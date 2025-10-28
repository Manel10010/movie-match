import { NextResponse } from "next/server"

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
    )

    if (!response.ok) {
      throw new Error("TMDB API request failed")
    }

    const data = await response.json()

    const results = data.results.map((movie: any) => ({
      tmdbId: movie.id.toString(),
      title: movie.title,
      posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : "/placeholder.svg?height=300&width=200",
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[TMDB_SEARCH_ERROR]", error)
    return NextResponse.json({ error: "Failed to search movies" }, { status: 500 })
  }
}
