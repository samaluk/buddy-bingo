import { pgSchema, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

const authSchema = pgSchema("auth")

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
})

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  username: varchar("username", { length: 256 }),
  email: varchar("email", { length: 256 }),
})

export type NewProfile = typeof profiles.$inferInsert
export type Profile = typeof profiles.$inferSelect
export const ProfileSchema = createSelectSchema(profiles)
export const NewProfileSchema = createInsertSchema(profiles)
