"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Search, Plus, Check } from "lucide-react"

interface Movie {
  tmdbId: string
  title: string
  posterUrl: string
}

interface MovieSearchProps {
  onSelectMovie: (movie: Movie) => void
  existingMovies: string[]
}

export function MovieSearch({ onSelectMovie, existingMovies }: MovieSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {results.map((movie) => {
          const isAdded = existingMovies.includes(movie.tmdbId)
          return (
            <Card key={movie.tmdbId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={movie.posterUrl || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base">{movie.title}</CardTitle>
                  </div>
                  <Button onClick={() => onSelectMovie(movie)} disabled={isAdded} size="sm">
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
