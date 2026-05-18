/* AppCard — used by Grid, Pipeline (compact), and Showcase variants. */

function AppCard({ app, density = "comfortable", onEditNext, showAttention = true, onOpen, onOpenNotes }) {
  const cat = CC.CATS[app.category] || CC.CATS.internal;
  const [hover, setHover] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(app.next_move || "");
  const compact = density === "compact";

  const handleOpen = (e) => {
    if (e.target.closest("[data-stop]")) return;
    onOpen?.(app);
  };

  const saveNext = () => {
    app.next_move = draft.trim() || null;
    setEditing(false);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); if (editing) saveNext(); }}
      onClick={handleOpen}
      style={{
        position: "relative",
        background: CC.SURFACE,
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 10,
        padding: compact ? "12px 14px" : "16px 18px 14px",
        cursor: "pointer",
        transition: "transform .12s ease, box-shadow .12s ease, border-color .12s",
        boxShadow: hover ? "0 4px 14px rgba(15,23,42,.06)" : "none",
        borderColor: hover ? "#CBD5E1" : CC.HAIR,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        minHeight: compact ? 0 : 124,
      }}
    >
      {/* left brand stripe */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: cat.accent,
      }}/>

      {/* row 1: name + health */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontWeight: 700, fontSize: compact ? 13.5 : 15, color: CC.INK,
            letterSpacing: "-0.005em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{app.name}</div>
          {!compact && (
            <div style={{
              fontSize: 12.5, color: CC.MUTED, marginTop: 3, lineHeight: 1.45,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{app.description}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
          <HealthDot score={app.status.health_score} pulse />
          <StagePill stage={app.stage} />
          {onOpenNotes && <NotesButton app={app} onOpen={onOpenNotes} />}
        </div>
      </div>

      {/* row 2: url + apis */}
      {!compact && (
        <div style={{
          marginTop: 12, display: "flex", justifyContent: "space-between",
          alignItems: "flex-end", gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {app.live_url ? (
              <div style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 11, color: cat.primary,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{shortHost(app.live_url)}</div>
            ) : (
              <div style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 11, color: CC.MUTED_2,
              }}>no live url</div>
            )}
          </div>
          {app.api_dependencies?.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {app.api_dependencies.slice(0, 4).map(a => <ApiChip key={a} name={a}/>)}
              {app.api_dependencies.length > 4 && (
                <span style={{ fontSize: 10.5, color: CC.MUTED_2, fontFamily: "'Space Mono', monospace" }}>
                  +{app.api_dependencies.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* hover overlay (next move + last deploy) */}
      {!compact && hover && showAttention && (
        <div
          data-stop
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", left: 4, right: 0, bottom: 0,
            background: "linear-gradient(to top, #FFFFFF 75%, rgba(255,255,255,0))",
            padding: "26px 18px 14px",
            borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
            animation: "ccFade .12s ease-out",
          }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            gap: 10, marginBottom: 6,
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: CC.MUTED_2, textTransform: "uppercase", letterSpacing: ".08em",
            }}>Next move</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: CC.MUTED,
            }}>
              last deploy {relDate(app.status.last_commit_at)}
              {app.status.url_response_ms != null && (
                <> · {app.status.url_response_ms}ms</>
              )}
            </div>
          </div>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") saveNext();
                if (e.key === "Escape") { setDraft(app.next_move || ""); setEditing(false); }
              }}
              onBlur={saveNext}
              style={{
                width: "100%", padding: "6px 8px",
                border: `1px solid ${cat.accent}`, borderRadius: 6,
                fontFamily: "inherit", fontSize: 13, outline: "none",
                color: CC.INK, background: "#fff",
              }}
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              style={{
                fontSize: 13, color: app.next_move ? CC.INK : CC.MUTED_2,
                lineHeight: 1.4, fontStyle: app.next_move ? "normal" : "italic",
                cursor: "text", padding: "2px 0",
                borderBottom: `1px dashed transparent`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = CC.HAIR}
              onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "transparent"}
            >
              {app.next_move || "click to add next move"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AppCard });
