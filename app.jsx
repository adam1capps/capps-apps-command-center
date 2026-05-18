/* Capps Apps Command Center — main app shell.
 * Routes: showcase (public "/") vs dashboard ("/dashboard").
 * Three dashboard views: grid, pipeline, attention.
 */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "route": "dashboard",
  "view": "grid",
  "density": "comfortable",
  "headerStyle": "navy",
  "showAttentionBadge": true
}/*EDITMODE-END*/;

const VIEWS = [
  { id: "grid",      label: "Grid",            sub: "Launcher" },
  { id: "pipeline",  label: "Pipeline",        sub: "Lifecycle" },
  { id: "attention", label: "Needs Attention", sub: "Triage" },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState(t.route);          // "showcase" | "dashboard"
  const [view, setView]   = React.useState(t.view);
  const [q, setQ]         = React.useState("");
  const [notesApp,    setNotesApp]    = React.useState(null); // app object | null
  const [detailApp,   setDetailApp]   = React.useState(null); // app object | null
  const [noteContext, setNoteContext] = React.useState(null); // { slug, noteId } | null
  const [intRoute,    setIntRoute]    = React.useState(false);
  const [syncToast,   setSyncToast]   = React.useState(null);

  const openNotes  = React.useCallback((app) => { setNotesApp(app); setDetailApp(null); }, []);
  const openDetail = React.useCallback((app) => setDetailApp(app), []);
  const openFull   = React.useCallback((slug, noteId) => {
    setNoteContext({ slug, noteId });
    setNotesApp(null);
  }, []);
  const closeFull  = React.useCallback(() => setNoteContext(null), []);

  // allow NotePage "other notes" rail to navigate within the page
  React.useEffect(() => {
    const handler = (e) => setNoteContext(e.detail);
    window.addEventListener("cc-open-note", handler);
    return () => window.removeEventListener("cc-open-note", handler);
  }, []);

  // surface a toast whenever an integration event lands (after first render)
  React.useEffect(() => {
    let firstRun = true;
    return window.CC_INT.subscribe(() => {
      if (firstRun) { firstRun = false; return; }
      const latest = window.CC_INT.getEvents()[0];
      if (!latest) return;
      const stamp = Date.now();
      setSyncToast({ ts: stamp, ...latest });
      setTimeout(() => setSyncToast(t => (t && t.ts === stamp) ? null : t), 5200);
    });
  }, []);

  React.useEffect(() => setRoute(t.route), [t.route]);
  React.useEffect(() => setView(t.view),   [t.view]);

  const apps = window.CC_DATA.APPS;

  // search filter (applies to dashboard only)
  const matched = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return apps;
    return apps.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.description.toLowerCase().includes(term) ||
      a.category.toLowerCase().includes(term) ||
      window.CC_DATA.CATEGORIES[a.category]?.label.toLowerCase().includes(term) ||
      a.api_dependencies.some(d => d.toLowerCase().includes(term)) ||
      (a.github_repo && a.github_repo.toLowerCase().includes(term))
    );
  }, [q, apps]);

  const attentionCount = React.useMemo(() =>
    apps.reduce((n, a) => n + window.CC_DATA.getIssues(a).length, 0),
    [apps]
  );

  if (noteContext) {
    return <NotePage slug={noteContext.slug} noteId={noteContext.noteId} onClose={closeFull}/>;
  }

  if (intRoute) {
    return <IntegrationPage
      onClose={() => setIntRoute(false)}
      onOpenDetail={(a) => { setIntRoute(false); setDetailApp(a); }}
    />;
  }

  if (detailApp) {
    return <>
      <AppDetailPage
        app={detailApp}
        onClose={() => setDetailApp(null)}
        onOpenNotes={openNotes}
        onOpenNote={openFull}
        onOpenIntegration={() => setIntRoute(true)}
      />
      {notesApp && (
        <NotesModal app={notesApp} onClose={() => setNotesApp(null)} onOpenFull={openFull}/>
      )}
      <SyncToast event={syncToast} onClose={() => setSyncToast(null)} onOpen={(slug) => {
        const a = window.CC_DATA.APPS.find(x => x.slug === slug);
        if (a) setDetailApp(a);
      }}/>
    </>;
  }

  if (route === "showcase") {
    return (
      <div style={{ minHeight: "100vh", background: "#fff" }}>
        <PublicHeader onSwitchRoute={() => { setRoute("dashboard"); setTweak({ route: "dashboard" }); }}/>
        <ShowcaseView apps={apps}/>
        <PublicFooter/>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 80 }}>
      <DashHeader
        headerStyle={t.headerStyle}
        attentionCount={t.showAttentionBadge ? attentionCount : 0}
        onSwitchRoute={() => { setRoute("showcase"); setTweak({ route: "showcase" }); }}
        onOpenIntegration={() => setIntRoute(true)}
        q={q} setQ={setQ}
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px 0" }}>
        <ViewSwitcher view={view} setView={(v) => { setView(v); setTweak({ view: v }); }} attentionCount={attentionCount}/>
        <div style={{ height: 18 }}/>
        {view === "grid"      && <GridView      apps={matched} density={t.density} onOpenNotes={openNotes} onOpenDetail={openDetail}/>}
        {view === "pipeline"  && <PipelineView  apps={matched} onOpenNotes={openNotes} onOpenDetail={openDetail}/>}
        {view === "attention" && <AttentionView apps={matched} onOpenNotes={openNotes} onOpenDetail={openDetail}/>}
      </div>

      {notesApp && (
        <NotesModal
          app={notesApp}
          onClose={() => setNotesApp(null)}
          onOpenFull={openFull}
        />
      )}

      <SyncToast event={syncToast} onClose={() => setSyncToast(null)} onOpen={(slug) => {
        const a = window.CC_DATA.APPS.find(x => x.slug === slug);
        if (a) setDetailApp(a);
      }}/>
    </div>
  );
}


