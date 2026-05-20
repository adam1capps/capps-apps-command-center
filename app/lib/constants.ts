// Category and stage metadata for Capps Apps Command Center.
// Mirrors prototype/data.js:6-24. Keep in sync.

import type { Category, Stage } from "./tokens";

export const CATEGORIES: Record<Category, {
  id: Category;
  label: string;
  primary: string;
  accent: string;
}> = {
  roofmri:    { id: "roofmri",    label: "Roof MRI",   primary: "#1E2C55", accent: "#00BD70" },
  redry:      { id: "redry",      label: "ReDry",      primary: "#1E2C55", accent: "#E99A3F" },
  mindreadir: { id: "mindreadir", label: "MindReadir", primary: "#6B4DE0", accent: "#1E2C55" },
  cappsapps:  { id: "cappsapps",  label: "Capps Apps", primary: "#1F1F1F", accent: "#D4E04F" },
  internal:   { id: "internal",   label: "Internal",   primary: "#64748B", accent: "#1A8F96" },
};

export const STAGES: readonly Stage[] = [
  "idea", "building", "mvp", "live", "polishing", "mature", "archive",
] as const;

export const STAGE_LABEL: Record<Stage, string> = {
  idea:      "Idea",
  building:  "Building",
  mvp:       "MVP",
  live:      "Live",
  polishing: "Polishing",
  mature:    "Mature",
  archive:   "Archive",
};

// Dashboard view tabs. Mirrors prototype/app.jsx:14-18.
export const VIEWS = [
  { id: "grid",      label: "Grid",            sub: "Launcher" },
  { id: "pipeline",  label: "Pipeline",        sub: "Lifecycle" },
  { id: "attention", label: "Needs Attention", sub: "Triage" },
] as const;

export type ViewId = (typeof VIEWS)[number]["id"];
