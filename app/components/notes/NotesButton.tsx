"use client";

import { CC } from "@/lib/tokens";
import { NoteGlyph } from "./NoteGlyph";

// Ported from prototype/ui-notes.jsx:53-82.
export function NotesButton({
  count,
  onOpen,
  variant = "ghost",
}: {
  count: number;
  onOpen: () => void;
  variant?: "ghost" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title={count ? `${count} note${count !== 1 ? "s" : ""}` : "Notes & instructions"}
      style={{
        background: count
          ? isDark
            ? "rgba(255,255,255,0.12)"
            : "#fff"
          : "transparent",
        border: `1px solid ${
          count
            ? isDark
              ? "rgba(255,255,255,0.22)"
              : "#CBD5E1"
            : isDark
              ? "rgba(255,255,255,0.18)"
              : CC.HAIR
        }`,
        color: isDark ? "#fff" : count ? CC.INK : CC.MUTED,
        padding: "2px 8px",
        height: 22,
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        lineHeight: 1,
      }}
    >
      <NoteGlyph size={11} />
      {count > 0 && (
        <span
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
