"use client"

import { useState } from "react"
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
    currentRoundIndex: number
    participants: { id: string; name: string }[]
    rounds: any[]
  }
  userId: string
}

export function VoteClient({ combat, userId }: VoteClientProps) {
  const router = useRouter()
  const [currentRoundIndex, setCurrentRoundIndex] = useState(combat.currentRoundIndex)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [waitingForOthers, setWaitingForOthers] = useState(false)
  const [hasVotedCurrentRound, setHasVotedCurrentRound] = useState(false)

  useCombatSocket({
    combatId: combat.id,
    onRoundFinished: (data) => {
      console.log("[v0] Round finished event received:", data)
      setCurrentRoundIndex(data.nextRoundIndex)
      setWaitingForOthers(false)
      setHasVotedCurrentRound(false)
    },
    onCombatFinished: (data) => {
      console.log("[v0] Combat finished, redirecting to results")
      router.push(`/combat/${combat.id}/result`)
    },
  })

  const currentRound = combat.rounds[currentRoundIndex]

  if (!currentRound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  const handleVote = async (choice: "A" | "B" | "skip") => {
    if (hasVotedCurrentRound) return

    setIsSubmitting(true)
    setHasVotedCurrentRound(true)

    try {
      console.log("[v0] Submitting vote:", {
        filmA: currentRound.filmA.title,
        filmB: currentRound.filmB.title,
        choice,
        roundIndex: currentRoundIndex,
      })

      const res = await fetch(`/api/combat/${combat.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmA: currentRound.filmA,
          filmB: currentRound.filmB,
          vote: choice,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[v0] Vote failed:", data.error)
        setHasVotedCurrentRound(false)
        return
      }

      console.log("[v0] Vote response:", data)

      if (data.combatFinished) {
        console.log("[v0] Combat finished:", data.winner?.title)
        router.push(`/combat/${combat.id}/result`)
        return
      }

      if (data.roundFinished) {
        setWaitingForOthers(true)
      }
    } catch (error) {
      console.error("[v0] Vote error:", error)
      setHasVotedCurrentRound(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentRoundIndex + 1) / combat.rounds.length) * 100

  if (waitingForOthers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white text-xl">Waiting for other participants to vote...</p>
            <p className="text-gray-400 text-sm">
              Round {currentRoundIndex + 1} of {combat.rounds.length}
            </p>
          </div>
        </Card>
      </div>
    )
  }

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
              Round {currentRoundIndex + 1} of {combat.rounds.length} • {combat.participants.length} participants
            </p>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              onClick={() => !isSubmitting && !hasVotedCurrentRound && handleVote("A")}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={currentRound.filmA.posterUrl || "/placeholder.svg?height=600&width=400"}
                  alt={currentRound.filmA.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white text-center">{currentRound.filmA.title}</h2>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote("A")
                  }}
                  disabled={isSubmitting || hasVotedCurrentRound}
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
              onClick={() => !isSubmitting && !hasVotedCurrentRound && handleVote("B")}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={currentRound.filmB.posterUrl || "/placeholder.svg?height=600&width=400"}
                  alt={currentRound.filmB.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-white text-center">{currentRound.filmB.title}</h2>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote("B")
                  }}
                  disabled={isSubmitting || hasVotedCurrentRound}
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
              disabled={isSubmitting || hasVotedCurrentRound}
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
