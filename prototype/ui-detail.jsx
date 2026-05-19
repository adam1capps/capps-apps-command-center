/* AppDetailPage — full-page mission control for one app.
 *
 * Replaces the dashboard when an app card is clicked. Shows every signal
 * the Command Center has: live status, deploys, commits, database schema,
 * Claude Code plan, API usage, traffic, hosting, notes.
 */

function AppDetailPage({ app, onClose, onOpenNotes, onOpenNote, onOpenIntegration }) {
  const cat = CC.CATS[app.category];
  const issues = window.CC_DATA.getIssues(app);
  const intel = React.useMemo(() => window.CC_INTEL.intelFor(app), [app.slug]);
  const notes = window.CC_NOTES.getFor(app.slug);

  const [draft, setDraft] = React.useState(app.next_move || "");
  const [editingNext, setEditingNext] = React.useState(false);
  const [planLocal, setPlanLocal] = React.useState(intel.plan);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveNext = () => { app.next_move = draft.trim() || null; setEditingNext(false); };
  const togglePlan = (id) => setPlanLocal(p => p.map(x => x.id === id ? { ...x, done: !x.done } : x));

  const planRemaining = planLocal.filter(p => !p.done).length;
  const planDone      = planLocal.length - planRemaining;
  const lastDeploy    = intel.deploys[0];

  return (
    <div style={{ minHeight: "100vh", background: CC.SURFACE_2, animation: "ccFade .14s ease-out" }}>

      {/* ─── Sticky top bar ─────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, background: "#fff", zIndex: 30,
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
            display: "flex", alignItems: "center", gap: 10, minWidth: 0,
            fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: CC.MUTED,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2, background: cat.accent,
            }}/>
            <span>{window.CC_DATA.CATEGORIES[app.category].label}</span>
            <span>/</span>
            <span style={{ color: CC.INK, fontWeight: 700 }}>{app.name}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => onOpenNotes(app)} style={pillBtn()}>
              <NoteGlyph size={11}/> Notes
              {notes.length > 0 && <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, color: CC.MUTED,
              }}>{notes.length}</span>}
            </button>
            {app.github_repo && (
              <a href={`https://github.com/${app.github_repo}`} target="_blank" rel="noopener" style={pillBtn(true)}>
                Repo ↗
              </a>
            )}
            {app.live_url ? (
              <a href={app.live_url} target="_blank" rel="noopener" style={launchBtn(cat)}>
                Launch
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>↗</span>
              </a>
            ) : (
              <span style={{ ...launchBtn(cat), opacity: .45, cursor: "not-allowed", background: CC.MUTED_2 }}>
                No live URL
              </span>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px 80px" }}>

        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          }}>
            <HealthDot score={app.status.health_score} size={10} pulse/>
            <StagePill stage={app.stage}/>
            <CategoryPill cat={app.category}/>
            <HostingMark hosting={app.hosting}/>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
              marginLeft: "auto",
            }}>polled {relDate(app.status.checked_at)}</span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 32, fontWeight: 700, color: CC.INK,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>{app.name}</h1>
          <p style={{
            margin: "8px 0 0", fontSize: 16, color: CC.MUTED, lineHeight: 1.5,
            maxWidth: 720,
          }}>{app.description}</p>
          {app.live_url && (
            <a href={app.live_url} target="_blank" rel="noopener" style={{
              marginTop: 10, display: "inline-flex", gap: 6, alignItems: "center",
              fontFamily: "'Space Mono', monospace", fontSize: 12.5, color: cat.primary,
              textDecoration: "none",
            }}>
              {app.live_url} ↗
            </a>
          )}
        </section>

        {/* ─── Issues callout (if any) ─────────────────────────── */}
        {issues.length > 0 && <IssuesBanner issues={issues} cat={cat}/>}

        {/* ─── Quick-stat strip ────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0,
          background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 10,
          overflow: "hidden", marginBottom: 24,
        }}>
          <QuickStat label="HTTP" value={app.status.url_status ?? "—"}
            color={app.status.url_status === 200 ? CC.H_HEALTHY : CC.H_BROKEN}/>
          <QuickStat label="Response" value={app.status.url_response_ms != null ? `${app.status.url_response_ms}ms` : "—"}
            color={app.status.url_response_ms > 1500 ? CC.H_WARN : CC.INK}/>
          <QuickStat label="Commits" value={intel.commits.total || "—"}/>
          <QuickStat label="Tables" value={intel.database?.tables.length || "—"}/>
          <QuickStat label="APIs" value={app.api_dependencies.length || "—"}/>
          <QuickStat label="Notes" value={notes.length} last/>
        </div>

        {/* ─── Row: Next move + Plan summary ───────────────────── */}
        <Row>
          <Card title="Next move" accent={cat.accent}>
            {editingNext ? (
              <input
                autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveNext();
                  if (e.key === "Escape") { setDraft(app.next_move || ""); setEditingNext(false); }
                }}
                onBlur={saveNext}
                style={{
                  width: "100%", padding: "8px 10px",
                  border: `1px solid ${cat.accent}`, borderRadius: 6,
                  fontFamily: "inherit", fontSize: 15, outline: "none",
                  color: CC.INK, background: "#fff",
                }}
              />
            ) : (
              <div onClick={() => setEditingNext(true)} style={{
                fontSize: 16, color: app.next_move ? CC.INK : CC.MUTED_2,
                lineHeight: 1.45, cursor: "text", padding: "4px 0",
                fontStyle: app.next_move ? "normal" : "italic",
              }}>{app.next_move || "click to add"}</div>
            )}
            {app.blockers && (
              <div style={{
                marginTop: 14, padding: "10px 12px", borderRadius: 6,
                background: "#FEE9E9", border: "1px solid #F5C5C5",
              }}>
                <div style={labelMonoSm("#A23434")}>BLOCKER</div>
                <div style={{ fontSize: 13.5, color: CC.INK, marginTop: 2 }}>
                  {app.blockers}
                </div>
              </div>
            )}
          </Card>

          <Card title="Claude Code plan"
            right={<span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED,
            }}>{planDone}/{planLocal.length} done</span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {planLocal.map(p => (
                <label key={p.id} style={{
                  display: "flex", gap: 9, alignItems: "flex-start",
                  cursor: "pointer", padding: "4px 0",
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, marginTop: 3, flex: "none",
                    background: p.done ? cat.accent : "transparent",
                    border: `1.5px solid ${p.done ? cat.accent : CC.MUTED_2}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {p.done && <CheckGlyph color={cat.accent === "#D4E04F" ? "#1F1F1F" : "#fff"}/>}
                  </span>
                  <input type="checkbox" checked={p.done} onChange={() => togglePlan(p.id)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}/>
                  <span onClick={() => togglePlan(p.id)} style={{
                    fontSize: 13.5, color: p.done ? CC.MUTED_2 : CC.INK,
                    textDecoration: p.done ? "line-through" : "none",
                    lineHeight: 1.4,
                  }}>{p.text}</span>
                </label>
              ))}
              {planRemaining === 0 && (
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.H_HEALTHY,
                  marginTop: 6,
                }}>· all clear</div>
              )}
            </div>
          </Card>
        </Row>

        {/* ─── Row: Activity timeline + Repository ─────────────── */}
        <Row>
          <Card title="Activity">
            <ActivityFeed app={app} intel={intel}/>
          </Card>
          <Card title="Repository"
            right={app.github_repo && (
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED,
              }}>github.com/{app.github_repo}</span>
            )}>
            <RepositoryPanel intel={intel} app={app}/>
          </Card>
        </Row>

        {/* ─── Row: Database + Hosting ─────────────────────────── */}
        <Row>
          <Card title="Database"
            right={intel.database && <span style={labelMonoSm()}>NEON · {intel.database.region}</span>}>
            <DatabasePanel db={intel.database}/>
          </Card>
          <Card title="Hosting"
            right={intel.hosting && <span style={labelMonoSm()}>{intel.hosting.provider.toUpperCase()}</span>}>
            <HostingPanel hosting={intel.hosting} deploys={intel.deploys}/>
          </Card>
        </Row>

        {/* ─── Row: API usage + Traffic ───────────────────────── */}
        <Row>
          <Card title="API usage · 24h">
            <ApiUsagePanel rows={intel.api_usage}/>
          </Card>
          <Card title="Traffic · 7d">
            <TrafficPanel t={intel.traffic} cat={cat}/>
          </Card>
        </Row>

        {/* ─── Claude Code integration ─────────────────────────── */}
        <Card title="Claude Code integration"
          right={<ConnectionDot connected={!!app.github_repo} label={app.github_repo ? "connected" : "not linked"}/>}>
          <IntegrationCard app={app} onOpenGlobal={onOpenIntegration}/>
        </Card>

        <div style={{ height: 16 }}/>

        {/* ─── Notes preview ──────────────────────────────────── */}
        <Card title="Notes & instructions"
          right={
            <button onClick={() => onOpenNotes(app)} style={miniBtn()}>
              View all ({notes.length})
            </button>
          }>
          {notes.length === 0 ? (
            <div style={{ fontSize: 13, color: CC.MUTED_2, fontStyle: "italic", padding: "6px 0" }}>
              No notes yet. Use the Notes button to add one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {notes.slice(0, 4).map(n => {
                const m = KIND_META[n.kind];
                return (
                  <button key={n.id} onClick={() => onOpenNote(app.slug, n.id)} style={{
                    background: "transparent", border: `1px solid ${CC.HAIR}`,
                    borderRadius: 7, padding: "10px 12px", cursor: "pointer",
                    fontFamily: "inherit", textAlign: "left",
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9.5, fontWeight: 700,
                      color: m.color, background: m.tint,
                      padding: "2px 6px", borderRadius: 4,
                      textTransform: "uppercase", letterSpacing: ".05em",
                      marginTop: 2, whiteSpace: "nowrap", flex: "none",
                    }}>{m.label}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: 13.5, color: CC.INK,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{n.title}</div>
                      <div style={{
                        fontSize: 12.5, color: CC.MUTED, marginTop: 2, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>{n.body || "(empty)"}</div>
                    </div>
                  </button>
                );
              })}
              {notes.length > 4 && (
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
                  textAlign: "center", padding: "4px 0",
                }}>+ {notes.length - 4} more</div>
              )}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}


/* ─── shared bits ──────────────────────────────────────────────── */
function Row({ children }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
      marginBottom: 16,
    }}>{children}</div>
  );
}

function Card({ title, right, accent, children }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${CC.HAIR}`, borderRadius: 10,
      padding: "16px 18px", borderTop: accent ? `2px solid ${accent}` : `1px solid ${CC.HAIR}`,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12, gap: 10,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10.5, fontWeight: 700,
          color: CC.INK, textTransform: "uppercase", letterSpacing: ".08em",
        }}>{title}</div>
        {right && <div>{right}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function QuickStat({ label, value, color, last }) {
  return (
    <div style={{
      padding: "16px 16px", borderRight: last ? "none" : `1px solid ${CC.HAIR_2}`,
    }}>
      <div style={{
        fontSize: 22, fontWeight: 700, color: color || CC.INK,
        letterSpacing: "-0.02em", lineHeight: 1,
        fontFamily: typeof value === "number" ? "'Space Mono', monospace" : "inherit",
      }}>{value}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10,
        color: CC.MUTED, marginTop: 7, letterSpacing: ".08em",
        textTransform: "uppercase",
      }}>{label}</div>
    </div>
  );
}

function IssuesBanner({ issues, cat }) {
  return (
    <div style={{
      marginBottom: 24,
      background: "#FFF6E6", border: "1px solid #F5C77A", borderRadius: 10,
      padding: "14px 16px",
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10.5,
        color: "#8A5A00", letterSpacing: ".08em", marginBottom: 8, fontWeight: 700,
      }}>{issues.length} ISSUE{issues.length > 1 ? "S" : ""} REQUIRING ATTENTION</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
        {issues.map((i, idx) => (
          <div key={idx} style={{
            background: "#fff", borderRadius: 6, padding: "10px 12px",
            border: "1px solid #F5DCA0",
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
              color: "#8A5A00", letterSpacing: ".06em", textTransform: "uppercase",
            }}>{i.kind}</div>
            <div style={{ fontSize: 13.5, color: CC.INK, fontWeight: 600, marginTop: 2 }}>{i.title}</div>
            {i.detail && <div style={{ fontSize: 12, color: CC.MUTED, marginTop: 2 }}>{i.detail}</div>}
            <div style={{ fontSize: 12, color: CC.MUTED, marginTop: 4, fontStyle: "italic" }}>→ {i.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckGlyph({ color = "#fff" }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M1 4.5L3.5 7L8 1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function labelMonoSm(color) {
  return {
    fontFamily: "'Space Mono', monospace", fontSize: 9.5, fontWeight: 700,
    color: color || CC.MUTED_2, textTransform: "uppercase", letterSpacing: ".08em",
  };
}

function pillBtn(asLink) {
  const base = {
    background: "#fff", border: `1px solid ${CC.HAIR}`, color: CC.INK,
    padding: "7px 12px", borderRadius: 7,
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none",
  };
  return base;
}
function launchBtn(cat) {
  return {
    background: cat.accent, color: cat.accent === "#D4E04F" ? "#1F1F1F" : "#fff",
    padding: "8px 16px", borderRadius: 7, border: "none",
    fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
  };
}
function miniBtn() {
  return {
    background: "transparent", border: `1px solid ${CC.HAIR}`, color: CC.INK,
    padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
    fontSize: 11.5, fontWeight: 600,
  };
}


/* ─── ActivityFeed ─────────────────────────────────────────────── */
function ActivityFeed({ app, intel }) {
  const items = [];
  // status check at the top (always)
  items.push({
    kind: "check", when: app.status.checked_at,
    text: app.status.url_status
      ? `Status check ${app.status.url_status} · ${app.status.url_response_ms ?? "—"}ms`
      : "Status check skipped (no live URL)",
    color: app.status.url_status === 200 ? CC.H_HEALTHY
      : app.status.url_status ? CC.H_BROKEN : CC.MUTED_2,
  });
  intel.deploys.slice(0, 3).forEach(d => items.push({
    kind: "deploy", when: d.when,
    text: `Deploy ${d.status} · ${d.branch} @ ${d.sha} · ${d.duration_s}s`,
    color: d.status === "succeeded" ? CC.H_HEALTHY : CC.H_BROKEN,
  }));
  if (app.status.last_commit_at) {
    items.push({
      kind: "commit", when: app.status.last_commit_at,
      text: `Commit · ${app.status.last_commit_msg || "—"}`,
      color: "#6B4DE0",
    });
  }
  items.sort((a, b) => new Date(b.when) - new Date(a.when));

  if (items.length === 0) {
    return <Empty text="No recorded activity."/>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {items.slice(0, 8).map((it, idx) => (
        <div key={idx} style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          padding: "8px 0",
          borderBottom: idx < Math.min(items.length, 8) - 1 ? `1px solid ${CC.HAIR_2}` : "none",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: it.color,
            flex: "none", marginTop: 7,
          }}/>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: CC.INK }}>{it.text}</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
              marginTop: 2,
            }}>{relDate(it.when)} · {it.kind}</div>
          </div>
        </div>
      ))}
    </div>
  );
}


/* ─── RepositoryPanel ──────────────────────────────────────────── */
function RepositoryPanel({ intel, app }) {
  if (!app.github_repo) return <Empty text="No repository linked (drift)."/>;
  const { commits, languages, contributors } = intel;
  const max = Math.max(...commits.weekly, 1);

  return (
    <div>
      {/* commit sparkline */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 3, height: 56,
        marginBottom: 10,
      }}>
        {commits.weekly.map((v, i) => (
          <div key={i} style={{
            flex: 1, height: `${(v / max) * 100}%`, minHeight: 2,
            background: i === commits.weekly.length - 1 ? CC.NAVY : `${CC.NAVY}55`,
            borderRadius: 2,
          }} title={`${v} commits`}/>
        ))}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED_2,
        marginBottom: 14,
      }}>
        <span>12 weeks ago</span>
        <span>{commits.total} commits total · {contributors} contributor{contributors !== 1 ? "s" : ""}</span>
        <span>this week</span>
      </div>

      {/* language bar */}
      {languages.length > 0 && (
        <>
          <div style={labelMonoSm()}>Languages</div>
          <div style={{
            display: "flex", height: 8, borderRadius: 3, overflow: "hidden",
            marginTop: 6, marginBottom: 8, border: `1px solid ${CC.HAIR_2}`,
          }}>
            {languages.map((l, idx) => (
              <div key={l.name} style={{
                width: `${l.pct}%`,
                background: ["#1E2C55", "#00BD70", "#E99A3F", "#6B4DE0"][idx] || CC.MUTED_2,
              }} title={`${l.name} ${l.pct}%`}/>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {languages.map((l, idx) => (
              <span key={l.name} style={{
                fontSize: 11.5, color: CC.MUTED, display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: ["#1E2C55", "#00BD70", "#E99A3F", "#6B4DE0"][idx] || CC.MUTED_2,
                }}/>
                {l.name} <span style={{ fontFamily: "'Space Mono', monospace", color: CC.MUTED_2 }}>{l.pct}%</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


/* ─── DatabasePanel ────────────────────────────────────────────── */
function DatabasePanel({ db }) {
  if (!db) return <Empty text="No database connected to this app."/>;
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 10, gap: 8,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 12.5, color: CC.INK, fontWeight: 700,
        }}>{db.name}</div>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.MUTED_2,
        }}>{db.total_rows.toLocaleString()} rows · {db.size_mb}MB</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {db.tables.map(t => (
          <div key={t.name} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 8px", background: CC.SURFACE_2, borderRadius: 4,
            fontFamily: "'Space Mono', monospace", fontSize: 12,
          }}>
            <span style={{ color: CC.INK }}>{t.name}</span>
            <span style={{ color: CC.MUTED_2, fontSize: 11 }}>{t.rows.toLocaleString()} rows · {relDate(t.last_write.toISOString())}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <a href="https://console.neon.tech" target="_blank" rel="noopener" style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: CC.NAVY, textDecoration: "none",
        }}>Open in Neon console ↗</a>
      </div>
    </div>
  );
}


/* ─── HostingPanel ─────────────────────────────────────────────── */
function HostingPanel({ hosting, deploys }) {
  if (!hosting) return <Empty text="No hosting configured."/>;
  return (
    <div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 12, color: CC.INK, marginBottom: 8,
      }}>
        <div>provider · {hosting.provider}</div>
        <div>branch   · {hosting.branch}</div>
        <div>build    · {hosting.build_cmd}</div>
        <div>ssl      · expires {relDate(hosting.ssl_expires.toISOString())}</div>
      </div>

      <div style={{ ...labelMonoSm(), marginTop: 12, marginBottom: 6 }}>Recent deploys</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {deploys.slice(0, 4).map((d, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "5px 8px", background: CC.SURFACE_2, borderRadius: 4,
            fontFamily: "'Space Mono', monospace", fontSize: 11,
          }}>
            <span style={{ display: "inline-flex", gap: 8 }}>
              <span style={{
                width: 5, height: 5, borderRadius: 999, marginTop: 5, flex: "none",
                background: d.status === "succeeded" ? CC.H_HEALTHY : CC.H_BROKEN,
              }}/>
              <span style={{ color: CC.INK }}>{d.branch} · {d.sha}</span>
            </span>
            <span style={{ color: CC.MUTED_2 }}>{relDate(d.when.toISOString())}</span>
          </div>
        ))}
      </div>

      <div style={{ ...labelMonoSm(), marginTop: 12, marginBottom: 6 }}>Env vars ({hosting.env_var_names.length})</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {hosting.env_var_names.map(n => (
          <span key={n} style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10.5,
            color: CC.MUTED, background: CC.SURFACE_2,
            padding: "2px 6px", borderRadius: 3, border: `1px solid ${CC.HAIR}`,
          }}>{n}</span>
        ))}
      </div>
    </div>
  );
}


