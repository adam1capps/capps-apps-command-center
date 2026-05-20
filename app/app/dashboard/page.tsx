import { DashboardClient } from "@/components/dash/DashboardClient";
import { getDashboardApps } from "@/lib/db-queries";
import type { DashboardApp } from "@/lib/db-queries";
import { getIssues } from "@/lib/derive";
import { relTimeShort } from "@/lib/format";
import type { Stage } from "@/lib/tokens";

// Reads live data per request; protected by proxy.ts (clerkMiddleware).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const apps = await getDashboardApps();

  const withIssues: DashboardApp[] = apps.map((a) => ({
    ...a,
    issues: a.snapshot
      ? getIssues(
          { stage: a.stage as Stage, liveUrl: a.liveUrl, blockers: a.blockers },
          a.snapshot,
        )
      : [],
  }));

  const attentionCount = withIssues.reduce((n, a) => n + a.issues.length, 0);

  const newest = apps
    .map((a) => a.snapshot?.checkedAt)
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <DashboardClient
      apps={withIssues}
      attentionCount={attentionCount}
      polledAgo={relTimeShort(newest ?? null)}
    />
  );
}
