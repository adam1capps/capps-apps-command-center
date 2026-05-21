"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import { NoteEditor, KIND_META } from "./NoteEditor";
import { NoteRow } from "./NoteRow";
import type { ClientNote } from "./NoteRow";
import type { NoteDraft } from "./NoteEditor";

type Filter = "all" | "instruction" | "note";

// Ported from prototype/ui-notes.jsx:97-267.
// Fetches notes for the given app on mount. onClose receives the final note
// count so callers can update their badge.
export function NotesModal({
  app,
  onClose,
}: {
  app: { slug: string; name: string; category: string };
  onClose: (finalCount: number) => void;
}) {
  const router = useRouter();
  const [noteList, setNoteList] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null); // noteId | "new-instruction" | "new-note"
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;

  useEffect(() => {
    fetch(`/api/apps/${app.slug}/notes`)
      .then((r) => r.json())
      .then((data: ClientNote[]) => {
        setNoteList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [app.slug]);

  const visible =
    filter === "all" ? noteList : noteList.filter((n) => n.kind === filter);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(noteList.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [noteList, onClose]);

  const startNew = (kind: "instruction" | "note") => setExpanded(`new-${kind}`);

  const handleNewSave = async (draft: NoteDraft) => {
    const res = await fetch(`/api/apps/${app.slug}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: draft.kind,
        title: draft.title.trim() || "Untitled",
        body: draft.body,
      }),
    });
    if (!res.ok) return;
    const created: ClientNote = await res.json();
    setNoteList((prev) => [created, ...prev]);
    setExpanded(null);
  };

  const handleNewExpand = async (kind: "instruction" | "note") => {
    const res = await fetch(`/api/apps/${app.slug}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, title: "Untitled", body: "" }),
    });
    if (!res.ok) return;
    const created: ClientNote = await res.json();
    setNoteList((prev) => [created, ...prev]);
    router.push(`/app/${app.slug}/notes/${created.id}`);
  };

  const handleEditSave = async (noteId: string, draft: NoteDraft) => {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: draft.kind, title: draft.title, body: draft.body }),
    });
    if (!res.ok) return;
    const updated: ClientNote = await res.json();
    setNoteList((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    setExpanded(null);
  };

  const handleDelete = async (noteId: string) => {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setNoteList((prev) => prev.filter((n) => n.id !== noteId));
    setExpanded(null);
  };

  const newKind = expanded?.startsWith("new-")
    ? (expanded.slice(4) as "instruction" | "note")
    : null;

  return (
    <div
      onClick={() => onClose(noteList.length)}
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
        {/* header */}
        <header
          style={{
            padding: "16px 20px 12px",
            borderBottom: `1px solid ${CC.HAIR}`,
          }}
        >
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
              <div
                style={{ fontSize: 17, fontWeight: 700, color: CC.INK, marginTop: 2 }}
              >
                {app.name}
              </div>
            </div>
            <button
              onClick={() => onClose(noteList.length)}
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
              {(
                [
                  { id: "all" as Filter, label: "All", count: noteList.length },
                  {
                    id: "instruction" as Filter,
                    label: "Instructions",
                    count: noteList.filter((n) => n.kind === "instruction").length,
                  },
                  {
                    id: "note" as Filter,
                    label: "Notes",
                    count: noteList.filter((n) => n.kind === "note").length,
                  },
                ] as const
              ).map((f) => (
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
              <button onClick={() => startNew("instruction")} style={newBtnStyle(KIND_META.instruction.color)}>
                + Instruction
              </button>
              <button onClick={() => startNew("note")} style={newBtnStyle(KIND_META.note.color)}>
                + Note
              </button>
            </div>
          </div>
        </header>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 14px" }}>
          {loading && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: CC.MUTED_2, fontSize: 13 }}>
              Loading...
            </div>
          )}

          {!loading && newKind && (
            <NoteEditor
              isNew
              note={{ kind: newKind, title: "", body: "" }}
              onSave={handleNewSave}
              onCancel={() => setExpanded(null)}
              onExpand={() => handleNewExpand(newKind)}
            />
          )}

          {!loading && visible.length === 0 && !newKind && (
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

          {!loading && visible.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              expanded={expanded === n.id}
              onToggle={() => setExpanded(expanded === n.id ? null : n.id)}
              onSave={(draft) => handleEditSave(n.id, draft)}
              onDelete={() => handleDelete(n.id)}
              onExpand={() => router.push(`/app/${app.slug}/notes/${n.id}`)}
            />
          ))}
        </div>

        {/* footer */}
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
            {noteList.length} item{noteList.length !== 1 ? "s" : ""}
          </span>
        </footer>
      </div>
    </div>
  );
}

function newBtnStyle(color: string): React.CSSProperties {
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
