import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { CreateCombatClient } from "@/components/create-combat-client"

export default async function CreateCombatPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  await connectDB()
  const user = await User.findById(session.userId).select("-passwordHash").lean()

  if (!user) {
    redirect("/login")
  }

  return (
    <CreateCombatClient
      user={{
        id: user._id.toString(),
        name: user.name,
        deckCount: user.deck.length,
      }}
    />
  )
}
