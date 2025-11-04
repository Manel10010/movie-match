"use client"

import { useEffect, useState } from "react"
import { getSocket } from "@/lib/socket-client"
import type { Socket } from "socket.io-client"

interface Movie {
  tmdbId: string
  title: string
  posterUrl: string
}

interface Participant {
  id: string
  name: string
  profilePic: string
  deckCount: number
}

interface UseCombatSocketOptions {
  combatId: string
  onParticipantJoined?: (participants: Participant[]) => void
  onCombatStarted?: () => void
  onRoundFinished?: (data: { winner: string; nextRoundIndex: number; totalRounds: number }) => void
  onCombatFinished?: (data: { winner: Movie }) => void
}

export function useCombatSocket({
  combatId,
  onParticipantJoined,
  onCombatStarted,
  onRoundFinished,
  onCombatFinished,
}: UseCombatSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    socketInstance.emit("join-combat", combatId)

    const handleConnect = () => {
      console.log("[v0] Socket connected to combat:", combatId)
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      console.log("[v0] Socket disconnected from combat:", combatId)
      setIsConnected(false)
    }

    const handleParticipantJoined = (data: { participants: Participant[] }) => {
      console.log("[v0] Participant joined:", data)
      onParticipantJoined?.(data.participants)
    }

    const handleCombatStarted = () => {
      console.log("[v0] Combat started")
      onCombatStarted?.()
    }

    const handleRoundFinished = (data: { winner: string; nextRoundIndex: number; totalRounds: number }) => {
      console.log("[v0] Round finished:", data)
      onRoundFinished?.(data)
    }

    const handleCombatFinished = (data: { winner: Movie }) => {
      console.log("[v0] Combat finished, winner:", data.winner)
      onCombatFinished?.(data)
    }

    socketInstance.on("connect", handleConnect)
    socketInstance.on("disconnect", handleDisconnect)
    socketInstance.on("participant-joined", handleParticipantJoined)
    socketInstance.on("combat-started", handleCombatStarted)
    socketInstance.on("round-finished", handleRoundFinished)
    socketInstance.on("combat-finished", handleCombatFinished)

    return () => {
      socketInstance.emit("leave-combat", combatId)
      socketInstance.off("connect", handleConnect)
      socketInstance.off("disconnect", handleDisconnect)
      socketInstance.off("participant-joined", handleParticipantJoined)
      socketInstance.off("combat-started", handleCombatStarted)
      socketInstance.off("round-finished", handleRoundFinished)
      socketInstance.off("combat-finished", handleCombatFinished)
    }
  }, [combatId, onParticipantJoined, onCombatStarted, onRoundFinished, onCombatFinished])

  return { socket, isConnected }
}
