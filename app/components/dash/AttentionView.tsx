"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import { relDate } from "@/lib/format";
import type { DashboardApp } from "@/lib/db-queries";
import type { Issue, IssueKind } from "@/lib/derive";

const KIND_COLOR: Record<IssueKind, string> = {
  broken: CC.H_BROKEN,
  drift: CC.H_WARN,
  blocker: CC.NAVY,
  slow: "#A855F7",
  stalled: CC.H_STALE,
};

interface FlatIssue {
  app: DashboardApp;
  issue: Issue;
  key: string;
}

// Ported from prototype/ui-views.jsx:284-360. "Mark resolved" is local
// session state (not persisted), matching the prototype.
export function AttentionView({ apps }: { apps: DashboardApp[] }) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const items: FlatIssue[] = [];
  apps.forEach((a) => {
    a.issues.forEach((issue, idx) => {
      const key = `${a.slug}::${issue.kind}::${idx}`;
      if (!resolved.has(key)) items.push({ app: a, issue, key });
    });
  });
  items.sort((a, b) => a.issue.severity - b.issue.severity);

  const count = (kind: IssueKind) =>
    items.filter((i) => i.issue.kind === kind).length;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 10,
          marginBottom: 22,
        }}
      >
        <SummaryStat n={count("broken")} label="Broken" color={CC.H_BROKEN} />
        <SummaryStat n={count("drift")} label="Drift" color={CC.H_WARN} />
        <SummaryStat n={count("blocker")} label="Blocked" color={CC.NAVY} />
        <SummaryStat n={count("slow")} label="Slow" color="#A855F7" />
        <SummaryStat n={count("stalled")} label="Stalled" color={CC.H_STALE} />
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: CC.MUTED,
            border: `1px dashed ${CC.HAIR}`,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: CC.INK }}>
            All clear.
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Next poll in ~6h.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(({ app, issue, key }) => (
            <IssueRow
              key={key}
              app={app}
              issue={issue}
              onResolve={() => setResolved((r) => new Set([...r, key]))}
            />
          ))}
        </div>
      )}

      {resolved.size > 0 && (
        <div
          style={{
            marginTop: 24,
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.MUTED_2,
            textAlign: "right",
          }}
        >
          {resolved.size} resolved this session ·{" "}
          <button
            onClick={() => setResolved(new Set())}
            style={{
              background: "transparent",
              border: "none",
              color: CC.NAVY,
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "inherit",
              fontSize: 11,
            }}
          >
            undo
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 8,
        padding: 14,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: n > 0 ? color : CC.MUTED_2,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {String(n).padStart(2, "0")}
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10,
          color: CC.MUTED,
          marginTop: 6,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function IssueRow({
  app,
  issue,
  onResolve,
}: {
  app: DashboardApp;
  issue: Issue;
  onResolve: () => void;
}) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const router = useRouter();
  const kindColor = KIND_COLOR[issue.kind] ?? CC.MUTED;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto auto",
        alignItems: "center",
        gap: 14,
        background: "#fff",
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 8,
        padding: "12px 14px",
        borderLeft: `3px solid ${kindColor}`,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10,
          color: kindColor,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          fontWeight: 700,
          minWidth: 64,
        }}
      >
        {issue.kind}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push(`/app/${app.slug}`)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
              color: CC.INK,
              fontSize: 13.5,
              textAlign: "left",
            }}
          >
            {app.name}
          </button>
          <span style={{ fontSize: 11, color: cat.accent, fontWeight: 600 }}>
            {CATEGORIES[app.category as Category]?.label ?? app.category}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: CC.INK, marginTop: 2 }}>
          {issue.title}
        </div>
        {issue.detail && (
          <div
            style={{
              fontSize: 11.5,
              color: CC.MUTED,
              marginTop: 2,
              fontFamily:
                issue.kind === "broken"
                  ? "var(--font-space-mono), monospace"
                  : "inherit",
            }}
          >
            {issue.detail}
          </div>
        )}
        <div
          style={{
            fontSize: 11.5,
            color: CC.MUTED,
            marginTop: 4,
            fontStyle: "italic",
          }}
        >
          → {issue.action}
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10.5,
          color: CC.MUTED_2,
          textAlign: "right",
          minWidth: 80,
        }}
      >
        {app.snapshot?.urlStatus != null && <div>http {app.snapshot.urlStatus}</div>}
        {app.snapshot?.lastCommitAt && <div>{relDate(app.snapshot.lastCommitAt)}</div>}
      </div>

      <button
        onClick={onResolve}
        style={{
          background: "transparent",
          border: `1px solid ${CC.HAIR}`,
          color: CC.MUTED,
          padding: "6px 10px",
          borderRadius: 6,
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Mark resolved
      </button>
    </div>
  );
}
