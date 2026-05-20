"use client";

import { useState } from "react";

import { CC } from "@/lib/tokens";
import { shortHost } from "@/lib/format";
import type { App } from "@/db/schema";

// Ported from prototype/ui-showcase.jsx:164-205.
export function ShowcaseCard({ app }: { app: App }) {
  const cat = CC.CATS[app.category as keyof typeof CC.CATS] ?? CC.CATS.internal;
  const [hover, setHover] = useState(false);

  return (
    <a
      href={app.liveUrl ?? "#"}
      target="_blank"
      rel="noopener"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "#fff",
        border: `1px solid ${hover ? cat.primary : CC.HAIR}`,
        borderRadius: 10,
        padding: 18,
        transition: "border-color .12s, transform .12s, box-shadow .12s",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? "0 8px 20px rgba(15,23,42,.06)" : "none",
        position: "relative",
        overflow: "hidden",
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
          fontWeight: 700,
          fontSize: 15.5,
          color: CC.INK,
          letterSpacing: "-0.005em",
        }}
      >
        {app.name}
      </div>
      <div style={{ fontSize: 13, color: CC.MUTED, marginTop: 6, lineHeight: 1.5 }}>
        {app.description}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11.5,
            color: cat.primary,
            fontWeight: 600,
          }}
        >
          {shortHost(app.liveUrl)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 12,
            color: hover ? cat.accent : CC.MUTED_2,
            transition: "color .12s",
          }}
        >
          ↗
        </span>
      </div>
    </a>
  );
}
