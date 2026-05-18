/* The three dashboard views: Grid, Pipeline, Needs Attention. */

/* ─── GRID VIEW ─────────────────────────────────────────────────────── */
function GridView({ apps, density, onOpenNotes, onOpenDetail }) {
  const [tab, setTab] = React.useState("all");
  const cats = Object.values(window.CC_DATA.CATEGORIES);
  const counts = {};
  apps.forEach(a => { counts[a.category] = (counts[a.category]||0) + 1; });
  const filtered = tab === "all" ? apps : apps.filter(a => a.category === tab);

  // group by category when "all"
  const sections = tab === "all"
    ? cats.map(c => ({ cat: c, items: apps.filter(a => a.category === c.id) }))
        .filter(s => s.items.length)
    : [{ cat: window.CC_DATA.CATEGORIES[tab], items: filtered }];

  return (
    <div>
      {/* category tab strip */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap",
        borderBottom: `1px solid ${CC.HAIR}`, paddingBottom: 0,
      }}>
        {[{ id:"all", label:"All", count: apps.length }, ...cats.map(c => ({ id: c.id, label: c.label, count: counts[c.id]||0 }))].map(t => {
          const active = tab === t.id;
          const accent = t.id === "all" ? CC.NAVY : (CC.CATS[t.id]?.accent || CC.NAVY);
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "10px 14px 12px", fontFamily: "inherit",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? CC.INK : CC.MUTED,
                borderBottom: `2px solid ${active ? accent : "transparent"}`,
                marginBottom: -1, display: "flex", alignItems: "center", gap: 7,
              }}>
              {t.label}
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11,
                color: active ? accent : CC.MUTED_2,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {sections.map(({ cat, items }) => (
        <section key={cat.id} style={{ marginBottom: 36 }}>
          {tab === "all" && <SectionHeader cat={cat} count={items.length}/>}
          <div style={{
            display: "grid",
            gridTemplateColumns: density === "compact"
              ? "repeat(auto-fill, minmax(240px, 1fr))"
              : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {items.map(app => <AppCard key={app.slug} app={app} density={density} onOpenNotes={onOpenNotes} onOpen={onOpenDetail}/>)}
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionHeader({ cat, count }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      marginBottom: 12, paddingBottom: 6,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: 2,
        background: cat.accent, display: "inline-block",
      }}/>
      <h3 style={{
        margin: 0, fontSize: 13, fontWeight: 700, color: CC.INK,
        textTransform: "uppercase", letterSpacing: ".08em",
      }}>{cat.label}</h3>
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
      }}>{String(count).padStart(2,"0")}</span>
      <div style={{ flex: 1, height: 1, background: CC.HAIR_2 }}/>
    </div>
  );
}


/* ─── PIPELINE VIEW ─────────────────────────────────────────────────── */
function PipelineView({ apps, onOpenNotes, onOpenDetail }) {
  const [filterCat, setFilterCat] = React.useState("all");
  const stages = window.CC_DATA.STAGES;
  const cats = Object.values(window.CC_DATA.CATEGORIES);
  const visible = filterCat === "all" ? apps : apps.filter(a => a.category === filterCat);

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18, flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{id:"all", label:"All categories"}, ...cats].map(c => {
            const active = filterCat === c.id;
            const accent = c.id === "all" ? CC.NAVY : c.accent;
            return (
              <button key={c.id} onClick={() => setFilterCat(c.id)}
                style={{
                  background: active ? accent : "#fff",
                  color: active ? "#fff" : CC.MUTED,
                  border: `1px solid ${active ? accent : CC.HAIR}`,
                  padding: "5px 10px", borderRadius: 999,
                  fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}>{c.label || c.id}</button>
            );
          })}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
        }}>{visible.length} apps · {stages.length} stages</div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stages.length}, minmax(160px, 1fr))`,
        gap: 10, alignItems: "stretch",
        overflowX: "auto", paddingBottom: 6,
      }}>
        {stages.map(stage => {
          const items = visible.filter(a => a.stage === stage);
          const tint = STAGE_TINT[stage];
          return (
            <div key={stage} style={{
              background: CC.SURFACE_2,
              border: `1px solid ${CC.HAIR}`,
              borderRadius: 8, minHeight: 360, padding: 8,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "4px 4px 8px", borderBottom: `1px solid ${CC.HAIR}`, marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 999, background: tint, display: "inline-block",
                  }}/>
                  <span style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    color: CC.INK, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700,
                  }}>{window.CC_DATA.STAGE_LABEL[stage]}</span>
                </div>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, color: CC.MUTED_2,
                }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {items.map(a => <PipelineCard key={a.slug} app={a}
                  onSelect={() => onOpenDetail?.(a)} />)}
                {items.length === 0 && (
                  <div style={{
                    border: `1px dashed ${CC.HAIR}`, borderRadius: 6, padding: 12,
                    fontSize: 11, color: CC.MUTED_2, textAlign: "center",
                  }}>empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({ app, onSelect }) {
  const cat = CC.CATS[app.category];
  return (
    <div onClick={onSelect} style={{
      background: "#fff",
      border: `1px solid ${CC.HAIR}`,
      borderRadius: 6, padding: "8px 10px",
      cursor: "pointer",
      borderLeft: `3px solid ${cat.accent}`,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: CC.INK,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          minWidth: 0, flex: 1,
        }}>{app.name}</div>
        <HealthDot score={app.status.health_score}/>
      </div>
      {app.next_move && (
        <div style={{
          marginTop: 4, fontSize: 10.5, color: CC.MUTED, lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>→ {app.next_move}</div>
      )}
    </div>
  );
}

function DetailDrawer({ app, onClose, onOpenNotes }) {
  const cat = CC.CATS[app.category];
  const issues = window.CC_DATA.getIssues(app);
  return (
    <div style={{
      position: "fixed", right: 16, bottom: 16, width: 380, maxWidth: "calc(100vw - 32px)",
      background: "#fff", border: `1px solid ${CC.HAIR}`,
      borderRadius: 10, boxShadow: "0 20px 50px rgba(15,23,42,.15)",
      padding: 16, zIndex: 50,
      animation: "ccSlideUp .2s ease-out",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <HealthDot score={app.status.health_score}/>
            <div style={{ fontWeight: 700, color: CC.INK, fontSize: 15 }}>{app.name}</div>
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED,
            marginTop: 2,
          }}>{shortHost(app.live_url) || "no live url"}</div>
        </div>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: CC.MUTED,
          fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4,
        }}>×</button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <CategoryPill cat={app.category}/>
        <StagePill stage={app.stage}/>
        <HostingMark hosting={app.hosting}/>
        {onOpenNotes && <NotesButton app={app} onOpen={onOpenNotes}/>}
      </div>

      <DetailRow label="NEXT MOVE" value={app.next_move || "—"}/>
      {app.blockers && <DetailRow label="BLOCKERS" value={app.blockers} accent="#D64545"/>}
      <DetailRow label="LAST COMMIT" value={
        app.status.last_commit_at
          ? `${relDate(app.status.last_commit_at)} · ${app.status.last_commit_msg || ""}`
          : "no commits"
      }/>
      <DetailRow label="REPO" value={app.github_repo ? `github.com/${app.github_repo}` : "—"} mono/>
      <DetailRow label="API DEPS" value={app.api_dependencies.length ? app.api_dependencies.join(", ") : "none"} mono/>
      {issues.length > 0 && (
        <div style={{
          marginTop: 12, padding: 10, background: "#FFF6E6",
          border: "1px solid #F5C77A", borderRadius: 6,
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: "#8A5A00", letterSpacing: ".08em", marginBottom: 4,
          }}>{issues.length} ISSUE{issues.length > 1 ? "S" : ""}</div>
          {issues.map((i, idx) => (
            <div key={idx} style={{ fontSize: 12, color: CC.INK, marginTop: 2 }}>· {i.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, accent }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10,
        color: accent || CC.MUTED_2, letterSpacing: ".08em", marginBottom: 2,
      }}>{label}</div>
      <div style={{
        fontSize: 12.5, color: CC.INK,
        fontFamily: mono ? "'Space Mono', monospace" : "inherit",
        wordBreak: "break-word",
      }}>{value}</div>
    </div>
  );
}


/* ─── NEEDS ATTENTION VIEW ─────────────────────────────────────────── */
function AttentionView({ apps, onOpenNotes, onOpenDetail }) {
  const [resolved, setResolved] = React.useState(new Set());

  // Flatten: [{ app, issue }]
  const items = [];
  apps.forEach(a => {
    window.CC_DATA.getIssues(a).forEach((iss, idx) => {
      const key = `${a.slug}::${iss.kind}::${idx}`;
      if (!resolved.has(key)) items.push({ app: a, issue: iss, key });
    });
  });
  items.sort((a,b) => a.issue.severity - b.issue.severity);

  const buckets = {
    broken:  items.filter(i => i.issue.kind === "broken"),
    drift:   items.filter(i => i.issue.kind === "drift"),
    blocker: items.filter(i => i.issue.kind === "blocker"),
    slow:    items.filter(i => i.issue.kind === "slow"),
    stalled: items.filter(i => i.issue.kind === "stalled"),
  };

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10,
        marginBottom: 22,
      }}>
        <SummaryStat n={buckets.broken.length}  label="Broken"  color={CC.H_BROKEN}/>
        <SummaryStat n={buckets.drift.length}   label="Drift"   color={CC.H_WARN}/>
        <SummaryStat n={buckets.blocker.length} label="Blocked" color={CC.NAVY}/>
        <SummaryStat n={buckets.slow.length}    label="Slow"    color="#A855F7"/>
        <SummaryStat n={buckets.stalled.length} label="Stalled" color={CC.H_STALE}/>
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", color: CC.MUTED,
          border: `1px dashed ${CC.HAIR}`, borderRadius: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: CC.INK }}>All clear.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Next poll in ~6h.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(({ app, issue, key }) => (
            <IssueRow key={key} app={app} issue={issue}
              onResolve={() => setResolved(r => new Set([...r, key]))}
              onOpenNotes={onOpenNotes}
              onOpenDetail={onOpenDetail}/>
          ))}
        </div>
      )}

      {resolved.size > 0 && (
        <div style={{
          marginTop: 24, fontFamily: "'Space Mono', monospace", fontSize: 11,
          color: CC.MUTED_2, textAlign: "right",
        }}>
          {resolved.size} resolved this session ·{" "}
          <button onClick={() => setResolved(new Set())} style={{
            background: "transparent", border: "none", color: CC.NAVY,
            cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", fontSize: 11,
          }}>undo</button>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ n, label, color }) {
  return (
    <div style={{
      border: `1px solid ${CC.HAIR}`, borderRadius: 8, padding: 14,
      background: "#fff",
    }}>
      <div style={{
        fontSize: 26, fontWeight: 700, color: n > 0 ? color : CC.MUTED_2,
        lineHeight: 1, letterSpacing: "-0.02em",
      }}>{String(n).padStart(2,"0")}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10,
        color: CC.MUTED, marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase",
      }}>{label}</div>
    </div>
  );
}

function IssueRow({ app, issue, onResolve, onOpenNotes, onOpenDetail }) {
  const cat = CC.CATS[app.category];
  const kindColor = {
    broken: CC.H_BROKEN, drift: CC.H_WARN, blocker: CC.NAVY,
    slow: "#A855F7", stalled: CC.H_STALE,
  }[issue.kind] || CC.MUTED;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
      alignItems: "center", gap: 14,
      background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 8,
      padding: "12px 14px",
      borderLeft: `3px solid ${kindColor}`,
    }}>
      {/* kind tag */}
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10,
        color: kindColor, textTransform: "uppercase", letterSpacing: ".08em",
        fontWeight: 700, minWidth: 64,
      }}>{issue.kind}</div>

      {/* body */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
        }}>
          <button onClick={() => onOpenDetail?.(app)} style={{
            background: "transparent", border: "none", padding: 0, cursor: "pointer",
            fontFamily: "inherit", fontWeight: 700, color: CC.INK, fontSize: 13.5,
            textAlign: "left",
          }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          >{app.name}</button>
          <span style={{
            fontSize: 11, color: cat.accent, fontWeight: 600,
          }}>{window.CC_DATA.CATEGORIES[app.category].label}</span>
        </div>
        <div style={{ fontSize: 12.5, color: CC.INK, marginTop: 2 }}>{issue.title}</div>
        {issue.detail && (
          <div style={{
            fontSize: 11.5, color: CC.MUTED, marginTop: 2,
            fontFamily: issue.kind === "broken" ? "'Space Mono', monospace" : "inherit",
          }}>{issue.detail}</div>
        )}
        <div style={{
          fontSize: 11.5, color: CC.MUTED, marginTop: 4,
          fontStyle: "italic",
        }}>→ {issue.action}</div>
      </div>

      {/* meta */}
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
        textAlign: "right", minWidth: 80,
      }}>
        {app.status.url_status != null && <div>http {app.status.url_status}</div>}
        {app.status.last_commit_at && <div>{relDate(app.status.last_commit_at)}</div>}
      </div>

      {/* notes */}
      {onOpenNotes && <NotesButton app={app} onOpen={onOpenNotes}/>}

      {/* resolve */}
      <button onClick={onResolve} style={{
        background: "transparent", border: `1px solid ${CC.HAIR}`,
        color: CC.MUTED, padding: "6px 10px", borderRadius: 6,
        fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer",
        whiteSpace: "nowrap",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = CC.NAVY; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = CC.NAVY; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = CC.MUTED; e.currentTarget.style.borderColor = CC.HAIR; }}
      >Mark resolved</button>
    </div>
  );
}

Object.assign(window, { GridView, PipelineView, AttentionView });
