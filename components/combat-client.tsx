"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Users, Film, Play } from "lucide-react"

interface Participant {
  id: string
  name: string
  profilePic: string
  deckCount: number
}

interface CombatClientProps {
  combat: {
    id: string
    creatorId: string
    maxParticipants: number
    deckSize: number
    status: string
    participants: Participant[]
  }
  user: {
    id: string
    name: string
    deckCount: number
  }
  isParticipant: boolean
}

export function CombatClient({ combat, user, isParticipant }: CombatClientProps) {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState("")

  const canJoin =
    !isParticipant && combat.participants.length < combat.maxParticipants && user.deckCount >= combat.deckSize
  const canStart =
    isParticipant && user.id === combat.creatorId && combat.participants.length >= 2 && combat.status === "waiting"

  const handleJoin = async () => {
    setIsJoining(true)
    setError("")

    try {
      const res = await fetch(`/api/combat/${combat.id}/join`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to join combat")
        return
      }

      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setIsJoining(false)
    }
  }

  const handleStart = async () => {
    setIsStarting(true)
    setError("")

    try {
      const res = await fetch(`/api/combat/${combat.id}/start`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to start combat")
        return
      }

      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setIsStarting(false)
    }
  }

  if (combat.status === "in_progress") {
    router.push(`/combat/${combat.id}/vote`)
    return null
  }

  if (combat.status === "finished") {
    router.push(`/combat/${combat.id}/result`)
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-white hover:text-white/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Combat Lobby</CardTitle>
              <CardDescription className="text-gray-300">Waiting for participants to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Participants</p>
                    <p className="text-2xl font-bold text-white">
                      {combat.participants.length} / {combat.maxParticipants}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                  <Film className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Required Movies</p>
                    <p className="text-2xl font-bold text-white">{combat.deckSize}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
                <div className="space-y-3">
                  {combat.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
                      <Avatar>
                        <AvatarImage src={participant.profilePic || "/placeholder.svg"} alt={participant.name} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {participant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{participant.name}</p>
                        <p className="text-sm text-gray-400">{participant.deckCount} movies in deck</p>
                      </div>
                      {participant.id === combat.creatorId && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">Creator</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!isParticipant && user.deckCount < combat.deckSize && (
                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertDescription className="text-yellow-200">
                    You need at least {combat.deckSize} movies in your deck to join this combat. You currently have{" "}
                    {user.deckCount}.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="bg-red-500/10 border-red-500/50">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                {canJoin && (
                  <Button onClick={handleJoin} disabled={isJoining} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {isJoining ? "Joining..." : "Join Combat"}
                  </Button>
                )}

                {canStart && (
                  <Button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isStarting ? "Starting..." : "Start Combat"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
