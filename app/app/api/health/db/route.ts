import { sql } from "drizzle-orm";

import { db } from "@/db/client";

// Temporary diagnostic for the production 500. Reports whether the DB env var
// is present (without leaking the value), the host it resolves to, and the
// result of a trivial query so the real Postgres/connection error surfaces.
// Remove once the connection is confirmed healthy.
export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.NETLIFY_DATABASE_URL ?? null;
  const hasUrl = Boolean(raw);
  let urlHost: string | null = null;
  try {
    urlHost = raw ? new URL(raw).host : null;
  } catch {
    urlHost = "unparseable";
  }

  try {
    await db.execute(sql`select 1 as ok`);
    return Response.json({ hasUrl, urlHost, ok: true });
  } catch (e) {
    return Response.json({
      hasUrl,
      urlHost,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : null,
    });
  }
}
