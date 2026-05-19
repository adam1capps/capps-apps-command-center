/* Claude Code integration UI:
 *  - IntegrationCard       — per-app, shown on the detail page
 *  - IntegrationPage       — global, accessible from dashboard header
 *  - ConnectionDot         — small connection indicator
 *  - SyncToast             — slide-in toast for incoming sync events
 *  - CodeBlock / TreePane  — supporting bits for showing .cappshub/ files
 */

/* ─── ConnectionDot ─────────────────────────────────────────────── */
function ConnectionDot({ connected, label, size = 8 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: size, height: size, borderRadius: 999,
        background: connected ? CC.H_HEALTHY : CC.MUTED_2,
        boxShadow: connected ? `0 0 0 0 ${CC.H_HEALTHY}55` : "none",
        animation: connected ? "ccConnPulse 2s ease-out infinite" : "none",
        flex: "none",
      }}/>
      {label && (
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11,
          color: connected ? CC.INK : CC.MUTED, letterSpacing: ".02em",
        }}>{label}</span>
      )}
    </span>
  );
}

/* ─── useIntegration hook ──────────────────────────────────────── */
function useIntegrationEvents() {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => window.CC_INT.subscribe(force), []);
  return window.CC_INT.getEvents();
}

const EVT_META = {
  hook:            { label: "hook",       color: "#6B4DE0" },
  "slash-command": { label: "/cmd",       color: "#1E2C55" },
  manual:          { label: "manual",     color: "#94A3B8" },
  push:            { label: "git push",   color: "#00BD70" },
  "claude-md":     { label: "CLAUDE.md",  color: "#1A8F96" },
  "plan-update":   { label: "plan",       color: "#E99A3F" },
  instruction:     { label: "instruct",   color: "#1E2C55" },
};

function EventDot({ kind }) {
  const m = EVT_META[kind] || EVT_META.manual;
  return <span style={{
    width: 8, height: 8, borderRadius: 2, background: m.color,
    display: "inline-block", flex: "none",
  }}/>;
}
function EventTag({ kind }) {
  const m = EVT_META[kind] || EVT_META.manual;
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 9.5, fontWeight: 700,
      color: m.color, background: `${m.color}14`,
      padding: "2px 6px", borderRadius: 3,
      textTransform: "uppercase", letterSpacing: ".04em",
      whiteSpace: "nowrap",
    }}>{m.label}</span>
  );
}


