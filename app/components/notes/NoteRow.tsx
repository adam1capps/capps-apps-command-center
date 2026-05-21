"use client";

import type { MouseEvent } from "react";

import { CC } from "@/lib/tokens";

import { NoteEditor } from "./NoteEditor";
import { KIND_META, SourceChip, ExpandGlyph, formatStamp, type NoteKind, type NoteUI } from "./meta";

// Ported from prototype/ui-notes.jsx:279-354.
export function NoteRow({
  note,
  expanded,
  onToggle,
  onSave,
  onDelete,
  onExpand,
}: {
  note: NoteUI;
  expanded: boolean;
  onToggle: () => void;
  onSave: (draft: { title: string; body: string; kind: NoteKind }) => void;
  onDelete: () => void;
  onExpand: () => void;
}) {
  const meta = KIND_META[note.kind] ?? KIND_META.note;

  if (expanded) {
    return (
      <NoteEditor
        note={note}
        onSave={onSave}
        onCancel={onToggle}
        onDelete={onDelete}
        onExpand={onExpand}
      />
    );
  }

  return (
    <div
      onClick={(e: MouseEvent) => {
        if (e.metaKey || e.ctrlKey) {
          onExpand();
          return;
        }
        onToggle();
      }}
      style={{
        padding: "11px 12px",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        border: "1px solid transparent",
        transition: "background .1s, border-color .1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = CC.SURFACE_2;
        e.currentTarget.style.borderColor = CC.HAIR;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 9.5,
          fontWeight: 700,
          color: meta.color,
          background: meta.tint,
          padding: "2px 6px",
          borderRadius: 4,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          marginTop: 2,
          whiteSpace: "nowrap",
          flex: "none",
        }}
      >
        {meta.label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontWeight: 600,
                color: CC.INK,
                fontSize: 13.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {note.title}
            </span>
            <SourceChip source={note.source} repoPath={note.repoPath} commitSha={note.commitSha} compact />
          </div>
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 10,
              color: CC.MUTED_2,
              flex: "none",
            }}
          >
            {formatStamp(note.updatedAt || note.createdAt)}
          </div>
        </div>
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
          {note.body || "(empty)"}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        title="Open full page"
        style={{
          background: "transparent",
          border: "none",
          color: CC.MUTED_2,
          cursor: "pointer",
          padding: 4,
          flex: "none",
          borderRadius: 4,
          display: "inline-flex",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = CC.INK)}
        onMouseLeave={(e) => (e.currentTarget.style.color = CC.MUTED_2)}
      >
        <ExpandGlyph />
      </button>
    </div>
  );
}
