import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schemaFilter: ["public"],
  schema: "./src/db/schemas/**.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  migrations: {
    prefix: "supabase",
    schema: "public",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
