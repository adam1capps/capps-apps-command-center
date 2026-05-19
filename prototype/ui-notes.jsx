/* Notes & instructions UI:
 *   - NotesButton    — small icon-button used on app cards / drawers
 *   - NotesModal     — popout list of notes for one app, with inline edit
 *   - NotePage       — full-screen single-note editor (opened from the modal)
 *
 * Persistence handled by window.CC_NOTES (see notes-store.js).
 */

function useNotesFor(slug) {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => window.CC_NOTES.subscribe(force), []);
  return slug ? window.CC_NOTES.getFor(slug) : [];
}

const KIND_META = {
  instruction: { label: "Instruction", color: "#1E2C55", tint: "#E8EAF2" },
  note:        { label: "Note",        color: "#E99A3F", tint: "#FCEFDD" },
};

const SOURCE_META = {
  manual:          { label: "manual",       glyph: "·",  desc: "Added in the dashboard" },
  "slash-command": { label: "/cmd",         glyph: "/", desc: "From a Claude Code slash command" },
  hook:            { label: "hook",         glyph: "⚭", desc: "From a Claude Code PostToolUse hook" },
  "claude-md":     { label: "CLAUDE.md",   glyph: "¶",  desc: "Imported from the repo's CLAUDE.md" },
};

function SourceChip({ source, repo_path, commit_sha, compact }) {
  if (!source || source === "manual") return null;
  const m = SOURCE_META[source] || SOURCE_META.manual;
  return (
    <span title={`${m.desc}${repo_path ? `\n${repo_path}` : ""}${commit_sha ? ` @ ${commit_sha}` : ""}`}
      style={{
        fontFamily: "'Space Mono', monospace", fontSize: compact ? 9 : 9.5,
        color: CC.NAVY, background: "#fff",
        border: `1px solid #C7CFE0`,
        padding: "1px 5px", borderRadius: 3,
        display: "inline-flex", alignItems: "center", gap: 4,
        textTransform: "lowercase", letterSpacing: ".02em",
        flex: "none",
      }}>
      <span style={{ opacity: .7 }}>{m.glyph}</span>{m.label}
    </span>
  );
}

function formatStamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ─── NotesButton ────────────────────────────────────────────────── */
function NotesButton({ app, onOpen, variant = "ghost" }) {
  const count = useNotesFor(app.slug).length;
  const isDark = variant === "dark";
  return (
    <button
      data-stop
      onClick={(e) => { e.stopPropagation(); onOpen(app); }}
      title={count ? `${count} note${count !== 1 ? "s" : ""}` : "Notes & instructions"}
      style={{
        background: count
          ? (isDark ? "rgba(255,255,255,0.12)" : "#fff")
          : "transparent",
        border: `1px solid ${count
          ? (isDark ? "rgba(255,255,255,0.22)" : "#CBD5E1")
          : (isDark ? "rgba(255,255,255,0.18)" : CC.HAIR)}`,
        color: isDark ? "#fff" : (count ? CC.INK : CC.MUTED),
        padding: "2px 8px",
        height: 22,
        borderRadius: 999,
        cursor: "pointer", fontFamily: "inherit",
        fontSize: 11, fontWeight: 600,
        display: "inline-flex", alignItems: "center", gap: 4,
        lineHeight: 1,
      }}
    >
      <NoteGlyph size={11}/>
      {count > 0 && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10.5 }}>{count}</span>}
    </button>
  );
}

