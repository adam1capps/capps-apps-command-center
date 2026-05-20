// Notes seed, ported from prototype/notes-store.js:13-68. Em/en dashes are
// replaced with hyphens to satisfy the brand rule. createdAt doubles as the
// initial updatedAt. Consumed by db/dump-notes-sql.ts to build the Neon bundle.

export interface NoteSeed {
  slug: string;
  kind: "instruction" | "note";
  title: string;
  body: string;
  source: string;
  repoPath: string | null;
  commitSha: string | null;
  createdAt: string;
}

export const NOTE_SEED: NoteSeed[] = [
  {
    slug: "vent-placement",
    kind: "instruction",
    title: "Use the theme tokens",
    body: "Pull colors/fonts from `frontend/src/constants/theme.js`. SEG_COLORS controls the wall rotation - don't redefine it elsewhere. DM Sans only, 6px radii, navy header.",
    source: "claude-md",
    repoPath: ".cappshub/instructions.md",
    commitSha: "a91f2c4",
    createdAt: "2026-05-09T14:00:00Z",
  },
  {
    slug: "vent-placement",
    kind: "note",
    title: "Render cold-start measurement",
    body: "Stopwatch on the Render service: 2.8s first request after 15min idle. After warmup, 280-340ms steady state. If we move proposal generation here, warm with a /healthz ping every 10min.",
    source: "hook",
    repoPath: ".cappshub/notes/2026-05-15-render-cold-start.md",
    commitSha: "d4e8a17",
    createdAt: "2026-05-15T09:20:00Z",
  },
  {
    slug: "vent-placement",
    kind: "instruction",
    title: "Contractor view = read-only",
    body: "Contractors must never be able to edit vent placement. The PHD-scale overlay should render but actions are disabled.",
    source: "claude-md",
    repoPath: ".cappshub/instructions.md",
    commitSha: "a91f2c4",
    createdAt: "2026-05-11T08:10:00Z",
  },
  {
    slug: "job-lifecycle",
    kind: "instruction",
    title: "Foreman filter respects job timezone",
    body: "All filters use the job site timezone, not the foreman's local. There was a bug where MST/CST jobs got mis-bucketed in the 'today' filter.",
    source: "slash-command",
    repoPath: ".cappshub/instructions.md",
    commitSha: "7c2b119",
    createdAt: "2026-05-12T17:45:00Z",
  },
  {
    slug: "job-lifecycle",
    kind: "note",
    title: "Status-change-age request",
    body: "Brandon asked: surface how long a job has been in its current status. Want a soft yellow tint when > 5 days.",
    source: "manual",
    repoPath: null,
    commitSha: null,
    createdAt: "2026-05-14T11:00:00Z",
  },
  {
    slug: "warranty-management",
    kind: "note",
    title: "Render free tier - moving off",
    body: "1.84s response logged in last poll. That's cold start. Bumping to paid Render service before the next contractor batch ships next Tuesday.",
    source: "hook",
    repoPath: ".cappshub/notes/2026-05-16-render-tier.md",
    commitSha: "b1d44a0",
    createdAt: "2026-05-16T19:30:00Z",
  },
  {
    slug: "redry-website",
    kind: "instruction",
    title: "Voice rules - REDRY_BRAND.md",
    body: "No em dashes. No emoji. Imperative voice. Imperial units. Phone format: 877.733.7973 (dots, not dashes). Domain: re-dry.com (hyphenated).",
    source: "claude-md",
    repoPath: ".cappshub/instructions.md",
    commitSha: "e0a9c12",
    createdAt: "2026-04-29T16:00:00Z",
  },
  {
    slug: "invoice-manager",
    kind: "note",
    title: "500s started last Friday",
    body: "Stripe webhook signature mismatch after they rotated keys. Quick fix is to pull the new secret from Stripe dashboard. Probably easier to just deprecate this and route invoicing through the new Accounting app.",
    source: "slash-command",
    repoPath: ".cappshub/notes/2026-05-16-stripe-500s.md",
    commitSha: "3f8e0b2",
    createdAt: "2026-05-16T08:00:00Z",
  },
  {
    slug: "mri-connect",
    kind: "instruction",
    title: "Cert verification endpoint stays public",
    body: "/api/verify/:cert_id must remain unauthenticated - it's hit from QR codes on printed certificates. Rate-limit but never gate.",
    source: "claude-md",
    repoPath: ".cappshub/instructions.md",
    commitSha: "5c1aa83",
    createdAt: "2026-05-09T10:00:00Z",
  },
  {
    slug: "mindreadir-press",
    kind: "note",
    title: "Anthropic rate-limit playbook",
    body: "Press generation can burst 6-8 calls in a few seconds when an outlet batch ships. If we start hitting 429s, fall back to Render worker with a backoff queue.",
    source: "hook",
    repoPath: ".cappshub/notes/2026-05-11-anthropic-429.md",
    commitSha: "9a2c4d5",
    createdAt: "2026-05-11T12:00:00Z",
  },
];
