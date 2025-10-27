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

  // Get all unique movies from participants
  const allMovies: any[] = []
  combat.participants.forEach((p: any) => {
    p.deck.forEach((movie: any) => {
      if (!allMovies.find((m) => m.tmdbId === movie.tmdbId)) {
        allMovies.push({
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterUrl: movie.posterUrl,
        })
      }
    })
  })

  // 🧩 Correção: serializar o objeto antes de enviá-lo ao componente cliente
  const serializedCombat = JSON.parse(
    JSON.stringify({
      id: combat._id.toString(),
      participants: combat.participants.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
      })),
      rounds: combat.rounds || [],
    })
  )

  return (
    <VoteClient
      combat={serializedCombat}
      userId={session.userId}
      allMovies={allMovies}
    />
  )
}
