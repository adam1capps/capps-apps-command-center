"use client";

import { useEffect, useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import type { ViewId } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { AppWithSnapshot } from "@/lib/db-queries";

import { Header } from "./Header";
import { ViewSwitcher } from "./ViewSwitcher";
import { GridView } from "./GridView";

// Search filter mirrors prototype/app.jsx:64-76, debounced 150ms.
export function DashboardClient({
  apps,
  polledAgo,
}: {
  apps: AppWithSnapshot[];
  polledAgo: string;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [view, setView] = useState<ViewId>("grid");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 150);
    return () => clearTimeout(id);
  }, [q]);

  const matched = useMemo(() => {
    const term = debouncedQ.trim().toLowerCase();
    if (!term) return apps;
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term) ||
        (CATEGORIES[a.category as Category]?.label.toLowerCase().includes(term) ??
          false) ||
        a.apiDependencies.some((d) => d.toLowerCase().includes(term)) ||
        (a.githubRepo?.toLowerCase().includes(term) ?? false),
    );
  }, [debouncedQ, apps]);

  return (
    <>
      <Header q={q} setQ={setQ} polledAgo={polledAgo} />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <ViewSwitcher view={view} setView={setView} attentionCount={0} />
        </div>
        {view === "grid" ? (
          <GridView apps={matched} />
        ) : (
          <div
            style={{
              border: `1px solid ${CC.HAIR}`,
              borderRadius: 10,
              background: CC.SURFACE_2,
              padding: "40px 24px",
              textAlign: "center",
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 13,
              color: CC.MUTED,
            }}
          >
            {view === "pipeline" ? "Pipeline" : "Needs Attention"} view lands in
            Phase 6.
          </div>
        )}
      </main>
    </>
  );
}
