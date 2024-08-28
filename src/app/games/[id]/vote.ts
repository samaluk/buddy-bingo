"use server"
import { db } from "@/db"
import { statements } from "@/db/schemas/statements"
import { votes, VoteSchema } from "@/db/schemas/votes"
import { getUser } from "@/lib/auth"
import { actionClient } from "@/lib/safe-action"
import { and, eq } from "drizzle-orm"

export const vote = actionClient
  .schema(VoteSchema.pick({ statement_id: true, vote: true }))
  .action(async ({ parsedInput }) => {
    console.log("VOTING", parsedInput.vote)
    const user = await getUser()

    const DBvote = await db.query.votes.findFirst({
      where: and(
        eq(votes.statement_id, parsedInput.statement_id),
        eq(votes.player_id, user.id),
      ),
    })
    if (DBvote) {
      if (DBvote.vote === parsedInput.vote) {
        return { message: "Already voted" }
      }

      await db
        .update(votes)
        .set({ vote: parsedInput.vote })
        .where(
          and(
            eq(votes.statement_id, parsedInput.statement_id),
            eq(votes.player_id, user.id),
          ),
        )

      return { message: "Vote updated" }
    }

    const q = db.insert(votes).values({
      player_id: user.id,
      statement_id: parsedInput.statement_id,
      vote: parsedInput.vote,
    })
    const query = q.toSQL()
    console.log(query.sql)
    console.log(query.params)
    console.log("INSERTING VOTE")
    await q

    return { message: "Voted" }
  })

export const clearVote = actionClient
  .schema(VoteSchema.pick({ statement_id: true }))
  .action(async ({ parsedInput }) => {
    console.log("CLEARING VOTE")
    const user = await getUser()

    const statement = await db.query.statements.findFirst({
      where: eq(statements.id, parsedInput.statement_id),
      columns: {},
      with: { game: true },
    })

    if (!statement) {
      return { message: "Statement not found" }
    }

    if (!statement.game || statement.game.status !== "draft") {
      return { message: "Game is not in draft" }
    }

    const DBvote = await db.query.votes.findFirst({
      where: and(
        eq(votes.statement_id, parsedInput.statement_id),
        eq(votes.player_id, user.id),
      ),
    })
    if (!DBvote) {
      return { message: "No vote to clear" }
    }

    await db
      .delete(votes)
      .where(
        and(
          eq(votes.statement_id, parsedInput.statement_id),
          eq(votes.player_id, user.id),
        ),
      )

    return { message: "Vote cleared" }
  })
