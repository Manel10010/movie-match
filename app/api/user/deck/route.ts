import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { movie } = await request.json()

    if (!movie || !movie.tmdbId || !movie.title || !movie.posterUrl) {
      return NextResponse.json({ error: "Invalid movie data" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if movie already exists in deck
    const exists = user.deck.some((m) => m.tmdbId === movie.tmdbId)
    if (exists) {
      return NextResponse.json({ error: "Movie already in deck" }, { status: 400 })
    }

    user.deck.push(movie)
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADD_MOVIE_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tmdbId } = await request.json()

    if (!tmdbId) {
      return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    user.deck = user.deck.filter((m) => m.tmdbId !== tmdbId)
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[REMOVE_MOVIE_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
