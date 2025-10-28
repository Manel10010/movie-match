import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { getSession } from "@/lib/auth"
import { getSocketServer } from "@/lib/socket-server"

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

    if (combat.creatorId.toString() !== session.userId) {
      return NextResponse.json({ error: "Only the creator can start the combat" }, { status: 403 })
    }

    if (combat.status !== "waiting") {
      return NextResponse.json({ error: "Combat has already started" }, { status: 400 })
    }

    if (combat.participants.length < 2) {
      return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 })
    }

    combat.status = "selecting"
    combat.participantSelections = []
    combat.rounds = []
    await combat.save()

    const io = getSocketServer()
    io.to(id).emit("selection-started")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Start combat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
