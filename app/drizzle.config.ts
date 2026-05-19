import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const url =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
  process.env.NETLIFY_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
