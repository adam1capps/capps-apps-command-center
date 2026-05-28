"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CC } from "@/lib/tokens";

// Renders the integration event feed and live-appends new events from the SSE
// stream. Initial rows come from a server fetch (passed as `initial`); the
// EventSource appends newer rows as they arrive.

interface FeedEvent {
  id: string;
  appId: string | null;
  kind: string;
  text: string;
  actor: string | null;
  createdAt: string;
}

interface SlugMap {
  [appId: string]: { slug: string; name: string };
}

const KIND_COLOR: Record<string, string> = {
  push: CC.NAVY,
  note: CC.H_HEALTHY,
  instruct: "#6B4DE0",
  plan: "#E99A3F",
  sync: CC.MUTED,
};

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function LiveEventFeed({
  initial,
  slugMap,
}: {
  initial: FeedEvent[];
  slugMap: SlugMap;
}) {
  const [events, setEvents] = useState<FeedEvent[]>(initial);

  useEffect(() => {
    const es = new EventSource("/api/events/stream");
    es.addEventListener("integration-event", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as FeedEvent;
        setEvents((prev) => {
          if (prev.some((x) => x.id === data.id)) return prev;
          return [data, ...prev].slice(0, 200);
        });
      } catch {
        // skip malformed
      }
    });
    return () => es.close();
  }, []);

  if (events.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          border: `1px solid ${CC.HAIR}`,
          borderRadius: 8,
          padding: "24px 16px",
          color: CC.MUTED,
          fontStyle: "italic",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        No events yet. Use a slash command in Claude Code or push to a connected repo.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 8,
        maxHeight: 380,
        overflowY: "auto",
      }}
    >
      {events.map((e, i) => {
        const app = e.appId ? slugMap[e.appId] : null;
        const row = (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "82px 84px 1fr auto auto",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderBottom: i < events.length - 1 ? `1px solid ${CC.HAIR_2}` : "none",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11.5,
              cursor: app ? "pointer" : "default",
            }}
          >
            <span style={{ color: CC.MUTED_2, fontSize: 11 }}>{relTime(e.createdAt)}</span>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                color: "#fff",
                background: KIND_COLOR[e.kind] ?? CC.MUTED,
                fontSize: 10,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {e.kind}
            </span>
            <span
              style={{
                color: CC.INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {e.text}
            </span>
            <span style={{ color: CC.MUTED, fontSize: 11 }}>{app?.name ?? "unknown"}</span>
            <span style={{ color: CC.MUTED_2, fontSize: 10.5 }}>{e.actor ?? ""}</span>
          </div>
        );
        return app ? (
          <Link key={e.id} href={`/app/${app.slug}`} style={{ textDecoration: "none" }}>
            {row}
          </Link>
        ) : (
          <div key={e.id}>{row}</div>
        );
      })}
    </div>
  );
}
