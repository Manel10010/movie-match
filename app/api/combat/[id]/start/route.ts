import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { getSession } from "@/lib/auth"

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

    // Gather all movies from participants
    const users = await User.find({ _id: { $in: combat.participants } })
    const allMovies: any[] = []

    users.forEach((user) => {
      user.deck.forEach((movie) => {
        allMovies.push({
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterUrl: movie.posterUrl,
        })
      })
    })

    // Remove duplicates
    const uniqueMovies = Array.from(new Map(allMovies.map((m) => [m.tmdbId, m])).values())

    // Shuffle movies
    const shuffled = uniqueMovies.sort(() => Math.random() - 0.5)

    combat.status = "in_progress"
    combat.rounds = []
    await combat.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[START_COMBAT_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
