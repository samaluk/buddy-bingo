import { relations } from "drizzle-orm"
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { games } from "./games"
import { profiles } from "./profiles"

export const playerRoleEnum = pgEnum("player_role", [
  "player",
  "moderator",
  "host",
])

export const players = pgTable(
  "players",
  {
    game_id: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 256 }),
    deleted_at: timestamp("deleted_at"),
    role: playerRoleEnum("role").notNull().default("player"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.game_id, table.user_id] }),
    username_once_per_game: unique().on(table.game_id, table.username),
  }),
)

export const playersRelations = relations(players, ({ one }) => ({
  game: one(games, {
    fields: [players.game_id],
    references: [games.id],
  }),
  user: one(profiles, {
    fields: [players.user_id],
    references: [profiles.id],
  }),
}))

export type NewPlayer = typeof players.$inferInsert
export type Player = typeof players.$inferSelect
export const PlayerSchema = createSelectSchema(players, {
  created_at: z.date().or(z.string()).pipe(z.coerce.date()),
})
export const NewPlayerSchema = createInsertSchema(players, {
  game_id: z.number().or(z.string()).pipe(z.coerce.number()),
  created_at: z.date().or(z.string()).pipe(z.coerce.date()),
})
