"use server"
import { db } from "@/db"
import { games, GameSchema } from "@/db/schemas/games"
import { players } from "@/db/schemas/players"

import { getUser } from "@/lib/auth"
import { actionClient } from "@/lib/safe-action"
import { and, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const leaveGame = actionClient
  .schema(GameSchema.pick({ id: true }))
  .action(async ({ parsedInput: { id: game_id } }) => {
    const user = await getUser()

    // check if user is host
    const game = await db.query.games.findFirst({
      where: eq(games.id, game_id),
      with: {
        players: {
          where: isNull(players.deleted_at),
          columns: {
            role: true,
            user_id: true,
          },
        },
      },
    })

    if (!game) {
      throw new Error("Game not found")
    }

    const host = game.players.find((p) => p.role === "host")
    if (!host) {
      throw new Error("Host not found")
    }

    if (host.user_id === user.id) {
      game.players.sort(() => Math.random() - 0.5)
      const newHost = game.players.find((p) => p.user_id !== host.user_id)
      if (!newHost) {
        throw new Error(
          "Could not find a new host. If you are the only player, you cannot leave the game. You must delete the game instead.",
        )
      }

      await db
        .update(players)
        .set({ role: "host" })
        .where(
          and(
            eq(players.game_id, game_id),
            eq(players.user_id, newHost.user_id),
          ),
        )
    }

    await db
      .update(players)
      .set({ deleted_at: new Date() })
      .where(and(eq(players.game_id, game_id), eq(players.user_id, user.id)))

    revalidatePath("/games")

    return {
      message: "Successfully left game",
    }
  })
