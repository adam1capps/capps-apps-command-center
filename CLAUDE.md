# Capps Apps Command Center — Active Build (Session Handoff)

Mid-port from a static Babel-in-browser prototype (`/prototype/`) to a production Next.js 16 app (`/app/`) on Netlify, ultimately at `hub.cappsapps.ai`. The full implementation plan is in **`PLAN.md`** — read that first.

## Land here first

1. You may be checked out on `implement-command-center` (the de-facto main). Active work is on `claude/capps-command-center-jGch8`. Run:

   ```bash
   git fetch origin
   git checkout claude/capps-command-center-jGch8
   git pull
   ```

2. Read `PLAN.md` end to end. The "How to read this plan" section and the "Sanity Check Protocol" govern every phase. The "Where am I" tracker at the bottom is the live status surface — update it after every merge.

3. Current open work: **PR #3 (Phase 2 — Neon schema + seed)**. Code is committed; the seed has not yet been run against a live DB.

## What's blocking, and the resume point

The user is providing **Neon connection strings** (pooled + unpooled) from neon.tech directly. When you receive them:

1. Store both as Netlify env vars on site `c681f8dd-aae1-4519-9b71-db26114b6dc0`:
   - `NETLIFY_DATABASE_URL` = pooled URL (mark secret)
   - `NETLIFY_DATABASE_URL_UNPOOLED` = unpooled URL (mark secret)
   - Use MCP `mcp__ed489899-...__netlify-project-services-updater` with operation `manage-env-vars`, `upsertEnvVar: true`, `envVarIsSecret: true`, `newVarContext: "all"`.
2. Write both to `/home/user/capps-apps-command-center/app/.env.local` (gitignored) so local Drizzle commands resolve them.
3. From `app/` directory:

   ```bash
   pnpm db:migrate     # applies db/migrations/0000_uneven_snowbird.sql
   pnpm db:seed        # truncates + inserts 37 apps + 37 derived snapshots
   ```

4. Verify:

   ```sql
   SELECT count(*) FROM apps;                                       -- expect 37
   SELECT count(*) FROM status_snapshots;                           -- expect 37
   SELECT slug, health_score FROM apps a
     JOIN status_snapshots s ON s.app_id = a.id
     WHERE a.slug = 'invoice-manager';                              -- expect 'broken'
   ```

5. Mark Phase 2 done in PLAN.md tracker, record SHA + sanity-check result, then mark PR #3 ready for merge.
6. Proceed to **Phase 3** (public showcase from real DB data) per PLAN.md.

## Locked decisions (do not relitigate)

- **Target**: Next.js on Netlify at `hub.cappsapps.ai` per `prototype/chats/chat1.md` (also see Design Session in the prototype). Not re-touching the prototype.
- **Repo layout**: same repo. Prototype kept under `/prototype/` (read-only design reference). Production app under `/app/`.
- **Notes source of truth**: `.cappshub/` files in each managed repo. Production reads via GitHub Contents API and caches in Neon `notes_cache` table.

## Stack

- Next.js 16.2.6 + React 19.2.4 + TypeScript strict + pnpm 10
- Drizzle ORM + `@neondatabase/serverless` (HTTP driver) + `@netlify/neon` (wrapper)
- zod (validation at boundaries only)
- Clerk (Phase 5) — newer pattern: `proxy.ts` with `clerkMiddleware()` from `@clerk/nextjs/server`, `<ClerkProvider>` inside `<body>`, `<Show when="signed-in|signed-out">`, `<UserButton>`, `<SignInButton>`. Source: https://clerk.com/docs/nextjs/getting-started/quickstart
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
| `GITHUB_TOKEN` (Netlify env) | done | classic PAT, scope `repo`, login `adam1capps`, stored secret |
| `CAPPSHUB_WEBHOOK_SECRET` (Netlify env) | done | 32-byte hex, secret |
| `CAPPSHUB_HOOK_TOKEN` (Netlify env) | done | 32-byte hex, secret |
| `X_TRIGGER_TOKEN` (Netlify env) | done | 32-byte hex, secret. Used by Phase 4 `/api/poll-now` |
| Neon project | **user creating now at neon.tech** | resume above when URLs arrive |
| Site public access | user toggling now | was 403 `host_not_allowed`; user flipping Site access → Public in Netlify UI |
| Clerk app + keys | pending user action | Required by Phase 5 only |
| DNS `hub.cappsapps.ai` | not started | Phase 14 cutover |

## MCP capabilities at handoff time

You may have more. Verify on session start.

- `mcp__github__*` — full PR/repo CRUD scoped to `adam1capps/capps-apps-command-center`
- `mcp__ed489899-...__netlify-*` — Netlify project / extension / team / user services. Can create sites, manage env vars, toggle visitor access. **Cannot** source-link or read secret env values back (returns `[]`).
- `mcp__214d5704-...__clerk_sdk_snippet*` — doc snippet lookup only, no provisioning
- Stripe, Bitly, Canva, Zoom, etc. — mostly not relevant to this build

If the new session has the **Netlify CLI** (`netlify`) available, that unlocks: source-link, `netlify db init`, `netlify env:list`, `netlify deploy --build`. Useful when MCP gaps bite.

## Sanity Check Protocol (SCP) — abbreviated

After EVERY merge into `implement-command-center`:

1. `git fetch && git checkout implement-command-center && git pull`
2. `cd app && pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm build`
3. Confirm Netlify deploy for the merge SHA is green
4. Run the cumulative smoke-test rows in PLAN.md (39 rows by end of port, currently 1)
5. Record result in PLAN.md tracker: `YYYY-MM-DDTHH:MMZ · green|yellow|red · short note`

If anything fails → fix forward or revert before starting the next phase.

## Subscription state

The previous session was subscribed to PR #3 activity (`<github-webhook-activity>` events). The new session may inherit this or need to re-subscribe via `mcp__github__subscribe_pr_activity`. When events arrive: investigate; fix if confident and small; ask if ambiguous; skip if no-op.

## Tone, working style

- The user values: structured plans, momentum, fast PR cadence, sanity checks after every merge. They merge quickly so design for incremental, reviewable commits.
- Update the PLAN.md tracker after every merge. The tracker is the single source of truth for "where are we."
- Prototype line references (`ui-detail.jsx:516-570`) are stable — quote them when porting.

## Quick-reference file tour

- `PLAN.md` — full implementation plan, 14 phases, ~900 lines. The map.
- `prototype/` — design source of truth, byte-identical to the original Design Session. Reference, do not edit.
- `app/db/schema.ts` — Drizzle schema (apps + status_snapshots)
- `app/db/seed-data.ts` — 37 apps, ported verbatim from `prototype/data.js:30-397`
- `app/db/seed.ts` — idempotent seeder
- `app/db/migrations/0000_uneven_snowbird.sql` — initial migration (drizzle-kit generated)
- `app/lib/derive.ts` — ported `deriveSnapshot` + `getIssues` (pure TS)
- `app/lib/tokens.ts` — brand palette (mirrors `prototype/ui-shared.jsx:3-31`)
- `app/lib/constants.ts` — `CATEGORIES`, `STAGES`, `STAGE_LABEL` (mirrors `prototype/data.js:6-24`)
- `app/AGENTS.md` — Next.js 16 breaking-changes warning (preserved verbatim from create-next-app)