function NoteGlyph({ size = 12, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
      <path d="M2.5 1.5h5L9.5 3.5V10a.5.5 0 0 1-.5.5H2.5A.5.5 0 0 1 2 10V2a.5.5 0 0 1 .5-.5Z"
        stroke={color || "currentColor"} strokeWidth="1"/>
      <path d="M7 1.5V3.5h2.5" stroke={color || "currentColor"} strokeWidth="1"/>
      <path d="M4 6h4M4 8h3" stroke={color || "currentColor"} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}


/* ─── NotesModal ────────────────────────────────────────────────── */
function NotesModal({ app, onClose, onOpenFull }) {
  const notes = useNotesFor(app.slug);
  const [filter, setFilter] = React.useState("all");
  const [expanded, setExpanded] = React.useState(null); // noteId | "new-<kind>" | null
  const cat = CC.CATS[app.category];

  const visible = filter === "all" ? notes : notes.filter(n => n.kind === filter);

  // close on Escape
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startNew = (kind) => {
    const id = window.CC_NOTES.newId();
    setExpanded({ tempId: id, kind, title: "", body: "" });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
        zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "6vh 16px", animation: "ccFade .14s ease-out",
        backdropFilter: "blur(2px)",
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)", maxHeight: "84vh",
          background: "#fff", borderRadius: 12,
          boxShadow: "0 30px 80px rgba(15,23,42,.35)",
          display: "flex", flexDirection: "column",
          animation: "ccSlideUp .18s ease-out",
        }}>
        {/* header */}
        <header style={{
          padding: "16px 20px 12px", borderBottom: `1px solid ${CC.HAIR}`,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10.5,
                color: cat.accent, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: ".1em",
              }}>{window.CC_DATA.CATEGORIES[app.category].label} · Notes</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: CC.INK, marginTop: 2 }}>
                {app.name}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "transparent", border: "none", color: CC.MUTED,
              fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0,
            }}>×</button>
          </div>

          <div style={{
            marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
          }}>
            <div style={{
              display: "inline-flex", background: CC.SURFACE_2,
              border: `1px solid ${CC.HAIR}`, borderRadius: 8, padding: 3,
            }}>
              {[
                { id: "all", label: "All", count: notes.length },
                { id: "instruction", label: "Instructions", count: notes.filter(n => n.kind === "instruction").length },
                { id: "note", label: "Notes", count: notes.filter(n => n.kind === "note").length },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  background: filter === f.id ? "#fff" : "transparent",
                  border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 11.5, fontWeight: filter === f.id ? 700 : 500,
                  color: filter === f.id ? CC.INK : CC.MUTED,
                  display: "inline-flex", alignItems: "center", gap: 5,
                  boxShadow: filter === f.id ? "0 1px 2px rgba(15,23,42,.06)" : "none",
                }}>
                  {f.label}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: CC.MUTED_2 }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => startNew("instruction")} style={newBtn(KIND_META.instruction.color)}>
                + Instruction
              </button>
              <button onClick={() => startNew("note")} style={newBtn(KIND_META.note.color)}>
                + Note
              </button>
            </div>
          </div>
        </header>

        {/* body */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "12px 12px 14px",
        }}>
          {/* compose new */}
          {expanded?.tempId && (
            <NoteEditor
              isNew
              note={{ id: expanded.tempId, kind: expanded.kind, title: expanded.title, body: expanded.body }}
              onSave={(draft) => {
                window.CC_NOTES.upsert(app.slug, {
                  id: expanded.tempId, kind: expanded.kind,
                  title: draft.title.trim() || "Untitled",
                  body: draft.body,
                });
                setExpanded(null);
              }}
              onCancel={() => setExpanded(null)}
              onExpand={() => {
                // save first if has content
                if (expanded.title || expanded.body) {
                  window.CC_NOTES.upsert(app.slug, {
                    id: expanded.tempId, kind: expanded.kind,
                    title: expanded.title.trim() || "Untitled",
                    body: expanded.body,
                  });
                }
                onOpenFull(app.slug, expanded.tempId);
              }}
            />
          )}

          {visible.length === 0 && !expanded && (
            <div style={{
              padding: "32px 20px", textAlign: "center", color: CC.MUTED_2,
              fontSize: 13,
            }}>
              No {filter === "all" ? "items" : filter + "s"} yet for this app.<br/>
              <span style={{ fontSize: 12 }}>Use the buttons above to add one.</span>
            </div>
          )}

          {visible.map(n => (
            <NoteRow
              key={n.id}
              note={n}
              expanded={expanded === n.id}
              onToggle={() => setExpanded(expanded === n.id ? null : n.id)}
              onSave={(draft) => {
                window.CC_NOTES.upsert(app.slug, { id: n.id, kind: draft.kind, title: draft.title, body: draft.body });
                setExpanded(null);
              }}
              onDelete={() => window.CC_NOTES.remove(app.slug, n.id)}
              onExpand={() => onOpenFull(app.slug, n.id)}
            />
          ))}
        </div>

        {/* footer */}
        <footer style={{
          padding: "10px 20px", borderTop: `1px solid ${CC.HAIR}`,
          background: CC.SURFACE_2,
          fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        }}>
          <span>esc to close · ⌘+click any row to open full page</span>
          <span>{notes.length} item{notes.length !== 1 ? "s" : ""}</span>
        </footer>
      </div>
    </div>
  );
}

