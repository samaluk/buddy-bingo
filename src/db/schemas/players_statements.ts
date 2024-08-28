import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { players } from "./players"
import { users } from "./profiles"
import { statements } from "./statements"

export const players_statements = pgTable(
  "players_statements",
  {
    statement_id: integer("statement_id")
      .notNull()
      .references(() => statements.id, {
        onDelete: "cascade",
      }),
    player_id: uuid("player_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    marked: boolean("marked").notNull().default(false),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      unq: unique().on(table.statement_id, table.player_id),
      playerReference: foreignKey({
        columns: [table.statement_id, table.player_id],
        foreignColumns: [players.game_id, players.user_id],
      }),
    }
  },
)

export const playersStatementsRelations = relations(
  players_statements,
  ({ one }) => ({
    player: one(players, {
      fields: [players_statements.player_id],
      references: [players.user_id],
    }),
    statement: one(statements, {
      fields: [players_statements.statement_id],
      references: [statements.id],
    }),
  }),
)

export type NewPlayersStatements = typeof players_statements.$inferInsert
export type PlayersStatements = typeof players_statements.$inferSelect
