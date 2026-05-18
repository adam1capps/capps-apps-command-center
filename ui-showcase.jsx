/* Public showcase route ("/" — hub.cappsapps.ai).
 * Read-only marketing surface. No status indicators, no internal tools.
 */

function ShowcaseView({ apps }) {
  const showcase = apps.filter(a =>
    a.visible_on_showcase && a.stage !== "archive" && a.live_url
  );

  // unique APIs across the visible set
  const apis = unique(showcase.flatMap(a => a.api_dependencies)).sort();
  const liveUrls = showcase.filter(a => a.live_url).length;
  const customDomains = showcase.filter(a => a.custom_domain).length;

  // group by category for the grid
  const cats = Object.values(window.CC_DATA.CATEGORIES);
  const sections = cats.map(c => ({
    cat: c,
    items: showcase.filter(a => a.category === c.id),
  })).filter(s => s.items.length);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>
      {/* Hero */}
      <div style={{ padding: "56px 0 32px" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11,
          color: CC.MUTED, letterSpacing: ".12em", textTransform: "uppercase",
          marginBottom: 14,
        }}>hub.cappsapps.ai · adam capps · portfolio</div>
        <h1 style={{
          margin: 0, fontSize: "clamp(40px, 6vw, 68px)",
          fontWeight: 700, color: CC.INK, lineHeight: 1.05,
          letterSpacing: "-0.025em",
        }}>
          Every app I've shipped.<br/>
          <span style={{ color: CC.MUTED }}>One place.</span>
        </h1>
        <p style={{
          maxWidth: 620, marginTop: 18, fontSize: 16.5, color: CC.MUTED,
          lineHeight: 1.55,
        }}>
          Live index of the apps running across Roof MRI, ReDry, MindReadir,
          and Capps Apps consulting. Updates itself every six hours from HTTP
          pings and the GitHub API. No screenshots, no marketing renders.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
        border: `1px solid ${CC.HAIR}`, borderRadius: 10,
        marginBottom: 56, overflow: "hidden", background: "#fff",
      }}>
        <Stat n={showcase.length} label="Apps shipped"/>
        <Stat n={liveUrls} label="Live URLs"/>
        <Stat n={customDomains} label="Custom domains"/>
        <Stat n={apis.length} label="APIs integrated"/>
      </div>

      {/* Cards by brand */}
      {sections.map(({ cat, items }) => (
        <section key={cat.id} style={{ marginBottom: 56 }}>
          <ShowcaseSectionHeader cat={cat}/>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}>
            {items.map(a => <ShowcaseCard key={a.slug} app={a}/>)}
          </div>
        </section>
      ))}

      {/* APIs strip */}
      <section style={{ marginBottom: 56 }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11,
          color: CC.MUTED, letterSpacing: ".12em", textTransform: "uppercase",
          marginBottom: 14,
        }}>Stack</div>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          padding: "20px 22px", borderRadius: 10,
          border: `1px solid ${CC.HAIR}`, background: "#fff",
        }}>
          {apis.map(api => (
            <span key={api} style={{
              fontFamily: "'Space Mono', monospace", fontSize: 12,
              color: CC.INK, background: CC.SURFACE_2,
              padding: "5px 10px", borderRadius: 4,
              border: `1px solid ${CC.HAIR}`,
            }}>{api}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: CC.NAVY, color: "#fff", borderRadius: 12,
        padding: "40px 36px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 24, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
            Want something like this built?
          </div>
          <div style={{ marginTop: 6, color: "#B0C4DE", fontSize: 14 }}>
            Consulting, prototyping, and full-stack builds.
          </div>
        </div>
        <a href="https://cappsapps.ai" target="_blank" rel="noopener" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#D4E04F", color: "#1F1F1F",
          padding: "14px 22px", borderRadius: 8,
          fontWeight: 700, textDecoration: "none", fontSize: 14,
        }}>
          cappsapps.ai
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14 }}>→</span>
        </a>
      </section>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div style={{
      padding: "22px 22px",
      borderRight: `1px solid ${CC.HAIR}`,
    }}>
      <div style={{
        fontSize: 36, fontWeight: 700, color: CC.INK,
        lineHeight: 1, letterSpacing: "-0.02em",
      }}>{n}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 11,
        color: CC.MUTED, marginTop: 8, letterSpacing: ".08em",
        textTransform: "uppercase",
      }}>{label}</div>
    </div>
  );
}

function ShowcaseSectionHeader({ cat }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      marginBottom: 16,
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 3, background: cat.accent,
      }}/>
      <h2 style={{
        margin: 0, fontSize: 20, fontWeight: 700, color: CC.INK,
        letterSpacing: "-0.01em",
      }}>{cat.label}</h2>
      <div style={{ flex: 1, height: 1, background: CC.HAIR_2 }}/>
    </div>
  );
}

function ShowcaseCard({ app }) {
  const cat = CC.CATS[app.category];
  const [hover, setHover] = React.useState(false);
  return (
    <a href={app.live_url} target="_blank" rel="noopener"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block", textDecoration: "none", color: "inherit",
        background: "#fff",
        border: `1px solid ${hover ? cat.primary : CC.HAIR}`,
        borderRadius: 10, padding: 18,
        transition: "border-color .12s, transform .12s, box-shadow .12s",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? "0 8px 20px rgba(15,23,42,.06)" : "none",
        position: "relative", overflow: "hidden",
      }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: cat.accent,
      }}/>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: CC.INK, letterSpacing: "-0.005em" }}>
        {app.name}
      </div>
      <div style={{
        fontSize: 13, color: CC.MUTED, marginTop: 6, lineHeight: 1.5,
      }}>{app.description}</div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 14, gap: 8,
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11.5,
          color: cat.primary, fontWeight: 600,
        }}>{shortHost(app.live_url)}</span>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 12,
          color: hover ? cat.accent : CC.MUTED_2, transition: "color .12s",
        }}>↗</span>
      </div>
    </a>
  );
}

Object.assign(window, { ShowcaseView });
