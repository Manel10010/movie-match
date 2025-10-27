import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { getSession } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const combat = await Combat.findById(id).populate("participants", "deck").lean()
    if (!combat) {
      return NextResponse.json({ error: "Combat not found" }, { status: 404 })
    }

    // Get all unique movies
    const allMovies: any[] = []
    combat.participants.forEach((p: any) => {
      p.deck.forEach((movie: any) => {
        if (!allMovies.find((m: any) => m.tmdbId === movie.tmdbId)) {
          allMovies.push({
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterUrl: movie.posterUrl,
          })
        }
      })
    })

    // Calculate eliminated movies
    const eliminatedIds = new Set<string>()
    combat.rounds.forEach((r: any) => {
      const allVoted = combat.participants.every((p: any) => r.votes.has(p._id.toString()))
      if (allVoted) {
        let votesA = 0
        let votesB = 0

        r.votes.forEach((v: string) => {
          if (v === "A") votesA++
          else if (v === "B") votesB++
        })

        if (votesA > votesB) {
          eliminatedIds.add(r.filmB.tmdbId)
        } else if (votesB > votesA) {
          eliminatedIds.add(r.filmA.tmdbId)
        }
      }
    })

    const remainingMovies = allMovies.filter((m: any) => !eliminatedIds.has(m.tmdbId))

    return NextResponse.json({
      status: combat.status,
      totalMovies: allMovies.length,
      remainingMovies: remainingMovies.length,
      winner: combat.winner,
    })
  } catch (error) {
    console.error("[STATUS_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