/* ─── IntegrationCard (per-app, lives in detail page) ──────────── */
function IntegrationCard({ app, onOpenGlobal }) {
  useIntegrationEvents();              // re-render on new events
  const conn = window.CC_INT.connectionFor(app.slug);
  const events = window.CC_INT.getEventsFor(app.slug).slice(0, 5);
  const files = window.CC_INT.cappshubFiles(app.slug);
  const [activeTab, setActiveTab] = React.useState("instructions");
  const [noteIdx, setNoteIdx]   = React.useState(0);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  if (!conn?.connected) {
    return (
      <div style={{
        padding: "12px 14px", background: CC.SURFACE_2,
        border: `1px dashed ${CC.HAIR}`, borderRadius: 8,
        fontSize: 13, color: CC.MUTED, lineHeight: 1.5,
      }}>
        <strong style={{ color: CC.INK }}>Claude Code not connected.</strong><br/>
        {conn?.reason || "No repo linked. Add a repository to enable sync."}
      </div>
    );
  }

  return (
    <div>
      {/* connection row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, marginBottom: 12, flexWrap: "wrap",
      }}>
        <div>
          <ConnectionDot connected label="Claude Code · connected"/>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
            marginTop: 4,
          }}>
            github.com/{conn.repo} · {conn.branch} · last sync {conn.last_sync ? relDate(conn.last_sync) : "never"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => {
            window.CC_INT.simulate(app.slug, Math.random() < 0.6 ? "note" : "instruction");
          }} style={{
            background: "#fff", border: `1px solid ${CC.HAIR}`, color: CC.INK,
            padding: "5px 10px", borderRadius: 6, fontFamily: "inherit",
            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace" }}>↻</span> Simulate sync
          </button>
          <button onClick={onOpenGlobal} style={{
            background: "transparent", border: `1px solid ${CC.HAIR}`, color: CC.MUTED,
            padding: "5px 10px", borderRadius: 6, fontFamily: "inherit",
            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
          }}>Global ↗</button>
        </div>
      </div>

      {/* file tabs + body */}
      {files && (() => {
        const noteFiles = Object.keys(files).filter(f => f.startsWith(".cappshub/notes/"));
        const TABS = [
          { id: "instructions", label: ".cappshub/instructions.md", path: ".cappshub/instructions.md" },
          { id: "plan",         label: ".cappshub/plan.json",        path: ".cappshub/plan.json" },
          { id: "notes",        label: "Notes",                       path: noteFiles[noteIdx] || null,
                                count: noteFiles.length },
          { id: "claude-md",    label: "CLAUDE.md",                   path: "CLAUDE.md" },
        ];
        const active = TABS.find(t => t.id === activeTab) || TABS[0];
        return (
          <div style={{
            border: `1px solid ${CC.HAIR}`, borderRadius: 8, overflow: "hidden",
            marginBottom: 12,
          }}>
            <div style={{
              display: "flex", background: CC.SURFACE_2,
              borderBottom: `1px solid ${CC.HAIR}`, alignItems: "stretch",
            }}>
              {TABS.map(tab => {
                const isActive = tab.id === activeTab;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    background: isActive ? "#fff" : "transparent", border: "none",
                    padding: "8px 12px", cursor: "pointer",
                    fontFamily: "'Space Mono', monospace", fontSize: 11,
                    color: isActive ? CC.INK : CC.MUTED,
                    fontWeight: isActive ? 700 : 500,
                    borderRight: `1px solid ${CC.HAIR_2}`,
                    whiteSpace: "nowrap",
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}>
                    {tab.label}
                    {tab.count != null && (
                      <span style={{
                        background: isActive ? CC.NAVY : CC.HAIR,
                        color: isActive ? "#fff" : CC.MUTED,
                        borderRadius: 999, padding: "0 5px", fontSize: 9.5, fontWeight: 700,
                      }}>{tab.count}</span>
                    )}
                  </button>
                );
              })}
              <div style={{ flex: 1 }}/>
            </div>

            {/* Notes sub-control: most recent + history selector */}
            {activeTab === "notes" && noteFiles.length > 0 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 12px", background: "#FAFBFC",
                borderBottom: `1px solid ${CC.HAIR_2}`, gap: 10, position: "relative",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, minWidth: 0,
                }}>
                  <span style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 9.5, fontWeight: 700,
                    color: noteIdx === 0 ? CC.H_HEALTHY : CC.MUTED,
                    background: noteIdx === 0 ? `${CC.H_HEALTHY}15` : CC.SURFACE_2,
                    border: `1px solid ${noteIdx === 0 ? `${CC.H_HEALTHY}40` : CC.HAIR}`,
                    padding: "2px 6px", borderRadius: 3,
                    textTransform: "uppercase", letterSpacing: ".05em",
                  }}>{noteIdx === 0 ? "latest" : `history · ${noteIdx} back`}</span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.INK,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{noteFiles[noteIdx]?.replace(".cappshub/notes/", "")}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setNoteIdx(i => Math.min(noteFiles.length - 1, i + 1))}
                    disabled={noteIdx >= noteFiles.length - 1}
                    title="Older"
                    style={navBtn(noteIdx >= noteFiles.length - 1)}>←</button>
                  <button onClick={() => setNoteIdx(i => Math.max(0, i - 1))}
                    disabled={noteIdx <= 0}
                    title="Newer"
                    style={navBtn(noteIdx <= 0)}>→</button>
                  <button onClick={() => setHistoryOpen(o => !o)} style={{
                    ...navBtn(false), padding: "3px 8px",
                  }}>History ({noteFiles.length}) {historyOpen ? "▴" : "▾"}</button>
                </div>
                {historyOpen && (
                  <div style={{
                    position: "absolute", top: "100%", right: 12, marginTop: 4,
                    background: "#fff", border: `1px solid ${CC.HAIR}`,
                    borderRadius: 6, boxShadow: "0 10px 30px rgba(15,23,42,.12)",
                    minWidth: 320, maxHeight: 280, overflowY: "auto", zIndex: 10,
                  }} onMouseLeave={() => setHistoryOpen(false)}>
                    {noteFiles.map((f, i) => (
                      <button key={f} onClick={() => { setNoteIdx(i); setHistoryOpen(false); }} style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: i === noteIdx ? CC.SURFACE_2 : "transparent",
                        border: "none", borderBottom: `1px solid ${CC.HAIR_2}`,
                        padding: "7px 10px", cursor: "pointer",
                        fontFamily: "'Space Mono', monospace", fontSize: 11,
                        color: i === noteIdx ? CC.INK : CC.MUTED,
                      }}>
                        <span style={{
                          color: i === 0 ? CC.H_HEALTHY : CC.MUTED_2,
                          fontWeight: 700, marginRight: 6,
                        }}>{i === 0 ? "●" : "○"}</span>
                        {f.replace(".cappshub/notes/", "")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "notes" && noteFiles.length === 0 && (
              <div style={{
                padding: "7px 12px", background: "#FAFBFC",
                borderBottom: `1px solid ${CC.HAIR_2}`,
                fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
              }}>No notes synced yet. Use /note in Claude Code to add one.</div>
            )}

            <pre style={{
              margin: 0, padding: "12px 14px",
              background: "#FAFBFC",
              fontFamily: "'Space Mono', monospace", fontSize: 11.5, lineHeight: 1.55,
              color: CC.INK, maxHeight: 260, overflow: "auto",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{active.path ? files[active.path] : ""}</pre>
          </div>
        );
      })()}

      {/* recent events */}
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9.5, fontWeight: 700,
        color: CC.MUTED_2, textTransform: "uppercase", letterSpacing: ".08em",
        marginBottom: 6,
      }}>Recent sync events</div>
      {events.length === 0 ? (
        <div style={{ fontSize: 12.5, color: CC.MUTED_2, fontStyle: "italic" }}>
          No events yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {events.map((e, i) => (
            <div key={i} style={{
              display: "flex", gap: 8, alignItems: "center",
              fontFamily: "'Space Mono', monospace", fontSize: 11.5,
              padding: "5px 8px", background: CC.SURFACE_2, borderRadius: 4,
            }}>
              <EventTag kind={e.kind}/>
              <span style={{
                color: CC.INK, flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{e.text}</span>
              <span style={{ color: CC.MUTED_2, flex: "none" }}>{relDate(e.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ─── IntegrationPage (global) ─────────────────────────────────── */
function IntegrationPage({ onClose, onOpenDetail }) {
  useIntegrationEvents();
  const events = window.CC_INT.getEvents();
  const summary = window.CC_INT.connectionSummary();
  const apps = window.CC_DATA.APPS.filter(a => a.github_repo && a.stage !== "archive");
  const [copied, setCopied] = React.useState(null);

  const copy = (label, text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1400);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: CC.SURFACE_2, animation: "ccFade .14s ease-out" }}>
      {/* top bar */}
      <header style={{
        position: "sticky", top: 0, background: "#fff", zIndex: 20,
        borderBottom: `1px solid ${CC.HAIR}`,
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "12px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${CC.HAIR}`, color: CC.INK,
            padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
            fontSize: 12.5, fontWeight: 600,
          }}>← Command Center</button>

          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: CC.MUTED,
          }}>
            integration <span style={{ color: CC.INK, fontWeight: 700 }}>· Claude Code</span>
          </div>

          <ConnectionDot connected label="connected"/>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 80px" }}>
        {/* hero */}
        <section style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 11,
            color: CC.MUTED, letterSpacing: ".1em", textTransform: "uppercase",
            marginBottom: 10,
          }}>Claude Code · Capps Apps integration</div>
          <h1 style={{
            margin: 0, fontSize: 36, fontWeight: 700, color: CC.INK,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>
            Notes flow both ways.<br/>
            <span style={{ color: CC.MUTED }}>You and Claude Code share one source of truth.</span>
          </h1>
          <p style={{
            maxWidth: 720, marginTop: 14, fontSize: 16, color: CC.MUTED, lineHeight: 1.55,
          }}>
            Every repo carries a <code style={codeStyle}>.cappshub/</code> folder. Slash commands and the PostToolUse hook write into it from inside Claude Code. A GitHub webhook pushes those changes to this dashboard within seconds, no waiting on the 6-hour poll.
          </p>
        </section>

        {/* stats strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 10,
          marginBottom: 32, overflow: "hidden",
        }}>
          <QStat n={summary.connected_repos} label="Connected repos"/>
          <QStat n={summary.events_24h} label="Events · 24h"/>
          <QStat n={summary.events_total} label="Events · all-time"/>
          <QStat n={window.CC_INT.SLASH_COMMANDS.length} label="Slash commands" last/>
        </div>

        {/* slash commands */}
        <Section title="Slash commands" subtitle="Type these inside Claude Code while working in any connected repo.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {window.CC_INT.SLASH_COMMANDS.map(s => (
              <div key={s.cmd} style={{
                background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 8,
                padding: "14px 16px",
              }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700,
                  color: CC.NAVY,
                }}>{s.cmd}</div>
                <div style={{ fontSize: 12.5, color: CC.MUTED, marginTop: 4, lineHeight: 1.45 }}>
                  {s.summary}
                </div>
                <div style={{
                  marginTop: 10, padding: "7px 9px",
                  background: CC.SURFACE_2, borderRadius: 4,
                  fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.INK,
                  overflow: "auto",
                }}>{s.cmd} {s.args}</div>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
                  marginTop: 6, fontStyle: "italic",
                }}>writes to {s.writes_to}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* hook config */}
        <Section
          title="Hook contract"
          subtitle="Drop this into ~/.claude/settings.json. Hooks fire on every Edit/Write and on Claude's Notification events."
          right={
            <button onClick={() => copy("hook", JSON.stringify(window.CC_INT.HOOK_CONFIG, null, 2))} style={copyBtn()}>
              {copied === "hook" ? "Copied ✓" : "Copy JSON"}
            </button>
          }>
          <pre style={{
            margin: 0, padding: "14px 16px",
            background: "#0F172A", color: "#E2E8F0",
            fontFamily: "'Space Mono', monospace", fontSize: 11.5, lineHeight: 1.55,
            borderRadius: 8, overflow: "auto", maxHeight: 320,
          }}>{JSON.stringify(window.CC_INT.HOOK_CONFIG, null, 2)}</pre>
        </Section>

        {/* .cappshub spec */}
        <Section title=".cappshub/ folder spec"
          subtitle="Every connected repo carries this folder. Claude Code reads + writes it; the dashboard mirrors it.">
          <div style={{
            background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 8,
            padding: "12px 16px",
            fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.75, color: CC.INK,
          }}>
            <div><span style={dirGlyph}>📁</span> <strong>.cappshub/</strong></div>
            <div style={{ paddingLeft: 18 }}>├── <strong>instructions.md</strong>     <span style={fileNote}>durable directives, /instruct appends</span></div>
            <div style={{ paddingLeft: 18 }}>├── <strong>plan.json</strong>            <span style={fileNote}>Claude Code plan; /plan add|done|drop</span></div>
            <div style={{ paddingLeft: 18 }}>└── <strong>notes/</strong></div>
            <div style={{ paddingLeft: 36 }}>    ├── 2026-05-15-render-cold-start.md</div>
            <div style={{ paddingLeft: 36 }}>    ├── 2026-05-16-stripe-500s.md</div>
            <div style={{ paddingLeft: 36 }}>    └── ...</div>
            <div style={{ marginTop: 8 }}><span style={dirGlyph}>📄</span> <strong>CLAUDE.md</strong>             <span style={fileNote}>auto-generated header + slash-command reference</span></div>
          </div>
        </Section>

        {/* event stream */}
        <Section title="Live event stream" subtitle="Newest first. Refreshes whenever Claude Code emits a hook or you press Simulate.">
          <div style={{
            background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 8,
            maxHeight: 380, overflowY: "auto",
          }}>
            {events.map((e, i) => {
              const app = window.CC_DATA.APPS.find(a => a.slug === e.slug);
              return (
                <div key={i} onClick={() => app && onOpenDetail(app)} style={{
                  display: "grid",
                  gridTemplateColumns: "70px 90px 1fr auto auto",
                  alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  borderBottom: i < events.length - 1 ? `1px solid ${CC.HAIR_2}` : "none",
                  cursor: app ? "pointer" : "default",
                  fontFamily: "'Space Mono', monospace", fontSize: 11.5,
                }}
                  onMouseEnter={(el) => el.currentTarget.style.background = CC.SURFACE_2}
                  onMouseLeave={(el) => el.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: CC.MUTED_2, fontSize: 11 }}>{relDate(e.ts)}</span>
                  <EventTag kind={e.kind}/>
                  <span style={{
                    color: CC.INK,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{e.text}</span>
                  <span style={{ color: CC.MUTED, fontSize: 11 }}>{app?.name || e.slug}</span>
                  <span style={{ color: CC.MUTED_2, fontSize: 10.5 }}>{e.actor}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* connected repos */}
        <Section title="Connected repos" subtitle="All repositories with .cappshub/ + the hook installed.">
          <div style={{
            background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 8,
            overflow: "hidden",
          }}>
            {apps.map((a, i) => {
              const conn = window.CC_INT.connectionFor(a.slug);
              return (
                <div key={a.slug} onClick={() => onOpenDetail(a)} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 14,
                  alignItems: "center", padding: "11px 16px",
                  borderBottom: i < apps.length - 1 ? `1px solid ${CC.HAIR_2}` : "none",
                  cursor: "pointer",
                }}
                  onMouseEnter={(el) => el.currentTarget.style.background = CC.SURFACE_2}
                  onMouseLeave={(el) => el.currentTarget.style.background = "transparent"}
                >
                  <ConnectionDot connected/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CC.INK }}>{a.name}</div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
                    }}>{a.github_repo}</div>
                  </div>
                  <CategoryPill cat={a.category}/>
                  <span style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED,
                  }}>{conn?.event_count || 0} event{conn?.event_count === 1 ? "" : "s"}</span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
                  }}>last sync {conn?.last_sync ? relDate(conn.last_sync) : "never"}</span>
                </div>
              );
            })}
          </div>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        marginBottom: 12, gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 700, color: CC.INK, letterSpacing: "-0.01em",
          }}>{title}</h2>
          {subtitle && (
            <div style={{ fontSize: 13, color: CC.MUTED, marginTop: 4, maxWidth: 720 }}>{subtitle}</div>
          )}
        </div>
        {right && <div>{right}</div>}
      </div>
      {children}
    </section>
  );
}
function QStat({ n, label, last }) {
  return (
    <div style={{ padding: "20px 22px", borderRight: last ? "none" : `1px solid ${CC.HAIR}` }}>
      <div style={{
        fontSize: 30, fontWeight: 700, color: CC.INK,
        letterSpacing: "-0.02em", lineHeight: 1,
        fontFamily: "'Space Mono', monospace",
      }}>{n}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10.5,
        color: CC.MUTED, marginTop: 8, letterSpacing: ".08em", textTransform: "uppercase",
      }}>{label}</div>
    </div>
  );
}
const codeStyle = {
  fontFamily: "'Space Mono', monospace", fontSize: 13.5,
  background: "#EEF1F5", padding: "1px 6px", borderRadius: 3, color: "#1E2C55",
};
function copyBtn() {
  return {
    background: "#fff", border: `1px solid ${CC.HAIR}`, color: CC.INK,
    padding: "6px 12px", borderRadius: 6, fontFamily: "inherit",
    fontSize: 11.5, fontWeight: 600, cursor: "pointer",
  };
}
const dirGlyph  = { marginRight: 6 };
const fileNote  = { color: "#94A3B8", marginLeft: 6, fontSize: 10.5 };

