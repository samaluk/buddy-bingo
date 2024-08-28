"use server"
import { db } from "@/db"
import { games, NewGameSchema } from "@/db/schemas/games"
import { players } from "@/db/schemas/players"
import { profiles } from "@/db/schemas/profiles"
import { getUser } from "@/lib/auth"
import { actionClient } from "@/lib/safe-action"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export const createGame = actionClient
  .schema(NewGameSchema.pick({ title: true }))
  .action(async ({ parsedInput }) => {
    console.log("CREATING GAME")
    const user = await getUser()

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
    })
    if (!profile) {
      redirect("/login")
    }

    const [newGame] = await db
      .insert(games)
      .values({
        title: parsedInput.title,
        created_by: user.id,
      })
      .returning({
        id: games.id,
      })

    await db.insert(players).values({
      user_id: user.id,
      game_id: newGame.id,
      username: profile.username || profile.name,
      role: "host",
    })

    return { message: "Game created", game_id: newGame.id }
  })
