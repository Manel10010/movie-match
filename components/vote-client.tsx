"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ThumbsUp, X } from "lucide-react"
import { useCombatSocket } from "@/hooks/use-combat-socket"

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
  const [completedRounds, setCompletedRounds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [waitingForOthers, setWaitingForOthers] = useState(false)

  useCombatSocket({
    combatId: combat.id,
    onRoundCompleted: (data) => {
      console.log("[v0] Round completed event received:", data)
      const roundKey = [data.completedRound.filmA.tmdbId, data.completedRound.filmB.tmdbId].sort().join("-")

      setCompletedRounds((prev) => {
        const newSet = new Set([...prev, roundKey])
        console.log("[v0] Updated completed rounds:", newSet.size)
        return newSet
      })

      setCurrentMovies(data.remainingMovies)
      console.log("[v0] Updated remaining movies:", data.remainingMovies.length)

      // Reset state to allow next pair selection
      setCurrentPair(null)
      setWaitingForOthers(false)
    },
    onCombatFinished: () => {
      console.log("[v0] Combat finished, redirecting to results")
      router.push(`/combat/${combat.id}/result`)
    },
  })

  useEffect(() => {
    const completed = new Set<string>()
    combat.rounds.forEach((round: any) => {
      const allVoted = combat.participants.every((p) => p.id in round.votes)
      if (allVoted) {
        const roundKey = [round.filmA.tmdbId, round.filmB.tmdbId].sort().join("-")
        completed.add(roundKey)
      }
    })
    setCompletedRounds(completed)
    console.log("[v0] Initialized with", completed.size, "completed rounds")
  }, [combat.rounds, combat.participants])

  useEffect(() => {
    console.log("[v0] Pair selection check:", {
      moviesCount: currentMovies.length,
      hasPair: !!currentPair,
      waiting: waitingForOthers,
      completedCount: completedRounds.size,
    })

    if (currentMovies.length >= 2 && !currentPair && !waitingForOthers) {
      console.log("[v0] Selecting next pair...")
      selectNextPair()
    } else if (currentMovies.length === 1) {
      console.log("[v0] Only one movie left, redirecting to results")
      router.push(`/combat/${combat.id}/result`)
    }
  }, [currentMovies, currentPair, waitingForOthers, completedRounds])

  const selectNextPair = () => {
    const availablePairs: [Movie, Movie][] = []

    for (let i = 0; i < currentMovies.length; i++) {
      for (let j = i + 1; j < currentMovies.length; j++) {
        const pairKey = [currentMovies[i].tmdbId, currentMovies[j].tmdbId].sort().join("-")
        if (!completedRounds.has(pairKey)) {
          availablePairs.push([currentMovies[i], currentMovies[j]])
        }
      }
    }

    console.log("[v0] Available pairs:", {
      total: availablePairs.length,
      completed: completedRounds.size,
      movies: currentMovies.length,
    })

    if (availablePairs.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePairs.length)
      const selectedPair = availablePairs[randomIndex]
      console.log("[v0] Selected pair:", selectedPair[0].title, "vs", selectedPair[1].title)
      setCurrentPair(selectedPair)
      setWaitingForOthers(false)
    } else if (currentMovies.length > 1) {
      // All pairs voted but still multiple movies - need to wait for elimination
      console.log("[v0] All pairs voted, waiting for elimination...")
      setWaitingForOthers(true)
    }
  }

  const handleVote = async (choice: "A" | "B" | "skip") => {
    if (!currentPair) return

    setIsSubmitting(true)

    try {
      console.log("[v0] Submitting vote:", {
        filmA: currentPair[0].title,
        filmB: currentPair[1].title,
        choice,
      })

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
        console.error("[v0] Vote failed:", data.error)
        return
      }

      console.log("[v0] Vote response:", data)

      if (data.winner) {
        console.log("[v0] Winner determined:", data.winner.title)
        router.push(`/combat/${combat.id}/result`)
        return
      }

      if (data.remainingMovies) {
        setCurrentMovies(data.remainingMovies)
      }

      // Mark this pair as completed locally
      const pairKey = [currentPair[0].tmdbId, currentPair[1].tmdbId].sort().join("-")
      setCompletedRounds((prev) => new Set([...prev, pairKey]))

      // Clear current pair and wait for others
      setCurrentPair(null)
      setWaitingForOthers(true)
    } catch (error) {
      console.error("[v0] Vote error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (currentMovies.length === 1) {
    router.push(`/combat/${combat.id}/result`)
    return null
  }

  if (waitingForOthers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white text-xl">Waiting for other participants to vote...</p>
            <p className="text-gray-400 text-sm">{currentMovies.length} movies remaining</p>
          </div>
        </Card>
      </div>
    )
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
