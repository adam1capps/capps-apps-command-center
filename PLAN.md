# Capps Apps Command Center — Prototype to Production Port Plan

## Context

This repo (`/home/user/capps-apps-command-center`, branch `claude/capps-command-center-jGch8`) currently holds a 17-file Babel-in-browser React prototype. It is byte-identical to the finished Claude Design Session bundle (README md5-verified file by file against `/tmp/design/app-command-center/project/`). The prototype is feature-complete on the UI surface; every behavior production must preserve is already there with line-level references.

Production has not been built. The brief in the Design Session (`chats/chat1.md` lines 25–183) scopes the production target: a Next.js app on Netlify at `hub.cappsapps.ai`, Clerk auth restricted to `@re-dry.com`, Neon Postgres with `apps` + `status_snapshots` tables, a Netlify Scheduled Function that polls every 6h, and a real `.cappshub/` integration (PostToolUse hook + GitHub webhook).

### Scope decisions (locked)

1. **Target**: Port to production per the brief. The prototype stops being the deployed site.
2. **Repo layout**: Same repo. Existing files move to `/prototype/` (read-only reference). Next.js app lives under `/app/`.
3. **Notes source of truth**: `.cappshub/` files in each managed repo. Command Center mirrors via GitHub Contents API and caches in Neon for fast reads. Writes flow GitHub → webhook → cache.

---

## How to read this plan

Read this document top-to-bottom on day one. After that, jump to the **"Where am I" tracker** at the bottom — it tells you the active phase, what shipped, and what is next.

Three rules govern every phase:

1. **The prototype is the design spec.** When a phase says "build the Grid view," do not invent layout — port `ui-views.jsx:4-63` and `ui-card.jsx:1-167` to TSX. The prototype matches the Design Session output byte-for-byte, so line numbers are stable references.
2. **No new behavior in phase N that wasn't in phase N-1's acceptance criteria.** If you find yourself wanting to "also wire up X," stop. X goes in its own phase.
3. **Every merge into `main` triggers the Sanity Check Protocol (SCP) below.** No exceptions. If the SCP fails, fix forward or revert before starting the next phase.

---

## Sanity Check Protocol (SCP) — run after every merge

Pre-flight checklist. Run from a freshly-pulled `main`. Time budget: ~5 minutes in early phases, ~10 minutes once auth/DB are in.

### A. Local build gate (must all pass)

```bash
cd /home/user/capps-apps-command-center
git fetch origin && git checkout main && git pull
cd app
pnpm install --frozen-lockfile
pnpm typecheck         # tsc --noEmit
pnpm lint              # eslint, must be 0 errors
pnpm build             # next build, must succeed
```

If any of these fail, the merge is broken. STOP and either fix forward or revert.

### B. Netlify deploy verification

1. Open the Netlify dashboard for the `hub.cappsapps.ai` site.
2. Find the deploy matching the merge commit SHA. It must be green.
3. Check function logs for the last 10 minutes — zero unhandled errors expected.
4. Open the deploy URL. Must render without console errors.

### C. Smoke test — the cumulative checklist

Each phase ADDS rows. Run the entire list each merge. Each item ≤30 seconds.

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| (none in Phase 0) | — | — | — |

(Phases 1–14 below specify "Adds to SCP smoke test" — append, never replace.)

### D. Regression sniff test

Open the production URL. Click through every navigation in the cumulative smoke test. Watch browser console. Open Network tab — no 4xx/5xx on first paint. Anything unexpected: file under Blockers in the tracker; decide fix-forward or revert.

### E. Record the SCP result

In the "Where am I" tracker, fill `last-sanity-check`:
- timestamp (ISO),
- result (`green` | `yellow` | `red`),
- short note (if yellow/red, what failed).

**green** = A–D all passed. **yellow** = non-blocking degradation with issue filed. **red** = reverting.

---

## Phase ordering rationale

Smallest deployable slice: a **public showcase served by Next.js from real seed data in Neon** — exercises Netlify, Neon, build, and brand styles without auth complexity. From there: poller → dashboard reads → auth → richer detail surfaces → notes → real `.cappshub/` integration → polish.

One adjustment from the brief's draft order: auth lands **before** the rich detail surfaces, not after the Grid. Once Grid shows live data, the next user-visible feature is the detail page, which has editable `next_move` and plan checkboxes. Editing without auth means migrating write paths twice — cheaper to gate `/dashboard` before mutations.

- Phase 0: Provisioning (Netlify site, Neon, Clerk, GitHub PAT) — no code.
- Phase 1: Repo reshape + Next.js skeleton + design tokens.
- Phase 2: Neon schema + seed migration from `data.js`.
- Phase 3: Public showcase route (`/`, no auth).
- Phase 4: Scheduled poller writing real `status_snapshots`.
- Phase 5: Clerk auth + `/dashboard` shell + Grid view (read-only).
- Phase 6: Pipeline + Needs Attention views + search polish.
- Phase 7: App detail page (read-mostly, mutations land in 8).
- Phase 8: Editable next_move + plan checkboxes + blocker UI.
- Phase 9: Notes modal + full-page editor backed by Neon.
- Phase 10: `.cappshub/` GitHub Contents reads + cache table.
- Phase 11: GitHub webhook (push → cache invalidate).
- Phase 12: `/api/cappshub-events` Netlify Function for the PostToolUse hook.
- Phase 13: Slash command + hook docs + dogfood.
- Phase 14: Polish + DNS cutover.

14 phases. 1–4 PRs per phase, ~30 PRs total. Each phase is independently mergeable and reversible.

---

## Phase 0: Provisioning

**Goal.** Stand up external services so subsequent phases have credentials.

**Build.**

1. **Netlify site**: new site bound to this GitHub repo. Build command `cd app && pnpm build`, publish `app/.next`, Node 20. `@netlify/plugin-nextjs` auto-detected (verify in build settings). Queue `hub.cappsapps.ai` as custom domain but do NOT cut DNS yet — Phase 14 owns that. Pin a placeholder subdomain like `cappsapps-cc.netlify.app`.
2. **Neon project**: `capps-command-center`, US-East. Grab pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED`. Add both to Netlify env.
3. **Clerk app**: email auth only. Allowlist email domain `re-dry.com` (Clerk → User & Authentication → Email, Phone, Username → Restrictions → Allowlist). Capture `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` into Netlify env.
4. **GitHub PAT**: classic (or fine-grained) with `repo` scope. Set as `GITHUB_TOKEN` in Netlify env.
5. Generate random `CAPPSHUB_WEBHOOK_SECRET` and `CAPPSHUB_HOOK_TOKEN`. Add both to Netlify env.

**Acceptance criteria.**
- Netlify site exists with a green hello-world deploy on the placeholder subdomain.
- `psql $DATABASE_URL` connects from your laptop.
- Clerk test user `adam@re-dry.com` can sign in to the Clerk dashboard.
- `curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user` returns 200.

**Sanity-check protocol.** No merge in this phase — provisioning is out-of-band. Confirm credentials saved to a password manager and recorded in the Provisioning Checklist below.

**Rollback path.** N/A. Provisioning is reversible at any time via service dashboards.

**Estimated PR count.** 0 (no code).

---

## Phase 1: Repo reshape + Next.js skeleton

**Goal.** Move the prototype to `/prototype/` (kept for diff reference) and stand up `/app/` as a Next.js 15 project with brand tokens. Deploy must be green and serve a placeholder homepage.

**Build.**

1. Create `/prototype/` and move all current top-level files (`index.html`, `*.jsx`, `*.js`, `assets/`, `ds/`) into it.
2. Create `/app/` as a Next.js 15 project. App Router. TypeScript strict. ESLint + Prettier.
3. Stack choices (opinionated):
   - Package manager: **pnpm**.
   - DB client: `@neondatabase/serverless` (HTTP driver, edge-friendly).
   - ORM: `drizzle-orm` + `drizzle-kit`.
   - Auth: `@clerk/nextjs` v6+.
   - Validation: `zod` for API input.
   - Styling: inline styles ported one-to-one from prototype; a single `app/globals.css` for keyframes (port from `index.html:25-55`) and font import. No CSS-in-JS layer.
4. Port `ds/tokens.css` to `app/app/globals.css` as CSS custom properties + the four `@keyframes` (`ccFade`, `ccSlideUp`, `ccConnPulse`, `ccPulse`).
5. Create `app/lib/tokens.ts` exporting a TypeScript `CC` constant byte-identical to `ui-shared.jsx:3-31`. Single source of truth for all colors.
6. Create `app/lib/constants.ts` with `CATEGORIES`, `STAGES`, `STAGE_LABEL`, `STAGE_TINT`, `HEALTH` lifted verbatim from `data.js:6-24` and `ui-shared.jsx:33-49`.
7. Create `app/app/layout.tsx`: `<html lang="en">`, DM Sans + Space Mono via `next/font`, white background `#FFFFFF`, text `#0F172A`, antialiased.
8. Create `app/app/page.tsx` with the literal text "Capps Apps Command Center — production app coming online."
9. Root `netlify.toml`:
   ```toml
   [build]
     base = "app"
     command = "pnpm install --frozen-lockfile && pnpm build"
     publish = "app/.next"
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```
10. Create `app/.env.example` listing every env var the eventual app will read.

