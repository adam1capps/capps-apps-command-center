// Install the GitHub push webhook on every managed repo so pushes invalidate
// notes_cache immediately (Phase 11). Run locally, never deployed.
//
// Requires GITHUB_TOKEN + CAPPSHUB_WEBHOOK_SECRET in app/.env.local.
//   pnpm webhooks:install            # all managed repos
//   pnpm webhooks:install hub        # only repos whose full name contains "hub"
//
// Idempotent: skips a repo that already has a hook pointing at WEBHOOK_URL.
import { config } from "dotenv";
config({ path: ".env.local" });

import { APPS } from "../db/seed-data";

const GITHUB_API = "https://api.github.com";
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "https://hub.cappsapps.ai/api/github-webhook";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function existingHookId(repo: string, token: string): Promise<number | null> {
  const res = await fetch(`${GITHUB_API}/repos/${repo}/hooks`, { headers: headers(token) });
  if (!res.ok) throw new Error(`list hooks: ${res.status} ${await res.text()}`);
  const hooks = (await res.json()) as { id: number; config?: { url?: string } }[];
  return hooks.find((h) => h.config?.url === WEBHOOK_URL)?.id ?? null;
}

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const secret = process.env.CAPPSHUB_WEBHOOK_SECRET;
  if (!token || !secret) {
    console.error("Missing GITHUB_TOKEN or CAPPSHUB_WEBHOOK_SECRET in app/.env.local");
    process.exit(1);
  }

  const filter = process.argv[2];
  const repos = [...new Set(APPS.map((a) => a.githubRepo).filter((r): r is string => !!r))].filter(
    (r) => !filter || r.includes(filter),
  );

  if (repos.length === 0) {
    console.log(filter ? `No managed repos match "${filter}".` : "No managed repos.");
    return;
  }

  console.log(`Installing ${WEBHOOK_URL} on ${repos.length} repo(s):`);
  for (const repo of repos) {
    try {
      const existing = await existingHookId(repo, token);
      if (existing != null) {
        console.log(`  = ${repo} (already installed, hook ${existing})`);
        continue;
      }
      const res = await fetch(`${GITHUB_API}/repos/${repo}/hooks`, {
        method: "POST",
        headers: { ...headers(token), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "web",
          active: true,
          events: ["push"],
          config: { url: WEBHOOK_URL, content_type: "json", secret, insecure_ssl: "0" },
        }),
      });
      if (!res.ok) {
        console.error(`  x ${repo}: ${res.status} ${await res.text()}`);
        continue;
      }
      const hook = (await res.json()) as { id: number };
      console.log(`  + ${repo} (hook ${hook.id})`);
    } catch (err) {
      console.error(`  x ${repo}: ${(err as Error).message}`);
    }
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
