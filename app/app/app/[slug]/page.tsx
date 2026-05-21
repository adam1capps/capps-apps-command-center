import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { notes } from "@/db/schema";
import { AppDetailPage } from "@/components/detail/AppDetailPage";
import { getAppBySlug } from "@/lib/db-queries";
import { getIssues } from "@/lib/derive";
import { intelFor } from "@/lib/intel";
import type { Stage } from "@/lib/tokens";
import type { ClientNote } from "@/components/notes/NoteRow";

// Reads live data per request; protected by proxy.ts (clerkMiddleware).
export const dynamic = "force-dynamic";

export default async function AppDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) notFound();

  const issues = app.snapshot
    ? getIssues(
        { stage: app.stage as Stage, liveUrl: app.liveUrl, blockers: app.blockers },
        app.snapshot,
      )
    : [];

  const intel = intelFor({
    slug: app.slug,
    stage: app.stage,
    githubRepo: app.githubRepo,
    liveUrl: app.liveUrl,
    hosting: app.hosting,
    apiDependencies: app.apiDependencies,
    nextMove: app.nextMove,
    urlStatus: app.snapshot?.urlStatus ?? null,
  });

  const recentNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.appId, app.id))
    .orderBy(desc(notes.updatedAt))
    .limit(4);

  const serializedNotes: ClientNote[] = recentNotes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return (
    <AppDetailPage
      app={app}
      snapshot={app.snapshot}
      issues={issues}
      intel={intel}
      notesCount={app.notesCount}
      recentNotes={serializedNotes}
    />
  );
}

