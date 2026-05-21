"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App } from "@/db/schema";

import { NoteEditor } from "./NoteEditor";
import { NoteRow } from "./NoteRow";
import { KIND_META, type NoteKind, type NoteUI } from "./meta";

type Draft = { title: string; body: string; kind: NoteKind };

// Ported from prototype/ui-notes.jsx:97-267. Rendered through a portal so it
// stacks above the detail page. CRUD is delegated to the parent (lifted state).
export function NotesModal({
  app,
  notes,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onOpenFull,
}: {
  app: App;
  notes: NoteUI[];
  onClose: () => void;
  onCreate: (draft: Draft) => Promise<NoteUI>;
  onUpdate: (id: string, draft: Draft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenFull: (noteId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | NoteKind>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composing, setComposing] = useState<NoteKind | null>(null);
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = filter === "all" ? notes : notes.filter((n) => n.kind === filter);

  const tabs: { id: "all" | NoteKind; label: string; count: number }[] = [
    { id: "all", label: "All", count: notes.length },
    {
      id: "instruction",
      label: "Instructions",
      count: notes.filter((n) => n.kind === "instruction").length,
    },
    { id: "note", label: "Notes", count: notes.filter((n) => n.kind === "note").length },
  ];

  const content = (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 16px",
        animation: "ccFade .14s ease-out",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          maxHeight: "84vh",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 30px 80px rgba(15,23,42,.35)",
          display: "flex",
          flexDirection: "column",
          animation: "ccSlideUp .18s ease-out",
        }}
      >
        <header style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${CC.HAIR}` }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  fontSize: 10.5,
                  color: cat.accent,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                }}
              >
                {CATEGORIES[app.category as Category]?.label ?? app.category} · Notes
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: CC.INK, marginTop: 2 }}>
                {app.name}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: CC.MUTED,
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                background: CC.SURFACE_2,
                border: `1px solid ${CC.HAIR}`,
                borderRadius: 8,
                padding: 3,
              }}
            >
              {tabs.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    background: filter === f.id ? "#fff" : "transparent",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 11.5,
                    fontWeight: filter === f.id ? 700 : 500,
                    color: filter === f.id ? CC.INK : CC.MUTED,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: filter === f.id ? "0 1px 2px rgba(15,23,42,.06)" : "none",
                  }}
                >
                  {f.label}
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono), monospace",
                      fontSize: 10,
                      color: CC.MUTED_2,
                    }}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  setExpandedId(null);
                  setComposing("instruction");
                }}
                style={newBtn(KIND_META.instruction.color)}
              >
                + Instruction
              </button>
              <button
                onClick={() => {
                  setExpandedId(null);
                  setComposing("note");
                }}
                style={newBtn(KIND_META.note.color)}
              >
                + Note
              </button>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 14px" }}>
          {composing && (
            <NoteEditor
              isNew
              note={{ kind: composing, title: "", body: "" }}
              onSave={async (draft) => {
                await onCreate({ ...draft, title: draft.title.trim() || "Untitled" });
                setComposing(null);
              }}
              onCancel={() => setComposing(null)}
              onExpand={async () => {
                const created = await onCreate({
                  kind: composing,
                  title: "Untitled",
                  body: "",
                });
                setComposing(null);
                onOpenFull(created.id);
              }}
            />
          )}

          {visible.length === 0 && !composing && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: CC.MUTED_2,
                fontSize: 13,
              }}
            >
              No {filter === "all" ? "items" : filter + "s"} yet for this app.
              <br />
              <span style={{ fontSize: 12 }}>Use the buttons above to add one.</span>
            </div>
          )}

          {visible.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              expanded={expandedId === n.id}
              onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
              onSave={async (draft) => {
                await onUpdate(n.id, draft);
                setExpandedId(null);
              }}
              onDelete={async () => {
                await onDelete(n.id);
                setExpandedId(null);
              }}
              onExpand={() => onOpenFull(n.id)}
            />
          ))}
        </div>

        <footer
          style={{
            padding: "10px 20px",
            borderTop: `1px solid ${CC.HAIR}`,
            background: CC.SURFACE_2,
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
            color: CC.MUTED_2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <span>esc to close · cmd+click any row to open full page</span>
          <span>
            {notes.length} item{notes.length !== 1 ? "s" : ""}
          </span>
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function newBtn(color: string): React.CSSProperties {
  return {
    background: color,
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: 6,
    fontFamily: "inherit",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
  };
}
