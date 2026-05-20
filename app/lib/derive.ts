// Ports prototype/data.js:399-489 (deriveSnapshot, getIssues).
// Pure functions — used at seed time and by the Phase 4 poller.

import type { Stage, HealthScore } from "./tokens";

// Synthetic "now" so seed-time days_since_commit values stay stable
// across reseeds. Production poller passes the real current time.
// Mirrors prototype/data.js:27.
export const SEED_NOW = new Date("2026-05-18T08:00:00Z");

export interface SnapshotInput {
  urlStatus: number | null;
  urlResponseMs: number | null;
  lastCommitAt: string | null;
  lastCommitMsg: string | null;
}

export interface AppForDerive {
  stage: Stage;
  liveUrl: string | null;
  githubRepo: string | null;
  snap: SnapshotInput;
}

export interface DerivedSnapshot {
  urlStatus: number | null;
  urlResponseMs: number | null;
  lastCommitAt: string | null;
  daysSinceCommit: number | null;
  lastCommitMsg: string | null;
  healthScore: HealthScore;
  driftDetected: boolean;
  checkedAt: string;
}

function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
}

export function deriveSnapshot(app: AppForDerive, now: Date = SEED_NOW): DerivedSnapshot {
  const s = app.snap;
  const lastCommitAt = s.lastCommitAt ?? null;
  const days = daysSince(lastCommitAt, now);

  let healthScore: HealthScore = "healthy";
  if (app.stage === "archive") {
    healthScore = "archive";
  } else if (s.urlStatus != null && s.urlStatus !== 200) {
    healthScore = "broken";
  } else if (app.liveUrl && !app.githubRepo) {
    healthScore = "warning";
  } else if (app.liveUrl && days != null && days > 60) {
    healthScore = "warning";
  } else if (app.stage === "building" && days != null && days > 60) {
    healthScore = "stale";
  } else if (!app.liveUrl && app.stage !== "building" && app.stage !== "idea") {
    healthScore = "warning";
  }

  return {
    urlStatus: s.urlStatus,
    urlResponseMs: s.urlResponseMs,
    lastCommitAt,
    daysSinceCommit: days,
    lastCommitMsg: s.lastCommitMsg,
    healthScore,
    driftDetected: Boolean(app.liveUrl && !app.githubRepo),
    checkedAt: now.toISOString(),
  };
}

export type IssueKind = "broken" | "drift" | "stalled" | "slow" | "blocker";

export interface Issue {
  kind: IssueKind;
  severity: 1 | 2 | 3;
  title: string;
  detail: string;
  action: string;
}

export interface AppForIssues {
  stage: Stage;
  liveUrl: string | null;
  blockers: string | null;
}

// Structural subset getIssues reads. Satisfied by both DerivedSnapshot and the
// persisted status_snapshots row (whose date fields are Date, not string).
export interface IssueSnapshot {
  urlStatus: number | null;
  urlResponseMs: number | null;
  daysSinceCommit: number | null;
  lastCommitMsg: string | null;
  driftDetected: boolean;
}

export function getIssues(app: AppForIssues, snap: IssueSnapshot): Issue[] {
  const out: Issue[] = [];
  if (app.stage === "archive") return out;

  if (snap.urlStatus != null && snap.urlStatus !== 200) {
    out.push({
      kind: "broken",
      severity: 1,
      title: `Site responded ${snap.urlStatus}`,
      detail: app.liveUrl ?? "",
      action: "Check Netlify deploy log and DNS.",
    });
  }
  if (snap.driftDetected) {
    out.push({
      kind: "drift",
      severity: 2,
      title: "Live site has no repo backing it",
      detail: "Drag-and-drop deploy. Source lives only on Netlify.",
      action: "Move source into a repo; reconnect Netlify to it.",
    });
  }
  if (app.stage === "building" && snap.daysSinceCommit != null && snap.daysSinceCommit > 60) {
    out.push({
      kind: "stalled",
      severity: 3,
      title: `Stalled in development (${snap.daysSinceCommit}d since last commit)`,
      detail: snap.lastCommitMsg ? `Last: "${snap.lastCommitMsg}"` : "",
      action: "Decide: ship the MVP cut, hand off, or archive.",
    });
  }
  if (snap.urlResponseMs != null && snap.urlResponseMs > 1500 && snap.urlStatus === 200) {
    out.push({
      kind: "slow",
      severity: 3,
      title: `Slow response (${snap.urlResponseMs}ms)`,
      detail: "Likely Render cold start.",
      action: "Move off Render free tier or warm with a ping.",
    });
  }
  if (app.blockers) {
    out.push({
      kind: "blocker",
      severity: 2,
      title: "Blocker noted",
      detail: app.blockers,
      action: "Unblock or move to backburner.",
    });
  }
  return out;
}
