import { and, desc, eq, gte, isNotNull, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { apps, integrationEvents, notes, statusSnapshots } from "@/db/schema";
import type { App, IntegrationEvent, Note, StatusSnapshot } from "@/db/schema";
import type { Issue } from "@/lib/derive";

export type AppWithSnapshot = App & { snapshot: StatusSnapshot | null };
export type DashboardApp = AppWithSnapshot & { issues: Issue[] };

// Public showcase set: visible, not archived, has a live URL.
// Mirrors the prototype filter in ui-showcase.jsx:6-8.
export async function getShowcaseApps(): Promise<App[]> {
  return db
    .select()
    .from(apps)
    .where(
      and(
        eq(apps.visibleOnShowcase, true),
        ne(apps.stage, "archive"),
        isNotNull(apps.liveUrl),
      ),
    );
}

// One app by slug, paired with its most recent snapshot. null if not found.
export async function getAppBySlug(slug: string): Promise<AppWithSnapshot | null> {
  const [app] = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  if (!app) return null;
  const [snap] = await db
    .select()
    .from(statusSnapshots)
    .where(eq(statusSnapshots.appId, app.id))
    .orderBy(desc(statusSnapshots.checkedAt))
    .limit(1);
  return { ...app, snapshot: snap ?? null };
}

// All notes for one app, newest-updated first. Drives the notes modal,
// detail-page preview, and full-page editor.
export async function getNotesForApp(appId: string): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(eq(notes.appId, appId))
    .orderBy(desc(notes.updatedAt));
}

// Recent integration_events for the /integration page initial paint. The SSE
// stream (app/app/api/events/stream/route.ts) appends newer rows after the
// connection opens.
export async function getRecentEvents(limit = 50): Promise<IntegrationEvent[]> {
  return db
    .select()
    .from(integrationEvents)
    .orderBy(desc(integrationEvents.createdAt))
    .limit(limit);
}

// Apps eligible to receive a webhook + .cappshub/ sync: have a github_repo and
// are not archived. Used by the connected-repos list on /integration.
export async function getConnectedRepos(): Promise<App[]> {
  return db
    .select()
    .from(apps)
    .where(and(isNotNull(apps.githubRepo), ne(apps.stage, "archive")))
    .orderBy(apps.name);
}

// Aggregate counts for the /integration stats strip.
export interface IntegrationSummary {
  connectedRepos: number;
  events24h: number;
  eventsTotal: number;
}
export async function getIntegrationSummary(): Promise<IntegrationSummary> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ connected }] = await db
    .select({ connected: sql<number>`count(*)::int` })
    .from(apps)
    .where(and(isNotNull(apps.githubRepo), ne(apps.stage, "archive")));
  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(integrationEvents)
    .where(gte(integrationEvents.createdAt, since));
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(integrationEvents);
  return { connectedRepos: connected ?? 0, events24h: recent ?? 0, eventsTotal: total ?? 0 };
}

// Every app paired with its most recent status snapshot (DISTINCT ON app_id,
// newest checked_at). Drives the dashboard.
export async function getDashboardApps(): Promise<AppWithSnapshot[]> {
  const [allApps, latestSnaps] = await Promise.all([
    db.select().from(apps).orderBy(apps.name),
    db
      .selectDistinctOn([statusSnapshots.appId])
      .from(statusSnapshots)
      .orderBy(statusSnapshots.appId, desc(statusSnapshots.checkedAt)),
  ]);
  const byApp = new Map(latestSnaps.map((s) => [s.appId, s]));
  return allApps.map((a) => ({ ...a, snapshot: byApp.get(a.id) ?? null }));
}
