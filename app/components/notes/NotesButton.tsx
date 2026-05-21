"use client";

import { CC } from "@/lib/tokens";

import { NoteGlyph } from "./meta";

// Ported from prototype/ui-notes.jsx:53-93. Count comes from lifted state so the
// badge updates without a reload after CRUD.
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
        background: count ? (isDark ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
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
        padding: "7px 12px",
        height: 34,
        borderRadius: 7,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        lineHeight: 1,
      }}
    >
      <NoteGlyph size={12} />
      Notes
      {count > 0 && (
        <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 11 }}>{count}</span>
      )}
    </button>
  );
}
