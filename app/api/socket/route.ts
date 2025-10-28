import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"

export async function GET(req: NextRequest) {
  // @ts-ignore - Next.js socket handling
  if (req.socket?.server?.io) {
    console.log("[v0] Socket.io already initialized")
    return new Response("Socket server already running", { status: 200 })
  }

  // @ts-ignore
  const io = new SocketIOServer(req.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
  })

  // @ts-ignore
  req.socket.server.io = io

  io.on("connection", (socket) => {
    console.log("[v0] Socket connected:", socket.id)

    socket.on("join-combat", (combatId: string) => {
      socket.join(`combat-${combatId}`)
      console.log("[v0] Socket joined combat:", combatId)
    })

    socket.on("leave-combat", (combatId: string) => {
      socket.leave(`combat-${combatId}`)
      console.log("[v0] Socket left combat:", combatId)
    })

    socket.on("disconnect", () => {
      console.log("[v0] Socket disconnected:", socket.id)
    })
  })

  return new Response("Socket server initialized", { status: 200 })
}
