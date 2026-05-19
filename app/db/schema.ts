import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

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

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type StatusSnapshot = typeof statusSnapshots.$inferSelect;
export type NewStatusSnapshot = typeof statusSnapshots.$inferInsert;