/* ─── ApiUsagePanel ───────────────────────────────────────────── */
function ApiUsagePanel({ rows }) {
  if (rows.length === 0) return <Empty text="No external APIs."/>;
  const max = Math.max(...rows.map(r => r.calls), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {rows.map(r => (
        <div key={r.name}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12.5, marginBottom: 3,
          }}>
            <span style={{ color: CC.INK, fontWeight: 600 }}>{r.name}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", color: CC.MUTED }}>
              {r.calls.toLocaleString()} calls
              {r.fails > 0 && <span style={{ color: CC.H_BROKEN }}> · {r.fails} fails</span>}
              <span style={{ color: CC.MUTED_2 }}> · p95 {r.p95_ms}ms</span>
            </span>
          </div>
          <div style={{
            height: 6, background: CC.HAIR_2, borderRadius: 3, overflow: "hidden",
          }}>
            <div style={{
              width: `${(r.calls / max) * 100}%`, height: "100%",
              background: r.fails > 0 ? CC.H_WARN : CC.NAVY,
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}


/* ─── TrafficPanel ────────────────────────────────────────────── */
function TrafficPanel({ t, cat }) {
  if (!t) return <Empty text="No traffic data (no live URL)."/>;
  const max = Math.max(...t.week, 1);
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8,
      }}>
        <div style={{
          fontSize: 22, fontWeight: 700, color: CC.INK, letterSpacing: "-0.02em",
          fontFamily: "'Space Mono', monospace",
        }}>{t.sessions.toLocaleString()}</div>
        <div style={labelMonoSm()}>sessions · last 7d</div>
      </div>
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 4, height: 50, marginBottom: 12,
      }}>
        {t.week.map((v, i) => (
          <div key={i} style={{
            flex: 1, height: `${(v / max) * 100}%`, minHeight: 2,
            background: cat.accent,
            borderRadius: 2, opacity: 0.6 + 0.4 * (i / 6),
          }} title={`${v} sessions`}/>
        ))}
      </div>
      <div style={{ ...labelMonoSm(), marginBottom: 6 }}>Top sources</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {t.referrers.map(r => (
          <div key={r.src} style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: CC.MUTED,
          }}>
            <span style={{ color: CC.INK }}>{r.src}</span>
            <span>{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function Empty({ text }) {
  return (
    <div style={{
      fontSize: 12.5, color: CC.MUTED_2, fontStyle: "italic", padding: "6px 0",
    }}>{text}</div>
  );
}

Object.assign(window, { AppDetailPage });
