"use client";

import { CC } from "@/lib/tokens";
import { ExpandGlyph } from "./NoteGlyph";
import { SourceChip } from "./SourceChip";
import { NoteEditor, KIND_META } from "./NoteEditor";
import type { NoteDraft } from "./NoteEditor";

export interface ClientNote {
  id: string;
  appId: string;
  kind: string;
  title: string;
  body: string;
  source: string;
  repoPath: string | null;
  commitSha: string | null;
  createdAt: string;
  updatedAt: string;
  createdByEmail: string | null;
}

function formatStamp(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Ported from prototype/ui-notes.jsx:279-354.
export function NoteRow({
  note,
  expanded,
  onToggle,
  onSave,
  onDelete,
  onExpand,
}: {
  note: ClientNote;
  expanded: boolean;
  onToggle: () => void;
  onSave: (draft: NoteDraft) => void;
  onDelete: () => void;
  onExpand: () => void;
}) {
  const meta = KIND_META[note.kind as keyof typeof KIND_META] ?? KIND_META.note;

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
      onClick={(e) => {
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
        (e.currentTarget as HTMLDivElement).style.background = CC.SURFACE_2;
        (e.currentTarget as HTMLDivElement).style.borderColor = CC.HAIR;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
        (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
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
            <SourceChip
              source={note.source}
              repoPath={note.repoPath}
              commitSha={note.commitSha}
              compact
            />
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
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = CC.INK)}
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = CC.MUTED_2)
        }
      >
        <ExpandGlyph />
      </button>
    </div>
  );
}
