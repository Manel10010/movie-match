import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { getSession } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filmA, filmB, vote } = await request.json()

    await connectDB()

    const combat = await Combat.findById(id).populate("participants", "deck")
    if (!combat) {
      return NextResponse.json({ error: "Combat not found" }, { status: 404 })
    }

    const isParticipant = combat.participants.some((p: any) => p._id.toString() === session.userId)
    if (!isParticipant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    // Find or create round for this pair
    let round = combat.rounds.find(
      (r: any) =>
        (r.filmA.tmdbId === filmA.tmdbId && r.filmB.tmdbId === filmB.tmdbId) ||
        (r.filmA.tmdbId === filmB.tmdbId && r.filmB.tmdbId === filmA.tmdbId),
    )

    if (!round) {
      round = {
        filmA,
        filmB,
        votes: new Map(),
      }
      combat.rounds.push(round)
    }

    // Record vote
    if (vote === "skip") {
      round.votes.set(session.userId, "skip")
    } else {
      round.votes.set(session.userId, vote)
    }

    // Check if all participants have voted on this round
    const allVoted = combat.participants.every((p: any) => round.votes.has(p._id.toString()))

    let eliminated = null
    let winner = null

    if (allVoted) {
      // Count votes
      let votesA = 0
      let votesB = 0
      let skips = 0

      round.votes.forEach((v: string) => {
        if (v === "A") votesA++
        else if (v === "B") votesB++
        else skips++
      })

      // Determine elimination
      if (votesA > votesB) {
        eliminated = filmB.tmdbId
      } else if (votesB > votesA) {
        eliminated = filmA.tmdbId
      }
      // If tied or all skipped, no elimination
    }

    // Get all unique movies from participants
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

    // Remove eliminated movies
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

    // Check if we have a winner
    if (remainingMovies.length === 1) {
      combat.winner = remainingMovies[0]
      combat.status = "finished"
      winner = remainingMovies[0]
    }

    await combat.save()

    return NextResponse.json({ success: true, eliminated, winner })
  } catch (error) {
    console.error("[VOTE_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
