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
  onSelectionStarted?: () => void
  onParticipantSelected?: (data: { userId: string; ready: boolean; allReady: boolean }) => void
  onCombatStarted?: (data?: { remainingFilms: Movie[]; currentRound: any }) => void
  onRoundCompleted?: (data: { completedRound: any; remainingMovies: Movie[] }) => void
  onCombatFinished?: (data: { winner: Movie }) => void
  onNewRound?: (data: { filmA: Movie; filmB: Movie }) => void
}

export function useCombatSocket({
  combatId,
  onParticipantJoined,
  onSelectionStarted,
  onParticipantSelected,
  onCombatStarted,
  onRoundCompleted,
  onCombatFinished,
  onNewRound,
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

    const handleSelectionStarted = () => {
      console.log("[v0] Selection phase started")
      onSelectionStarted?.()
    }

    const handleParticipantSelected = (data: { userId: string; ready: boolean; allReady: boolean }) => {
      console.log("[v0] Participant selected films:", data)
      onParticipantSelected?.(data)
    }

    const handleCombatStarted = (data?: { remainingFilms: Movie[]; currentRound: any }) => {
      console.log("[v0] Combat started with data:", data)
      onCombatStarted?.(data)
    }

    const handleRoundCompleted = (data: { completedRound: any; remainingMovies: Movie[] }) => {
      console.log("[v0] Round completed:", data)
      onRoundCompleted?.(data)
    }

    const handleCombatFinished = (data: { winner: Movie }) => {
      console.log("[v0] Combat finished, winner:", data.winner)
      onCombatFinished?.(data)
    }

    const handleNewRound = (data: { filmA: Movie; filmB: Movie }) => {
      console.log("[v0] New round started:", data)
      onNewRound?.(data)
    }

    socketInstance.on("connect", handleConnect)
    socketInstance.on("disconnect", handleDisconnect)
    socketInstance.on("participant-joined", handleParticipantJoined)
    socketInstance.on("selection-started", handleSelectionStarted)
    socketInstance.on("participant-selected", handleParticipantSelected)
    socketInstance.on("combat-started", handleCombatStarted)
    socketInstance.on("round-completed", handleRoundCompleted)
    socketInstance.on("combat-finished", handleCombatFinished)
    socketInstance.on("new-round", handleNewRound)

    return () => {
      socketInstance.emit("leave-combat", combatId)
      socketInstance.off("connect", handleConnect)
      socketInstance.off("disconnect", handleDisconnect)
      socketInstance.off("participant-joined", handleParticipantJoined)
      socketInstance.off("selection-started", handleSelectionStarted)
      socketInstance.off("participant-selected", handleParticipantSelected)
      socketInstance.off("combat-started", handleCombatStarted)
      socketInstance.off("round-completed", handleRoundCompleted)
      socketInstance.off("combat-finished", handleCombatFinished)
      socketInstance.off("new-round", handleNewRound)
    }
  }, [
    combatId,
    onParticipantJoined,
    onSelectionStarted,
    onParticipantSelected,
    onCombatStarted,
    onRoundCompleted,
    onCombatFinished,
    onNewRound,
  ])

  return { socket, isConnected }
}
