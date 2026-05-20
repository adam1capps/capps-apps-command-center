"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CC } from "@/lib/tokens";
import { relDate, shortHost } from "@/lib/format";
import type { AppWithSnapshot } from "@/lib/db-queries";
import type { Category } from "@/lib/tokens";

import { HealthDot } from "@/components/shared/HealthDot";
import { StagePill } from "@/components/shared/StagePill";
import { ApiChip } from "@/components/shared/ApiChip";

// Ported from prototype/ui-card.jsx:3-167. The hover overlay shows last
// deploy and an inline-editable next move (Phase 8B persists via PATCH).
// Card click opens the detail page.
export function AppCard({
  app,
  density = "comfortable",
}: {
  app: AppWithSnapshot;
  density?: "comfortable" | "compact";
}) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const [hover, setHover] = useState(false);
  const [nextMove, setNextMove] = useState(app.nextMove ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(app.nextMove ?? "");
  const router = useRouter();
  const compact = density === "compact";
  const snap = app.snapshot;
  const apis = app.apiDependencies;

  const commitNextMove = async () => {
    setEditing(false);
    const next = draft.trim();
    const prev = nextMove;
    if (next === prev) return;
    setNextMove(next); // optimistic
    try {
      const res = await fetch(`/api/apps/${app.slug}/next-move`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next || null }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setNextMove(prev); // rollback
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => router.push(`/app/${app.slug}`)}
      style={{
        position: "relative",
        background: CC.SURFACE,
        border: `1px solid ${hover ? "#CBD5E1" : CC.HAIR}`,
        borderRadius: 10,
        padding: compact ? "12px 14px" : "16px 18px 14px",
        cursor: "pointer",
        transition: "transform .12s ease, box-shadow .12s ease, border-color .12s",
        boxShadow: hover ? "0 4px 14px rgba(15,23,42,.06)" : "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: compact ? 0 : 124,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: cat.accent,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: compact ? 13.5 : 15,
              color: CC.INK,
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {app.name}
          </div>
          {!compact && (
            <div
              style={{
                fontSize: 12.5,
                color: CC.MUTED,
                marginTop: 3,
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {app.description}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
          <HealthDot score={snap?.healthScore ?? "stale"} pulse />
          <StagePill stage={app.stage} />
        </div>
      </div>

      {!compact && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-space-mono), ui-monospace, monospace",
                fontSize: 11,
                color: app.liveUrl ? cat.primary : CC.MUTED_2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {app.liveUrl ? shortHost(app.liveUrl) : "no live url"}
            </div>
          </div>
          {apis.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {apis.slice(0, 4).map((a) => (
                <ApiChip key={a} name={a} />
              ))}
              {apis.length > 4 && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: CC.MUTED_2,
                    fontFamily: "var(--font-space-mono), monospace",
                  }}
                >
                  +{apis.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {!compact && hover && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            left: 4,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to top, #FFFFFF 75%, rgba(255,255,255,0))",
            padding: "26px 18px 14px",
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            animation: "ccFade .12s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 10,
                color: CC.MUTED_2,
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Next move
            </div>
            <div
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 10.5,
                color: CC.MUTED,
              }}
            >
              last deploy {relDate(snap?.lastCommitAt ?? null)}
              {snap?.urlResponseMs != null && <> · {snap.urlResponseMs}ms</>}
            </div>
          </div>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNextMove();
                if (e.key === "Escape") {
                  setDraft(nextMove);
                  setEditing(false);
                }
              }}
              onBlur={commitNextMove}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: `1px solid ${cat.accent}`,
                borderRadius: 6,
                fontFamily: "inherit",
                fontSize: 13,
                outline: "none",
                color: CC.INK,
                background: "#fff",
              }}
            />
          ) : (
            <div
              onClick={() => {
                setDraft(nextMove);
                setEditing(true);
              }}
              style={{
                fontSize: 13,
                color: nextMove ? CC.INK : CC.MUTED_2,
                lineHeight: 1.4,
                fontStyle: nextMove ? "normal" : "italic",
                padding: "2px 0",
                cursor: "text",
              }}
            >
              {nextMove || "click to add next move"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
