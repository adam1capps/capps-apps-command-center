import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, check, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export interface PlanItem {
  id: string;
  done: boolean;
  text: string;
}

export const apps = pgTable("apps", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  liveUrl: text("live_url"),
  customDomain: text("custom_domain"),
  githubRepo: text("github_repo"),
  hosting: text("hosting"),
  stage: text("stage").notNull(),
  visibleOnShowcase: boolean("visible_on_showcase").notNull().default(false),
  nextMove: text("next_move"),
  blockers: text("blockers"),
  plan: jsonb("plan").$type<PlanItem[]>(),
  apiDependencies: text("api_dependencies").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statusSnapshots = pgTable("status_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  appId: uuid("app_id")
    .notNull()
    .references(() => apps.id, { onDelete: "cascade" }),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  urlStatus: integer("url_status"),
  urlResponseMs: integer("url_response_ms"),
  lastCommitAt: timestamp("last_commit_at", { withTimezone: true }),
  lastCommitMsg: text("last_commit_msg"),
  daysSinceCommit: integer("days_since_commit"),
  healthScore: text("health_score").notNull(),
  driftDetected: boolean("drift_detected").notNull().default(false),
});

// Audit trail for edits to next_move / plan / blockers (Phase 8).
export const changeLog = pgTable("change_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  appId: uuid("app_id")
    .notNull()
    .references(() => apps.id, { onDelete: "cascade" }),
  actorEmail: text("actor_email").notNull(),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Notes + instructions per app (Phase 9). source: manual | slash-command |
// hook | claude-md. kind: instruction | note.
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    source: text("source").notNull().default("manual"),
    repoPath: text("repo_path"),
    commitSha: text("commit_sha"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdByEmail: text("created_by_email"),
  },
  (t) => [check("notes_kind_check", sql`${t.kind} in ('instruction', 'note')`)],
);

// Cache of `.cappshub/*` + CLAUDE.md files read from each managed repo via the
// GitHub Contents API (Phase 10). content is null when the file is absent (404),
// so misses are cached too. Freshness is checked against fetched_at (5 min).
export const notesCache = pgTable(
  "notes_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    repoPath: text("repo_path").notNull(),
    content: text("content"),
    sha: text("sha"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("notes_cache_app_repo_unique").on(t.appId, t.repoPath)],
);

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type StatusSnapshot = typeof statusSnapshots.$inferSelect;
export type NewStatusSnapshot = typeof statusSnapshots.$inferInsert;
export type ChangeLogEntry = typeof changeLog.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteCache = typeof notesCache.$inferSelect;
export type NewNoteCache = typeof notesCache.$inferInsert;