import { relations } from "drizzle-orm"
import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { players } from "./players"
import { profiles } from "./profiles"
import { statements } from "./statements"

export const gameStatusEnum = pgEnum("game_status", [
  "draft",
  "playing",
  "finished",
])

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: gameStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),

  created_by: uuid("user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
})

export const gamesRelations = relations(games, ({ one, many }) => ({
  created_by: one(profiles, {
    fields: [games.created_by],
    references: [profiles.id],
  }),
  players: many(players),
  statements: many(statements),
}))

export type NewGame = typeof games.$inferInsert
export type Game = typeof games.$inferSelect
export const GameSchema = createSelectSchema(games, {
  id: z.string().or(z.number()).pipe(z.coerce.number()),
})
export const NewGameSchema = createInsertSchema(games, {
  title: z.string().min(1).max(255),
}).pick({ title: true, created_by: true })
