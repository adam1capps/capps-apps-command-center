"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App, StatusSnapshot } from "@/db/schema";
import type { Issue } from "@/lib/derive";

import { IssuesBanner, pillBtnStyle, launchBtnStyle } from "./primitives";

// Ported from prototype/ui-detail.jsx:8-100 (top bar). Hero, quick stats, and
// panels land in PR 7B/7C; this shell establishes the route, sticky top bar,
// and responsive container.
export function AppDetailPage({
  app,
  issues,
}: {
  app: App;
  snapshot: StatusSnapshot | null;
  issues: Issue[];
}) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/dashboard");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: CC.SURFACE_2, animation: "ccFade .14s ease-out" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 30,
          borderBottom: `1px solid ${CC.HAIR}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link href="/dashboard" style={{ ...pillBtnStyle, background: "transparent" }}>
            ← Command Center
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11.5,
              color: CC.MUTED,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.accent }} />
            <span>{CATEGORIES[app.category as Category]?.label ?? app.category}</span>
            <span>/</span>
            <span style={{ color: CC.INK, fontWeight: 700 }}>{app.name}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {app.githubRepo && (
              <a
                href={`https://github.com/${app.githubRepo}`}
                target="_blank"
                rel="noopener"
                style={pillBtnStyle}
              >
                Repo ↗
              </a>
            )}
            {app.liveUrl ? (
              <a href={app.liveUrl} target="_blank" rel="noopener" style={launchBtnStyle(cat.accent)}>
                Launch
                <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 13 }}>
                  ↗
                </span>
              </a>
            ) : (
              <span
                style={{
                  ...launchBtnStyle(cat.accent),
                  opacity: 0.45,
                  cursor: "not-allowed",
                  background: CC.MUTED_2,
                  color: "#fff",
                }}
              >
                No live URL
              </span>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px 80px" }}>
        {issues.length > 0 && <IssuesBanner issues={issues} />}

        <div
          style={{
            border: `1px solid ${CC.HAIR}`,
            borderRadius: 10,
            background: "#fff",
            padding: "28px 24px",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 13,
            color: CC.MUTED,
          }}
        >
          Hero, quick stats, plan, and panels land in the next slices.
        </div>
      </div>
    </div>
  );
}