**Acceptance criteria.**
- `pnpm dev` from `/app/` serves the placeholder at localhost.
- `pnpm build && pnpm start` works locally.
- Netlify deploys green on push.
- Placeholder subdomain shows the placeholder text in DM Sans on pure white.
- `/prototype/index.html` is preserved but not served as the site root.

**Sanity-check protocol.** Full SCP A–E.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 1 | `/` renders placeholder text in DM Sans | Phase 1 | No console errors, white background, computed font-family is DM Sans |

**Rollback path.** Revert merge commit. Prototype was relocated, not modified, so `git revert` restores the old root layout. Netlify redeploys the previous root-publish state. Validate on the placeholder subdomain.

**Estimated PR count.** 2.
- PR 1: Move prototype → `/prototype/` and update `.gitignore`; keep deploy on prototype temporarily.
- PR 2: `/app/` skeleton + new `netlify.toml` + tokens + globals.

---

## Phase 2: Neon schema + seed migration

**Goal.** Define `apps` and `status_snapshots` tables, seed from `data.js`, expose a typed Drizzle client. No UI changes.

**Build.**

1. Install `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `postgres` (migration runner).
2. Create `app/db/schema.ts` with two tables (schemas per `chat1.md` lines 44–71):
   - `apps` — id, slug (unique), name, category, description, live_url, custom_domain, github_repo, hosting, stage, visible_on_showcase, next_move, blockers, api_dependencies (text[]), created_at, updated_at.
   - `status_snapshots` — id, app_id (FK), checked_at, url_status, url_response_ms, last_commit_at, last_commit_msg, days_since_commit, health_score, drift_detected.
3. Create `app/db/client.ts` exporting a Drizzle client backed by `@neondatabase/serverless` HTTP driver.
4. Create `app/db/seed.ts` reading a TS-literal copy of the `APPS` array at `app/db/seed-data.ts` (ported from `data.js`). Insert all 37 apps + one initial snapshot per app based on the prototype's `snap` field.
5. Add npm scripts to `app/package.json`: `db:generate`, `db:migrate`, `db:seed`.
6. Run migrations and seed against Neon. One-time action.
7. Port `deriveSnapshot` (`data.js:399-432`) and `getIssues` (`data.js:438-489`) to `app/lib/derive.ts` as pure TS functions. Used both at seed time and by the poller.

**Acceptance criteria.**
- `SELECT count(*) FROM apps;` returns 38.
- `SELECT count(*) FROM status_snapshots;` returns 38.
- `SELECT slug, health_score FROM apps a JOIN status_snapshots s ON s.app_id = a.id WHERE a.slug='invoice-manager';` returns `broken` (invoice-manager has url_status 500 in seed).
- `pnpm build` still passes — schema files typed.

**Sanity-check protocol.** Full SCP. Build must stay green. No new UI to test.

**Adds to SCP smoke test:** none. No user-visible surface.

**Rollback path.** Revert merge. Neon database persists but is ahead of code — fine because nothing reads it yet. For a clean slate: `DROP TABLE status_snapshots; DROP TABLE apps;` and re-seed after revert is reverted.

**Estimated PR count.** 1.

---

## Phase 3: Public showcase route

**Goal.** `/` renders the showcase view from real DB data. No auth, no dashboard. Visually identical to `ui-showcase.jsx:5-125`.

**Build.**

1. Port `ui-showcase.jsx` to `app/app/page.tsx` + components under `app/components/showcase/`:
   - `ShowcaseView.tsx` (`ui-showcase.jsx:5-125`)
   - `ShowcaseCard.tsx` (`ui-showcase.jsx:164-205`)
   - `Stat.tsx` (`ui-showcase.jsx:127-144`)
   - `ShowcaseSectionHeader.tsx` (`ui-showcase.jsx:146-162`)
   - `PublicHeader.tsx` + `PublicFooter.tsx` (`app.jsx:362-418`)
2. Server component fetches apps with `visible_on_showcase = true AND stage != 'archive' AND live_url IS NOT NULL`.
3. Brand rule from the brief: pure white `#FFFFFF` background, no em dashes anywhere in copy.
4. The Sign-in button in `PublicHeader` (`ui-showcase.jsx` line 386 area): Phase 3 ships a plain `<a href="/sign-in">` that 404s pre-Clerk. Phase 5 swaps in `<SignInButton mode="redirect" />` from `@clerk/nextjs` pointing at `/sign-in`.
5. CTA card (line 99–122) keeps the `cappsapps.ai` external link verbatim. Brand color `#D4E04F` exact.

**Acceptance criteria.**
- `/` shows the showcase at the placeholder subdomain.
- Apps displayed: only `visible_on_showcase && stage !== 'archive' && live_url` (~15 from seed).
- Each section has correct accent color bar and category label.
- Card hover lifts 2px and shows the navy border (`ui-showcase.jsx:170-178`).
- Footer shows "© 2026 Capps Apps · adam capps".
- No Babel warnings, no React hydration warnings.
- Background is pure `#FFFFFF`.

**Sanity-check protocol.** Full SCP.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 2 | `/` shows showcase grid | Phase 3 | ≥5 cards visible, grouped by brand, accent bars correct |
| 3 | Stats strip shows 4 numbers | Phase 3 | Apps shipped / Live URLs / Custom domains / APIs all > 0 |
| 4 | Each ShowcaseCard links to `live_url` in new tab | Phase 3 | `target="_blank" rel="noopener"`, click opens external site |
| 5 | No em dashes anywhere | Phase 3 | `grep '—'` in rendered HTML returns nothing |

**Rollback path.** Revert merge. `/` returns to placeholder text. Nothing else affected — dashboard not built yet.

**Estimated PR count.** 1–2.

---

## Phase 4: Scheduled poller writing real status_snapshots

**Goal.** A Netlify Scheduled Function runs every 6h and writes a fresh `status_snapshots` row per app. Showcase keeps working.

**Build.**

1. Create `app/netlify/functions/poll-status.ts` as a Scheduled Function with cron `0 */6 * * *`.
2. For each app row:
   - If `live_url` is null: insert snapshot with `url_status=null`, derive other fields from absence.
   - Else: `fetch(live_url, { method: 'HEAD', signal: AbortSignal.timeout(8000) })`. Record status + elapsed ms. On error, status = 0.
   - If `github_repo` non-null: GET `/repos/{owner}/{repo}/commits?per_page=1` with `Authorization: Bearer $GITHUB_TOKEN`. Extract `committer.date` + `message`.
3. Call `deriveSnapshot` from `app/lib/derive.ts` with fresh inputs, insert one row per app.
4. Per-app try/catch — one failure must not abort the whole run. Log to function logs.
5. Add manual-trigger endpoint `app/app/api/poll-now/route.ts` gated by `X-Trigger-Token` env-var secret. Useful for testing without waiting 6h.
6. Don't expose snapshot data in the UI yet — Phase 5 reads it from `/dashboard`.

