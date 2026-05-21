import { CC } from "@/lib/tokens";

const SOURCE_META: Record<string, { label: string; glyph: string; desc: string }> = {
  "slash-command": { label: "/cmd",      glyph: "/", desc: "From a Claude Code slash command" },
  hook:            { label: "hook",      glyph: "⚭", desc: "From a Claude Code PostToolUse hook" },
  "claude-md":     { label: "CLAUDE.md", glyph: "¶", desc: "Imported from the repo's CLAUDE.md" },
};

export function SourceChip({
  source,
  repoPath,
  commitSha,
  compact,
}: {
  source?: string | null;
  repoPath?: string | null;
  commitSha?: string | null;
  compact?: boolean;
}) {
  if (!source || source === "manual") return null;
  const m = SOURCE_META[source];
  if (!m) return null;
  const tip = [m.desc, repoPath, commitSha ? `@ ${commitSha}` : null].filter(Boolean).join("\n");
  return (
    <span
      title={tip}
      style={{
        fontFamily: "var(--font-space-mono), monospace",
        fontSize: compact ? 9 : 9.5,
        color: CC.NAVY,
        background: "#fff",
        border: `1px solid #C7CFE0`,
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
