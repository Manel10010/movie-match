import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { ProfileClient } from "@/components/profile-client"

export default async function ProfilePage() {
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
    <ProfileClient
      user={{
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || "",
        bio: user.bio || "",
        deck: user.deck.map((movie) => ({
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterUrl: movie.posterUrl,
        })),
      }}
    />
  )
}
