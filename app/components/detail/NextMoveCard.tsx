"use client";

import { useState } from "react";

import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App } from "@/db/schema";

import { Card } from "./primitives";

// Ported from prototype/ui-detail.jsx:144-194. Local-only for Phase 7B: edits
// are not persisted (Phase 8B wires a PATCH). A hint makes that explicit.
export function NextMoveCard({ app }: { app: App }) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(app.nextMove ?? "");
  const [dirty, setDirty] = useState(false);

  const stopEditing = () => {
    setDirty(draft.trim() !== (app.nextMove ?? ""));
    setEditing(false);
  };

  return (
    <Card title="Next move" accent={cat.accent}>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") stopEditing();
            if (e.key === "Escape") {
              setDraft(app.nextMove ?? "");
              setEditing(false);
            }
          }}
          onBlur={stopEditing}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: `1px solid ${cat.accent}`,
            borderRadius: 6,
            fontFamily: "inherit",
            fontSize: 15,
            outline: "none",
            color: CC.INK,
            background: "#fff",
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            fontSize: 16,
            color: draft ? CC.INK : CC.MUTED_2,
            lineHeight: 1.45,
            cursor: "text",
            padding: "4px 0",
            fontStyle: draft ? "normal" : "italic",
          }}
        >
          {draft || "click to add"}
        </div>
      )}

      {dirty && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
            color: CC.MUTED_2,
          }}
        >
          saving lands in Phase 8 (not persisted yet)
        </div>
      )}

      {app.blockers && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 6,
            background: "#FEE9E9",
            border: "1px solid #F5C5C5",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 9.5,
              fontWeight: 700,
              color: "#A23434",
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            BLOCKER
          </div>
          <div style={{ fontSize: 13.5, color: CC.INK, marginTop: 2 }}>{app.blockers}</div>
        </div>
      )}
    </Card>
  );
}
