import { env } from "@/env.mjs"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as games from "./schemas/games"
import * as players from "./schemas/players"
import * as players_statements from "./schemas/players_statements"
import * as profiles from "./schemas/profiles"
import * as statements from "./schemas/statements"
import * as votes from "./schemas/votes"

config({ path: ".env.development.local" })

const schema = {
  ...games,
  ...players_statements,
  ...players,
  ...profiles,
  ...statements,
  ...votes,
}

export const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, { schema })
