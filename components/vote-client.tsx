"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ThumbsUp, X } from "lucide-react"

interface Movie {
  tmdbId: string
  title: string
  posterUrl: string
}

interface VoteClientProps {
  combat: {
    id: string
    participants: { id: string; name: string }[]
    rounds: any[]
  }
  userId: string
  allMovies: Movie[]
}

export function VoteClient({ combat, userId, allMovies }: VoteClientProps) {
  const router = useRouter()
  const [currentMovies, setCurrentMovies] = useState<Movie[]>(allMovies)
  const [currentPair, setCurrentPair] = useState<[Movie, Movie] | null>(null)
  const [votedPairs, setVotedPairs] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentMovies.length >= 2 && !currentPair) {
      selectNextPair()
    }
  }, [currentMovies, currentPair])

  const selectNextPair = () => {
    const shuffled = [...currentMovies].sort(() => Math.random() - 0.5)
    const pair: [Movie, Movie] = [shuffled[0], shuffled[1]]
    setCurrentPair(pair)
  }

  const handleVote = async (choice: "A" | "B" | "skip") => {
    if (!currentPair) return

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/combat/${combat.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmA: currentPair[0],
          filmB: currentPair[1],
          vote: choice,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("Vote failed:", data.error)
        return
      }

      // Mark this pair as voted
      const pairKey = [currentPair[0].tmdbId, currentPair[1].tmdbId].sort().join("-")
      setVotedPairs(new Set([...votedPairs, pairKey]))

      // Check if voting is complete
      if (data.winner) {
        router.push(`/combat/${combat.id}/result`)
        return
      }

      // Update current movies based on elimination
      if (data.eliminated) {
        setCurrentMovies(currentMovies.filter((m) => m.tmdbId !== data.eliminated))
      }

      // Select next pair
      setCurrentPair(null)
    } catch (error) {
      console.error("Vote error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (currentMovies.length === 1) {
    router.push(`/combat/${combat.id}/result`)
    return null
  }

  if (!currentPair) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center">
        <p className="text-white text-xl">Loading next matchup...</p>
      </div>
    )
  }

  const progress = ((allMovies.length - currentMovies.length) / allMovies.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-white hover:text-white/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Combat
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Choose Your Preference</h1>
            <p className="text-gray-300">
              {currentMovies.length} movies remaining • {combat.participants.length} participants
            </p>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              onClick={() => !isSubmitting && handleVote("A")}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={currentPair[0].posterUrl || "/placeholder.svg?height=600&width=400"}
                  alt={currentPair[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white text-center">{currentPair[0].title}</h2>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote("A")
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  I'd Watch This
                </Button>
              </CardContent>
            </Card>

            <Card
              className="bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              onClick={() => !isSubmitting && handleVote("B")}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={currentPair[1].posterUrl || "/placeholder.svg?height=600&width=400"}
                  alt={currentPair[1].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white text-center">{currentPair[1].title}</h2>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote("B")
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  I'd Watch This
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={() => handleVote("skip")}
              disabled={isSubmitting}
              variant="outline"
              className="bg-transparent text-white border-white/20 hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              Skip Both
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
