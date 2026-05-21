import { notFound } from "next/navigation";

import { AppDetailPage } from "@/components/detail/AppDetailPage";
import { toNoteUI } from "@/components/notes/meta";
import { getIntegrationFor } from "@/lib/cappshub";
import { getAppBySlug, getNotesForApp } from "@/lib/db-queries";
import { getIssues } from "@/lib/derive";
import { intelFor } from "@/lib/intel";
import type { Stage } from "@/lib/tokens";

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

  const [notes, integration] = await Promise.all([
    getNotesForApp(app.id).then((rows) => rows.map(toNoteUI)),
    getIntegrationFor(app.slug),
  ]);

  return (
    <AppDetailPage
      app={app}
      snapshot={app.snapshot}
      issues={issues}
      intel={intel}
      notes={notes}
      integration={integration}
    />
  );
}

