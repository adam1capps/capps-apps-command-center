/* App Intel — deterministic synthetic metrics per app.
 *
 * In production this would aggregate Neon (DB schemas, row counts),
 * GitHub API (commit history, languages, contributors), Netlify/Render
 * (deploy history, env var names), Plausible (traffic), and a
 * Claude-Code plan store. For the prototype, we generate consistent
 * fake values from a hash of the app slug so the same app always shows
 * the same numbers.
 */

(function () {
  const NOW = window.CC_DATA.NOW;

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
    return h;
  }
  function rng(seed) {
    let x = seed >>> 0;
    return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 0x100000000; };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const rint = (r, lo, hi) => Math.floor(r() * (hi - lo + 1)) + lo;
  const daysAgo = (d) => new Date(NOW - d * 86400000);

  /* ─── Commit timeline (sparkline of weekly counts) ─────────────── */
  function commitsTimeline(app, r, weeks = 12) {
    const totalLo = app.stage === "mature" ? 80 : app.stage === "live" ? 40 : app.stage === "mvp" ? 14 : 6;
    const totalHi = app.stage === "mature" ? 240 : app.stage === "live" ? 120 : app.stage === "mvp" ? 38 : 18;
    const total = rint(r, totalLo, totalHi);
    const series = [];
    let remaining = total;
    for (let i = 0; i < weeks; i++) {
      // recent weeks slightly busier for active apps
      const bias = (app.stage === "archive" || !app.github_repo)
        ? Math.max(0, 1 - i / 3)         // archive: only old commits
        : 0.4 + 0.6 * (i / weeks);
      const share = bias * r();
      series.push(Math.floor(share * remaining * 0.35));
      remaining -= series[i];
    }
    // tail toward zero for archives
    if (app.stage === "archive") {
      for (let i = 0; i < weeks - 2; i++) series[i] = 0;
    }
    // no recent commit if drift / no repo
    if (!app.github_repo) return { total: 0, weekly: new Array(weeks).fill(0) };
    return { total, weekly: series };
  }

  /* ─── Languages ────────────────────────────────────────────────── */
  const LANG_SETS = {
    web:    [["TypeScript", 64], ["CSS", 18], ["JavaScript", 14], ["HTML", 4]],
    react:  [["TypeScript", 71], ["CSS", 21], ["HTML", 6], ["JavaScript", 2]],
    node:   [["TypeScript", 88], ["JavaScript", 9], ["Shell", 3]],
    py:     [["Python", 78], ["HTML", 12], ["CSS", 7], ["JavaScript", 3]],
    mixed:  [["TypeScript", 52], ["Python", 26], ["CSS", 14], ["HTML", 8]],
  };
  function languages(app, r) {
    if (!app.github_repo) return [];
    let set;
    if (app.slug.includes("certificate") || app.slug.includes("warranty")) set = LANG_SETS.node;
    else if (app.slug.includes("smart-bookkeeper") || app.slug.includes("gravimetric")) set = LANG_SETS.py;
    else if (app.slug.includes("mindreadir") || app.slug.includes("proposal-builder")) set = LANG_SETS.mixed;
    else if (app.slug.includes("website") || app.slug.includes("guide") || app.slug.includes("links")) set = LANG_SETS.web;
    else set = LANG_SETS.react;
    return set.map(([name, p]) => ({ name, pct: p }));
  }

  /* ─── Database / Neon schema ──────────────────────────────────── */
  const TABLE_DICT = [
    ["users", 50, 800], ["sessions", 200, 4000], ["audit_log", 800, 30000],
    ["events", 400, 12000], ["api_requests", 2000, 80000],
  ];
  function database(app, r) {
    if (!app.api_dependencies.includes("Neon")) return null;
    const named = {
      "proposals-roofmri": ["proposals", "clients", "line_items", "templates", "pdf_jobs"],
      "mri-connect":       ["contractors", "certificates", "verifications", "scans"],
      "rackley-reports":   ["reports", "roofs", "moisture_readings", "share_links"],
      "warranty-management": ["warranties", "claims", "contractors", "attachments"],
      "certificate-generator": ["certificates", "templates", "issuances"],
      "job-lifecycle":     ["jobs", "foremen", "status_changes", "addresses", "fleet_assignments"],
      "vent-placement":    ["projects", "addresses", "roofs", "vents", "shares"],
      "accounting":        ["accounts", "transactions", "categories", "imports"],
      "mindreadir-press":  ["releases", "outlets", "drafts", "send_log"],
      "lightup":           ["proposals", "sections"],
      "gravimetric-readings": ["readings", "samples", "calibrations"],
      "hub-app":           ["routes", "endpoints", "dispatches"],
      "hub-app-scanner":   ["repos", "deploys", "drift_records"],
    }[app.slug] || null;
    const tableNames = named ?? Array.from({ length: rint(r, 2, 5) }, () => pick(r, TABLE_DICT)[0]);
    const tables = tableNames.map((name, i) => {
      const sub = TABLE_DICT.find(t => t[0] === name);
      const lo = sub ? sub[1] : 50;
      const hi = sub ? sub[2] : 8000;
      return {
        name,
        rows: rint(r, Math.max(20, lo * (i + 1)), hi),
        // some quiet, some busy
        last_write: daysAgo(rint(r, 0, app.stage === "mature" ? 5 : 30)),
      };
    });
    const dbName = `${app.slug.replace(/-/g, "_")}_prod`.slice(0, 38);
    return {
      name: dbName, region: "aws-us-east-2",
      tables,
      total_rows: tables.reduce((s, t) => s + t.rows, 0),
      size_mb: Math.round((tables.reduce((s, t) => s + t.rows, 0) / 1800) * 10) / 10,
    };
  }

  /* ─── Recent deploys ──────────────────────────────────────────── */
  function deploys(app, r) {
    if (!app.live_url) return [];
    const n = rint(r, 4, 8);
    const out = [];
    let d = 0;
    for (let i = 0; i < n; i++) {
      d += rint(r, 1, app.stage === "live" || app.stage === "mature" ? 4 : 14);
      const branch = i === 0 ? "main" : (r() < 0.85 ? "main" : "feat/" + pick(r, [
        "tighten-copy", "fix-pdf", "rate-limit", "ui-polish", "neon-pool", "ssl-cert",
      ]));
      const status = (i === 0 && app.status?.url_status === 500) ? "failed"
        : (i === 0 && app.status?.url_status === 404) ? "failed"
        : (r() < 0.04) ? "failed"
        : "succeeded";
      out.push({
        when: daysAgo(d), branch,
        sha: hash(app.slug + i).toString(16).slice(0, 7),
        status,
        duration_s: rint(r, 35, 240),
      });
    }
    return out;
  }

  /* ─── Claude Code plan (todos) ────────────────────────────────── */
  // Seeded blueprints with realistic copy, then filled by app context.
  const PLAN_TEMPLATES = {
    "proposals-roofmri": [
      { done: true,  text: "Fix PDF orientation when landscape requested" },
      { done: true,  text: "Add line-item drag reorder" },
      { done: false, text: "Wire Render service health into the status dot" },
      { done: false, text: "Pull recipient list from Connect instead of CSV upload" },
      { done: false, text: "Add audit_log entry on every proposal export" },
    ],
    "mri-connect": [
      { done: true,  text: "Stand up /api/verify/:cert_id (public, rate-limited)" },
      { done: false, text: "Add @re-dry.com login gate for the staff view" },
      { done: false, text: "Surface contractor certification level on profile" },
      { done: false, text: "Move QR scan handler off Render free tier" },
    ],
    "rackley-reports": [
      { done: true,  text: "PDF export with thermal overlay" },
      { done: false, text: "Add per-roof drill-down from index page" },
      { done: false, text: "Cache mapbox tiles for offline contractor view" },
    ],
    "warranty-management": [
      { done: false, text: "Upgrade Render free → paid tier (cold starts 1.8s)" },
      { done: false, text: "Add SendGrid template for claim acknowledgement" },
      { done: false, text: "Backfill warranty.contractor_id from CSV (Eric)" },
    ],
    "vent-placement": [
      { done: true,  text: "Address > Roof > Project tree refactor" },
      { done: false, text: "Contractor read-only view with PHD-scale overlay" },
      { done: false, text: "Persist wall-segment rotation across saves" },
      { done: false, text: "Replace VM gradient chip with the inverted ReDry mark" },
    ],
    "job-lifecycle": [
      { done: true,  text: "Filter by foreman with job-tz aware buckets" },
      { done: false, text: "Surface days-since-status-change on each card" },
      { done: false, text: "Tag jobs that have been in Drying > 7d" },
    ],
    "flyby": [
      { done: false, text: "Bake camera path for the new sales pitch" },
      { done: false, text: "Mobile fallback (drop the 3D layer below 720p)" },
    ],
    "accounting": [
      { done: false, text: "Map chart of accounts to the new categories" },
      { done: false, text: "Plaid webhook idempotency" },
      { done: false, text: "Import-from-QBO one-time migrator" },
    ],
    "invoice-manager": [
      { done: false, text: "Stripe webhook signature mismatch (key rotated)" },
      { done: false, text: "Decide: keep or fold into Accounting?" },
    ],
    "mindreadir-press": [
      { done: true,  text: "Outlet targeting (per-region filters)" },
      { done: false, text: "Move LLM calls from Render worker to direct fetch" },
      { done: false, text: "Anthropic 429 backoff queue" },
    ],
    "lightup": [
      { done: true,  text: "Tighten deliverables list copy" },
      { done: false, text: "Add scope-extension addendum section" },
    ],
    "cappsapps-proposals": [
      { done: false, text: "Pick a template structure" },
      { done: false, text: "Lock the first three sections" },
      { done: false, text: "Decide auth: Clerk vs none for first cut" },
    ],
    "redry-website": [
      { done: false, text: "Hero copy from the 2026 messaging refresh" },
      { done: false, text: "Add Rapid-Vent fleet count to footer (auto)" },
    ],
    "roof-mri-website": [
      { done: false, text: "Refresh case-study section with Rackley data" },
    ],
    "training-site": [
      { done: false, text: "Decide: redirect to protraining or rehost in a repo" },
    ],
    "moisture-detection": [
      { done: false, text: "Move source into a repo (currently Netlify-only)" },
    ],
    "gravimetric-readings": [
      { done: false, text: "CSV import from lab USB scale" },
      { done: false, text: "Calibration regression chart" },
    ],
    "smart-bookkeeper": [
      { done: false, text: "Rule engine prototype → ship as v0" },
      { done: false, text: "Fold into ReDry Accounting" },
    ],
    "linkedin-app": [
      { done: false, text: "Resume once LinkedIn API access lands" },
    ],
    "taskline": [
      { done: false, text: "Decide if this stays personal" },
    ],
    "hub-app-scanner": [
      { done: false, text: "Push results to Neon for the Command Center" },
      { done: true,  text: "Detect Netlify-only deploys" },
    ],
  };
  function plan(app) {
    const blueprint = PLAN_TEMPLATES[app.slug];
    if (blueprint) return blueprint.map((p, i) => ({ id: `${app.slug}-p${i}`, ...p }));
    // generic fallback
    return [
      { id: `${app.slug}-p0`, done: false, text: app.next_move || "Define the next move." },
    ];
  }

  /* ─── API usage 24h ───────────────────────────────────────────── */
  function apiUsage(app, r) {
    return app.api_dependencies.map(name => ({
      name,
      calls: rint(r, 12, name === "Neon" ? 5200 : 600),
      fails: r() < 0.08 ? rint(r, 1, 4) : 0,
      p95_ms: rint(r, 80, name === "Anthropic" ? 2400 : 800),
    }));
  }

  /* ─── Traffic (7d) ─────────────────────────────────────────────── */
  function traffic(app, r) {
    if (!app.live_url) return null;
    const base = app.stage === "mature" ? rint(r, 600, 3500)
      : app.stage === "live" ? rint(r, 80, 900)
      : rint(r, 4, 80);
    const week = Array.from({ length: 7 }, () => Math.max(0, Math.round(base / 7 * (0.6 + r() * 0.9))));
    const sessions = week.reduce((a, b) => a + b, 0);
    const referrers = [
      { src: "direct", pct: 42 },
      { src: "google", pct: 31 },
      { src: "linkedin", pct: 14 },
      { src: "re-dry.com", pct: 9 },
      { src: "other", pct: 4 },
    ];
    return { sessions, week, referrers };
  }

  /* ─── Env / hosting summary ────────────────────────────────────── */
  const ENV_NAMES = [
    "ANTHROPIC_API_KEY", "DATABASE_URL", "NEXT_PUBLIC_BASE_URL",
    "SENDGRID_API_KEY", "STRIPE_SECRET_KEY", "GITHUB_TOKEN",
    "CLERK_SECRET_KEY", "RENDER_SERVICE_ID", "MAPBOX_TOKEN",
    "NEON_DATABASE_URL", "PLAID_CLIENT_ID", "PLAID_SECRET",
  ];
  function hostingDetail(app, r) {
    if (app.hosting === "none" || !app.hosting) return null;
    const envs = [];
    const probable = new Set();
    if (app.api_dependencies.includes("Anthropic")) probable.add("ANTHROPIC_API_KEY");
    if (app.api_dependencies.includes("Neon")) probable.add("DATABASE_URL");
    if (app.api_dependencies.includes("SendGrid")) probable.add("SENDGRID_API_KEY");
    if (app.api_dependencies.includes("Clerk")) probable.add("CLERK_SECRET_KEY");
    if (app.api_dependencies.includes("Stripe")) probable.add("STRIPE_SECRET_KEY");
    if (app.api_dependencies.includes("Plaid")) { probable.add("PLAID_CLIENT_ID"); probable.add("PLAID_SECRET"); }
    if (app.api_dependencies.includes("Render")) probable.add("RENDER_SERVICE_ID");
    if (app.api_dependencies.includes("Mapbox")) probable.add("MAPBOX_TOKEN");
    if (app.live_url) probable.add("NEXT_PUBLIC_BASE_URL");
    for (const n of probable) envs.push(n);
    while (envs.length < (probable.size + (r() < 0.5 ? 1 : 0))) {
      envs.push(pick(r, ENV_NAMES.filter(n => !envs.includes(n))));
    }
    return {
      provider: app.hosting,
      site_id:  `${app.slug}-${hash(app.slug).toString(16).slice(0,6)}.netlify.app`,
      branch:   "main",
      build_cmd: app.slug.includes("py") ? "uv run build" : "npm run build",
      env_var_names: envs.slice(0, 8),
      ssl_expires: daysAgo(-rint(r, 30, 180)),
    };
  }

  /* ─── Top-level intel for one app ─────────────────────────────── */
  function intelFor(app) {
    const r = rng(hash(app.slug));
    return {
      commits:    commitsTimeline(app, r),
      languages:  languages(app, r),
      database:   database(app, r),
      deploys:    deploys(app, r),
      plan:       plan(app),
      api_usage:  apiUsage(app, r),
      traffic:    traffic(app, r),
      hosting:    hostingDetail(app, r),
      contributors: app.github_repo
        ? Math.min(3, 1 + Math.floor(hash(app.slug) % 3))
        : 0,
    };
  }

  window.CC_INTEL = { intelFor };
})();
