import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

let io: SocketIOServer | null = null

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

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

  return io
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized")
  }
  return io
}
