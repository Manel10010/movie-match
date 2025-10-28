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
    round.votes.set(session.userId, vote)

    const allVotedOnThisRound = combat.participants.every((p: any) => round.votes.has(p._id.toString()))

    console.log("[v0] Vote recorded:", {
      filmA: filmA.title,
      filmB: filmB.title,
      vote,
      userId: session.userId,
      allVoted: allVotedOnThisRound,
      totalVotes: round.votes.size,
      totalParticipants: combat.participants.length,
    })

    await combat.save()

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

    const eliminatedIds = new Set<string>()
    const completedRounds: any[] = []

    combat.rounds.forEach((r: any) => {
      const isComplete = combat.participants.every((p: any) => r.votes.has(p._id.toString()))
      if (isComplete) {
        completedRounds.push(r)
        let votesA = 0
        let votesB = 0

        r.votes.forEach((v: string) => {
          if (v === "A") votesA++
          else if (v === "B") votesB++
        })

        if (votesA > votesB) {
          eliminatedIds.add(r.filmB.tmdbId)
          console.log("[v0] Eliminating:", r.filmB.title, `(${votesB} votes vs ${votesA} votes)`)
        } else if (votesB > votesA) {
          eliminatedIds.add(r.filmA.tmdbId)
          console.log("[v0] Eliminating:", r.filmA.title, `(${votesA} votes vs ${votesB} votes)`)
        } else {
          console.log("[v0] Tie between:", r.filmA.title, "and", r.filmB.title)
        }
      }
    })

    const remainingMovies = allMovies.filter((m: any) => !eliminatedIds.has(m.tmdbId))

    console.log("[v0] Current state:", {
      totalMovies: allMovies.length,
      completedRounds: completedRounds.length,
      totalRounds: combat.rounds.length,
      eliminated: eliminatedIds.size,
      remaining: remainingMovies.length,
      eliminatedTitles: Array.from(eliminatedIds),
    })

    let winner = null
    if (remainingMovies.length === 1) {
      combat.winner = remainingMovies[0]
      combat.status = "finished"
      winner = remainingMovies[0]
      await combat.save()

      console.log("[v0] Combat finished! Winner:", winner.title)

      try {
        const io = (global as any).io
        if (io) {
          io.to(`combat-${id}`).emit("combat-finished", { winner })
        }
      } catch (socketError) {
        console.error("[SOCKET_ERROR]", socketError)
      }

      return NextResponse.json({ success: true, winner, remainingMovies })
    }

    try {
      const io = (global as any).io
      if (io && allVotedOnThisRound) {
        console.log("[v0] Emitting round-completed event")
        io.to(`combat-${id}`).emit("round-completed", {
          completedRound: {
            filmA: round.filmA,
            filmB: round.filmB,
          },
          remainingMovies,
          completedRoundsCount: completedRounds.length,
        })
      }
    } catch (socketError) {
      console.error("[SOCKET_ERROR]", socketError)
    }

    return NextResponse.json({
      success: true,
      remainingMovies,
      completedRounds: completedRounds.length,
      totalRounds: combat.rounds.length,
    })
  } catch (error) {
    console.error("[VOTE_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
