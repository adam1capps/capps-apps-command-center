import { notFound } from "next/navigation";

import { AppDetailPage } from "@/components/detail/AppDetailPage";
import { getAppBySlug } from "@/lib/db-queries";
import { getIssues } from "@/lib/derive";
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

  return <AppDetailPage app={app} snapshot={app.snapshot} issues={issues} />;
}
