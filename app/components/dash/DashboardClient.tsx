"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SyncToast } from "@/components/SyncToast";
import { CATEGORIES } from "@/lib/constants";
import type { ViewId } from "@/lib/constants";
import type { Category } from "@/lib/tokens";
import type { DashboardApp } from "@/lib/db-queries";

import { Header } from "./Header";
import { ViewSwitcher } from "./ViewSwitcher";
import { GridView } from "./GridView";
import { PipelineView } from "./PipelineView";
import { AttentionView } from "./AttentionView";

// Search filter mirrors prototype/app.jsx:64-76, debounced 150ms. The active
// view lives in the URL (?view=grid|pipeline|attention) so it survives reload.
export function DashboardClient({
  apps,
  attentionCount,
  polledAgo,
}: {
  apps: DashboardApp[];
  attentionCount: number;
  polledAgo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: ViewId =
    viewParam === "pipeline" || viewParam === "attention" ? viewParam : "grid";
  const setView = (v: ViewId) =>
    router.replace(v === "grid" ? "/dashboard" : `/dashboard?view=${v}`);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 150);
    return () => clearTimeout(id);
  }, [q]);

  const slugMap = useMemo(() => {
    const m: Record<string, { slug: string; name: string }> = {};
    for (const a of apps) m[a.id] = { slug: a.slug, name: a.name };
    return m;
  }, [apps]);

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
          <ViewSwitcher view={view} setView={setView} attentionCount={attentionCount} />
        </div>
        {view === "grid" && <GridView apps={matched} />}
        {view === "pipeline" && <PipelineView apps={matched} />}
        {view === "attention" && <AttentionView apps={matched} />}
      </main>
      <SyncToast slugMap={slugMap} />
    </>
  );
}
