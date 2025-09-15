import { relations } from "drizzle-orm"
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { players } from "./players"
import { profiles } from "./profiles"
import { statements } from "./statements"

export const votes = pgTable(
  "votes",
  {
    vote: boolean("vote").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    statement_id: integer("statement_id")
      .notNull()
      .references(() => statements.id, { onDelete: "cascade" }),
    player_id: uuid("player_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      vote_once_per_statement: primaryKey({
        columns: [table.statement_id, table.player_id],
      }),
    }
  },
)

export const votesRelations = relations(votes, ({ one }) => ({
  statement: one(statements, {
    fields: [votes.statement_id],
    references: [statements.id],
  }),
  user: one(players, {
    fields: [votes.player_id],
    references: [players.user_id],
  }),
}))

export type NewVote = typeof votes.$inferInsert
export type Vote = typeof votes.$inferSelect
export const VoteSchema = createSelectSchema(votes, {
  created_at: z.date().or(z.string()).pipe(z.coerce.date()),
  statement_id: z.number().or(z.string()).pipe(z.coerce.number()),
})
export const NewVoteSchema = createInsertSchema(votes)
