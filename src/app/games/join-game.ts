"use server"
import { db } from "@/db"
import { NewPlayerSchema, players } from "@/db/schemas/players"
import { profiles } from "@/db/schemas/profiles"
import { getUser } from "@/lib/auth"
import { actionClient } from "@/lib/safe-action"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export const joinGame = actionClient
  .schema(NewPlayerSchema.pick({ game_id: true }))
  .action(async ({ parsedInput }) => {
    const user = await getUser()

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
    })
    if (!profile) {
      redirect("/login")
    }

    // check if user is already in game but deleted
    const player = await db.query.players.findFirst({
      where: and(
        eq(players.game_id, parsedInput.game_id),
        eq(players.user_id, user.id),
      ),
    })

    if (!player) {
      await db.insert(players).values({
        user_id: user.id,
        game_id: parsedInput.game_id,
        username: profile.username,
      })

      return { message: "Joined game" }
    }

    if (player.deleted_at) {
      await db
        .update(players)
        .set({ deleted_at: null, role: "player" })
        .where(
          and(
            eq(players.game_id, parsedInput.game_id),
            eq(players.user_id, user.id),
          ),
        )

      return { message: "You are back in the game" }
    }
  })
