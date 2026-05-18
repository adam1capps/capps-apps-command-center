/* Shared tokens, helpers, and small UI primitives for the Command Center. */

const CC = {
  // brand
  NAVY:    "#1E2C55",
  WHITE:   "#FFFFFF",
  // category palette (mirror data.js)
  CATS: {
    roofmri:    { primary: "#1E2C55", accent: "#00BD70", chip: "#E7F6EE" },
    redry:      { primary: "#1E2C55", accent: "#E99A3F", chip: "#FCEFDD" },
    mindreadir: { primary: "#6B4DE0", accent: "#1E2C55", chip: "#EFEAFD" },
    cappsapps:  { primary: "#1F1F1F", accent: "#D4E04F", chip: "#F4F7DC" },
    internal:   { primary: "#64748B", accent: "#1A8F96", chip: "#E1F0F1" },
  },
  // health colors (kept utilitarian)
  H_HEALTHY: "#00BD70",
  H_WARN:    "#F5A623",
  H_BROKEN:  "#D64545",
  H_STALE:   "#94A3B8",
  H_ARCH:    "#CBD5E1",
  // neutrals
  INK:        "#0F172A",
  INK_2:      "#1E2C55",
  TEXT:       "#1F2937",
  MUTED:      "#64748B",
  MUTED_2:    "#94A3B8",
  HAIR:       "#E5E7EB",
  HAIR_2:     "#EEF1F5",
  SURFACE:    "#FFFFFF",
  SURFACE_2:  "#F7F8FA",
};

const HEALTH = {
  healthy: { color: CC.H_HEALTHY, label: "Healthy" },
  warning: { color: CC.H_WARN,    label: "Warning" },
  broken:  { color: CC.H_BROKEN,  label: "Broken" },
  stale:   { color: CC.H_STALE,   label: "Stale"   },
  archive: { color: CC.H_ARCH,    label: "Archive" },
};

const STAGE_TINT = {
  idea:      "#94A3B8",
  building:  "#6B4DE0",
  mvp:       "#1A8F96",
  live:      "#00BD70",
  polishing: "#E99A3F",
  mature:    "#1E2C55",
  archive:   "#CBD5E1",
};

/* ─── tiny helpers ─────────────────────────────────────────────────── */
function relDate(iso) {
  if (!iso) return "no commits";
  const d = Math.floor((window.CC_DATA.NOW - new Date(iso)) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d/30)}mo ago`;
  return `${Math.floor(d/365)}y ago`;
}
function shortHost(url) {
  if (!url) return "";
  try { return new URL(url).host.replace(/^www\./,""); }
  catch { return url.replace(/^https?:\/\//,"").replace(/\/$/,""); }
}
function unique(arr) { return Array.from(new Set(arr)); }

/* ─── HealthDot ───────────────────────────────────────────────────── */
function HealthDot({ score, size = 8, pulse = false }) {
  const h = HEALTH[score] || HEALTH.stale;
  return (
    <span
      title={h.label}
      style={{
        display: "inline-block",
        width: size, height: size, borderRadius: 999,
        background: h.color,
        boxShadow: pulse ? `0 0 0 0 ${h.color}66` : "none",
        animation: pulse && score === "broken" ? "ccPulse 1.6s ease-out infinite" : "none",
        flex: "none",
      }}
    />
  );
}

/* ─── Pills ───────────────────────────────────────────────────────── */
function StagePill({ stage }) {
  const c = STAGE_TINT[stage] || CC.MUTED;
  return (
    <span style={{
      fontFamily: "'Space Mono', ui-monospace, monospace",
      fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
      color: c, background: `${c}14`, border: `1px solid ${c}33`,
      padding: "2px 7px", borderRadius: 999, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>{stage}</span>
  );
}

function CategoryPill({ cat }) {
  const c = CC.CATS[cat] || CC.CATS.internal;
  const label = window.CC_DATA.CATEGORIES[cat]?.label || cat;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: c.primary,
      background: c.chip, padding: "2px 8px", borderRadius: 4,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function ApiChip({ name }) {
  return (
    <span style={{
      fontFamily: "'Space Mono', ui-monospace, monospace",
      fontSize: 10.5, color: CC.MUTED,
      background: CC.SURFACE_2,
      border: `1px solid ${CC.HAIR}`,
      padding: "1px 6px", borderRadius: 4,
      whiteSpace: "nowrap",
    }}>{name}</span>
  );
}

/* ─── Hosting glyph (just text — no emoji, brand rules) ───────────── */
function HostingMark({ hosting }) {
  if (!hosting || hosting === "none") return null;
  return (
    <span style={{
      fontFamily: "'Space Mono', ui-monospace, monospace",
      fontSize: 10, color: CC.MUTED_2, letterSpacing: ".04em",
    }}>{hosting}</span>
  );
}

Object.assign(window, {
  CC, HEALTH, STAGE_TINT,
  relDate, shortHost, unique,
  HealthDot, StagePill, CategoryPill, ApiChip, HostingMark,
});
