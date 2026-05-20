"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CATEGORIES, STAGES, STAGE_LABEL } from "@/lib/constants";
import { CC, STAGE_TINT } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { AppWithSnapshot } from "@/lib/db-queries";

import { HealthDot } from "@/components/shared/HealthDot";

// Ported from prototype/ui-views.jsx:89-180.
export function PipelineView({ apps }: { apps: AppWithSnapshot[] }) {
  const [filterCat, setFilterCat] = useState<"all" | Category>("all");
  const cats = Object.values(CATEGORIES);
  const visible =
    filterCat === "all" ? apps : apps.filter((a) => a.category === filterCat);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ id: "all" as const, label: "All categories", accent: CC.NAVY }, ...cats].map(
            (c) => {
              const active = filterCat === c.id;
              const accent = c.id === "all" ? CC.NAVY : c.accent;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(c.id)}
                  style={{
                    background: active ? accent : "#fff",
                    color: active ? "#fff" : CC.MUTED,
                    border: `1px solid ${active ? accent : CC.HAIR}`,
                    padding: "5px 10px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {c.label}
                </button>
              );
            },
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.MUTED_2,
          }}
        >
          {visible.length} apps · {STAGES.length} stages
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`,
          gap: 10,
          alignItems: "stretch",
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {STAGES.map((stage) => {
          const items = visible.filter((a) => a.stage === stage);
          const tint = STAGE_TINT[stage];
          return (
            <div
              key={stage}
              style={{
                background: CC.SURFACE_2,
                border: `1px solid ${CC.HAIR}`,
                borderRadius: 8,
                minHeight: 360,
                padding: 8,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 4px 8px",
                  borderBottom: `1px solid ${CC.HAIR}`,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: tint,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono), monospace",
                      fontSize: 10,
                      color: CC.INK,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      fontWeight: 700,
                    }}
                  >
                    {STAGE_LABEL[stage]}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                    fontSize: 10,
                    color: CC.MUTED_2,
                  }}
                >
                  {items.length}
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}
              >
                {items.map((a) => (
                  <PipelineCard key={a.slug} app={a} />
                ))}
                {items.length === 0 && (
                  <div
                    style={{
                      border: `1px dashed ${CC.HAIR}`,
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 11,
                      color: CC.MUTED_2,
                      textAlign: "center",
                    }}
                  >
                    empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({ app }: { app: AppWithSnapshot }) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/app/${app.slug}`)}
      style={{
        background: "#fff",
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        borderLeft: `3px solid ${cat.accent}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: CC.INK,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: 1,
          }}
        >
          {app.name}
        </div>
        <HealthDot score={app.snapshot?.healthScore ?? "stale"} />
      </div>
      {app.nextMove && (
        <div
          style={{
            marginTop: 4,
            fontSize: 10.5,
            color: CC.MUTED,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          → {app.nextMove}
        </div>
      )}
    </div>
  );
}
