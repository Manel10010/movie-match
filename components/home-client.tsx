"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Film, Plus, User } from "lucide-react"

interface HomeClientProps {
  user: {
    id: string
    name: string
    email: string
    profilePic: string
    bio: string
    deckCount: number
  }
}

export function HomeClient({ user }: HomeClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Movie Match Arena</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogout} className="text-white hover:text-white/80">
              Logout
            </Button>
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => router.push("/profile")}>
              <AvatarImage src={user.profilePic || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-purple-600 text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white">Welcome back, {user.name}!</h2>
            <p className="text-lg text-gray-300">Create a combat or manage your movie deck</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">My Profile</CardTitle>
                    <CardDescription className="text-gray-400">Manage your movie deck</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  You have <span className="font-bold text-blue-400">{user.deckCount} movies</span> in your deck
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => router.push("/combat/create")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Plus className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Create Combat</CardTitle>
                    <CardDescription className="text-gray-400">Start a new movie battle</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">Invite friends and vote on movies together</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
