import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// The Netlify-Neon extension injects NETLIFY_DATABASE_URL after first
// deploy with @netlify/neon imported. DATABASE_URL is a local-dev fallback.
// During build before Neon provisioning, the URL may be absent; queries
// will fail at fetch time with a clear error rather than at import.
const url =
  process.env.NETLIFY_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgres://unset@localhost/unset";

const sql = neon(url);

export const db = drizzle(sql, { schema });