function newBtn(color) {
  return {
    background: color, color: "#fff", border: "none",
    padding: "5px 10px", borderRadius: 6, fontFamily: "inherit",
    fontSize: 11.5, fontWeight: 600, cursor: "pointer",
  };
}


/* ─── NoteRow — one note in the modal list ──────────────────────── */
function NoteRow({ note, expanded, onToggle, onSave, onDelete, onExpand }) {
  const meta = KIND_META[note.kind] || KIND_META.note;
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
        if (e.metaKey || e.ctrlKey) { onExpand(); return; }
        onToggle();
      }}
      style={{
        padding: "11px 12px",
        borderRadius: 8, cursor: "pointer",
        display: "flex", gap: 10, alignItems: "flex-start",
        border: `1px solid transparent`,
        transition: "background .1s, border-color .1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = CC.SURFACE_2; e.currentTarget.style.borderColor = CC.HAIR; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
    >
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9.5, fontWeight: 700,
        color: meta.color, background: meta.tint,
        padding: "2px 6px", borderRadius: 4,
        textTransform: "uppercase", letterSpacing: ".05em",
        marginTop: 2, whiteSpace: "nowrap", flex: "none",
      }}>{meta.label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, minWidth: 0,
          }}>
            <span style={{
              fontWeight: 600, color: CC.INK, fontSize: 13.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{note.title}</span>
            <SourceChip source={note.source} repo_path={note.repo_path} commit_sha={note.commit_sha} compact/>
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, color: CC.MUTED_2, flex: "none",
          }}>{formatStamp(note.updated_at || note.created_at)}</div>
        </div>
        <div style={{
          fontSize: 12.5, color: CC.MUTED, marginTop: 3, lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{note.body || "(empty)"}</div>
      </div>
      <button
        data-stop
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        title="Open full page"
        style={{
          background: "transparent", border: "none", color: CC.MUTED_2,
          cursor: "pointer", padding: 4, flex: "none", borderRadius: 4,
          display: "inline-flex",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = CC.INK}
        onMouseLeave={(e) => e.currentTarget.style.color = CC.MUTED_2}
      >
        <ExpandGlyph/>
      </button>
    </div>
  );
}

function ExpandGlyph({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M7.5 1.5h3v3M10.5 1.5L7 5M4.5 10.5h-3v-3M1.5 10.5L5 7"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


/* ─── NoteEditor — inline edit row (used for both edit and new) ───── */
function NoteEditor({ note, onSave, onCancel, onDelete, onExpand, isNew }) {
  const [title, setTitle] = React.useState(note.title || "");
  const [body, setBody]   = React.useState(note.body || "");
  const [kind, setKind]   = React.useState(note.kind || "note");
  const meta = KIND_META[kind];

  return (
    <div style={{
      padding: 12, borderRadius: 8, background: CC.SURFACE_2,
      border: `1px solid ${CC.HAIR}`, marginBottom: 6,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 8, marginBottom: 8,
      }}>
        <div style={{
          display: "inline-flex", gap: 4,
        }}>
          {Object.entries(KIND_META).map(([k, m]) => (
            <button key={k} onClick={() => setKind(k)} style={{
              background: kind === k ? m.color : "#fff",
              color: kind === k ? "#fff" : m.color,
              border: `1px solid ${kind === k ? m.color : CC.HAIR}`,
              padding: "3px 8px", borderRadius: 4, fontFamily: "inherit",
              fontSize: 10.5, fontWeight: 700, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: ".05em",
            }}>{m.label}</button>
          ))}
        </div>
        <button data-stop onClick={onExpand} title="Open full page" style={{
          background: "transparent", border: `1px solid ${CC.HAIR}`,
          color: CC.MUTED, padding: "4px 8px", borderRadius: 4, cursor: "pointer",
          fontFamily: "inherit", fontSize: 11, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <ExpandGlyph/> Open page
        </button>
      </div>

      <input
        autoFocus
        value={title}
        placeholder="Title"
        onChange={e => setTitle(e.target.value)}
        style={{
          width: "100%", padding: "8px 10px",
          border: `1px solid ${CC.HAIR}`, borderRadius: 6,
          fontFamily: "inherit", fontSize: 14, fontWeight: 600,
          outline: "none", marginBottom: 6, color: CC.INK, background: "#fff",
        }}
      />
      <textarea
        value={body}
        placeholder="Body…"
        onChange={e => setBody(e.target.value)}
        rows={4}
        style={{
          width: "100%", padding: "8px 10px",
          border: `1px solid ${CC.HAIR}`, borderRadius: 6,
          fontFamily: "inherit", fontSize: 13, lineHeight: 1.5,
          outline: "none", resize: "vertical", color: CC.INK, background: "#fff",
        }}
      />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 8,
      }}>
        <div>
          {!isNew && onDelete && (
            <button onClick={onDelete} style={{
              background: "transparent", border: "none", color: CC.H_BROKEN,
              fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              padding: "4px 0",
            }}>Delete</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onCancel} style={{
            background: "transparent", border: `1px solid ${CC.HAIR}`,
            color: CC.MUTED, padding: "5px 11px", borderRadius: 6,
            fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={() => onSave({ title, body, kind })} style={{
            background: meta.color, color: "#fff", border: "none",
            padding: "5px 12px", borderRadius: 6,
            fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}


/* ─── NotePage — full-screen single-note editor ──────────────────── */
function NotePage({ slug, noteId, onClose }) {
  const allFor = useNotesFor(slug);
  const app = window.CC_DATA.APPS.find(a => a.slug === slug);
  const note = allFor.find(n => n.id === noteId);

  // If note doesn't exist (new from modal that wasn't saved), create a stub.
  const [title, setTitle] = React.useState(note?.title || "");
  const [body, setBody]   = React.useState(note?.body || "");
  const [kind, setKind]   = React.useState(note?.kind || "note");
  const [saved, setSaved] = React.useState(true);

  // autosave (debounced)
  React.useEffect(() => {
    setSaved(false);
    const id = setTimeout(() => {
      window.CC_NOTES.upsert(slug, {
        id: noteId, kind,
        title: title.trim() || "Untitled",
        body,
      });
      setSaved(true);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, kind]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); /* already autosaving */ }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!app) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        App not found. <button onClick={onClose}>Back</button>
      </div>
    );
  }

  const cat = CC.CATS[app.category];
  const meta = KIND_META[kind];
  const otherForApp = allFor.filter(n => n.id !== noteId);
  const created = note?.created_at;
  const updated = note?.updated_at;

  return (
    <div style={{
      minHeight: "100vh", background: "#fff",
      animation: "ccFade .15s ease-out",
    }}>
      {/* top bar */}
      <header style={{
        position: "sticky", top: 0, background: "#fff", zIndex: 20,
        borderBottom: `1px solid ${CC.HAIR}`,
      }}>
        <div style={{
          maxWidth: 980, margin: "0 auto", padding: "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${CC.HAIR}`,
            color: CC.INK, padding: "6px 12px", borderRadius: 6,
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>← Back</button>

          <div style={{
            display: "flex", alignItems: "center", gap: 14, minWidth: 0,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2, background: cat.accent, flex: "none",
            }}/>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10.5,
                color: CC.MUTED, letterSpacing: ".08em", textTransform: "uppercase",
              }}>
                {window.CC_DATA.CATEGORIES[app.category].label} · Notes
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: CC.INK, lineHeight: 1.2 }}>
                {app.name}
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 11,
            color: saved ? CC.H_HEALTHY : CC.MUTED, flex: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: saved ? CC.H_HEALTHY : CC.H_WARN,
            }}/>
            {saved ? "saved" : "saving…"}
          </div>
        </div>
      </header>

      <div style={{
        maxWidth: 980, margin: "0 auto", padding: "32px 28px 80px",
        display: "grid", gridTemplateColumns: "1fr 240px", gap: 40,
      }}>
        {/* main editor */}
        <main>
          <div style={{ display: "inline-flex", gap: 6, marginBottom: 14 }}>
            {Object.entries(KIND_META).map(([k, m]) => (
              <button key={k} onClick={() => setKind(k)} style={{
                background: kind === k ? m.color : "#fff",
                color: kind === k ? "#fff" : m.color,
                border: `1px solid ${kind === k ? m.color : CC.HAIR}`,
                padding: "5px 12px", borderRadius: 999, fontFamily: "inherit",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: ".06em",
              }}>{m.label}</button>
            ))}
          </div>

          <input
            value={title}
            placeholder="Untitled"
            onChange={e => setTitle(e.target.value)}
            style={{
              width: "100%", padding: "4px 0",
              border: "none", outline: "none",
              fontFamily: "inherit", fontSize: 36, fontWeight: 700,
              color: CC.INK, letterSpacing: "-0.02em", lineHeight: 1.15,
              background: "transparent",
            }}
          />

          <div style={{
            display: "flex", gap: 12, marginTop: 4, marginBottom: 22, alignItems: "center",
            fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
            flexWrap: "wrap",
          }}>
            {created && <span>created {formatStamp(created)}</span>}
            {updated && <span>· updated {formatStamp(updated)}</span>}
            <span>· {body.split(/\s+/).filter(Boolean).length} words</span>
            {note && note.source && note.source !== "manual" && (
              <SourceChip source={note.source} repo_path={note.repo_path} commit_sha={note.commit_sha}/>
            )}
          </div>

          <textarea
            value={body}
            placeholder={kind === "instruction"
              ? "Write the directive in clear, declarative sentences. Use bullets for steps."
              : "Capture the observation. Logs, measurements, quotes from stakeholders, links."}
            onChange={e => setBody(e.target.value)}
            style={{
              width: "100%", minHeight: 380, padding: 0,
              border: "none", outline: "none",
              fontFamily: "inherit", fontSize: 16, lineHeight: 1.65,
              color: CC.TEXT, resize: "vertical",
              background: "transparent",
            }}
          />
        </main>

        {/* right rail */}
        <aside style={{
          borderLeft: `1px solid ${CC.HAIR}`, paddingLeft: 24,
          fontSize: 12.5,
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: CC.MUTED_2, letterSpacing: ".08em", textTransform: "uppercase",
            marginBottom: 10,
          }}>App</div>
          <div style={{ fontWeight: 700, color: CC.INK, fontSize: 14, marginBottom: 4 }}>
            {app.name}
          </div>
          <div style={{ fontSize: 12, color: CC.MUTED, lineHeight: 1.5, marginBottom: 14 }}>
            {app.description}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            <StagePill stage={app.stage}/>
            <CategoryPill cat={app.category}/>
          </div>
          {app.live_url && (
            <a href={app.live_url} target="_blank" rel="noopener" style={{
              display: "inline-block", marginBottom: 14,
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              color: cat.primary, textDecoration: "none",
            }}>{shortHost(app.live_url)} ↗</a>
          )}

          {otherForApp.length > 0 && (
            <>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: CC.MUTED_2, letterSpacing: ".08em", textTransform: "uppercase",
                marginTop: 22, marginBottom: 10,
              }}>Other notes ({otherForApp.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {otherForApp.map(n => {
                  const m = KIND_META[n.kind];
                  return (
                    <button key={n.id} onClick={() => {
                      window.dispatchEvent(new CustomEvent("cc-open-note", {
                        detail: { slug, noteId: n.id }
                      }));
                    }} style={{
                      textAlign: "left", background: "transparent",
                      border: `1px solid ${CC.HAIR}`, borderRadius: 6,
                      padding: "7px 9px", cursor: "pointer", fontFamily: "inherit",
                    }}>
                      <div style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
                        color: m.color, letterSpacing: ".05em", textTransform: "uppercase",
                        marginBottom: 2,
                      }}>{m.label}</div>
                      <div style={{
                        fontSize: 12, color: CC.INK, fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{n.title}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ borderTop: `1px solid ${CC.HAIR}`, marginTop: 22, paddingTop: 14 }}>
            <button onClick={() => {
              if (confirm("Delete this note?")) {
                window.CC_NOTES.remove(slug, noteId);
                onClose();
              }
            }} style={{
              background: "transparent", border: "none", color: CC.H_BROKEN,
              fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
              padding: 0,
            }}>Delete this note</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { NotesButton, NotesModal, NotePage, KIND_META, SOURCE_META, SourceChip });
