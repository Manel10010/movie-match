import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { FilmSelectionClient } from "@/components/film-selection-client"

export default async function SelectFilmsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  await connectDB()

  const combat = await Combat.findById(id).populate("participants", "name").lean()

  if (!combat) {
    redirect("/")
  }

  if (combat.status !== "selecting") {
    if (combat.status === "in_progress") {
      redirect(`/combat/${id}/vote`)
    } else if (combat.status === "finished") {
      redirect(`/combat/${id}/result`)
    } else {
      redirect(`/combat/${id}`)
    }
  }

  const user = await User.findById(session.userId).select("name deck").lean()

  if (!user) {
    redirect("/login")
  }

  const isParticipant = combat.participants.some((p: any) => p._id.toString() === session.userId)

  if (!isParticipant) {
    redirect(`/combat/${id}`)
  }

  const userSelection = combat.participantSelections.find((s: any) => s.userId.toString() === session.userId)

  return (
    <FilmSelectionClient
      combatId={id}
      deckSize={combat.deckSize}
      userDeck={user.deck.map((m: any) => ({
        tmdbId: String(m.tmdbId),
        title: String(m.title),
        posterUrl: String(m.posterUrl),
      }))}
      participants={combat.participants.map((p: any) => {
        const selection = combat.participantSelections.find((s: any) => s.userId.toString() === p._id.toString())
        return {
          id: p._id.toString(),
          name: p.name,
          ready: selection?.ready || false,
        }
      })}
    />
  )
}
