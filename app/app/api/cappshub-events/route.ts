import { timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { apps, integrationEvents } from "@/db/schema";

// External-facing events endpoint for Claude Code hooks + slash commands
// (Phase 12). Guarded by the CAPPSHUB_HOOK_TOKEN Bearer token; signed-in
// dashboard users do not call this directly (they read the stream).
// On success: one row in `integration_events`, picked up by the SSE poller
// in `app/app/api/events/stream/route.ts` within ~1.5s.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["push", "note", "instruct", "plan", "sync"] as const;
const TEXT_MAX = 280;

const Body = z.object({
  appSlug: z.string().min(1).max(120),
  kind: z.enum(KINDS),
  text: z.string().min(1),
  actor: z.string().max(120).optional(),
  repoPath: z.string().max(500).optional(),
  commitSha: z.string().max(80).optional(),
});

function tokenMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.CAPPSHUB_HOOK_TOKEN;
  if (!expected) return jsonError("endpoint not configured", 503);

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!bearer || !tokenMatches(expected, bearer)) {
    return jsonError("unauthorized", 401);
  }

  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "bad request", 400);
  }
  const { appSlug, kind, text, actor, repoPath, commitSha } = parsed.data;

  const [app] = await db
    .select({ id: apps.id })
    .from(apps)
    .where(eq(apps.slug, appSlug))
    .limit(1);
  if (!app) return jsonError("unknown app slug", 404);

  await db.insert(integrationEvents).values({
    appId: app.id,
    kind,
    text: text.slice(0, TEXT_MAX),
    actor: actor ?? null,
    repoPath: repoPath ?? null,
    commitSha: commitSha ?? null,
  });

  return new Response(null, { status: 204 });
}

export function GET(): Response {
  return jsonError("method not allowed", 405);
}
