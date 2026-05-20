"use client";

import { VIEWS } from "@/lib/constants";
import type { ViewId } from "@/lib/constants";
import { CC } from "@/lib/tokens";

// Ported from prototype/app.jsx:286-358. Phase 5B wires only the Grid view;
// Pipeline and Needs Attention render placeholders until Phase 6.
export function ViewSwitcher({
  view,
  setView,
  attentionCount,
}: {
  view: ViewId;
  setView: (v: ViewId) => void;
  attentionCount: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          background: CC.SURFACE_2,
          border: `1px solid ${CC.HAIR}`,
          borderRadius: 10,
          padding: 4,
        }}
      >
        {VIEWS.map((v) => {
          const active = view === v.id;
          const showBadge = v.id === "attention" && attentionCount > 0;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                background: active ? "#fff" : "transparent",
                border: "none",
                padding: "8px 14px",
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
                color: active ? CC.INK : CC.MUTED,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                boxShadow: active ? "0 1px 3px rgba(15,23,42,.06)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all .12s",
              }}
            >
              {v.label}
              <span
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  fontSize: 10,
                  color: active ? CC.MUTED : CC.MUTED_2,
                  fontWeight: 500,
                }}
              >
                {v.sub}
              </span>
              {showBadge && (
                <span
                  style={{
                    background: CC.H_BROKEN,
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {attentionCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    { color: CC.H_HEALTHY, label: "Healthy" },
    { color: CC.H_WARN, label: "Warning" },
    { color: CC.H_BROKEN, label: "Broken" },
    { color: CC.H_STALE, label: "Stale" },
  ];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {items.map((i) => (
        <div
          key={i.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
            color: CC.MUTED,
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: 999, background: i.color }}
          />
          {i.label}
        </div>
      ))}
    </div>
  );
}
