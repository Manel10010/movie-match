import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Combat } from "@/lib/models/Combat"
import { User } from "@/lib/models/User"
import { getSocketServer } from "@/lib/socket-server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { selectedFilmIds } = await req.json()

    if (!Array.isArray(selectedFilmIds) || selectedFilmIds.length === 0) {
      return NextResponse.json({ error: "Please select at least one film" }, { status: 400 })
    }

    await connectDB()

    const combat = await Combat.findById(id)
    if (!combat) {
      return NextResponse.json({ error: "Combat not found" }, { status: 404 })
    }

    if (combat.status !== "selecting") {
      return NextResponse.json({ error: "Combat is not in selection phase" }, { status: 400 })
    }

    const isParticipant = combat.participants.some((p) => p.toString() === session.userId)
    if (!isParticipant) {
      return NextResponse.json({ error: "You are not a participant" }, { status: 403 })
    }

    // Get user's deck
    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate selected films are in user's deck
    const selectedFilms = user.deck.filter((film: any) => selectedFilmIds.includes(film.tmdbId))

    if (selectedFilms.length !== selectedFilmIds.length) {
      return NextResponse.json({ error: "Some selected films are not in your deck" }, { status: 400 })
    }

    if (selectedFilms.length !== combat.deckSize) {
      return NextResponse.json({ error: `Please select exactly ${combat.deckSize} films` }, { status: 400 })
    }

    // Update or create participant selection
    const existingSelection = combat.participantSelections.find((s: any) => s.userId.toString() === session.userId)

    if (existingSelection) {
      existingSelection.selectedFilms = selectedFilms
      existingSelection.ready = true
    } else {
      combat.participantSelections.push({
        userId: session.userId as any,
        selectedFilms,
        ready: true,
      })
    }

    await combat.save()

    // Check if all participants are ready
    const allReady = combat.participants.every((participantId) =>
      combat.participantSelections.some((s: any) => s.userId.toString() === participantId.toString() && s.ready),
    )

    // Emit update via WebSocket
    const io = getSocketServer()
    io.to(id).emit("participant-selected", {
      userId: session.userId,
      ready: true,
      allReady,
    })

    // If all ready, start the combat automatically
    if (allReady) {
      // Collect all selected films
      const allFilms: any[] = []
      combat.participantSelections.forEach((selection: any) => {
        selection.selectedFilms.forEach((film: any) => {
          if (!allFilms.find((f) => f.tmdbId === film.tmdbId)) {
            allFilms.push({
              tmdbId: film.tmdbId,
              title: film.title,
              posterUrl: film.posterUrl,
            })
          }
        })
      })

      // Shuffle and pick first pair
      const shuffled = [...allFilms].sort(() => Math.random() - 0.5)
      const firstPair = {
        filmA: shuffled[0],
        filmB: shuffled[1],
        votes: new Map(),
      }

      combat.remainingFilms = allFilms
      combat.currentRound = firstPair as any
      combat.status = "in_progress"
      await combat.save()

      io.to(id).emit("combat-started", {
        remainingFilms: allFilms,
        currentRound: {
          filmA: firstPair.filmA,
          filmB: firstPair.filmB,
        },
      })
    }

    return NextResponse.json({
      success: true,
      allReady,
      selectedCount: selectedFilms.length,
    })
  } catch (error) {
    console.error("[v0] Select films error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
