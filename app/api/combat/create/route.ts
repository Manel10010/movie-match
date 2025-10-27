import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { maxParticipants, deckSize } = await request.json()

    if (!maxParticipants || !deckSize) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.deck.length < deckSize) {
      return NextResponse.json({ error: "Not enough movies in your deck" }, { status: 400 })
    }

    const combat = await Combat.create({
      creatorId: session.userId,
      participants: [session.userId],
      maxParticipants,
      deckSize,
      status: "waiting",
      rounds: [],
    })

    return NextResponse.json({ combatId: combat._id.toString() })
  } catch (error) {
    console.error("[CREATE_COMBAT_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
