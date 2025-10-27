import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { HomeClient } from "@/components/home-client"

export default async function HomePage() {
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
    <HomeClient
      user={{
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || "",
        bio: user.bio || "",
        deckCount: user.deck.length,
      }}
    />
  )
}
