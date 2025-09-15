"use client"

import { Game } from "@/db/schemas/games"
import { Player, PlayerSchema } from "@/db/schemas/players"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

export function RealtimePlayers({
  gameId,
  serverPlayers,
}: {
  gameId: Game["id"]
  serverPlayers: Player[]
}) {
  const [players, setPlayers] = useState<Player[]>(serverPlayers)

  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel("realtime-players")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          console.log(payload)
          const parsed = PlayerSchema.safeParse(payload.new)
          if (!parsed.success) {
            console.error("Invalid player", parsed.error.issues)
            return
          }

          setPlayers((prev) => [...prev, parsed.data])
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          console.log("wtf")
          console.log(payload)
          console.log(players)
          const parsed = PlayerSchema.safeParse(payload.old)
          if (!parsed.success) {
            console.error("Invalid player", parsed.error)
            return
          }
          setPlayers((prev) =>
            prev.filter((player) => player.user_id !== parsed.data.user_id),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, gameId, players, setPlayers])

  return (
    <div>
      <h1>Players</h1>
      <ul>
        {players.map((player) => (
          <li key={player.user_id}>{player.username}</li>
        ))}
      </ul>
    </div>
  )
}
