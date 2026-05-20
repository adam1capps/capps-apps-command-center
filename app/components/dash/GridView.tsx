"use client";

import { useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { AppWithSnapshot } from "@/lib/db-queries";
import type { Category } from "@/lib/tokens";

import { AppCard } from "./AppCard";

// Ported from prototype/ui-views.jsx:4-85.
export function GridView({
  apps,
  density = "comfortable",
}: {
  apps: AppWithSnapshot[];
  density?: "comfortable" | "compact";
}) {
  const [tab, setTab] = useState<"all" | Category>("all");
  const cats = Object.values(CATEGORIES);

  const counts: Record<string, number> = {};
  apps.forEach((a) => {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  });

  const sections =
    tab === "all"
      ? cats
          .map((c) => ({ cat: c, items: apps.filter((a) => a.category === c.id) }))
          .filter((s) => s.items.length > 0)
      : [{ cat: CATEGORIES[tab], items: apps.filter((a) => a.category === tab) }];

  const tabs = [
    { id: "all" as const, label: "All", count: apps.length },
    ...cats.map((c) => ({ id: c.id, label: c.label, count: counts[c.id] ?? 0 })),
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          flexWrap: "wrap",
          borderBottom: `1px solid ${CC.HAIR}`,
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          const accent =
            t.id === "all" ? CC.NAVY : CC.CATS[t.id as Category]?.accent ?? CC.NAVY;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "10px 14px 12px",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? CC.INK : CC.MUTED,
                borderBottom: `2px solid ${active ? accent : "transparent"}`,
                marginBottom: -1,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {t.label}
              <span
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  fontSize: 11,
                  color: active ? accent : CC.MUTED_2,
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {sections.map(({ cat, items }) => (
        <section key={cat.id} style={{ marginBottom: 36 }}>
          {tab === "all" && <SectionHeader label={cat.label} accent={cat.accent} count={items.length} />}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                density === "compact"
                  ? "repeat(auto-fill, minmax(240px, 1fr))"
                  : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((app) => (
              <AppCard key={app.slug} app={app} density={density} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionHeader({
  label,
  accent,
  count,
}: {
  label: string;
  accent: string;
  count: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        paddingBottom: 6,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: accent,
          display: "inline-block",
        }}
      />
      <h3
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: CC.INK,
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        {label}
      </h3>
      <span
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 11,
          color: CC.MUTED_2,
        }}
      >
        {String(count).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, height: 1, background: CC.HAIR_2 }} />
    </div>
  );
}
