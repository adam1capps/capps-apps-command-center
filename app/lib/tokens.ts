// Brand tokens for Capps Apps Command Center.
// Mirrors prototype/ui-shared.jsx:3-31 — keep in sync.

export const CC = {
  NAVY: "#1E2C55",
  WHITE: "#FFFFFF",
  CATS: {
    roofmri:    { primary: "#1E2C55", accent: "#00BD70", chip: "#E7F6EE" },
    redry:      { primary: "#1E2C55", accent: "#E99A3F", chip: "#FCEFDD" },
    mindreadir: { primary: "#6B4DE0", accent: "#1E2C55", chip: "#EFEAFD" },
    cappsapps:  { primary: "#1F1F1F", accent: "#D4E04F", chip: "#F4F7DC" },
    internal:   { primary: "#64748B", accent: "#1A8F96", chip: "#E1F0F1" },
  },
  H_HEALTHY: "#00BD70",
  H_WARN:    "#F5A623",
  H_BROKEN:  "#D64545",
  H_STALE:   "#94A3B8",
  H_ARCH:    "#CBD5E1",
  INK:       "#0F172A",
  INK_2:     "#1E2C55",
  TEXT:      "#1F2937",
  MUTED:     "#64748B",
  MUTED_2:   "#94A3B8",
  HAIR:      "#E5E7EB",
  HAIR_2:    "#EEF1F5",
  SURFACE:   "#FFFFFF",
  SURFACE_2: "#F7F8FA",
} as const;

export const HEALTH = {
  healthy: { color: CC.H_HEALTHY, label: "Healthy" },
  warning: { color: CC.H_WARN,    label: "Warning" },
  broken:  { color: CC.H_BROKEN,  label: "Broken"  },
  stale:   { color: CC.H_STALE,   label: "Stale"   },
  archive: { color: CC.H_ARCH,    label: "Archive" },
} as const;

export const STAGE_TINT = {
  idea:      "#94A3B8",
  building:  "#6B4DE0",
  mvp:       "#1A8F96",
  live:      "#00BD70",
  polishing: "#E99A3F",
  mature:    "#1E2C55",
  archive:   "#CBD5E1",
} as const;

export type HealthScore = keyof typeof HEALTH;
export type Stage = keyof typeof STAGE_TINT;
export type Category = keyof typeof CC.CATS;
