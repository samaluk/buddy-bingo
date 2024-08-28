import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { games } from "./games"
import { players } from "./players"
import { users } from "./profiles"
import { votes } from "./votes"

export const statements = pgTable(
  "statements",
  {
    id: serial("id").primaryKey(),
    text: text("text").notNull(),
    marked: boolean("marked").notNull().default(false),
    created_at: timestamp("created_at").notNull().defaultNow(),

    game_id: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    created_by: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => {
    return {
      playerReference: foreignKey({
        columns: [table.game_id, table.created_by],
        foreignColumns: [players.game_id, players.user_id],
      }),
    }
  },
)

export const statementsRelations = relations(statements, ({ one, many }) => ({
  game: one(games, {
    fields: [statements.game_id],
    references: [games.id],
  }),
  created_by: one(players, {
    fields: [statements.created_by],
    references: [players.user_id],
  }),
  votes: many(votes),
}))

export type NewStatement = typeof statements.$inferInsert
export type Statement = typeof statements.$inferSelect
export const StatementSchema = createSelectSchema(statements, {
  created_at: z.date().or(z.string()).pipe(z.coerce.date()),
})
export const NewStatementSchema = createInsertSchema(statements, {
  game_id: z.number().or(z.string()).pipe(z.coerce.number()),
  created_at: z.date().or(z.string()).pipe(z.coerce.date()),
})