**Acceptance criteria.**
- Manual `curl -X POST -H "X-Trigger-Token: ..." https://<subdomain>/api/poll-now` returns 200 within 30s.
- After a manual run, `SELECT count(*) FROM status_snapshots;` is ≥76.
- A row for `invoice-manager` shows the real current HTTP status of `https://invoice.re-dry.com`.
- A row for `proposals-roofmri` has `last_commit_at` matching the most recent commit on its real GitHub repo.
- Function logs show per-app timing, no unhandled exceptions.
- GitHub rate limit usage logged at end of each run.

**Sanity-check protocol.** Full SCP + trigger `/api/poll-now` once and confirm a fresh row landed.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 6 | `/api/poll-now` (with secret header) returns 200 | Phase 4 | New snapshot rows visible in Neon |

**Rollback path.** Revert merge. Netlify Scheduled Function unregisters on next deploy. Existing snapshot rows stay — fine, labeled with `checked_at`. To clean: `DELETE FROM status_snapshots WHERE checked_at > '<merge-time>';`.

**Estimated PR count.** 1.

---

## Phase 5: Clerk auth + /dashboard shell + Grid view (read-only)

**Goal.** A signed-in user with `@re-dry.com` email can visit `/dashboard` and see the Grid view rendering apps from Neon. Public showcase unaffected.

