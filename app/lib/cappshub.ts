import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { apps, notesCache } from "@/db/schema";
import type { PlanItem } from "@/db/schema";

import { getRepoContents, listDirContents } from "./github";

// Reads `.cappshub/*` + CLAUDE.md from each managed repo via the GitHub Contents
// API, cached in notes_cache with a 5-minute freshness window. Misses (404) are
// cached too (content = null) so absent files don't hammer the API.

const FRESH_MS = 5 * 60 * 1000;
const NOTES_DIR = ".cappshub/notes";

export type CachedRead =
  | { status: "ok"; content: string; sha: string | null; cached: boolean }
  | { status: "missing" } // file absent (404), cached
  | { status: "no-repo" }; // app not found or has no github_repo

export type PlanRead =
  | { status: "ok"; items: PlanItem[]; cached: boolean }
  | { status: "missing" }
  | { status: "no-repo" }
  | { status: "invalid" }; // present but not parseable as a plan

export type NotesRead =
  | { status: "ok"; notes: { path: string; content: string }[] }
  | { status: "missing" } // no .cappshub/notes directory
  | { status: "no-repo" };

async function resolveApp(slug: string): Promise<{ appId: string; repo: string } | null> {
  const [app] = await db
    .select({ id: apps.id, githubRepo: apps.githubRepo })
    .from(apps)
    .where(eq(apps.slug, slug))
    .limit(1);
  if (!app || !app.githubRepo) return null;
  return { appId: app.id, repo: app.githubRepo };
}

async function upsertCache(
  appId: string,
  repoPath: string,
  content: string | null,
  sha: string | null,
): Promise<void> {
  await db
    .insert(notesCache)
    .values({ appId, repoPath, content, sha })
    .onConflictDoUpdate({
      target: [notesCache.appId, notesCache.repoPath],
      set: { content, sha, fetchedAt: new Date() },
    });
}

// Core: return a repo file's content, served from notes_cache when fresh,
// otherwise fetched from GitHub and cached. Used for instructions / plan.json /
// CLAUDE.md / individual note files.
async function readCachedFor(
  appId: string,
  repo: string,
  repoPath: string,
): Promise<CachedRead> {
  const [row] = await db
    .select()
    .from(notesCache)
    .where(and(eq(notesCache.appId, appId), eq(notesCache.repoPath, repoPath)))
    .limit(1);

  if (row && Date.now() - row.fetchedAt.getTime() < FRESH_MS) {
    if (row.content == null) return { status: "missing" };
    return { status: "ok", content: row.content, sha: row.sha, cached: true };
  }

  const { data } = await getRepoContents(repo, repoPath);
  if (!data) {
    await upsertCache(appId, repoPath, null, null);
    return { status: "missing" };
  }
  await upsertCache(appId, repoPath, data.text, data.sha);
  return { status: "ok", content: data.text, sha: data.sha, cached: false };
}

async function readCached(slug: string, repoPath: string): Promise<CachedRead> {
  const app = await resolveApp(slug);
  if (!app) return { status: "no-repo" };
  return readCachedFor(app.appId, app.repo, repoPath);
}

export function getInstructionsFor(slug: string): Promise<CachedRead> {
  return readCached(slug, ".cappshub/instructions.md");
}

export function getClaudeMdFor(slug: string): Promise<CachedRead> {
  return readCached(slug, "CLAUDE.md");
}

export async function getPlanFor(slug: string): Promise<PlanRead> {
  const read = await readCached(slug, ".cappshub/plan.json");
  if (read.status !== "ok") return read;
  try {
    const parsed = JSON.parse(read.content) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return { status: "invalid" };
    return { status: "ok", items: parsed.items as PlanItem[], cached: read.cached };
  } catch {
    return { status: "invalid" };
  }
}

export async function listNotesFor(slug: string): Promise<NotesRead> {
  const app = await resolveApp(slug);
  if (!app) return { status: "no-repo" };

  // Cache the directory listing itself under the dir path (content = JSON array
  // of note file paths), refreshed on the same 5-minute window.
  let paths: string[];
  const [dirRow] = await db
    .select()
    .from(notesCache)
    .where(and(eq(notesCache.appId, app.appId), eq(notesCache.repoPath, NOTES_DIR)))
    .limit(1);

  if (dirRow && Date.now() - dirRow.fetchedAt.getTime() < FRESH_MS) {
    if (dirRow.content == null) return { status: "missing" };
    paths = JSON.parse(dirRow.content) as string[];
  } else {
    const { data } = await listDirContents(app.repo, NOTES_DIR);
    if (!data) {
      await upsertCache(app.appId, NOTES_DIR, null, null);
      return { status: "missing" };
    }
    paths = data.filter((e) => e.type === "file" && e.name.endsWith(".md")).map((e) => e.path);
    // Note files are ISO-timestamp-prefixed by the /note convention, so sorting
    // descending puts the newest first — the card labels index 0 "latest".
    paths.sort().reverse();
    await upsertCache(app.appId, NOTES_DIR, JSON.stringify(paths), null);
  }

  const notes: { path: string; content: string }[] = [];
  for (const path of paths) {
    const read = await readCachedFor(app.appId, app.repo, path);
    if (read.status === "ok") notes.push({ path, content: read.content });
  }
  return { status: "ok", notes };
}

// Everything the detail-page IntegrationCard needs, in one resolve + parallel
// fetch. `null` fields mean the file is absent (404) or there is no repo.
export interface IntegrationData {
  repo: string | null;
  connected: boolean;
  instructions: string | null;
  planJson: string | null;
  planItems: PlanItem[] | null;
  claudeMd: string | null;
  notes: { path: string; content: string }[];
  hasCappshub: boolean;
}

export async function getIntegrationFor(slug: string): Promise<IntegrationData> {
  const app = await resolveApp(slug);
  if (!app) {
    return {
      repo: null,
      connected: false,
      instructions: null,
      planJson: null,
      planItems: null,
      claudeMd: null,
      notes: [],
      hasCappshub: false,
    };
  }

  const [instr, planRead, claude, notesRead] = await Promise.all([
    readCachedFor(app.appId, app.repo, ".cappshub/instructions.md"),
    readCachedFor(app.appId, app.repo, ".cappshub/plan.json"),
    readCachedFor(app.appId, app.repo, "CLAUDE.md"),
    listNotesFor(slug),
  ]);

  const instructions = instr.status === "ok" ? instr.content : null;
  const planJson = planRead.status === "ok" ? planRead.content : null;
  let planItems: PlanItem[] | null = null;
  if (planJson) {
    try {
      const parsed = JSON.parse(planJson) as { items?: unknown };
      if (Array.isArray(parsed.items)) planItems = parsed.items as PlanItem[];
    } catch {
      planItems = null;
    }
  }
  const claudeMd = claude.status === "ok" ? claude.content : null;
  const notes = notesRead.status === "ok" ? notesRead.notes : [];

  return {
    repo: app.repo,
    connected: true,
    instructions,
    planJson,
    planItems,
    claudeMd,
    notes,
    hasCappshub: instructions != null || planJson != null || notes.length > 0,
  };
}
