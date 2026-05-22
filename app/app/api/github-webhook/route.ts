import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@/db/client";
import { integrationEvents } from "@/db/schema";
import { invalidatePaths, resolveAppByRepo } from "@/lib/cappshub";

// GitHub push webhook: invalidates notes_cache for any pushed `.cappshub/*` or
// CLAUDE.md file so the detail page reflects new content immediately instead of
// waiting out the 5-minute freshness window. Guarded by an HMAC signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PushCommit {
  added?: string[];
  modified?: string[];
  removed?: string[];
}
interface PushPayload {
  ref?: string;
  repository?: { full_name?: string; default_branch?: string };
  commits?: PushCommit[];
  head_commit?: { id?: string; message?: string } | null;
  pusher?: { name?: string };
}

function signatureValid(secret: string, body: string, header: string | null): boolean {
  if (!header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isRelevant(path: string): boolean {
  return path.startsWith(".cappshub/") || path === "CLAUDE.md";
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CAPPSHUB_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const body = await request.text();
  if (!signatureValid(secret, body, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event === "ping") return Response.json({ ok: true, pong: true });
  if (event !== "push") return Response.json({ ok: true, ignored: event });

  let payload: PushPayload;
  try {
    payload = JSON.parse(body) as PushPayload;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const repo = payload.repository?.full_name;
  if (!repo) return Response.json({ ok: true, ignored: "no-repo" });

  // The cache reflects the repo's default branch (reads use no explicit ref),
  // so only act on pushes to that branch.
  const defaultBranch = payload.repository?.default_branch ?? "main";
  if (payload.ref && payload.ref !== `refs/heads/${defaultBranch}`) {
    return Response.json({ ok: true, ignored: "non-default-branch" });
  }

  const changed = new Set<string>();
  for (const c of payload.commits ?? []) {
    for (const p of [...(c.added ?? []), ...(c.modified ?? []), ...(c.removed ?? [])]) {
      if (isRelevant(p)) changed.add(p);
    }
  }
  if (changed.size === 0) return Response.json({ ok: true, invalidated: 0 });

  const appId = await resolveAppByRepo(repo);
  if (!appId) return Response.json({ ok: true, ignored: "unmanaged-repo" });

  const paths = [...changed];
  const invalidated = await invalidatePaths(appId, paths);

  await db.insert(integrationEvents).values({
    appId,
    kind: "push",
    text: payload.head_commit?.message?.slice(0, 280) ?? `push to ${repo}`,
    actor: payload.pusher?.name ?? null,
    repoPath: paths[0] ?? null,
    commitSha: payload.head_commit?.id ?? null,
  });

  return Response.json({ ok: true, invalidated, paths });
}
