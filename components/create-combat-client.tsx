"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Copy, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateCombatClientProps {
  user: {
    id: string
    name: string
    deckCount: number
  }
}

export function CreateCombatClient({ user }: CreateCombatClientProps) {
  const router = useRouter()
  const [maxParticipants, setMaxParticipants] = useState(2)
  const [deckSize, setDeckSize] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [combatLink, setCombatLink] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCreateCombat = async () => {
    setError("")

    if (user.deckCount < deckSize) {
      setError(`You need at least ${deckSize} movies in your deck to create this combat.`)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/combat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxParticipants, deckSize }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create combat")
        return
      }

      const link = `${window.location.origin}/combat/${data.combatId}`
      setCombatLink(link)
    } catch {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(combatLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinCombat = () => {
    const combatId = combatLink.split("/").pop()
    router.push(`/combat/${combatId}`)
  }

  if (combatLink) {
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
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-white">Combat Created!</CardTitle>
                <CardDescription className="text-gray-300">Share this link with your friends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input value={combatLink} readOnly className="bg-white/10 text-white border-white/20" />
                  <Button onClick={handleCopyLink} variant="outline" className="shrink-0 bg-transparent">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleJoinCombat} className="w-full bg-purple-600 hover:bg-purple-700">
                    Join Combat
                  </Button>
                  <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
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
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Create a Combat</CardTitle>
              <CardDescription className="text-gray-300">Set up a movie battle and invite your friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="participants" className="text-white">
                  Maximum Participants
                </Label>
                <Input
                  id="participants"
                  type="number"
                  min="2"
                  max="10"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="bg-white/10 text-white border-white/20"
                />
                <p className="text-sm text-gray-400">How many people can join this combat?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deckSize" className="text-white">
                  Minimum Movies per Participant
                </Label>
                <Input
                  id="deckSize"
                  type="number"
                  min="1"
                  max="20"
                  value={deckSize}
                  onChange={(e) => setDeckSize(Number(e.target.value))}
                  className="bg-white/10 text-white border-white/20"
                />
                <p className="text-sm text-gray-400">
                  Each participant must have at least this many movies in their deck
                </p>
              </div>

              {user.deckCount < deckSize && (
                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertDescription className="text-yellow-200">
                    You currently have {user.deckCount} movies in your deck. You need at least {deckSize} movies to
                    create this combat.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="bg-red-500/10 border-red-500/50">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateCombat}
                disabled={isLoading || user.deckCount < deckSize}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Creating..." : "Create Combat"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
