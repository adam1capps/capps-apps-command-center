import { and, desc, eq, isNotNull, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { apps, notes, statusSnapshots } from "@/db/schema";
import type { App, Note, StatusSnapshot } from "@/db/schema";
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