**Build.** (Follows current Clerk pattern per https://clerk.com/docs/nextjs/getting-started/quickstart — `proxy.ts`, `clerkMiddleware()`, `<Show>`, `<UserButton>`.)

1. `pnpm add @clerk/nextjs`. Place `<ClerkProvider>` **inside `<body>`** in `app/app/layout.tsx` (not wrapping `<html>`). Create `app/proxy.ts` at the app root using `clerkMiddleware()` from `@clerk/nextjs/server` to protect `/dashboard/**` and `/app/[slug]/**`. Public routes: `/`, `/sign-in`, `/sign-up`. Use the matcher shape from the Clerk quickstart (excludes static assets and includes API routes).
2. Belt-and-suspenders: server-side double-check email domain in `proxy.ts` before passing through — sign out if not `@re-dry.com`. Pair with Clerk dashboard allowlist.
3. Create `app/app/sign-in/[[...sign-in]]/page.tsx` using `<SignIn>`, styled navy. Header buttons elsewhere use `<SignInButton>` / `<SignUpButton>` from `@clerk/nextjs`.
4. Create `app/app/dashboard/page.tsx`:
   - Server fetch all apps + latest snapshot via LATERAL join (one query).
   - Pass to `<DashboardClient apps={apps} />`.
5. Port `DashHeader` from `app.jsx:159-261` to `app/components/dash/Header.tsx`. Replace the prototype's custom user badge with `<UserButton>` from `@clerk/nextjs` (canonical Clerk pattern; preserves brand by passing `appearance` prop with our navy tokens). Use `<Show when="signed-in">` / `<Show when="signed-out">` for conditional sign-in state. "Polled" timestamp uses latest `checked_at` across all apps via `currentUser()` from `@clerk/nextjs/server` for server-rendered identity if needed.
6. Port `ViewSwitcher` (`app.jsx:286-334`) and `Legend` (`app.jsx:336-358`). Only Grid wired in this phase — Pipeline/Attention buttons render a placeholder.
7. Port `GridView` (`ui-views.jsx:4-63`) and `SectionHeader` (`ui-views.jsx:65-85`).
8. Port `AppCard` (`ui-card.jsx:1-167`). **Read-only** — `onEditNext` wired but no-ops; hover overlay shows but inline edit doesn't persist. Card click navigates to `/app/[slug]` (Phase 7 creates the route; 404s here is acceptable).
9. Port `HealthDot`, `StagePill`, `CategoryPill`, `ApiChip`, `HostingMark` (`ui-shared.jsx:69-134`). Server-render-safe.
10. Implement search (`app.jsx:64-76`) as client-side filter, debounced 150ms.
11. `NotesButton` (`ui-notes.jsx:53-82`) included on cards with `count=0`, no-op click (Phase 9 wires it).

**Acceptance criteria.**
- `/dashboard` while signed out redirects to `/sign-in`.
- Sign-in succeeds for `@re-dry.com`, fails for any other email.
- `/dashboard` renders navy header, search, tab switcher, Grid view, category sections.
- All 37 apps visible across category sections.
- Search "stripe" filters to apps mentioning Stripe.
- Hover overlay (`ui-card.jsx:102-163`) appears with "Next move" label and `last deploy X ago · Yms`.
- Console clean, no hydration warnings.

**Sanity-check protocol.** Full SCP + sign-out/refresh test + reject non-allowlist email.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 7 | `/dashboard` redirects to `/sign-in` when logged out | Phase 5 | 302 to `/sign-in` |
| 8 | After signing in with `@re-dry.com`, `/dashboard` renders | Phase 5 | Navy header + Grid + 38 cards |
| 9 | Search "stripe" filters cards | Phase 5 | Only apps with Stripe in description/deps remain |
| 10 | Health dot pulses on broken apps | Phase 5 | `invoice-manager` has red dot with `ccPulse` animation |

**Rollback path.** Revert merge. `/dashboard` 404s. `/sign-in` may persist as a stub — harmless. Public showcase unaffected.

**Estimated PR count.** 2.
- PR A: Clerk integration + middleware + sign-in page.
- PR B: Dashboard shell + Grid view + AppCard read-only port.

---

## Phase 6: Pipeline + Needs Attention views + search polish

**Goal.** Wire the other two dashboard views. View state survives reloads via URL (`?view=pipeline`).

**Build.**

1. Port `PipelineView` (`ui-views.jsx:88-172`) and `PipelineCard` (`ui-views.jsx:174-203`). Category filter pill row.
2. Port `AttentionView` (`ui-views.jsx:285-352`), `SummaryStat` (`ui-views.jsx:354-370`), `IssueRow` (`ui-views.jsx:372-448`). "Mark resolved" uses local React state Set of issue keys — per-session, not persisted (matches prototype). "Undo" restores.
3. Replace `t.view` state in `app.jsx:136-138` with URL search param `?view=grid|pipeline|attention`. ViewSwitcher pushes via `useRouter()`.
4. `attentionCount` badge (`app.jsx:299-321`) reads `getIssues` for each app server-side; pass down once.
5. **Tweaks panel NOT ported.** Design Session affordance; production has no tweaks UI. EDITMODE markers dropped; `app/lib/constants.ts` is the source of truth.

**Acceptance criteria.**
- Clicking "Pipeline" updates URL to `?view=pipeline`, renders 7 swimlanes (`idea` → `archive`).
- Each swimlane shows matching apps as compact cards with category accent stripe.
- "Needs Attention" shows 5-bucket summary row + issue list.
- `invoice-manager` appears under "Broken" with the 500 status detail.
- Apps with `live_url && !github_repo` appear under "Drift".
- "Mark resolved" hides a row; "undo" restores.
- Refresh preserves selected view via URL.

**Sanity-check protocol.** Full SCP.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 11 | `?view=pipeline` shows 7 swimlanes | Phase 6 | All stages have headers; counts match seed |
| 12 | `?view=attention` shows 5 buckets + issue list | Phase 6 | Broken > 0, Drift > 0 |
| 13 | Mark resolved hides a row | Phase 6 | Count decreases by 1, undo restores |
| 14 | Attention badge shows total issue count | Phase 6 | Matches sum of buckets |

**Rollback path.** Revert merge. Grid still works. Pipeline/Attention go away.

**Estimated PR count.** 1.

---

## Phase 7: App detail page (read-mostly)

**Goal.** Click any card → navigate to `/app/[slug]` showing the full detail view. All sections render but most are still synthetic data from a ported `intelFor` (replaced incrementally later).

**Build.**

1. Port `app-intel.js` to `app/lib/intel.ts`. **Caveat:** still deterministic-from-slug fake data for everything except commits (already real from poller). Each function carries `// TODO(real-data): Phase X`:
   - `commits` → read `status_snapshots.last_commit_at` + future `commit_history` table (Phase 10).
   - `deploys` → Netlify Deploys API (future).
   - `database` → static config table (future).
   - `api_usage` → Plausible + per-API logs (future).
   - `traffic` → Plausible API (future).
   - `hosting.env_var_names` → Netlify env API (future).
   - `plan` → `.cappshub/plan.json` (Phase 10).
2. Create `app/app/app/[slug]/page.tsx`: server component, `params.slug` lookup, 404 if not found, fetch app + latest snapshot, pass to `<AppDetailClient app={app} intel={intel} />`.
3. Port `AppDetailPage` from `ui-detail.jsx:8-317` to `app/components/detail/AppDetailPage.tsx`. Each sub-component to its own file under `app/components/detail/`:
   - `Row`, `Card`, `QuickStat`, `IssuesBanner`, `ActivityFeed`, `RepositoryPanel`, `DatabasePanel`, `HostingPanel`, `ApiUsagePanel`, `TrafficPanel`.
4. Editable bits visually present but **not yet mutating server state**:
   - Next move click-to-edit → local React state, "save not implemented yet" hint.
   - Plan checkboxes → toggle local state only.
   - Notes count → still 0.
5. Integration card and notes preview render placeholder/empty states.
6. Sticky top bar matches `ui-detail.jsx:35-85`: back, breadcrumb, repo + launch buttons.
7. Below ~960px, the 2-column `Row` grid collapses to single column via media query in `app/globals.css`. Prototype was desktop-only; this is a minor extension.

**Acceptance criteria.**
- `/app/proposals-roofmri` renders the full detail page.
- Hero shows correct category accent, stage pill, hosting label.
- Quick-stat strip has HTTP, response, commits, tables, APIs, notes.
- Activity feed shows real `last_commit_at` from snapshot.
- Repo panel shows 12-week sparkline (still synthetic) + language bar.
- Issues banner appears for apps with issues (e.g. `invoice-manager`).
- ESC key closes back to `/dashboard`.
- "← Command Center" navigates back.

**Sanity-check protocol.** Full SCP.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 15 | Clicking a Grid card navigates to `/app/[slug]` | Phase 7 | URL updates, detail page renders |
| 16 | Detail page shows all sections | Phase 7 | Hero, stats, next-move, plan, activity, repo, db, hosting, apis, traffic, integration, notes |
| 17 | ESC navigates back | Phase 7 | Goes to `/dashboard` |
| 18 | Issues banner appears for `invoice-manager` | Phase 7 | Yellow banner with broken issue |

**Rollback path.** Revert merge. `/app/[slug]` 404s. Dashboard cards navigate nowhere — handle gracefully (wrap `router.push` in try, or render to placeholder).

**Estimated PR count.** 2–3.
- PR A: Port `app-intel.js` to TS, set up `/app/[slug]` route shell.
- PR B: Port hero + quick-stats + next-move + plan cards.
- PR C: Port activity, repo, db, hosting, api, traffic panels.

---

## Phase 8: Editable next_move + plan checkboxes + blocker management

**Goal.** The two most important inline edits on the detail page persist to Neon. Cards and detail page reflect saved state across reloads.

**Build.**

1. Schema additions: store the plan as a JSONB column on `apps.plan` (preserves `[{id, done, text}]` shape; avoids a separate fetch; can migrate to a table later if needed).
2. Migrate existing rows to seed `plan` from `PLAN_TEMPLATES` in `app-intel.js:141-234`.
3. API routes:
   - `PATCH /api/apps/[slug]/next-move` body `{ next_move: string | null }` → 204.
   - `PATCH /api/apps/[slug]/plan` body `{ plan: PlanItem[] }` → updated plan.
   - `PATCH /api/apps/[slug]/blockers` body `{ blockers: string | null }` (for future bulk-edit; UI keeps prototype read-only behavior).
4. All three routes:
   - `auth()` from Clerk → 401 without session.
   - zod-validate body.
   - Log to `change_log` table (id, app_id, actor_email, field, old, new, changed_at). Audit trail.
5. Wire `AppDetailPage` next-move input + plan checkboxes to these routes. Optimistic UI: update local state immediately, roll back on error.
6. Card hover overlay's inline edit (`ui-card.jsx:131-162`) also calls `/api/apps/[slug]/next-move`.
7. "saved · 2s ago" indicator near next-move field.

**Acceptance criteria.**
- Edit next_move on a card → reload → still shows the edit.
- Edit next_move on the detail page → reload → still shows.
- Toggle a plan checkbox → reload → still toggled.
- "X / Y done" counter updates.
- `change_log` has rows reflecting each edit with signed-in user's email.
- Unauthenticated PATCH returns 401.

**Sanity-check protocol.** Full SCP + end-to-end edit test.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 19 | Editing next_move persists across reload | Phase 8 | Type, blur, refresh, value retained |
| 20 | Toggling a plan checkbox persists | Phase 8 | Check, refresh, still checked |
| 21 | Unauthenticated `PATCH /api/apps/.../next-move` returns 401 | Phase 8 | curl without cookie → 401 |

**Rollback path.** Revert merge. Edits stop persisting (revert to local state). Schema additions remain — harmless. To fully roll back, drop `change_log` table; `apps.plan` column can stay (later phases use it).

**Estimated PR count.** 2.

---

## Phase 9: Notes modal + full-page editor backed by Neon

**Goal.** Notes button on every card opens a modal with the full notes list for that app. Full-page editor at `/app/[slug]/notes/[noteId]`. All data in Neon — no localStorage.

**Build.**

1. Schema:
   ```sql
   notes (
     id uuid pk,
     app_id uuid fk,
     kind text check (kind in ('instruction','note')),
     title text,
     body text,
     source text default 'manual',  -- manual | slash-command | hook | claude-md
     repo_path text,
     commit_sha text,
     created_at timestamptz default now(),
     updated_at timestamptz default now(),
     created_by_email text
   )
   ```
2. Seed notes table with the prototype's `SEED` from `notes-store.js:13-68` so the dashboard has realistic data day-one.
3. API routes:
   - `GET /api/apps/[slug]/notes` → array sorted by `updated_at DESC`.
   - `POST /api/apps/[slug]/notes` → `{ kind, title, body }` → created note.
   - `PATCH /api/notes/[id]` → `{ kind?, title?, body? }` → updated.
   - `DELETE /api/notes/[id]` → 204.
4. Port `NotesModal` (`ui-notes.jsx:97-267`) to `app/components/notes/NotesModal.tsx`. Portal so it stacks above the detail page.
5. Port `NoteRow` (`ui-notes.jsx:279-354`) and `NoteEditor` (`ui-notes.jsx:367-458`).
6. Port `NotePage` (`ui-notes.jsx:462-705`) to `app/app/app/[slug]/notes/[noteId]/page.tsx`. Right-rail "other notes" links via `<Link>` instead of the prototype's `cc-open-note` event.
7. Autosave (`ui-notes.jsx:474-486`): debounced 600ms PATCH on edit. "saved/saving" indicator.
8. `NotesButton` count (`ui-notes.jsx:53-82`) reads from a SWR or server-fetched per-card prop. Revalidate on save/delete.
9. Update `AppDetailPage` notes preview (`ui-detail.jsx:262-312`) to fetch latest 4 notes server-side.

**Acceptance criteria.**
- Click Notes on a card → modal opens listing notes for that app.
- "+ Note" → editor expands, type title and body, Save → note appears and persists.
- Click a row → editor expands inline.
- Cmd-click a row → navigates to full-page editor.
- Full-page editor autosaves as you type.
- Delete from full-page → confirm → returns to detail, note gone.
- Notes count badge on cards updates.
- Clearing localStorage does not lose notes.

**Sanity-check protocol.** Full SCP + verify localStorage independence.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 22 | Notes modal opens for any app | Phase 9 | Click Notes → modal with list |
| 23 | Adding a note persists | Phase 9 | Save, reload, note still there |
| 24 | Notes count badge reflects DB count | Phase 9 | Add note → badge increments without manual refresh |
| 25 | Clearing localStorage does not lose notes | Phase 9 | `localStorage.clear()`, reload, notes still present |

**Rollback path.** Revert merge. Notes buttons return to no-ops. `notes` table stays in Neon — harmless.

**Estimated PR count.** 2.

---

## Phase 10: `.cappshub/` GitHub Contents reads + cache table

**Goal.** Integration card on the detail page reads real `.cappshub/instructions.md`, `.cappshub/plan.json`, `.cappshub/notes/*.md`, and `CLAUDE.md` from each managed repo via the Contents API. Cached in Neon.

**Build.**

1. Schema:
   ```sql
   notes_cache (
     id uuid pk,
     app_id uuid fk,
     repo_path text,
     content text,
     sha text,
     fetched_at timestamptz default now(),
     unique (app_id, repo_path)
   )
   ```
2. `app/lib/github.ts`:
   - `getRepoContents(owner, repo, path)` — Contents API wrapper, returns `{text, sha}` or null on 404.
   - `listDirContents(owner, repo, path)` — for `.cappshub/notes/`.
3. `app/lib/cappshub.ts`:
   - `getInstructionsFor(slug)` — checks cache freshness (<5 min); refreshes if stale.
   - `getPlanFor(slug)`, `listNotesFor(slug)`, `getClaudeMdFor(slug)` — same pattern.
4. Detail page's `IntegrationCard` (stubbed in Phase 7) now renders these contents in the 4 tabs (instructions / plan / notes / CLAUDE.md) per `ui-integration.jsx:127-253`.
5. Port the history selector (`ui-integration.jsx:174-235`) for the notes tab. v1: each note file is one entry; "history N back" works on list of distinct note files (not file revisions). Per-file revision history via GH commit history → defer to polish.
6. Plan card on the detail page: if `.cappshub/plan.json` exists, prefer it over `apps.plan` column. Show a small "synced from .cappshub/" label when sourced from GitHub. Edits still PATCH Neon — Phase 12 closes the write-back loop.

**Acceptance criteria.**
- App with real GitHub repo and `.cappshub/instructions.md` shows actual contents in the instructions tab.
- App without `.cappshub/` shows "no `.cappshub/` folder found" empty state with a non-functional "Create one" button (Phase 12 wires it).
- Reloads within 5min hit cache (verify via GH rate-limit headers).
- After 5min, next page load refreshes cache.
- Plan card shows `.cappshub/plan.json` if present, fallback `apps.plan`.

**Sanity-check protocol.** Full SCP + create a real `.cappshub/` folder in one test repo and verify it shows up.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 26 | Integration card shows real `.cappshub/instructions.md` for at least one app | Phase 10 | Tab content matches GitHub repo |
| 27 | Apps without `.cappshub/` show empty state | Phase 10 | "No .cappshub/ folder" message |
| 28 | Cache prevents repeated GitHub calls | Phase 10 | Reload within 5min: GH rate-limit headers unchanged |

**Rollback path.** Revert merge. Integration card returns to placeholder. `notes_cache` table stays — harmless.

**Estimated PR count.** 2.

---

## Phase 11: GitHub webhook (push → cache invalidate)

**Goal.** Push to a managed repo invalidates cache immediately for that repo. No more waiting up to 5 minutes.

**Build.**

1. Create `app/app/api/github-webhook/route.ts`. POST endpoint that:
   - Verifies `X-Hub-Signature-256` against `CAPPSHUB_WEBHOOK_SECRET`. Reject 401 on mismatch.
   - Parses `push` event payload.
   - For each modified file in commits matching `.cappshub/*` or `CLAUDE.md`: invalidate the corresponding `notes_cache` row.
   - Records an event in `integration_events` (pre-create table here even though Phase 12 owns its main use).
2. Document the per-repo webhook config:
   - Path: `Settings → Webhooks → Add webhook`.
   - Payload URL: `https://hub.cappsapps.ai/api/github-webhook`.
   - Content type: `application/json`.
   - Secret: paste `CAPPSHUB_WEBHOOK_SECRET`.
   - Events: just `push`.
3. Create `scripts/install-webhooks.ts` using the PAT to install on all `github_repo` values automatically. Run locally, not deployed.
4. Verify by pushing a no-op commit to one repo and watching Netlify function logs.

**Acceptance criteria.**
- Pushing a commit modifying `.cappshub/notes/foo.md` to a managed repo invalidates that app/path within 5s.
- Next page load reflects new content.
- Fake webhook with wrong signature → 401.

**Sanity-check protocol.** Full SCP + verify end-to-end on one real repo.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 29 | Push to managed repo's `.cappshub/` invalidates cache | Phase 11 | Detail page reflects new content within 5s |
| 30 | Webhook with wrong signature is rejected | Phase 11 | curl with bad signature → 401 |

**Rollback path.** Revert merge. Endpoint 404s. GH retries the webhook for a while — harmless. Optionally run `scripts/uninstall-webhooks.ts` to clean up.

**Estimated PR count.** 1.

---

## Phase 12: `/api/cappshub-events` for the PostToolUse hook

**Goal.** Claude Code's PostToolUse hook POSTs to our endpoint on every edit. We log the event, optionally update a relevant note record, and emit a real-time "fresh sync" signal back to the dashboard.

**Build.**

1. Schema:
   ```sql
   integration_events (
     id uuid pk,
     app_id uuid fk,
     kind text,   -- hook | slash-command | manual | push | claude-md | plan-update | instruction
     text text,
     actor text,
     repo_path text,
     commit_sha text,
     created_at timestamptz default now()
   )
   ```
2. Create `app/app/api/cappshub-events/route.ts`:
   - POST with body `{slug, kind, text, actor, repo_path?, commit_sha?}`.
   - Require `Authorization: Bearer $CAPPSHUB_HOOK_TOKEN`.
   - Insert into `integration_events`.
   - If `kind` indicates a notes-relevant change AND `repo_path` is a note path: enqueue a `notes_cache` refresh (or call the Phase 10 helper directly).
   - Return 204.
3. Server-Sent Events at `GET /api/events/stream` (or Netlify's edge SSE pattern). Clients connect, get 30s heartbeats, get pushed any new `integration_events`. Used by:
   - Dashboard header "Claude Code" connection pill.
   - SyncToast (`ui-integration.jsx:571-615`).
4. Port `SyncToast` from prototype, fed by SSE. New event lands → toast for 5.2s (matches `app.jsx:55`).
5. Port global integration page (`ui-integration.jsx:289-506`) to `app/app/integration/page.tsx`. Hero, stats, slash commands, hook config, `.cappshub/` spec, live event stream, connected repos.

**Acceptance criteria.**
- `curl -X POST -H "Authorization: Bearer $CAPPSHUB_HOOK_TOKEN" -d '{...}' https://hub.cappsapps.ai/api/cappshub-events` → 204.
- New event appears in `integration_events`.
- Dashboard SyncToast pops up within 2s.
- `/integration` page shows the event in the live stream.
- Request without bearer → 401.

**Sanity-check protocol.** Full SCP + manual hook test.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 31 | POST `/api/cappshub-events` with valid token returns 204 | Phase 12 | New row in `integration_events` |
| 32 | Dashboard SyncToast fires after a POST | Phase 12 | Toast appears within 2s |
| 33 | `/integration` page renders live event stream | Phase 12 | Event from step 31 visible |
| 34 | Unauthorized POST returns 401 | Phase 12 | curl without bearer → 401 |

**Rollback path.** Revert merge. Endpoint 404s. Claude Code's hook fails silently (curl pipes errors to /dev/null in prototype hook config, `cc-integration.js:62-67`). SyncToast disappears.

**Estimated PR count.** 2.
- PR A: Backend (events table, POST, SSE stream).
- PR B: Frontend (SyncToast + integration page).

---

## Phase 13: Slash command + hook documentation + dogfood

**Goal.** Documentation is the implementation. Slash commands live in each repo's `.claude/commands/`, not in this app. We document them, ship the hook config snippet, and dogfood by installing the hook on this very repo first.

**Build.**

1. Integration page (Phase 12) already shows slash-command reference + hook-config JSON. Verify the JSON in `cc-integration.js:53-85` is current; port verbatim.
2. "Copy" button on the hook config copies the JSON to clipboard (prototype already has it at `ui-integration.jsx:399-401`).
3. Create `docs/setup-claude-code-hook.md` — quick-start explaining how to install hook config in `~/.claude/settings.json` and define `$CAPPSHUB_URL` + `$CAPPSHUB_TOKEN` env vars.
4. Install the hook on this repo first (dogfood). Edit a `.cappshub/*` file here → Command Center records an event for this repo.
5. Add this repo to the apps table if not already there (slug `command-center` or similar). Mark `visible_on_showcase = false`.

**Acceptance criteria.**
- Integration page lists `/note`, `/instruct`, `/plan`, `/sync` with descriptions.
- Hook config JSON is copyable.
- Editing a file in this repo from Claude Code fires an event visible on `/integration`.
- Setup doc renders correctly in GitHub.

**Sanity-check protocol.** Full SCP + manually exercise the dogfood loop.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 35 | Integration page Copy button copies JSON | Phase 13 | Verify clipboard via `pbpaste` or paste |
| 36 | Dogfood event flow works end-to-end | Phase 13 | Edit a file in this repo from Claude Code → SyncToast on `/dashboard` |

**Rollback path.** Revert merge. Docs disappear; the underlying endpoint (Phase 12) is unaffected.

**Estimated PR count.** 1.

---

## Phase 14: Polish + DNS cutover

**Goal.** Final polish. Cut DNS for `hub.cappsapps.ai` to the new Netlify site.

**Build.**

1. **Brand audit pass** — grep codebase for:
   - Em dashes (`—`). Replace with periods or sentence splits. Zero user-visible em dashes.
   - Em dash in dynamic copy generators (`notes-store.js:24` uses `—` in a date placeholder; replace with `n/a`).
   - Off-brand colors. Anything outside `CC.*` and `CATEGORIES.*` palette flagged.
2. **Accessibility quick pass**:
   - All interactive elements have visible focus rings (`:focus-visible` outline). Prototype has `outline: none` on inputs (`app.jsx:202`) — restore browser default `:focus-visible`.
   - HealthDot has `aria-label` matching `HEALTH[score].label`.
   - Keyboard nav: tab order through dashboard, sign-in.
3. **Animation parity**: verify all four keyframes (`ccFade`, `ccSlideUp`, `ccConnPulse`, `ccPulse`) fire where prototype fires them. Open prototype in one tab, prod in another, diff visually.
4. **Mobile/tablet polish**: prototype was desktop-only. Showcase page should be presentable on phones (375, 768, 1280, 1920).
5. Confirm `/prototype/` is not in the Netlify build artifact (it's outside `app/`, but verify).
6. **DNS cutover**:
   - Netlify: add `hub.cappsapps.ai` to the new site's Domain settings.
   - User updates DNS: CNAME `hub.cappsapps.ai` → `cappsapps-cc.netlify.app`.
   - Wait for propagation, verify SSL.
   - Update Clerk allowed origins + GitHub webhook URLs to use `hub.cappsapps.ai`.
7. Remove placeholder subdomain from docs. Tracker records cutover date.

**Acceptance criteria.**
- `hub.cappsapps.ai` resolves to the new Netlify site over HTTPS with a valid cert.
- All routes work under the new domain.
- Clerk sign-in works from `hub.cappsapps.ai`.
- All GitHub webhooks fire correctly to the new URL.
- Integration page Copy button copies the hook config with `CAPPSHUB_URL=https://hub.cappsapps.ai`.
- Brand audit grep returns zero em dashes in user-visible copy.

**Sanity-check protocol.** Full SCP run against `hub.cappsapps.ai` instead of the placeholder subdomain.

**Adds to SCP smoke test:**

| # | What to check | Added in | Acceptance |
|---|---------------|----------|------------|
| 37 | `hub.cappsapps.ai` resolves and serves the showcase | Phase 14 | curl returns 200, valid cert |
| 38 | No em dashes in rendered HTML | Phase 14 | `curl ... | grep '—'` returns nothing |
| 39 | All Phase 1–13 smoke tests pass on the new domain | Phase 14 | Run 1–36 manually |

**Rollback path.** DNS cutover is the riskiest step. Mitigation: keep prototype reachable via its original deploy URL until 24h after cutover. If new site has issues, revert DNS to point back to the old placeholder. Placeholder remains the safety net.

**Estimated PR count.** 2–3.
- PR A: Brand + a11y audit fixes.
- PR B: Animation parity + mobile responsive.
- PR C: DNS cutover-related config (Clerk origins, webhook URLs).

---

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | localStorage seed data drift between prototype and production seeds | High | Medium | Treat `data.js` and `notes-store.js:13-68` as immutable seed contracts. Port to TS literals in `app/db/seed-data.ts` and never edit by hand — re-derive from prototype. |
| 2 | `intelFor` synthetic data confuses real users | High | Medium | Every `intelFor` sub-function carries `// TODO(real-data): Phase X`. Detail page shows a small "synthetic" badge on each panel until that source is real. Defer the badge to Phase 14. |
| 3 | "No em dashes" brand rule violated by LLM-generated copy | High | Low | CI check: `grep -r '—' app/components app/lib | grep -v node_modules`. Fail build if found. |
| 4 | GitHub API rate limit (5,000/hr per token) hit | Medium | Medium | Poller: 1 req/app/6h (38 × 4 = 152/day, trivial). On-demand cache uses ETags. Log rate-limit headers in every response; alert if remaining < 500. |
| 5 | Clerk allowlist edge case | Low | Medium | Server-side double-check in middleware (Phase 5). Even if Clerk's allowlist is misconfigured, middleware blocks. |
| 6 | Webhook security: spoofed `/api/cappshub-events` | Medium | High | Require bearer token (`CAPPSHUB_HOOK_TOKEN`). Rotate quarterly. Log all 401s. |
| 7 | Scheduled Function fails silently | Medium | Medium | End each run, write a `pollers_runs` row with success/failure stats. Second smaller Scheduled Function (24h) reads recent runs, emails on failure. (Deferred — flagged in Open Questions.) |
| 8 | DNS cutover breaks production for users mid-day | Low | High | Cut over in low-traffic window. TTL low (300s) leading up. Verify all Phase 1–13 smoke tests work on the new domain via Netlify's `--site` flag before flipping DNS. |

---

## "Where am I" status tracker

**Update this section after every merge.** Future agents and future-you read this first.

### Current phase
**Phase 12A (cappshub-events POST + SSE event stream)** — merged 2026-05-28 (PR #33 → `4595358` → merge `af8ba5a`). Two new routes, no schema change (the Phase 11 `integration_events` table is enough). `POST /api/cappshub-events` is Bearer-guarded against `CAPPSHUB_HOOK_TOKEN` via `node:crypto.timingSafeEqual`, zod-validated body `{ appSlug, kind, text, actor?, repoPath?, commitSha? }` with kind enum `push | note | instruct | plan | sync`, slug → `app_id` lookup (404 on miss), text sliced to 280 chars, 204 on success; runtime `nodejs`. `GET /api/events/stream` is Clerk-gated SSE: polls `integration_events WHERE created_at > $lastSeen ORDER BY ASC LIMIT 50` every 1.5s, sends each row as `event: integration-event`, 30s `: ping` heartbeats, cleans up timers on `AbortSignal`; runtime `nodejs`. Design choice (polling over in-memory broadcaster) is documented in the route header — serverless isolation makes a memory broadcaster only see same-instance events; polling crosses instances at the cost of one Neon round-trip per tick.

**Phase 11 (GitHub push webhook → cache invalidation)** — DONE end-to-end as of 2026-05-28. Code merged via PR #31 (`42728d4`, 2026-05-22). `/api/github-webhook` (HMAC-verified against `CAPPSHUB_WEBHOOK_SECRET`) invalidates `notes_cache` rows for pushed `.cappshub/*` or `CLAUDE.md` files on the default branch and records a `push` row in `integration_events` (new table, pre-created here; Phase 12 owns its main use). Migration `0004` + `bundle-0004.sql`; `cappshub.ts` gained `resolveAppByRepo` + `invalidatePaths`; `app/scripts/install-webhooks.ts`/`uninstall-webhooks.ts` + `pnpm webhooks:install|uninstall [filter]`. **Runtime verified 2026-05-28:** `bundle-0004.sql` applied (idempotent rewrite needed; original CREATE was non-idempotent and rolled back on re-run). Webhook installed on `adam1capps/hub-dispatch` (staging target). End-to-end loop confirmed with two real pushes: commit `9de6e6c` → row `e7ef6a4e…`, then a rotation-verification commit → second row at 04:49Z, count=2. **Security debt cleared 2026-05-28**: `CAPPSHUB_WEBHOOK_SECRET` was initially set non-secret, then rotated to a fresh value stored as a true Netlify secret per-context (production + deploy-preview) with the GitHub hook re-keyed in lockstep; verification commit confirmed delivery 200 + new event row. Hook is currently only on `hub-dispatch` (1 of ~13 managed repos with `githubRepo`); rolling out to the rest is deferred — they have no `.cappshub/` files yet, so hooks there would be dormant until commits start touching `.cappshub/*` or `CLAUDE.md`. Next build step: **Phase 12B** (`SyncToast` component + `/integration` page).

INCIDENT (2026-05-20, RESOLVED): production `/` was 500ing because `NETLIFY_DATABASE_URL` was never set on Netlify, so `db/client.ts` fell back to a dummy URL. Gotcha: secret Netlify env vars cannot use `context:"all"` (they silently no-op) and must be set per-context. Fixed by setting the pooled URL secret for `production` + `deploy-preview`, then redeploying.

Open follow-ups (not blocking the live site): 2 still-missing/debt Netlify secrets — `GITHUB_TOKEN` (functional but stored non-secret + leaked; rotate to true secret per-context) and `X_TRIGGER_TOKEN` (Phase 4 manual-trigger guard, never provisioned). `CAPPSHUB_WEBHOOK_SECRET` is done (2026-05-28, secret per-context, exercised by hub-dispatch). `CAPPSHUB_HOOK_TOKEN` is done (2026-05-28, true secret per-context, provisioned for Phase 12A; user has the value in 1Password). Runtime-verification debt: Phase 12A POST + SSE not yet smoke-tested live (curl + EventSource snippets are in PR #33's body for the user to run from their laptop); the authenticated notes CRUD/autosave flows still want a click-through pass on `/app/[slug]`.

SCP 2026-05-28T19:15Z · green · `implement-command-center` @ `af8ba5a` (PR #33 / Phase 12A): merge of `POST /api/cappshub-events` + `GET /api/events/stream`. install/typecheck/lint/build all pass; both new routes register as dynamic in the build output. Netlify MCP unavailable at SCP time (502 from proxy) so deploy state for `af8ba5a` not directly verified from sandbox; previous production deploy was `6a17c808` `ready` and the new deploy will follow normally. Runtime smoke test pending the user's laptop (PR body has curl + EventSource snippets).

SCP 2026-05-28T05:00Z · green · `implement-command-center` @ `a48d023` (PR #32 / docs): squash-merged refresh of CLAUDE.md handoff (Phase 11 marked fully done; "What's blocking" section pivoted to three captured lessons — bundle idempotency, Netlify secret-setting per-context, webhook-rotation lockstep order; CAPPSHUB_WEBHOOK_SECRET provisioning row flipped from MISSING to done; "Roadmap at a glance" doc reference corrected). install/typecheck/lint/build all pass. Docs-only merge, no runtime impact; previous deploy `6a17c808` still `ready`.

SCP 2026-05-28T04:50Z · green · `implement-command-center` @ `42728d4` (PR #31 / Phase 11) **operationally live**: webhook installed on `adam1capps/hub-dispatch`, two real commits triggered end-to-end (HMAC verified, `integration_events` count=2 with full SHA `9de6e6c…cb3d` for the first and a rotation-verification commit for the second). `CAPPSHUB_WEBHOOK_SECRET` rotated to a true Netlify secret per-context (was initially non-secret) with the GitHub hook re-keyed in lockstep. Phase 11 fully done.

SCP 2026-05-22T00:10Z · green · `implement-command-center` @ `42728d4` (PR #31 / Phase 11): install/typecheck/lint/build all pass; Netlify current deploy `6a0fb8e3` `ready`; site public. Webhook endpoint deployed but dormant until `bundle-0004.sql` is applied + hooks installed (both user tasks). No runtime eyeball from sandbox (no egress).

SCP 2026-05-21T23:25Z · green · `implement-command-center` @ `37fbd39` (PR #30): note-sort follow-up to 10B (`.cappshub/notes` sorted newest-first so the IntegrationCard "latest" badge is correct). install/typecheck/lint/build all pass; Netlify current deploy `6a0f9848` `ready`; site public. Populated-repo path (tabs/notes-nav/plan label) still dark on the live deploy: no managed repo has `.cappshub/` committed; dogfood files for `adam1capps/hub-dispatch` (slug `hub-app`) prepared and handed to the user.

SCP 2026-05-21T22:00Z · green · `implement-command-center` @ `b82af64` (PR #29 / Phase 10B): install/typecheck/lint/build all pass; Netlify current deploy `6a0f8222` `ready`; site public; no em dashes in new copy. Runtime of the IntegrationCard not eyeballed from sandbox (no egress) — handed the user a Phase-10B smoke test for the deploy preview / production.

SCP 2026-05-21T20:39Z · green · `implement-command-center` @ `6359602`: install/typecheck/lint/build all pass; Netlify current deploy `ready`; site public (no password/SSO gate); showcase `/` renders live DB data (user-confirmed). Sandbox cannot reach the open internet (egress policy) so live checks are via the Netlify MCP + user eyeball, not local curl.

### Phase status

| # | Phase | Status | Merged at (SHA) | Last sanity-check | Blockers |
|---|-------|--------|-----------------|-------------------|----------|
| 0 | Provisioning | mostly done | — | — | Clerk app + keys still needed; Neon auto-provisions at first deploy |
| 1 | Repo reshape + Next.js skeleton | done | PR 1: `c1ac76b` · PR 2: `5292d5d` (both merged 2026-05-19) | 2026-05-19 · green · `pnpm build` + `pnpm lint` pass locally; Netlify auto-deploy pending repo-link | — |
| 2 | Neon schema + seed | done | PR #3 merged at `dfb9676` (2026-05-19) | 2026-05-19 · green · bundle SQL run via Neon SQL Editor: 37 apps, 37 snapshots, invoice-manager=broken | — |
| 3 | Public showcase route | done | PR #5 `a0f78d0` (shell) · PR #6 `9071620` (grid) | 2026-05-20 · green · typecheck/lint/build pass; `/` dynamic, shell+grid render from live DB | — |
| 4 | Scheduled poller | done | PR `b40fff6` | 2026-05-20 · green · build green | runtime poller verified only after deploy + the 4 missing Netlify secrets are set |
| 5 | Clerk auth + Grid view | done | 5A `456d282` (keys live, user-verified) · 5B `baba767` | 2026-05-20 · green | — |
| 6 | Pipeline + Needs Attention views | done | 6A `26d662c` | 2026-05-20 · green | — |
| 7 | App detail page (read-mostly) | done | 7A `849df9f` · 7B `e9a14d4` · 7C `f054954` | 2026-05-20 · green | — |
| 8 | Editable next_move + plan + blockers | done | 8A `fa0eef0` · 8B `1927424` | 2026-05-20 · green · `bundle-0001.sql` applied to Neon | — |
| 9 | Notes modal + full-page editor | done | 9A `9504380` (CRUD + table) · 9B `4125197` (modal + editor + full-page + preview) | 2026-05-21T20:39Z · green · build gate green; live showcase renders from DB; deploy `ready`, site public | authed notes CRUD/autosave still want a live click-through |
| 10 | `.cappshub/` GitHub Contents reads | done | 10A `c2f50fd` (notes_cache + github.ts + cappshub.ts) · 10B `b82af64` (IntegrationCard + getIntegrationFor + plan-card preference) · #30 `37fbd39` (notes sorted newest-first) | 2026-05-21T23:25Z · green · build gate green; deploy `6a0f9848` ready | empty-state UX user-verified on prod; populated path (tabs/notes-nav/plan label) dark until a repo gets `.cappshub/` (dogfood files for hub-dispatch handed to user) |
| 11 | GitHub webhook | done (operational) | PR #31 `42728d4` (github-webhook + integration_events + invalidatePaths + install scripts) | 2026-05-28T04:50Z · green · `bundle-0004.sql` applied; hook installed on `adam1capps/hub-dispatch`; 2 push events verified in `integration_events`; `CAPPSHUB_WEBHOOK_SECRET` rotated to true secret per-context | optional later: roll hook out to the remaining ~12 managed repos (deferred — they have no `.cappshub/` yet, hooks would be dormant) |
| 12 | `/api/cappshub-events` + SSE + SyncToast | 12A done, 12B todo | 12A: PR #33 `af8ba5a` (POST + SSE stream) | 12A: 2026-05-28T19:15Z · green · build gate green; Netlify deploy state not verified at SCP time (MCP 502); runtime smoke pending user laptop | runtime smoke test of POST + EventSource still owed |
| 13 | Slash command docs + dogfood | todo | — | — | — |
| 14 | Polish + DNS cutover | todo | — | — | — |

### Status legend
- **todo** — not started.
- **in-progress** — at least one PR open or merged for this phase, not all PRs merged.
- **done** — all PRs in this phase merged AND the SCP for the final PR passed green.
- **blocked** — see the Blockers column.

### Sanity-check legend (for "Last sanity-check" column)
- **green** — A–D all passed.
- **yellow** — non-blocking degradation, issue filed.
- **red** — reverting or actively rolling back.

Record format: `2026-05-19T14:22Z · green · all smoke tests passed`.

### Provisioning checklist (Phase 0 helper)

| Item | Status | Notes |
|------|--------|-------|
| Netlify site created | done | Site ID: `c681f8dd-aae1-4519-9b71-db26114b6dc0` · Team: ReDry (`adam-iusbapy`) · URL: `https://capps-apps-command-center.netlify.app` |
| Placeholder subdomain reachable | pending first deploy | Resolves once Phase 1 PR 2 lands |
| Neon database provisioned | deferred to Phase 1 PR 2 build | Using Netlify-Neon extension; DB auto-provisioned at first build that imports `@netlify/neon`. `NETLIFY_DATABASE_URL` env var auto-injected. |
| `psql $NETLIFY_DATABASE_URL` connects | todo | Verify after first deploy |
| Clerk app created | todo (user action) | App ID: — |
| Clerk allowlist set to `re-dry.com` | todo (user action) | — |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Netlify env | todo | Paste publishable + secret keys when ready |
| `CLERK_SECRET_KEY` in Netlify env | todo | — |
| GitHub PAT created with `repo` scope | done | Classic PAT, verified scope=`repo` against /user endpoint |
| `GITHUB_TOKEN` in Netlify env | done | Stored as secret, all contexts |
| `CAPPSHUB_WEBHOOK_SECRET` generated + in Netlify env | done | 32-byte hex, stored as secret env var |
| `CAPPSHUB_HOOK_TOKEN` generated + in Netlify env | done | 32-byte hex, stored as secret env var |
| `X_TRIGGER_TOKEN` (manual poller trigger) generated + in Netlify env | done | 32-byte hex, stored as secret env var (added in addition to plan; used by Phase 4 `/api/poll-now`) |
| DNS provider noted, TTL lowered to 300s ahead of Phase 14 | todo | — |

### Open questions
(Add things here as they come up. Resolve or escalate; don't let them rot.)

- [ ] Dedicated `commit_history` table (Phase 7 TODO), or just keep reading `last_commit_at` from snapshots? Decide before Phase 10.
- [ ] Synthetic-by-slug hostnames (e.g. `${slug}-${hash}.netlify.app` from `app-intel.js:298`): store real `site_id`s in a `hosting` table, or call Netlify API? Decide by Phase 7.
- [ ] Scheduled Function failure alerting (Risk #7) — when do we add it? Suggestion: opportunistically during Phase 4 if the work is small; otherwise a deferred polish phase.

---

## Reference: prototype file → production component map

Quick lookup. When a phase says "port X," this answers "from where to where."

| Prototype file (line range) | Production destination | Phase |
|-----------------------------|------------------------|-------|
| `index.html:25-55` (keyframes) | `app/app/globals.css` | 1 |
| `ds/tokens.css` | `app/app/globals.css` + `app/lib/tokens.ts` | 1 |
| `ui-shared.jsx:3-31` (CC tokens) | `app/lib/tokens.ts` | 1 |
| `ui-shared.jsx:33-49` (HEALTH, STAGE_TINT) | `app/lib/constants.ts` | 1 |
| `ui-shared.jsx:69-134` (HealthDot, pills, ApiChip, HostingMark) | `app/components/shared/` | 5 |
| `data.js:6-24` (CATEGORIES, STAGES) | `app/lib/constants.ts` | 1 |
| `data.js:30-397` (APPS array) | `app/db/seed-data.ts` | 2 |
| `data.js:399-432` (deriveSnapshot) | `app/lib/derive.ts` | 2 |
| `data.js:438-489` (getIssues) | `app/lib/derive.ts` | 2 |
| `ui-showcase.jsx:5-125` (ShowcaseView) | `app/app/page.tsx` + `app/components/showcase/` | 3 |
| `app.jsx:362-418` (PublicHeader, PublicFooter) | `app/components/showcase/` | 3 |
| `app.jsx:159-261` (DashHeader) | `app/components/dash/Header.tsx` | 5 |
| `app.jsx:286-358` (ViewSwitcher, Legend) | `app/components/dash/ViewSwitcher.tsx` | 5 |
| `ui-views.jsx:4-85` (GridView, SectionHeader) | `app/components/dash/GridView.tsx` | 5 |
| `ui-card.jsx:1-167` (AppCard) | `app/components/dash/AppCard.tsx` | 5, edits in 8 |
| `ui-views.jsx:88-203` (PipelineView, PipelineCard) | `app/components/dash/PipelineView.tsx` | 6 |
| `ui-views.jsx:285-448` (AttentionView, IssueRow) | `app/components/dash/AttentionView.tsx` | 6 |
| `ui-detail.jsx:8-317` (AppDetailPage) | `app/components/detail/AppDetailPage.tsx` | 7 |
| `ui-detail.jsx:320-440` (Row, Card, QuickStat, IssuesBanner) | `app/components/detail/primitives.tsx` | 7 |
| `ui-detail.jsx:442-725` (ActivityFeed, RepositoryPanel, DatabasePanel, HostingPanel, ApiUsagePanel, TrafficPanel) | `app/components/detail/panels/*.tsx` | 7 |
| `app-intel.js` (intelFor + helpers) | `app/lib/intel.ts` | 7, replaced incrementally 10+ |
| `ui-notes.jsx:53-93` (NotesButton, NoteGlyph) | `app/components/notes/NotesButton.tsx` | 9 |
| `ui-notes.jsx:97-267` (NotesModal) | `app/components/notes/NotesModal.tsx` | 9 |
| `ui-notes.jsx:279-458` (NoteRow, NoteEditor) | `app/components/notes/NoteRow.tsx`, `NoteEditor.tsx` | 9 |
| `ui-notes.jsx:462-705` (NotePage) | `app/app/app/[slug]/notes/[noteId]/page.tsx` | 9 |
| `notes-store.js:13-68` (SEED) | `app/db/seed-notes.ts` | 9 |
| `cc-integration.js:21-50` (SLASH_COMMANDS) | `app/lib/cappshub-spec.ts` | 12 |
| `cc-integration.js:53-85` (HOOK_CONFIG) | `app/lib/cappshub-spec.ts` | 12 |
| `cc-integration.js:88-153` (cappshubFiles, claudeMdFor) | `app/lib/cappshub.ts` (reads from GitHub, not generates) | 10 |
| `ui-integration.jsx:68-285` (IntegrationCard) | `app/components/detail/IntegrationCard.tsx` | 10, 12 |
| `ui-integration.jsx:289-506` (IntegrationPage) | `app/app/integration/page.tsx` | 12 |
| `ui-integration.jsx:571-615` (SyncToast) | `app/components/SyncToast.tsx` | 12 |
| `tweaks-panel.jsx` | NOT PORTED (Design Session affordance) | — |

---

## Critical files to read before Phase 1

- `/home/user/capps-apps-command-center/data.js` — app inventory + deriveSnapshot + getIssues
- `/home/user/capps-apps-command-center/app-intel.js` — synthetic per-app intel; every function here is replaced incrementally in later phases
- `/home/user/capps-apps-command-center/ui-detail.jsx` — the largest single component; understand its layout before Phase 7
- `/home/user/capps-apps-command-center/cc-integration.js` — the `.cappshub/` contract (slash commands, hook config, file paths)
- `/home/user/capps-apps-command-center/notes-store.js` — note seed data + shape that goes to the Postgres `notes` table in Phase 9
