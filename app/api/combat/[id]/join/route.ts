import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { getSession } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const combat = await Combat.findById(id)
    if (!combat) {
      return NextResponse.json({ error: "Combat not found" }, { status: 404 })
    }

    if (combat.status !== "waiting") {
      return NextResponse.json({ error: "Combat has already started" }, { status: 400 })
    }

    if (combat.participants.length >= combat.maxParticipants) {
      return NextResponse.json({ error: "Combat is full" }, { status: 400 })
    }

    const isAlreadyParticipant = combat.participants.some((p) => p.toString() === session.userId)
    if (isAlreadyParticipant) {
      return NextResponse.json({ error: "Already a participant" }, { status: 400 })
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.deck.length < combat.deckSize) {
      return NextResponse.json({ error: "Not enough movies in your deck" }, { status: 400 })
    }

    combat.participants.push(session.userId)
    await combat.save()

    try {
      const io = (global as any).io
      if (io) {
        const updatedCombat = await Combat.findById(id).populate("participants", "name profilePic deck")
        const participantsData = updatedCombat.participants.map((p: any) => ({
          id: p._id.toString(),
          name: p.name,
          profilePic: p.profilePic,
          deckCount: p.deck.length,
        }))

        io.to(`combat-${id}`).emit("participant-joined", { participants: participantsData })
      }
    } catch (socketError) {
      console.error("[SOCKET_ERROR]", socketError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[JOIN_COMBAT_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
