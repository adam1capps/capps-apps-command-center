// Seed the apps + status_snapshots tables from prototype-derived data.
// Run with: pnpm db:seed (requires NETLIFY_DATABASE_URL_UNPOOLED or DATABASE_URL).

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

import * as schema from "./schema";
import { APPS } from "./seed-data";
import { deriveSnapshot } from "../lib/derive";

const url =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
  process.env.NETLIFY_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "";

if (!url) {
  console.error("Missing NETLIFY_DATABASE_URL_UNPOOLED / DATABASE_URL");
  process.exit(1);
}

const client = neon(url);
const db = drizzle(client, { schema });

async function main() {
  console.log(`Seeding ${APPS.length} apps...`);

  // Idempotent: clear before insert. Snapshots cascade on app delete.
  await db.execute(sql`TRUNCATE TABLE ${schema.statusSnapshots}, ${schema.apps} RESTART IDENTITY CASCADE`);

  for (const app of APPS) {
    const [inserted] = await db
      .insert(schema.apps)
      .values({
        slug: app.slug,
        name: app.name,
        category: app.category,
        description: app.description,
        liveUrl: app.liveUrl,
        customDomain: app.customDomain,
        githubRepo: app.githubRepo,
        hosting: app.hosting,
        stage: app.stage,
        visibleOnShowcase: app.visibleOnShowcase,
        nextMove: app.nextMove,
        blockers: app.blockers,
        apiDependencies: app.apiDependencies,
      })
      .returning({ id: schema.apps.id });

    const derived = deriveSnapshot({
      stage: app.stage,
      liveUrl: app.liveUrl,
      githubRepo: app.githubRepo,
      snap: app.snap,
    });

    await db.insert(schema.statusSnapshots).values({
      appId: inserted.id,
      checkedAt: new Date(derived.checkedAt),
      urlStatus: derived.urlStatus,
      urlResponseMs: derived.urlResponseMs,
      lastCommitAt: derived.lastCommitAt ? new Date(derived.lastCommitAt) : null,
      lastCommitMsg: derived.lastCommitMsg,
      daysSinceCommit: derived.daysSinceCommit,
      healthScore: derived.healthScore,
      driftDetected: derived.driftDetected,
    });
  }

  const [{ count: appCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.apps);
  const [{ count: snapCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.statusSnapshots);

  console.log(`Done. apps=${appCount} status_snapshots=${snapCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
