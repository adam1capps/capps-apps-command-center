// Remove the Command Center push webhook from managed repos (Phase 11 rollback).
// Run locally. Requires GITHUB_TOKEN in app/.env.local.
//   pnpm webhooks:uninstall          # all managed repos
//   pnpm webhooks:uninstall hub      # only repos whose full name contains "hub"
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

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Missing GITHUB_TOKEN in app/.env.local");
    process.exit(1);
  }

  const filter = process.argv[2];
  const repos = [...new Set(APPS.map((a) => a.githubRepo).filter((r): r is string => !!r))].filter(
    (r) => !filter || r.includes(filter),
  );

  console.log(`Removing ${WEBHOOK_URL} from ${repos.length} repo(s):`);
  for (const repo of repos) {
    try {
      const res = await fetch(`${GITHUB_API}/repos/${repo}/hooks`, { headers: headers(token) });
      if (!res.ok) throw new Error(`list hooks: ${res.status} ${await res.text()}`);
      const hooks = (await res.json()) as { id: number; config?: { url?: string } }[];
      const match = hooks.find((h) => h.config?.url === WEBHOOK_URL);
      if (!match) {
        console.log(`  = ${repo} (no hook)`);
        continue;
      }
      const del = await fetch(`${GITHUB_API}/repos/${repo}/hooks/${match.id}`, {
        method: "DELETE",
        headers: headers(token),
      });
      if (!del.ok) {
        console.error(`  x ${repo}: ${del.status} ${await del.text()}`);
        continue;
      }
      console.log(`  - ${repo} (removed hook ${match.id})`);
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