/* ─── Dashboard header (navy or minimal) ──────────────────────────── */
function DashHeader({ headerStyle, attentionCount, onSwitchRoute, q, setQ, onOpenIntegration }) {
  const isNavy = headerStyle === "navy";
  return (
    <header style={{
      background: isNavy ? CC.NAVY : "#fff",
      color: isNavy ? "#fff" : CC.INK,
      borderBottom: isNavy ? "none" : `1px solid ${CC.HAIR}`,
      position: "sticky", top: 0, zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "14px 28px",
        display: "flex", alignItems: "center", gap: 18,
      }}>
        {/* logo block */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <Mark dark={isNavy}/>
          <div style={{
            paddingLeft: 12,
            borderLeft: `1px solid ${isNavy ? "rgba(255,255,255,0.18)" : CC.HAIR}`,
            lineHeight: 1.1,
          }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Command Center</div>
            <div style={{
              fontSize: 10.5, color: isNavy ? "rgba(255,255,255,0.55)" : CC.MUTED,
              fontFamily: "'Space Mono', monospace", letterSpacing: ".06em",
              marginTop: 2,
            }}>hub.cappsapps.ai</div>
          </div>
        </div>

        {/* search */}
        <div style={{ flex: 1, maxWidth: 520, position: "relative" }}>
          <input
            placeholder="Search apps, APIs, repos…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              width: "100%", padding: "9px 14px 9px 34px",
              background: isNavy ? "rgba(255,255,255,0.08)" : "#fff",
              border: `1px solid ${isNavy ? "rgba(255,255,255,0.15)" : CC.HAIR}`,
              color: isNavy ? "#fff" : CC.INK,
              borderRadius: 8, fontSize: 13.5, outline: "none",
              fontFamily: "inherit",
            }}/>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: isNavy ? "rgba(255,255,255,0.5)" : CC.MUTED_2, fontSize: 13,
          }}>⌕</span>
        </div>

        {/* right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10.5,
            color: isNavy ? "rgba(255,255,255,0.5)" : CC.MUTED_2,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: CC.H_HEALTHY,
            }}/>
            polled 12m ago
          </div>
          <button onClick={onOpenIntegration} title="Claude Code integration" style={{
            background: "transparent",
            border: `1px solid ${isNavy ? "rgba(255,255,255,0.25)" : CC.HAIR}`,
            color: isNavy ? "#fff" : CC.INK,
            padding: "6px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: CC.H_HEALTHY,
              boxShadow: `0 0 0 0 ${CC.H_HEALTHY}55`,
              animation: "ccConnPulse 2s ease-out infinite",
            }}/>
            Claude Code
          </button>
          <button onClick={onSwitchRoute} style={{
            background: "transparent",
            border: `1px solid ${isNavy ? "rgba(255,255,255,0.25)" : CC.HAIR}`,
            color: isNavy ? "#fff" : CC.INK,
            padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>View public showcase ↗</button>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 10px 5px 6px",
            border: `1px solid ${isNavy ? "rgba(255,255,255,0.15)" : CC.HAIR}`,
            borderRadius: 999,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 999, background: "#E99A3F",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 11, color: "#1F1F1F",
            }}>AC</span>
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>adam@re-dry.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Mark({ dark }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: dark ? "#fff" : CC.NAVY,
      display: "grid", placeItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* CC monogram: navy/white square + small accent dot */}
      <span style={{
        fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em",
        color: dark ? CC.NAVY : "#fff", fontFamily: "'DM Sans', sans-serif",
      }}>CC</span>
      <span style={{
        position: "absolute", right: 4, bottom: 4,
        width: 6, height: 6, borderRadius: 999, background: "#00BD70",
      }}/>
    </div>
  );
}


