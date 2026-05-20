"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import { CC } from "@/lib/tokens";
import { Mark } from "@/components/showcase/Mark";

// Ported from prototype/app.jsx:159-261 (white variant). The prototype's
// static user chip is replaced by Clerk's <UserButton/>; the synthetic
// "polled 12m ago" is now computed server-side from the newest checked_at.
export function Header({
  q,
  setQ,
  polledAgo,
}: {
  q: string;
  setQ: (v: string) => void;
  polledAgo: string;
}) {
  return (
    <header
      style={{
        background: "#fff",
        color: CC.INK,
        borderBottom: `1px solid ${CC.HAIR}`,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <Mark dark={false} />
          <div
            style={{
              paddingLeft: 12,
              borderLeft: `1px solid ${CC.HAIR}`,
              lineHeight: 1.1,
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Command Center</div>
            <div
              style={{
                fontSize: 10.5,
                color: CC.MUTED,
                fontFamily: "var(--font-space-mono), monospace",
                letterSpacing: ".06em",
                marginTop: 2,
              }}
            >
              hub.cappsapps.ai
            </div>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 520, position: "relative" }}>
          <input
            placeholder="Search apps, APIs, repos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 34px",
              background: "#fff",
              border: `1px solid ${CC.HAIR}`,
              color: CC.INK,
              borderRadius: 8,
              fontSize: 13.5,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: CC.MUTED_2,
              fontSize: 13,
            }}
          >
            &#8981;
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 10.5,
              color: CC.MUTED_2,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: CC.H_HEALTHY,
              }}
            />
            polled {polledAgo}
          </div>
          <Link
            href="/integration"
            title="Claude Code integration"
            style={{
              background: "transparent",
              border: `1px solid ${CC.HAIR}`,
              color: CC.INK,
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: CC.H_HEALTHY,
                boxShadow: `0 0 0 0 ${CC.H_HEALTHY}55`,
                animation: "ccConnPulse 2s ease-out infinite",
              }}
            />
            Claude Code
          </Link>
          <Link
            href="/"
            style={{
              background: "transparent",
              border: `1px solid ${CC.HAIR}`,
              color: CC.INK,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View public showcase ↗
          </Link>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
