"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Film, Check } from "lucide-react"
import { useCombatSocket } from "@/hooks/use-combat-socket"
import Image from "next/image"

interface Movie {
  tmdbId: string
  title: string
  posterUrl: string
}

interface Participant {
  id: string
  name: string
  ready: boolean
}

interface FilmSelectionClientProps {
  combatId: string
  deckSize: number
  userDeck: Movie[]
  participants: Participant[]
}

export function FilmSelectionClient({
  combatId,
  deckSize,
  userDeck,
  participants: initialParticipants,
}: FilmSelectionClientProps) {
  const router = useRouter()
  const [selectedFilms, setSelectedFilms] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [participants, setParticipants] = useState(initialParticipants)

  useCombatSocket({
    combatId,
    onParticipantSelected: (data) => {
      setParticipants((prev) => prev.map((p) => (p.id === data.userId ? { ...p, ready: true } : p)))
    },
    onCombatStarted: () => {
      router.push(`/combat/${combatId}/vote`)
    },
  })

  const toggleFilm = (tmdbId: string) => {
    setSelectedFilms((prev) => {
      if (prev.includes(tmdbId)) {
        return prev.filter((id) => id !== tmdbId)
      } else if (prev.length < deckSize) {
        return [...prev, tmdbId]
      }
      return prev
    })
  }

  const handleSubmit = async () => {
    if (selectedFilms.length !== deckSize) {
      setError(`Please select exactly ${deckSize} films`)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/combat/${combatId}/select-films`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFilmIds: selectedFilms }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit selection")
        return
      }

      // Wait for all participants to be ready
    } catch {
      setError("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const readyCount = participants.filter((p) => p.ready).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Select Your Films</CardTitle>
              <CardDescription className="text-gray-300">
                Choose {deckSize} films from your deck to compete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Film className="h-6 w-6 text-purple-400" />
                  <span className="text-white">
                    Selected: {selectedFilms.length} / {deckSize}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {readyCount} / {participants.length} participants ready
                </div>
              </div>

              {error && (
                <Alert className="bg-red-500/10 border-red-500/50">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userDeck.map((movie) => {
                  const isSelected = selectedFilms.includes(movie.tmdbId)
                  return (
                    <div
                      key={movie.tmdbId}
                      onClick={() => toggleFilm(movie.tmdbId)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                        isSelected ? "ring-4 ring-purple-500 scale-105" : "hover:scale-105"
                      }`}
                    >
                      <Image
                        src={movie.posterUrl || "/placeholder.svg"}
                        alt={movie.title}
                        width={300}
                        height={450}
                        className="w-full h-auto"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                          <div className="bg-purple-600 rounded-full p-2">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                        <p className="text-white text-sm font-semibold line-clamp-2">{movie.title}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedFilms.length !== deckSize}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isSubmitting ? "Submitting..." : `Confirm Selection (${selectedFilms.length}/${deckSize})`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
