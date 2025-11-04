import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { getSession } from "@/lib/auth"
import { generateRounds } from "@/lib/generate-rounds"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const combat = await Combat.findById(id)
    if (!combat) {
      return NextResponse.json({ error: "Combat not found" }, { status: 404 })
    }

    if (combat.creatorId.toString() !== session.userId) {
      return NextResponse.json({ error: "Only the creator can start the combat" }, { status: 403 })
    }

    if (combat.status !== "waiting") {
      return NextResponse.json({ error: "Combat has already started" }, { status: 400 })
    }

    if (combat.participants.length < 2) {
      return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 })
    }

    const users = await User.find({ _id: { $in: combat.participants } })
    const allMovies: any[] = []

    users.forEach((user) => {
      user.deck.forEach((movie) => {
        if (!allMovies.find((m) => m.tmdbId === movie.tmdbId)) {
          allMovies.push({
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterUrl: movie.posterUrl,
          })
        }
      })
    })

    const rounds = generateRounds(allMovies)

    combat.status = "in_progress"
    combat.rounds = rounds
    combat.currentRoundIndex = 0
    await combat.save()

    console.log("[v0] Combat started with", rounds.length, "rounds")

    try {
      const io = (global as any).io
      if (io) {
        io.to(`combat-${id}`).emit("combat-started", {
          totalRounds: rounds.length,
          currentRoundIndex: 0,
        })
      }
    } catch (socketError) {
      console.error("[SOCKET_ERROR]", socketError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[START_COMBAT_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
