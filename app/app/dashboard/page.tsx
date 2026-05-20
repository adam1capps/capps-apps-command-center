import { DashboardClient } from "@/components/dash/DashboardClient";
import { getDashboardApps } from "@/lib/db-queries";
import { relTimeShort } from "@/lib/format";

// Reads live data per request; protected by proxy.ts (clerkMiddleware).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const apps = await getDashboardApps();

  const newest = apps
    .map((a) => a.snapshot?.checkedAt)
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return <DashboardClient apps={apps} polledAgo={relTimeShort(newest ?? null)} />;
}
