import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { VoteClient } from "@/components/vote-client"

export default async function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  await connectDB()

  const combat = await Combat.findById(id).populate("participants", "name deck").lean()

  if (!combat) {
    redirect("/")
  }

  if (combat.status === "waiting") {
    redirect(`/combat/${id}`)
  }

  if (combat.status === "finished") {
    redirect(`/combat/${id}/result`)
  }

  const isParticipant = combat.participants.some((p: any) => p._id.toString() === session.userId)

  if (!isParticipant) {
    redirect(`/combat/${id}`)
  }

  const allMovies: any[] = []
  combat.participants.forEach((p: any) => {
    p.deck.forEach((movie: any) => {
      if (!allMovies.find((m) => m.tmdbId === movie.tmdbId)) {
        // Explicitly create plain object with only needed fields
        allMovies.push({
          tmdbId: String(movie.tmdbId),
          title: String(movie.title),
          posterUrl: String(movie.posterUrl),
        })
      }
    })
  })

  const serializedRounds = (combat.rounds || []).map((round: any) => {
    // Convert votes Map to plain object, handling cases where it might not be a Map
    let votesObj = {}
    if (round.votes) {
      if (round.votes instanceof Map) {
        votesObj = Object.fromEntries(round.votes)
      } else if (typeof round.votes === "object") {
        votesObj = round.votes
      }
    }

    return {
      filmA: round.filmA
        ? {
            tmdbId: String(round.filmA.tmdbId || ""),
            title: String(round.filmA.title || ""),
            posterUrl: String(round.filmA.posterUrl || ""),
          }
        : null,
      filmB: round.filmB
        ? {
            tmdbId: String(round.filmB.tmdbId || ""),
            title: String(round.filmB.title || ""),
            posterUrl: String(round.filmB.posterUrl || ""),
          }
        : null,
      votes: votesObj,
    }
  })

  return (
    <VoteClient
      combat={{
        id: combat._id.toString(),
        currentRoundIndex: combat.currentRoundIndex || 0,
        participants: combat.participants.map((p: any) => ({
          id: p._id.toString(),
          name: p.name,
        })),
        rounds: serializedRounds,
      }}
      userId={session.userId}
      allMovies={allMovies}
    />
  )
}
