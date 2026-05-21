"use client";

import { useState } from "react";

import { CC } from "@/lib/tokens";

import { KIND_META, ExpandGlyph, type NoteKind } from "./meta";

// Ported from prototype/ui-notes.jsx:367-458. Inline editor used for both new
// notes and editing an existing row.
export function NoteEditor({
  note,
  onSave,
  onCancel,
  onDelete,
  onExpand,
  isNew,
}: {
  note: { kind: NoteKind; title: string; body: string };
  onSave: (draft: { title: string; body: string; kind: NoteKind }) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onExpand: () => void;
  isNew?: boolean;
}) {
  const [title, setTitle] = useState(note.title || "");
  const [body, setBody] = useState(note.body || "");
  const [kind, setKind] = useState<NoteKind>(note.kind || "note");
  const meta = KIND_META[kind];

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: CC.SURFACE_2,
        border: `1px solid ${CC.HAIR}`,
        marginBottom: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ display: "inline-flex", gap: 4 }}>
          {(Object.entries(KIND_META) as [NoteKind, (typeof KIND_META)[NoteKind]][]).map(([k, m]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              style={{
                background: kind === k ? m.color : "#fff",
                color: kind === k ? "#fff" : m.color,
                border: `1px solid ${kind === k ? m.color : CC.HAIR}`,
                padding: "3px 8px",
                borderRadius: 4,
                fontFamily: "inherit",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={onExpand}
          title="Open full page"
          style={{
            background: "transparent",
            border: `1px solid ${CC.HAIR}`,
            color: CC.MUTED,
            padding: "4px 8px",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ExpandGlyph /> Open page
        </button>
      </div>

      <input
        autoFocus
        value={title}
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: `1px solid ${CC.HAIR}`,
          borderRadius: 6,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          outline: "none",
          marginBottom: 6,
          color: CC.INK,
          background: "#fff",
        }}
      />
      <textarea
        value={body}
        placeholder="Body..."
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: `1px solid ${CC.HAIR}`,
          borderRadius: 6,
          fontFamily: "inherit",
          fontSize: 13,
          lineHeight: 1.5,
          outline: "none",
          resize: "vertical",
          color: CC.INK,
          background: "#fff",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <div>
          {!isNew && onDelete && (
            <button
              onClick={onDelete}
              style={{
                background: "transparent",
                border: "none",
                color: CC.H_BROKEN,
                fontFamily: "inherit",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Delete
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: `1px solid ${CC.HAIR}`,
              color: CC.MUTED,
              padding: "5px 11px",
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ title, body, kind })}
            style={{
              background: meta.color,
              color: "#fff",
              border: "none",
              padding: "5px 12px",
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
