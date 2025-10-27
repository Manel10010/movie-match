import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { ResultClient } from "@/components/result-client"

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  await connectDB()

  const combat = await Combat.findById(id).populate("participants", "name profilePic").lean()

  if (!combat) {
    redirect("/")
  }

  if (combat.status !== "finished" || !combat.winner) {
    redirect(`/combat/${id}`)
  }

  return (
    <ResultClient
      combat={{
        id: combat._id.toString(),
        participants: combat.participants.map((p: any) => ({
          id: p._id.toString(),
          name: p.name,
          profilePic: p.profilePic || "",
        })),
        winner: {
          tmdbId: combat.winner.tmdbId,
          title: combat.winner.title,
          posterUrl: combat.winner.posterUrl,
        },
      }}
      userId={session.userId}
    />
  )
}
