"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CategoryPill } from "@/components/shared/CategoryPill";
import { StagePill } from "@/components/shared/StagePill";
import { CATEGORIES } from "@/lib/constants";
import { shortHost } from "@/lib/format";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App } from "@/db/schema";

import { KIND_META, SourceChip, formatStamp, type NoteKind, type NoteUI } from "./meta";

type SaveState = "saved" | "saving" | "error";

// Ported from prototype/ui-notes.jsx:462-705. Autosaves via PATCH /api/notes/[id]
// (600ms debounce). ESC returns to the app detail page.
export function NotePageClient({
  app,
  note,
  others,
}: {
  app: App;
  note: NoteUI;
  others: NoteUI[];
}) {
  const router = useRouter();
  const back = () => router.push(`/app/${app.slug}`);

  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [kind, setKind] = useState<NoteKind>(note.kind);
  const [state, setState] = useState<SaveState>("saved");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState("saving");
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, title: title.trim() || "Untitled", body }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setState("saved");
      } catch {
        setState("error");
      }
    }, 600);
    return () => clearTimeout(id);
  }, [title, body, kind, note.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  const statusColor = state === "error" ? CC.H_BROKEN : state === "saved" ? CC.H_HEALTHY : CC.H_WARN;
  const statusLabel = state === "error" ? "save failed" : state === "saved" ? "saved" : "saving...";

  return (
    <div style={{ minHeight: "100vh", background: "#fff", animation: "ccFade .15s ease-out" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 20,
          borderBottom: `1px solid ${CC.HAIR}`,
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <button
            onClick={back}
            style={{
              background: "transparent",
              border: `1px solid ${CC.HAIR}`,
              color: CC.INK,
              padding: "6px 12px",
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: cat.accent, flex: "none" }} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  fontSize: 10.5,
                  color: CC.MUTED,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {CATEGORIES[app.category as Category]?.label ?? app.category} · Notes
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: CC.INK, lineHeight: 1.2 }}>
                {app.name}
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11,
              color: statusColor,
              flex: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: statusColor }} />
            {statusLabel}
          </div>
        </div>
      </header>

      <div
        className="cc-note-page"
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "32px 28px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 240px",
          gap: 40,
        }}
      >
        <main>
          <div style={{ display: "inline-flex", gap: 6, marginBottom: 14 }}>
            {(Object.entries(KIND_META) as [NoteKind, (typeof KIND_META)[NoteKind]][]).map(([k, m]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  background: kind === k ? m.color : "#fff",
                  color: kind === k ? "#fff" : m.color,
                  border: `1px solid ${kind === k ? m.color : CC.HAIR}`,
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <input
            value={title}
            placeholder="Untitled"
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "4px 0",
              border: "none",
              outline: "none",
              fontFamily: "inherit",
              fontSize: 36,
              fontWeight: 700,
              color: CC.INK,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              background: "transparent",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 4,
              marginBottom: 22,
              alignItems: "center",
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11,
              color: CC.MUTED_2,
              flexWrap: "wrap",
            }}
          >
            <span>created {formatStamp(note.createdAt)}</span>
            <span>· updated {formatStamp(note.updatedAt)}</span>
            <span>· {body.split(/\s+/).filter(Boolean).length} words</span>
            {note.source && note.source !== "manual" && (
              <SourceChip source={note.source} repoPath={note.repoPath} commitSha={note.commitSha} />
            )}
          </div>

          <textarea
            value={body}
            placeholder={
              kind === "instruction"
                ? "Write the directive in clear, declarative sentences. Use bullets for steps."
                : "Capture the observation. Logs, measurements, quotes from stakeholders, links."
            }
            onChange={(e) => setBody(e.target.value)}
            style={{
              width: "100%",
              minHeight: 380,
              padding: 0,
              border: "none",
              outline: "none",
              fontFamily: "inherit",
              fontSize: 16,
              lineHeight: 1.65,
              color: CC.TEXT,
              resize: "vertical",
              background: "transparent",
            }}
          />
        </main>

        <aside style={{ borderLeft: `1px solid ${CC.HAIR}`, paddingLeft: 24, fontSize: 12.5 }}>
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 10,
              color: CC.MUTED_2,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            App
          </div>
          <div style={{ fontWeight: 700, color: CC.INK, fontSize: 14, marginBottom: 4 }}>{app.name}</div>
          <div style={{ fontSize: 12, color: CC.MUTED, lineHeight: 1.5, marginBottom: 14 }}>
            {app.description}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            <StagePill stage={app.stage} />
            <CategoryPill cat={app.category} />
          </div>
          {app.liveUrl && (
            <a
              href={app.liveUrl}
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-block",
                marginBottom: 14,
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 11,
                color: cat.primary,
                textDecoration: "none",
              }}
            >
              {shortHost(app.liveUrl)} ↗
            </a>
          )}

          {others.length > 0 && (
            <>
              <div
                style={{
                  fontFamily: "var(--font-space-mono), monospace",
                  fontSize: 10,
                  color: CC.MUTED_2,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  marginTop: 22,
                  marginBottom: 10,
                }}
              >
                Other notes ({others.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {others.map((n) => {
                  const m = KIND_META[n.kind];
                  return (
                    <Link
                      key={n.id}
                      href={`/app/${app.slug}/notes/${n.id}`}
                      style={{
                        textAlign: "left",
                        background: "transparent",
                        border: `1px solid ${CC.HAIR}`,
                        borderRadius: 6,
                        padding: "7px 9px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textDecoration: "none",
                        display: "block",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-space-mono), monospace",
                          fontSize: 9,
                          fontWeight: 700,
                          color: m.color,
                          letterSpacing: ".05em",
                          textTransform: "uppercase",
                          marginBottom: 2,
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: CC.INK,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ borderTop: `1px solid ${CC.HAIR}`, marginTop: 22, paddingTop: 14 }}>
            <button
              onClick={async () => {
                if (!confirm("Delete this note?")) return;
                await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
                back();
              }}
              style={{
                background: "transparent",
                border: "none",
                color: CC.H_BROKEN,
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Delete this note
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
