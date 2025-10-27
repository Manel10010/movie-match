"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { MovieSearch } from "@/components/movie-search"

interface Movie {
  tmdbId: string
  title: string
  posterUrl: string
}

interface ProfileClientProps {
  user: {
    id: string
    name: string
    email: string
    profilePic: string
    bio: string
    deck: Movie[]
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter()
  const [deck, setDeck] = useState<Movie[]>(user.deck)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddMovie = async (movie: Movie) => {
    try {
      const res = await fetch("/api/user/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie }),
      })

      if (res.ok) {
        setDeck([...deck, movie])
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Failed to add movie:", error)
    }
  }

  const handleRemoveMovie = async (tmdbId: string) => {
    try {
      const res = await fetch("/api/user/deck", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId }),
      })

      if (res.ok) {
        setDeck(deck.filter((m) => m.tmdbId !== tmdbId))
      }
    } catch (error) {
      console.error("Failed to remove movie:", error)
    }
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
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profilePic || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-purple-600 text-white text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <p className="text-gray-400">{user.email}</p>
                  {user.bio && <p className="text-gray-300 mt-2">{user.bio}</p>}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">My Movie Deck</h2>
                <p className="text-gray-400">{deck.length} movies in your collection</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Movie
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Search for a Movie</DialogTitle>
                  </DialogHeader>
                  <MovieSearch onSelectMovie={handleAddMovie} existingMovies={deck.map((m) => m.tmdbId)} />
                </DialogContent>
              </Dialog>
            </div>

            {deck.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400 mb-4">Your movie deck is empty</p>
                  <Button onClick={() => setIsDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Movie
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {deck.map((movie) => (
                  <Card key={movie.tmdbId} className="bg-white/5 border-white/10 overflow-hidden group relative">
                    <div className="aspect-[2/3] relative">
                      <img
                        src={movie.posterUrl || "/placeholder.svg"}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleRemoveMovie(movie.tmdbId)}
                          className="rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm text-white line-clamp-2">{movie.title}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
