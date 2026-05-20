"use client";

import { useState } from "react";

import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { PlanItem } from "@/lib/intel";

import { Card } from "./primitives";

function CheckGlyph({ color = "#fff" }: { color?: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path
        d="M1 4.5L3.5 7L8 1.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ported from prototype/ui-detail.jsx:196-244. Toggles are local-only in
// Phase 7B (Phase 8B wires persistence to .cappshub/plan.json).
export function PlanCard({
  category,
  plan,
}: {
  category: string;
  plan: PlanItem[];
}) {
  const cat = CC.CATS[category as Category] ?? CC.CATS.internal;
  const [items, setItems] = useState(plan);

  const toggle = (id: string) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const done = items.filter((p) => p.done).length;
  const remaining = items.length - done;

  return (
    <Card
      title="Claude Code plan"
      right={
        <span
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.MUTED,
          }}
        >
          {done}/{items.length} done
        </span>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((p) => (
          <div
            key={p.id}
            onClick={() => toggle(p.id)}
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                marginTop: 3,
                flex: "none",
                background: p.done ? cat.accent : "transparent",
                border: `1.5px solid ${p.done ? cat.accent : CC.MUTED_2}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p.done && <CheckGlyph color={cat.accent === "#D4E04F" ? "#1F1F1F" : "#fff"} />}
            </span>
            <span
              style={{
                fontSize: 13.5,
                color: p.done ? CC.MUTED_2 : CC.INK,
                textDecoration: p.done ? "line-through" : "none",
                lineHeight: 1.4,
              }}
            >
              {p.text}
            </span>
          </div>
        ))}
        {remaining === 0 && (
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11,
              color: CC.H_HEALTHY,
              marginTop: 6,
            }}
          >
            · all clear
          </div>
        )}
      </div>
    </Card>
  );
}
