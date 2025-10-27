import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { CombatClient } from "@/components/combat-client"

export default async function CombatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  await connectDB()

  const combat = await Combat.findById(id).populate("participants", "name email profilePic deck").lean()

  if (!combat) {
    redirect("/")
  }

  const user = await User.findById(session.userId).select("-passwordHash").lean()

  if (!user) {
    redirect("/login")
  }

  const isParticipant = combat.participants.some((p: any) => p._id.toString() === session.userId)

  return (
    <CombatClient
      combat={{
        id: combat._id.toString(),
        creatorId: combat.creatorId.toString(),
        maxParticipants: combat.maxParticipants,
        deckSize: combat.deckSize,
        status: combat.status,
        participants: combat.participants.map((p: any) => ({
          id: p._id.toString(),
          name: p.name,
          profilePic: p.profilePic || "",
          deckCount: p.deck.length,
        })),
      }}
      user={{
        id: user._id.toString(),
        name: user.name,
        deckCount: user.deck.length,
      }}
      isParticipant={isParticipant}
    />
  )
}
