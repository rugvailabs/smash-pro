import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit is run via `npm run db:push`, which loads .env.local
    url: process.env.DATABASE_URL!,
  },
});
