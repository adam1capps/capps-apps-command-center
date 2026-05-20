"use client";

import { useEffect, useRef, useState } from "react";

import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App } from "@/db/schema";

import { Card } from "./primitives";

type SaveState = "idle" | "saving" | "saved" | "error";

// Ported from prototype/ui-detail.jsx:144-194; Phase 8B persists via PATCH
// /api/apps/[slug]/next-move with optimistic update + rollback.
export function NextMoveCard({ app }: { app: App }) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const [current, setCurrent] = useState(app.nextMove ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(app.nextMove ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const commit = async () => {
    setEditing(false);
    const next = draft.trim();
    const prev = current;
    if (next === prev) return;

    setCurrent(next); // optimistic
    setState("saving");
    try {
      const res = await fetch(`/api/apps/${app.slug}/next-move`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next || null }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setState("idle"), 3000);
    } catch {
      setCurrent(prev); // rollback
      setDraft(prev);
      setState("error");
    }
  };

  return (
    <Card title="Next move" accent={cat.accent}>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(current);
              setEditing(false);
            }
          }}
          onBlur={commit}
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
          onClick={() => {
            setDraft(current);
            setEditing(true);
          }}
          style={{
            fontSize: 16,
            color: current ? CC.INK : CC.MUTED_2,
            lineHeight: 1.45,
            cursor: "text",
            padding: "4px 0",
            fontStyle: current ? "normal" : "italic",
          }}
        >
          {current || "click to add"}
        </div>
      )}

      {state !== "idle" && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
            color:
              state === "error"
                ? CC.H_BROKEN
                : state === "saved"
                  ? CC.H_HEALTHY
                  : CC.MUTED_2,
          }}
        >
          {state === "saving" && "saving..."}
          {state === "saved" && "saved"}
          {state === "error" && "save failed, reverted"}
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
