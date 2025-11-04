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

    const currentRound = combat.rounds[combat.currentRoundIndex]
    if (!currentRound) {
      return NextResponse.json({ error: "Current round not found" }, { status: 404 })
    }

    currentRound.votes.set(session.userId, vote)

    const allVotedOnThisRound = combat.participants.every((p: any) => currentRound.votes.has(p._id.toString()))

    console.log("[v0] Vote recorded:", {
      filmA: currentRound.filmA.title,
      filmB: currentRound.filmB.title,
      vote,
      userId: session.userId,
      allVoted: allVotedOnThisRound,
      totalVotes: currentRound.votes.size,
      totalParticipants: combat.participants.length,
      currentRoundIndex: combat.currentRoundIndex,
    })

    await combat.save()

    if (allVotedOnThisRound) {
      let votesA = 0
      let votesB = 0

      currentRound.votes.forEach((v: string) => {
        if (v === "A") votesA++
        else if (v === "B") votesB++
      })

      const winner = votesA > votesB ? "A" : votesB > votesA ? "B" : null

      console.log("[v0] Round completed:", {
        filmA: currentRound.filmA.title,
        filmB: currentRound.filmB.title,
        votesA,
        votesB,
        winner,
      })

      currentRound.finished = true

      if (combat.currentRoundIndex < combat.rounds.length - 1) {
        combat.currentRoundIndex += 1
        await combat.save()

        try {
          const io = (global as any).io
          if (io) {
            io.to(`combat-${id}`).emit("round-finished", {
              winner,
              nextRoundIndex: combat.currentRoundIndex,
              totalRounds: combat.rounds.length,
            })
          }
        } catch (socketError) {
          console.error("[SOCKET_ERROR]", socketError)
        }

        return NextResponse.json({
          success: true,
          roundFinished: true,
          winner,
          nextRound: true,
        })
      } else {
        combat.status = "finished"

        // Count total wins for each film across all rounds
        const filmWins = new Map<string, number>()

        combat.rounds.forEach((r: any) => {
          if (r.finished) {
            let votesA = 0
            let votesB = 0

            r.votes.forEach((v: string) => {
              if (v === "A") votesA++
              else if (v === "B") votesB++
            })

            const winner = votesA > votesB ? r.filmA : votesB > votesA ? r.filmB : null
            if (winner) {
              filmWins.set(winner.tmdbId, (filmWins.get(winner.tmdbId) || 0) + 1)
            }
          }
        })

        // Find the film with most wins
        let finalWinner = null
        let maxWins = 0

        filmWins.forEach((wins, tmdbId) => {
          if (wins > maxWins) {
            maxWins = wins
            const winnerFilm = combat.rounds
              .flatMap((r: any) => [r.filmA, r.filmB])
              .find((f: any) => f.tmdbId === tmdbId)
            finalWinner = winnerFilm
          }
        })

        combat.winner = finalWinner
        await combat.save()

        console.log("[v0] Combat finished! Winner:", finalWinner?.title)

        try {
          const io = (global as any).io
          if (io) {
            io.to(`combat-${id}`).emit("combat-finished", { winner: finalWinner })
          }
        } catch (socketError) {
          console.error("[SOCKET_ERROR]", socketError)
        }

        return NextResponse.json({
          success: true,
          roundFinished: true,
          combatFinished: true,
          winner: finalWinner,
        })
      }
    }

    return NextResponse.json({
      success: true,
      roundFinished: false,
    })
  } catch (error) {
    console.error("[VOTE_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
