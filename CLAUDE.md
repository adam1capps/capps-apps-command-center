# Capps Apps Command Center — Active Build (Session Handoff)

Mid-port from a static Babel-in-browser prototype (`/prototype/`) to a production Next.js 16 app (`/app/`) on Netlify, ultimately at `hub.cappsapps.ai`. The full implementation plan + live tracker is in **`PLAN.md`** — the "Phase status" table near the end + the "Current phase" blurb just above it are the single source of truth for "where are we." Read that first.

## Land here first

1. Default landing is `implement-command-center` (the de-facto main). No code branch is in flight right now. Refresh:

   ```bash
   git fetch origin
   git checkout implement-command-center
   git pull
   ```

2. Read `PLAN.md` end to end. The "Phase status" table is the live tracker — update it after every merge alongside the "Current phase" blurb just above it. The "How to read this plan" section and the "Sanity Check Protocol" govern every phase.

3. Current state (as of 2026-05-28):
   - **Phases 1-11 fully done.** Public showcase, 6h poller + manual trigger, Clerk auth, dashboard (Grid/Pipeline/Attention) with URL view-state, full app detail page (hero / quick stats / editable next-move·plan·blockers / activity / Repo/DB/Hosting/API/Traffic panels), notes CRUD + modal + full-page editor, `.cappshub/` GitHub Contents read layer + IntegrationCard, and the GitHub push webhook → `notes_cache` invalidation + `integration_events` row — **the webhook is verified operational end-to-end on `adam1capps/hub-dispatch`** (2 push events landed in `integration_events` as of 2026-05-28).
   - **Site is healthy** at `https://hub.cappsapps.ai` (latest implement-command-center merge `42728d4`, SCP green; tracker-update commits since are doc-only).
   - **No blockers right now.** Phase 12A (`/api/cappshub-events` POST + SSE stream) is 👉 NEXT and is pure code work (no user-gated step).

## What's blocking, and the resume point

Nothing is blocking right now. Phase 11 ran the full gauntlet (merge → `bundle-0004.sql` → hook install → live verification → secret rotation to true Netlify secret per-context with the GitHub hook re-keyed in lockstep) and is done.

**Lessons captured for future use:**

1. **Bundles must be idempotent from the start.** The original `bundle-0004.sql` used bare `CREATE TABLE` / `ALTER TABLE ADD CONSTRAINT`, which rolled back on re-run when the table already existed. The idempotent rewrite (`CREATE TABLE IF NOT EXISTS` + `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ...) ... $$`) is the pattern to use going forward.

2. **Netlify secret-setting must be true-secret per-context.** A secret env var set as `context:"all"` silently no-ops (this caused the 2026-05-20 outage). A secret env var set per-context but flagged *non-secret* is functional but leaks in the UI and build logs. The pattern that actually works: delete any existing entry, then create per-context with `envVarIsSecret: true` (one create per context), then redeploy. Toggling "secret" on an existing variable does not update the flag reliably.

3. **Webhook secret rotations must be lockstep.** When rotating `CAPPSHUB_WEBHOOK_SECRET`, the order is: (a) new value into Netlify per-context as a true secret, (b) trigger production redeploy and wait for `ready`, (c) PATCH the GitHub hook config with the new secret (sending the full `config` block — GitHub treats it as a replacement). Between (b) and (c) GitHub still has the old secret, so don't dawdle.

**Next code work: Phase 12A** per PLAN.md ("PR 12A: Backend — events table + POST + SSE stream"). The `integration_events` schema is already done; Phase 12A's additions are `/api/cappshub-events` (POST, `Authorization: Bearer $CAPPSHUB_HOOK_TOKEN`, returns 204) + `/api/events/stream` (SSE, 30s heartbeats). Before exercising, set `CAPPSHUB_HOOK_TOKEN` on Netlify (still missing; see Provisioning state).