/* ─── View switcher ───────────────────────────────────────────────── */
function ViewSwitcher({ view, setView, attentionCount }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 14, flexWrap: "wrap",
    }}>
      <div style={{
        display: "inline-flex",
        background: CC.SURFACE_2, border: `1px solid ${CC.HAIR}`,
        borderRadius: 10, padding: 4,
      }}>
        {VIEWS.map(v => {
          const active = view === v.id;
          const showBadge = v.id === "attention" && attentionCount > 0;
          return (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              background: active ? "#fff" : "transparent",
              border: "none", padding: "8px 14px",
              borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
              color: active ? CC.INK : CC.MUTED, fontSize: 13, fontWeight: active ? 700 : 500,
              boxShadow: active ? "0 1px 3px rgba(15,23,42,.06)" : "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "all .12s",
            }}>
              {v.label}
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: active ? CC.MUTED : CC.MUTED_2, fontWeight: 500,
              }}>{v.sub}</span>
              {showBadge && (
                <span style={{
                  background: CC.H_BROKEN, color: "#fff",
                  borderRadius: 999, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", minWidth: 18, textAlign: "center",
                }}>{attentionCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <Legend/>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: CC.H_HEALTHY, label: "Healthy" },
    { color: CC.H_WARN,    label: "Warning" },
    { color: CC.H_BROKEN,  label: "Broken" },
    { color: CC.H_STALE,   label: "Stale" },
  ];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {items.map(i => (
        <div key={i.label} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: 999, background: i.color,
          }}/>
          {i.label}
        </div>
      ))}
    </div>
  );
}


/* ─── Public showcase chrome ──────────────────────────────────────── */
function PublicHeader({ onSwitchRoute }) {
  return (
    <header style={{
      borderBottom: `1px solid ${CC.HAIR}`, background: "#fff",
      position: "sticky", top: 0, zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mark dark={false}/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: CC.INK }}>Capps Apps</div>
            <div style={{
              fontSize: 10.5, color: CC.MUTED, fontFamily: "'Space Mono', monospace",
              letterSpacing: ".06em",
            }}>portfolio · cappsapps.ai</div>
          </div>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="#" style={navLink}>Portfolio</a>
          <a href="#" style={navLink}>Stack</a>
          <a href="https://cappsapps.ai" target="_blank" rel="noopener" style={navLink}>Consulting</a>
          <button onClick={onSwitchRoute} style={{
            background: CC.NAVY, color: "#fff", border: "none",
            padding: "8px 14px", borderRadius: 6, fontFamily: "inherit",
            fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>Sign in</button>
        </nav>
      </div>
    </header>
  );
}

const navLink = {
  fontSize: 13, color: CC.MUTED, textDecoration: "none", fontWeight: 500,
};

function PublicFooter() {
  return (
    <footer style={{
      borderTop: `1px solid ${CC.HAIR}`, background: "#fff",
      padding: "28px 24px", marginTop: 40,
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 16, flexWrap: "wrap",
        fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED,
      }}>
        <div>© 2026 Capps Apps · adam capps</div>
        <div>Status updates every 6h · last sync 12m ago</div>
      </div>
    </footer>
  );
}


/* ─── Tweaks panel ────────────────────────────────────────────────── */
function CCTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Routing"/>
      <TweakRadio label="Route" value={t.route}
        options={[
          { label: "Dashboard", value: "dashboard" },
          { label: "Showcase",  value: "showcase" },
        ]}
        onChange={v => setTweak({ route: v })}/>
      <TweakSelect label="Default view" value={t.view}
        options={[
          { label: "Grid",            value: "grid" },
          { label: "Pipeline",        value: "pipeline" },
          { label: "Needs Attention", value: "attention" },
        ]}
        onChange={v => setTweak({ view: v })}/>

      <TweakSection label="Layout"/>
      <TweakRadio label="Density" value={t.density}
        options={[
          { label: "Comfy",   value: "comfortable" },
          { label: "Compact", value: "compact" },
        ]}
        onChange={v => setTweak({ density: v })}/>
      <TweakRadio label="Header" value={t.headerStyle}
        options={[
          { label: "Navy",    value: "navy" },
          { label: "Minimal", value: "minimal" },
        ]}
        onChange={v => setTweak({ headerStyle: v })}/>
      <TweakToggle label="Attention badge" value={t.showAttentionBadge}
        onChange={v => setTweak({ showAttentionBadge: v })}/>
    </TweaksPanel>
  );
}


/* ─── boot ────────────────────────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.Fragment>
    <App/>
    <CCTweaks/>
  </React.Fragment>
);
