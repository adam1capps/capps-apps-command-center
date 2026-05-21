"use client";

import { useState } from "react";

import { CC } from "@/lib/tokens";
import type { IntegrationData } from "@/lib/cappshub";

// Ported from prototype/ui-integration.jsx:68-285, wired to real `.cappshub/`
// reads (Phase 10B). The live sync-event feed + "simulate"/"global" controls
// arrive with Phase 12; this card shows connection state + the four files.

function ConnectionDot({ connected, label }: { connected: boolean; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: connected ? CC.H_HEALTHY : CC.MUTED_2,
          animation: connected ? "ccConnPulse 2s ease-out infinite" : "none",
          flex: "none",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 11,
          color: connected ? CC.INK : CC.MUTED,
          letterSpacing: ".02em",
        }}
      >
        {label}
      </span>
    </span>
  );
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "transparent" : "#fff",
    border: `1px solid ${CC.HAIR}`,
    color: disabled ? CC.MUTED_2 : CC.INK,
    padding: "3px 7px",
    borderRadius: 5,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-space-mono), monospace",
    fontSize: 11,
    fontWeight: 600,
  };
}

type TabId = "instructions" | "plan" | "notes" | "claude-md";

export function IntegrationCard({ integration }: { integration: IntegrationData }) {
  const [activeTab, setActiveTab] = useState<TabId>("instructions");
  const [noteIdx, setNoteIdx] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!integration.connected) {
    return (
      <div
        style={{
          padding: "12px 14px",
          background: CC.SURFACE_2,
          border: `1px dashed ${CC.HAIR}`,
          borderRadius: 8,
          fontSize: 13,
          color: CC.MUTED,
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: CC.INK }}>Claude Code not connected.</strong>
        <br />
        No repository linked for this app, so there is nothing to sync.
      </div>
    );
  }

  const noteFiles = integration.notes;
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "instructions", label: ".cappshub/instructions.md" },
    { id: "plan", label: ".cappshub/plan.json" },
    { id: "notes", label: "Notes", count: noteFiles.length },
    { id: "claude-md", label: "CLAUDE.md" },
  ];

  let body: string;
  if (activeTab === "instructions") {
    body = integration.instructions ?? "(no .cappshub/instructions.md in this repo)";
  } else if (activeTab === "plan") {
    body = integration.planJson ?? "(no .cappshub/plan.json in this repo)";
  } else if (activeTab === "claude-md") {
    body = integration.claudeMd ?? "(no CLAUDE.md in this repo)";
  } else {
    body = noteFiles[noteIdx]?.content ?? "";
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <ConnectionDot connected label="Claude Code · connected" />
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 10.5,
              color: CC.MUTED_2,
              marginTop: 4,
            }}
          >
            github.com/{integration.repo} · main
          </div>
        </div>
      </div>

      {!integration.hasCappshub ? (
        <div
          style={{
            padding: "16px 14px",
            background: CC.SURFACE_2,
            border: `1px dashed ${CC.HAIR}`,
            borderRadius: 8,
            fontSize: 13,
            color: CC.MUTED,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: CC.INK }}>No .cappshub/ folder found.</strong>
          <br />
          This repo has no <code>.cappshub/instructions.md</code>, <code>plan.json</code>, or notes yet.
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              title="Coming soon"
              style={{
                background: "#fff",
                border: `1px solid ${CC.HAIR}`,
                color: CC.MUTED_2,
                padding: "6px 12px",
                borderRadius: 6,
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              Create one
            </button>
          </div>
        </div>
      ) : (
        <div style={{ border: `1px solid ${CC.HAIR}`, borderRadius: 8, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              background: CC.SURFACE_2,
              borderBottom: `1px solid ${CC.HAIR}`,
              alignItems: "stretch",
            }}
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: isActive ? "#fff" : "transparent",
                    border: "none",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontFamily: "var(--font-space-mono), monospace",
                    fontSize: 11,
                    color: isActive ? CC.INK : CC.MUTED,
                    fontWeight: isActive ? 700 : 500,
                    borderRight: `1px solid ${CC.HAIR_2}`,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {tab.label}
                  {tab.count != null && (
                    <span
                      style={{
                        background: isActive ? CC.NAVY : CC.HAIR,
                        color: isActive ? "#fff" : CC.MUTED,
                        borderRadius: 999,
                        padding: "0 5px",
                        fontSize: 9.5,
                        fontWeight: 700,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
          </div>

          {activeTab === "notes" && noteFiles.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "7px 12px",
                background: "#FAFBFC",
                borderBottom: `1px solid ${CC.HAIR_2}`,
                gap: 10,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: noteIdx === 0 ? CC.H_HEALTHY : CC.MUTED,
                    background: noteIdx === 0 ? `${CC.H_HEALTHY}15` : CC.SURFACE_2,
                    border: `1px solid ${noteIdx === 0 ? `${CC.H_HEALTHY}40` : CC.HAIR}`,
                    padding: "2px 6px",
                    borderRadius: 3,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {noteIdx === 0 ? "latest" : `history · ${noteIdx} back`}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono), monospace",
                    fontSize: 11,
                    color: CC.INK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {noteFiles[noteIdx]?.path.replace(".cappshub/notes/", "")}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setNoteIdx((i) => Math.min(noteFiles.length - 1, i + 1))}
                  disabled={noteIdx >= noteFiles.length - 1}
                  title="Older"
                  style={navBtn(noteIdx >= noteFiles.length - 1)}
                >
                  ←
                </button>
                <button
                  onClick={() => setNoteIdx((i) => Math.max(0, i - 1))}
                  disabled={noteIdx <= 0}
                  title="Newer"
                  style={navBtn(noteIdx <= 0)}
                >
                  →
                </button>
                <button
                  onClick={() => setHistoryOpen((o) => !o)}
                  style={{ ...navBtn(false), padding: "3px 8px" }}
                >
                  History ({noteFiles.length}) {historyOpen ? "▴" : "▾"}
                </button>
              </div>
              {historyOpen && (
                <div
                  onMouseLeave={() => setHistoryOpen(false)}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 12,
                    marginTop: 4,
                    background: "#fff",
                    border: `1px solid ${CC.HAIR}`,
                    borderRadius: 6,
                    boxShadow: "0 10px 30px rgba(15,23,42,.12)",
                    minWidth: 320,
                    maxHeight: 280,
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  {noteFiles.map((f, i) => (
                    <button
                      key={f.path}
                      onClick={() => {
                        setNoteIdx(i);
                        setHistoryOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: i === noteIdx ? CC.SURFACE_2 : "transparent",
                        border: "none",
                        borderBottom: `1px solid ${CC.HAIR_2}`,
                        padding: "7px 10px",
                        cursor: "pointer",
                        fontFamily: "var(--font-space-mono), monospace",
                        fontSize: 11,
                        color: i === noteIdx ? CC.INK : CC.MUTED,
                      }}
                    >
                      <span
                        style={{
                          color: i === 0 ? CC.H_HEALTHY : CC.MUTED_2,
                          fontWeight: 700,
                          marginRight: 6,
                        }}
                      >
                        {i === 0 ? "●" : "○"}
                      </span>
                      {f.path.replace(".cappshub/notes/", "")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "notes" && noteFiles.length === 0 && (
            <div
              style={{
                padding: "7px 12px",
                background: "#FAFBFC",
                borderBottom: `1px solid ${CC.HAIR_2}`,
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 11,
                color: CC.MUTED_2,
              }}
            >
              No notes synced yet. Use /note in Claude Code to add one.
            </div>
          )}

          <pre
            style={{
              margin: 0,
              padding: "12px 14px",
              background: "#FAFBFC",
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11.5,
              lineHeight: 1.55,
              color: CC.INK,
              maxHeight: 260,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {body}
          </pre>
        </div>
      )}
    </div>
  );
}