function navBtn(disabled) {
  return {
    background: disabled ? CC.SURFACE_2 : "#fff",
    border: `1px solid ${CC.HAIR}`,
    color: disabled ? CC.MUTED_2 : CC.INK,
    padding: "3px 7px", borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 600,
    minWidth: 24, textAlign: "center",
  };
}


/* ─── SyncToast — slide-in when a new sync event lands ─────────── */
function SyncToast({ event, onClose, onOpen }) {
  if (!event) return null;
  const app = window.CC_DATA.APPS.find(a => a.slug === event.slug);
  return (
    <div
      onClick={() => { onOpen?.(event.slug); onClose(); }}
      style={{
        position: "fixed", right: 24, bottom: 24, zIndex: 200,
        background: "#0F172A", color: "#fff",
        padding: "12px 14px 12px 16px", borderRadius: 10,
        boxShadow: "0 12px 40px rgba(15,23,42,.35)",
        minWidth: 320, maxWidth: 420,
        animation: "ccSlideUp .22s ease-out",
        cursor: "pointer",
        borderLeft: `3px solid ${CC.H_HEALTHY}`,
      }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
        marginBottom: 4,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: "#94A3B8", letterSpacing: ".08em", textTransform: "uppercase",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: CC.H_HEALTHY }}/>
          Claude Code sync · {event.actor}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
          background: "transparent", border: "none", color: "#64748B",
          cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
        }}>×</button>
      </div>
      <div style={{
        fontSize: 13.5, lineHeight: 1.4, color: "#E2E8F0",
      }}>{event.text}</div>
      {app && (
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#94A3B8",
          marginTop: 6,
        }}>→ {app.name}</div>
      )}
    </div>
  );
}

Object.assign(window, { IntegrationCard, IntegrationPage, ConnectionDot, EventTag, SyncToast });