**Optional hook rollout (deferred):** the push webhook is currently only installed on `adam1capps/hub-dispatch` (1 of ~13 managed repos with `githubRepo`). Rolling out to the rest is dormant work — they have no `.cappshub/` files yet, so the hook would fire on every push but write no event row until a commit touches `.cappshub/*` or `CLAUDE.md`. Revisit when seeding `.cappshub/` files across the portfolio (Phase 13 dogfood) becomes the active task. Install script: `app/scripts/install-webhooks.ts`, exposed as `pnpm webhooks:install [filter]` (needs `GITHUB_TOKEN` + `CAPPSHUB_WEBHOOK_SECRET` in `app/.env.local`).

## Locked decisions (do not relitigate)

- **Target**: Next.js on Netlify at `hub.cappsapps.ai` per `prototype/chats/chat1.md` (also see Design Session in the prototype). Not re-touching the prototype.
- **Repo layout**: same repo. Prototype kept under `/prototype/` (read-only design reference). Production app under `/app/`.
- **Notes source of truth**: `.cappshub/` files in each managed repo. Production reads via GitHub Contents API and caches in Neon `notes_cache` table (5-min freshness, miss-caching so absent files don't hammer the API).
- **DB migrations**: Drizzle generates SQL, then a hand-written `app/db/bundle-NNNN.sql` (DDL + verification SELECT in `BEGIN/COMMIT`) is pasted into the Neon SQL Editor. The sandbox has no Neon egress; the user runs the bundles.
- **Recorded interactive demos behind a lead-gate** (Phase 15) replaces per-app demo-SSO. Build after Phase 14. See PLAN.md Phase 15 for the chosen architecture.

## Stack

- Next.js 16.2.6 + React 19.2.4 + TypeScript strict + pnpm 10
- Drizzle ORM + `@neondatabase/serverless` (HTTP driver) + `@netlify/neon` (wrapper)
- zod (validation at boundaries only)
- Clerk — `proxy.ts` with `clerkMiddleware()` from `@clerk/nextjs/server`, `<ClerkProvider>` inside `<body>`, `<Show when="signed-in|signed-out">`, `<UserButton>`, `<SignInButton>`. Source: https://clerk.com/docs/nextjs/getting-started/quickstart
- Inline styles ported one-to-one from prototype. No Tailwind, no CSS-in-JS layer. `app/app/globals.css` has the keyframes + reset.

## Brand rules

- Pure white `#FFFFFF` background everywhere
- Navy `#1E2C55` brand bridge
- **No em dashes** anywhere in user-visible copy. Grep before merging.
- Per-category accents in `app/lib/tokens.ts` — do not deviate
- DM Sans body, Space Mono mono (loaded via `next/font/google` in `app/app/layout.tsx`)

## Provisioning state

| Item | Status | Where / Notes |
|------|--------|---------------|
| Netlify site | done | id `c681f8dd-aae1-4519-9b71-db26114b6dc0`, team `adam-iusbapy` (ReDry), Pro plan, name `capps-apps-command-center` |
| Netlify ↔ GitHub link | done | PRs auto-deploy preview; production builds on push to `implement-command-center` |
| Site public access | done | toggled Public 2026-05-21; previously 403 `host_not_allowed` |
| Neon project | done | `capps-command-center` in ReDry LLC org (Scale plan), branch `production`, db `neondb`, role `neondb_owner`. Bundles all applied: `bundle-seed.sql` (apps + status_snapshots, 37/37 seeded) · `bundle-0001.sql` (apps.plan + change_log) · `bundle-0002.sql` (notes) · `bundle-0003.sql` (notes_cache) · `bundle-0004.sql` (integration_events, applied 2026-05-22; count=0). **Networking gotcha:** new Neon projects in this org ship with Settings → Networking → "Allow traffic via the public internet" OFF. Toggle ON; leave VPC OFF. |
| `NETLIFY_DATABASE_URL` (Netlify env) | done | pooled Neon URL, rotated + hardened post-incident: **secret per-context** (`production` + `deploy-preview`). The 2026-05-20 outage was this var silently no-op'ing under `context:"all"` (see below). |
| `GITHUB_TOKEN` (Netlify env) | done, security debt | classic PAT, scope `repo`, login `adam1capps`. **Currently stored non-secret, context `all`** + leaked to prior session transcript → rotate + re-add as secret per-context. Functional today because non-secret vars resolve fine on `all`. |
| Clerk publishable + secret keys | done | `NEXT_PUBLIC_CLERK_*` non-secret context `all` (publishable values, fine); `CLERK_SECRET_KEY` secret per-context (production / deploy-preview / branch-deploy / dev). Reference pattern for any new secret. |
| `CAPPSHUB_WEBHOOK_SECRET` (Netlify env) | done | Set 2026-05-28 as true secret per-context (production + deploy-preview + branch-deploy + preview-server; production + deploy-preview is what's exercised). Rotated once already: initial value was non-secret + leaked through CLI history → rotated to fresh value with the GitHub hook on `hub-dispatch` re-keyed in lockstep. Must match the value baked into the GitHub webhook config exactly. |
| `CAPPSHUB_HOOK_TOKEN` (Netlify env) | **MISSING** | Phase 12 `/api/cappshub-events` Bearer-token. Add as secret per-context before Phase 12A is exercised. |
| `X_TRIGGER_TOKEN` (Netlify env) | **MISSING** | Phase 4 `/api/poll-now` guard. Add as secret per-context before the manual trigger works in production. |
| DNS `hub.cappsapps.ai` | done (early) | already resolves to the Netlify site (per `urls.primarySiteUrl`). Phase 14C is now mostly a polish/verify step rather than a real cutover. |

### Netlify secret-setting gotcha (do not forget)
Secret env vars on Netlify **silently no-op** when set with `context:"all"`. They must be set **per context**: delete any `all` entry first, then re-create with `envVarIsSecret:true` once per context (`production`, then `deploy-preview`, etc.), then redeploy. Toggling "secret" while leaving `all` does nothing — the value won't resolve at runtime. This caused the 2026-05-20 production outage.

## MCP capabilities at handoff time

You may have more — call ToolSearch on session start to surface what's actually available.

- `mcp__github__*` — full PR/repo CRUD scoped to `adam1capps/capps-apps-command-center`. The harness restricts you to this single repo.
- `mcp__ed489899-...__netlify-*` — Netlify project / extension / team / user / deploy services. Can create sites, manage env vars (incl. `upsertEnvVar` + `envVarIsSecret` + `newVarContext`), read deploy state, toggle visitor access. **Cannot** source-link a project or read secret env values back (returns `[]`).
- `mcp__214d5704-...__clerk_sdk_snippet*` — doc snippet lookup only, no provisioning.
- Various others (Stripe, Bitly, Canva, Zoom, calendar/email, etc.) — not relevant to this build.

If a session has the **Netlify CLI** (`netlify`) available, that unlocks: source-link, `netlify db init`, `netlify env:list`, `netlify deploy --build`. Useful when MCP gaps bite — neither this session nor recent ones had it.

## Standing authorizations

**PR merges.** Claude may merge PRs into `implement-command-center` without asking, when ALL of these are true: (1) base branch is `implement-command-center` (never `main`/`production`); (2) head branch is one Claude pushed in this session or a prior session; (3) all CI checks are green; (4) no unresolved review threads; (5) SCP pre-flight (`pnpm typecheck && pnpm lint && pnpm build` from `app/`) passes locally on the head SHA; (6) merge method is **squash** with a one-line summary derived from the PR title. After merge: run the full SCP, record the merge SHA + sanity-check result in PLAN.md tracker, commit + push that update directly to `implement-command-center`. Anything outside those conditions → still ask first. Merges into `main`/`production` or any branch with a `release/*` prefix → always ask, no exceptions.

## Sanity Check Protocol (SCP) — abbreviated

After EVERY merge into `implement-command-center`:

1. `git fetch && git checkout implement-command-center && git pull`
2. `cd app && pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm build`
3. Confirm Netlify deploy for the merge SHA is `ready` (via `mcp__ed489899-...__netlify-project-services-reader` `get-project`, check `currentDeploy.currentDeploy.state`).
4. Run the cumulative smoke-test rows in PLAN.md (39 rows by end of port, currently 1; sandbox has no open-internet egress so live smoke checks need the Netlify MCP + user eyeball, not local curl).
5. Record result in PLAN.md tracker: `YYYY-MM-DDTHH:MMZ · green|yellow|red · short note`.

If anything fails → fix forward or revert before starting the next phase.

## Subscription state

PR #31 (Phase 11) is now merged; the prior session was subscribed to its activity. No PR is open right now. When opening a new PR, decide whether to `mcp__github__subscribe_pr_activity` based on the work: babysit-style sessions should subscribe; one-off doc PRs usually don't need to. When events arrive: investigate; fix if confident and small; ask if ambiguous; skip if no-op.

## Tone, working style

- The user values: structured plans, momentum, fast PR cadence, sanity checks after every merge. They merge quickly so design for incremental, reviewable commits.
- Update the PLAN.md "Roadmap at a glance" table + the relevant Phase status row after every merge. The tracker is the single source of truth for "where are we."
- Prototype line references (`ui-detail.jsx:516-570`) are stable — quote them when porting.
- Plan mode blocks `Bash` writes and `git commit/push`. If a tracker update is needed after a merge done in plan mode, exit plan mode before reporting "SCP done" or the recording will be missing.

## Quick-reference file tour

- `PLAN.md` — full implementation plan + live tracker. The map.
- `prototype/` — design source of truth, byte-identical to the original Design Session. Reference, do not edit.
- `app/db/schema.ts` — Drizzle schema: `apps`, `statusSnapshots`, `changeLog`, `notes`, `notesCache`, `integrationEvents`. `PlanItem` type.
- `app/db/seed-data.ts` — 37 apps, ported verbatim from `prototype/data.js:30-397`.
- `app/db/seed.ts` — idempotent seeder.
- `app/db/migrations/0000_*.sql` … `0004_*.sql` — drizzle-kit generated; the hand-paste bundles for the Neon SQL Editor are `app/db/bundle-seed.sql` (initial schema + 37 apps) and `app/db/bundle-000{1..4}.sql` (one per later migration).
- `app/lib/derive.ts` — `deriveSnapshot` + `getIssues` (pure TS, reused at seed/poller/dashboard).
- `app/lib/tokens.ts` — brand palette (mirrors `prototype/ui-shared.jsx:3-31`). Only place colors come from.
- `app/lib/constants.ts` — `CATEGORIES`, `STAGES`, `STAGE_LABEL` (mirrors `prototype/data.js:6-24`).
- `app/lib/db-queries.ts` — server-side query helpers (`getShowcaseApps`, `getAppBySlug`, etc.).
- `app/lib/github.ts` — GitHub API wrapper (`getLatestCommit`, `getRepoContents`, `listDirContents`). Returns `GitHubResult<T>` with rate-limit headers.
- `app/lib/cappshub.ts` — `.cappshub/` cache-aware read layer + `resolveAppByRepo` + `invalidatePaths` (used by the webhook).
- `app/lib/intel.ts` — port of `prototype/app-intel.js`, drives quick stats and panels.
- `app/proxy.ts` — Clerk middleware (matcher covers `/dashboard/**`, `/app/[slug]/**`).
- `app/app/api/github-webhook/route.ts` — Phase 11 HMAC-verified push handler.
- `app/scripts/install-webhooks.ts` + `app/scripts/uninstall-webhooks.ts` — local-only, run from `app/` via `pnpm webhooks:install|uninstall [filter]`.
- `app/AGENTS.md` — Next.js 16 breaking-changes warning (preserved verbatim from create-next-app).
