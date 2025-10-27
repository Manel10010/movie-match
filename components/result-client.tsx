"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Home, Plus, Check } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface ResultClientProps {
  combat: {
    id: string
    participants: Array<{
      id: string
      name: string
      profilePic: string
    }>
    winner: {
      tmdbId: string
      title: string
      posterUrl: string
    }
  }
  userId: string
}

export function ResultClient({ combat, userId }: ResultClientProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#a855f7", "#ec4899", "#3b82f6"],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#a855f7", "#ec4899", "#3b82f6"],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const handleAddToProfile = async () => {
    setIsAdding(true)

    try {
      const res = await fetch("/api/user/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie: combat.winner }),
      })

      if (res.ok) {
        setAdded(true)
      }
    } catch (error) {
      console.error("Failed to add movie:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-yellow-500/20 animate-pulse">
                <Trophy className="h-16 w-16 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white">We Have a Winner!</h1>
            <p className="text-xl text-gray-300">The movie everyone wants to watch is...</p>
          </div>

          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={combat.winner.posterUrl || "/placeholder.svg?height=600&width=400"}
                  alt={combat.winner.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-4">{combat.winner.title}</h2>
                  <p className="text-gray-300">
                    This movie won the vote among {combat.participants.length} participants!
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Participants</h3>
                  <div className="flex flex-wrap gap-3">
                    {combat.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={participant.profilePic || "/placeholder.svg"} alt={participant.name} />
                          <AvatarFallback className="bg-purple-600 text-white text-xs">
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white">{participant.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleAddToProfile}
                    disabled={isAdding || added}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {added ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Added to Profile
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Add to My Profile
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => router.push("/combat/create")}
                    variant="outline"
                    className="w-full bg-transparent text-white border-white/20 hover:bg-white/10"
                    size="lg"
                  >
                    Create New Combat
                  </Button>

                  <Button
                    onClick={() => router.push("/")}
                    variant="ghost"
                    className="w-full text-white hover:text-white/80"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-lg text-white font-semibold mb-2">Enjoy your movie night!</p>
              <p className="text-gray-300">Grab some popcorn and get ready to watch {combat.winner.title} together.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
