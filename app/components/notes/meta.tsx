import { CC } from "@/lib/tokens";
import type { Note } from "@/db/schema";

// Client-facing note shape: timestamps as ISO strings so the modal, preview,
// and full-page editor all share one representation (the CRUD routes return
// JSON with string dates; server-fetched rows are normalized via toNoteUI).
export interface NoteUI {
  id: string;
  kind: "instruction" | "note";
  title: string;
  body: string;
  source: string;
  repoPath: string | null;
  commitSha: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toNoteUI(n: Note): NoteUI {
  return {
    id: n.id,
    kind: n.kind === "instruction" ? "instruction" : "note",
    title: n.title,
    body: n.body,
    source: n.source,
    repoPath: n.repoPath,
    commitSha: n.commitSha,
    createdAt:
      n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
    updatedAt:
      n.updatedAt instanceof Date ? n.updatedAt.toISOString() : String(n.updatedAt),
  };
}

// Ported from prototype/ui-notes.jsx:15-25.
export const KIND_META = {
  instruction: { label: "Instruction", color: CC.NAVY, tint: "#E8EAF2" },
  note: { label: "Note", color: "#E99A3F", tint: "#FCEFDD" },
} as const;

export type NoteKind = keyof typeof KIND_META;

export const SOURCE_META: Record<
  string,
  { label: string; glyph: string; desc: string }
> = {
  manual: { label: "manual", glyph: "·", desc: "Added in the dashboard" },
  "slash-command": { label: "/cmd", glyph: "/", desc: "From a Claude Code slash command" },
  hook: { label: "hook", glyph: "⚭", desc: "From a Claude Code PostToolUse hook" },
  "claude-md": { label: "CLAUDE.md", glyph: "¶", desc: "Imported from the repo's CLAUDE.md" },
};

// Locale-formatted day. Only rendered inside client components, so no SSR
// hydration concern.
export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SourceChip({
  source,
  repoPath,
  commitSha,
  compact,
}: {
  source: string;
  repoPath?: string | null;
  commitSha?: string | null;
  compact?: boolean;
}) {
  if (!source || source === "manual") return null;
  const m = SOURCE_META[source] ?? SOURCE_META.manual;
  return (
    <span
      title={`${m.desc}${repoPath ? `\n${repoPath}` : ""}${commitSha ? ` @ ${commitSha}` : ""}`}
      style={{
        fontFamily: "var(--font-space-mono), monospace",
        fontSize: compact ? 9 : 9.5,
        color: CC.NAVY,
        background: "#fff",
        border: "1px solid #C7CFE0",
        padding: "1px 5px",
        borderRadius: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        textTransform: "lowercase",
        letterSpacing: ".02em",
        flex: "none",
      }}
    >
      <span style={{ opacity: 0.7 }}>{m.glyph}</span>
      {m.label}
    </span>
  );
}

export function NoteGlyph({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
      <path
        d="M2.5 1.5h5L9.5 3.5V10a.5.5 0 0 1-.5.5H2.5A.5.5 0 0 1 2 10V2a.5.5 0 0 1 .5-.5Z"
        stroke={color || "currentColor"}
        strokeWidth="1"
      />
      <path d="M7 1.5V3.5h2.5" stroke={color || "currentColor"} strokeWidth="1" />
      <path d="M4 6h4M4 8h3" stroke={color || "currentColor"} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function ExpandGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path
        d="M7.5 1.5h3v3M10.5 1.5L7 5M4.5 10.5h-3v-3M1.5 10.5L5 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
