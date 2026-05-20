// Shared status-poll routine, used by the Netlify Scheduled Function
// (netlify/functions/poll-status.ts) and the manual trigger
// (app/api/poll-now/route.ts). Relative imports keep the module safe for the
// Netlify function bundler, which does not resolve the "@/" tsconfig alias.

import { db } from "../db/client";
import { apps, statusSnapshots } from "../db/schema";
import { deriveSnapshot } from "./derive";
import { getLatestCommit } from "./github";
import type { Stage } from "./tokens";

export interface PollResult {
  checked: number;
  inserted: number;
  errors: number;
  githubRateLimitRemaining: number | null;
}

async function probeUrl(url: string): Promise<{ status: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
    });
    return { status: res.status, ms: Date.now() - start };
  } catch {
    // Network error / timeout / DNS failure all collapse to status 0,
    // which deriveSnapshot treats as broken.
    return { status: 0, ms: Date.now() - start };
  }
}

export async function runPoll(now: Date = new Date()): Promise<PollResult> {
  const rows = await db.select().from(apps);
  let inserted = 0;
  let errors = 0;
  let githubRateLimitRemaining: number | null = null;

  for (const app of rows) {
    try {
      let urlStatus: number | null = null;
      let urlResponseMs: number | null = null;
      if (app.liveUrl) {
        const probe = await probeUrl(app.liveUrl);
        urlStatus = probe.status;
        urlResponseMs = probe.ms;
      }

      let lastCommitAt: string | null = null;
      let lastCommitMsg: string | null = null;
      if (app.githubRepo) {
        const { data, rateLimitRemaining } = await getLatestCommit(app.githubRepo);
        if (rateLimitRemaining != null) githubRateLimitRemaining = rateLimitRemaining;
        if (data) {
          lastCommitAt = data.date;
          lastCommitMsg = data.message;
        }
      }

      const derived = deriveSnapshot(
        {
          stage: app.stage as Stage,
          liveUrl: app.liveUrl,
          githubRepo: app.githubRepo,
          snap: { urlStatus, urlResponseMs, lastCommitAt, lastCommitMsg },
        },
        now,
      );

      await db.insert(statusSnapshots).values({
        appId: app.id,
        checkedAt: new Date(derived.checkedAt),
        urlStatus: derived.urlStatus,
        urlResponseMs: derived.urlResponseMs,
        lastCommitAt: derived.lastCommitAt ? new Date(derived.lastCommitAt) : null,
        lastCommitMsg: derived.lastCommitMsg,
        daysSinceCommit: derived.daysSinceCommit,
        healthScore: derived.healthScore,
        driftDetected: derived.driftDetected,
      });
      inserted++;
    } catch (err) {
      errors++;
      console.error(`poll: ${app.slug} failed`, err);
    }
  }

  console.log(
    `poll done: checked=${rows.length} inserted=${inserted} errors=${errors} githubRateLimitRemaining=${githubRateLimitRemaining}`,
  );
  return { checked: rows.length, inserted, errors, githubRateLimitRemaining };
}
