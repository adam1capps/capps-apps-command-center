"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CC } from "@/lib/tokens";

// Port of prototype/ui-integration.jsx:571-615 (SyncToast). Subscribes to
// /api/events/stream via EventSource and shows an ephemeral bottom-right toast
// per new integration event. 5.2s display duration matches prototype/app.jsx:55.

// Server-shaped event row (matches `IntegrationEvent` from db/schema.ts).
interface ToastEvent {
  id: string;
  appId: string | null;
  kind: string;
  text: string;
  actor: string | null;
  createdAt: string;
}

const DISPLAY_MS = 5200;

interface SlugMap {
  [appId: string]: { slug: string; name: string };
}

export function SyncToast({ slugMap }: { slugMap: SlugMap }) {
  const [event, setEvent] = useState<ToastEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events/stream");
    es.addEventListener("integration-event", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as ToastEvent;
        setEvent(data);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setEvent(null), DISPLAY_MS);
      } catch {
        // Malformed payload; skip silently.
      }
    });
    return () => {
      es.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!event) return null;
  const app = event.appId ? slugMap[event.appId] : null;
  const inner = (
    <div
      style={{
        background: "#0F172A",
        color: "#fff",
        padding: "12px 14px 12px 16px",
        borderRadius: 10,
        boxShadow: "0 12px 40px rgba(15,23,42,.35)",
        minWidth: 320,
        maxWidth: 420,
        animation: "ccSlideUp .22s ease-out",
        borderLeft: `3px solid ${CC.H_HEALTHY}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: "#94A3B8",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: CC.H_HEALTHY }} />
          Claude Code sync · {event.actor ?? "system"}
        </div>
        <button
          aria-label="dismiss"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEvent(null);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#64748B",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#E2E8F0" }}>{event.text}</div>
      {app && (
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            color: "#94A3B8",
            marginTop: 6,
          }}
        >
          → {app.name}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 200,
        cursor: app ? "pointer" : "default",
      }}
    >
      {app ? (
        <Link
          href={`/app/${app.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
          onClick={() => setEvent(null)}
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
