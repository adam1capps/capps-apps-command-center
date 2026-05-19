/* Claude Code integration — connection state, event log, and the
 * .cappshub/ folder structure that lives in each repo.
 *
 * In production this would be:
 *   - A Netlify Function endpoint /api/cappshub-events that Claude Code's
 *     PostToolUse hook POSTs to whenever it edits .cappshub/* files.
 *   - A GitHub webhook on push events that re-reads .cappshub/ for changed
 *     repos and updates the Command Center's note store immediately.
 *   - A reader that exposes .cappshub/instructions.md and .cappshub/plan.json
 *     contents on demand via the GitHub Contents API.
 *
 * Here it's all in-memory + localStorage, but the schema and event flow are
 * what the real integration would produce.
 */

(function () {
  const EVT_KEY = "cc_int_events_v1";
  const NOW = window.CC_DATA.NOW;

  /* ─── Slash command + hook reference ────────────────────────────── */
  const SLASH_COMMANDS = [
    {
      cmd: "/note",
      summary: "Append an observation to .cappshub/notes/",
      args: "[--title <title>] <body>",
      example: "/note --title \"Render cold start\" measured 2.8s after 15min idle",
      writes_to: ".cappshub/notes/YYYY-MM-DD-<slug>.md",
    },
    {
      cmd: "/instruct",
      summary: "Append a durable directive to .cappshub/instructions.md",
      args: "<directive>",
      example: "/instruct contractor view must remain read-only",
      writes_to: ".cappshub/instructions.md",
    },
    {
      cmd: "/plan",
      summary: "Edit the Claude Code plan for this app",
      args: "add|done|drop <text-or-index>",
      example: "/plan add wire Render service health into the status dot",
      writes_to: ".cappshub/plan.json",
    },
    {
      cmd: "/sync",
      summary: "Force-push local .cappshub/ state to the Command Center",
      args: "(none)",
      example: "/sync",
      writes_to: ".cappshub/* (no-op if clean)",
    },
  ];

  /* ─── Hook contract — drop-in for ~/.claude/settings.json ───────── */
  const HOOK_CONFIG = {
    hooks: {
      PostToolUse: [
        {
          matcher: "Edit|Write|MultiEdit",
          hooks: [
            {
              type: "command",
              command:
                'curl -sS -X POST "$CAPPSHUB_URL/api/cappshub-events" ' +
                '-H "Authorization: Bearer $CAPPSHUB_TOKEN" ' +
                "-H 'Content-Type: application/json' " +
                "-d \"$(jq -c '{repo: env.PWD | sub(\".*/\"; \"\"), tool: .tool_name, path: .tool_input.file_path, ts: now}')\"",
            },
          ],
        },
      ],
      Notification: [
        {
          matcher: "*",
          hooks: [
            {
              type: "command",
              command:
                'curl -sS -X POST "$CAPPSHUB_URL/api/cappshub-events" ' +
                '-H "Authorization: Bearer $CAPPSHUB_TOKEN" ' +
                "-d \"$(jq -c '{kind: \\\"learning\\\", repo: env.PWD | sub(\\\".*/\\\"; \\\"\\\"), text: .message, ts: now}')\"",
            },
          ],
        },
      ],
    },
  };

  /* ─── Per-app .cappshub/ file mocks ─────────────────────────────── */
  function cappshubFiles(slug) {
    const app = window.CC_DATA.APPS.find(a => a.slug === slug);
    if (!app || !app.github_repo) return null;
    const notes = window.CC_NOTES.getFor(slug);
    const instructions = notes
      .filter(n => n.kind === "instruction")
      .map(n => `## ${n.title}\n${n.body}\n`)
      .join("\n");
    const noteFiles = notes
      .filter(n => n.kind === "note")
      .map(n => ({
        path: n.repo_path || `.cappshub/notes/${(n.created_at || "").slice(0,10)}-${slugify(n.title)}.md`,
        body: `# ${n.title}\n\n_${n.created_at?.slice(0,10) || "—"} · ${labelForSource(n.source)}_\n\n${n.body}\n`,
      }));
    const plan = window.CC_INTEL.intelFor(app).plan;
    return {
      "CLAUDE.md": claudeMdFor(app, notes),
      ".cappshub/instructions.md":
        `# ${app.name} — Instructions\n\n` +
        `_Synced with hub.cappsapps.ai. Edits here flow to the Command Center on push._\n\n` +
        (instructions || "_No instructions yet. Use /instruct in Claude Code to add one._\n"),
      ".cappshub/plan.json": JSON.stringify(
        { app: app.slug, updated: NOW.toISOString().slice(0, 10), items: plan },
        null, 2
      ),
      ...Object.fromEntries(noteFiles.map(f => [f.path, f.body])),
    };
  }
  function slugify(s) {
    return (s || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  }
  function labelForSource(s) {
    return ({
      manual: "Manual entry",
      "slash-command": "via /note",
      hook: "Claude Code hook",
      "claude-md": "CLAUDE.md import",
    })[s] || "Manual entry";
  }
  function claudeMdFor(app, notes) {
    const cat = window.CC_DATA.CATEGORIES[app.category]?.label || app.category;
    return [
      `# ${app.name}`,
      "",
      `> ${app.description}`,
      "",
      `Portfolio: **${cat}** · Stage: **${app.stage}** · Hosting: ${app.hosting}`,
      app.live_url ? `Live: ${app.live_url}` : null,
      "",
      `## Project context`,
      "",
      `Managed by the Capps Apps Command Center (hub.cappsapps.ai).`,
      `Edits to \`.cappshub/*\` automatically sync to the Command Center on push.`,
      "",
      `## Available slash commands`,
      "",
      `- \`/note\`     — log an observation`,
      `- \`/instruct\` — add a durable directive`,
      `- \`/plan\`     — edit the plan`,
      `- \`/sync\`     — force re-sync`,
      "",
      `## Latest instructions (${notes.filter(n => n.kind === "instruction").length})`,
      "",
      ...notes.filter(n => n.kind === "instruction").slice(0, 4).map(n => `- ${n.title}`),
    ].filter(x => x !== null).join("\n");
  }

  /* ─── Event log ─────────────────────────────────────────────────── */
  const SEED_EVENTS = [
    { ts: "2026-05-18T07:40:00Z", slug: "vent-placement",     kind: "hook",          text: "PostToolUse(Edit) → .cappshub/notes/2026-05-18-rotation-tests.md", actor: "Claude Code" },
    { ts: "2026-05-18T06:12:00Z", slug: "warranty-management", kind: "slash-command", text: "/note Render cold-start 1.84s flagged by poll",                    actor: "adam@re-dry.com" },
    { ts: "2026-05-17T22:01:00Z", slug: "invoice-manager",    kind: "slash-command", text: "/note Stripe webhook 500s — key rotated, need new secret",         actor: "Claude Code (autonomous)" },
    { ts: "2026-05-17T18:30:00Z", slug: "job-lifecycle",      kind: "plan-update",   text: "/plan done filter by foreman",                                       actor: "adam@re-dry.com" },
    { ts: "2026-05-17T15:44:00Z", slug: "proposals-roofmri",  kind: "push",          text: "push to main · 3 commits · .cappshub/plan.json updated",            actor: "github" },
    { ts: "2026-05-17T11:09:00Z", slug: "mindreadir-press",   kind: "hook",          text: "PostToolUse(Write) → .cappshub/notes/2026-05-17-outlet-tags.md",   actor: "Claude Code" },
    { ts: "2026-05-16T19:30:00Z", slug: "warranty-management", kind: "instruction",  text: "/instruct upgrade Render to paid tier before contractor batch",   actor: "adam@re-dry.com" },
    { ts: "2026-05-16T08:00:00Z", slug: "invoice-manager",    kind: "hook",          text: "PostToolUse(Edit) → .cappshub/notes/2026-05-16-stripe-500s.md",    actor: "Claude Code" },
    { ts: "2026-05-15T09:20:00Z", slug: "vent-placement",     kind: "hook",          text: "Notification → 'measured Render cold start at 2.8s after 15min idle'", actor: "Claude Code" },
    { ts: "2026-05-14T11:00:00Z", slug: "job-lifecycle",      kind: "manual",        text: "Note 'Status-change-age request' added in dashboard",              actor: "adam@re-dry.com" },
    { ts: "2026-05-12T17:45:00Z", slug: "job-lifecycle",      kind: "slash-command", text: "/instruct foreman filter respects job timezone",                   actor: "adam@re-dry.com" },
    { ts: "2026-05-11T12:00:00Z", slug: "mindreadir-press",   kind: "hook",          text: "Notification → 'Anthropic 429 risk on outlet batch burst'",        actor: "Claude Code" },
    { ts: "2026-05-09T14:00:00Z", slug: "vent-placement",     kind: "claude-md",     text: "Imported instructions from CLAUDE.md (initial sync)",              actor: "github" },
  ];

  function loadEvents() {
    try {
      const raw = localStorage.getItem(EVT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(EVT_KEY, JSON.stringify(SEED_EVENTS));
    return SEED_EVENTS.slice();
  }
  let events = loadEvents();
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());

  function getEvents()         { return events; }
  function getEventsFor(slug)  { return events.filter(e => e.slug === slug); }
  function recordEvent(evt) {
    events = [{ ts: new Date().toISOString(), ...evt }, ...events];
    localStorage.setItem(EVT_KEY, JSON.stringify(events));
    emit();
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  /* ─── Simulate a slash-command from Claude Code ─────────────────── */
  function simulate(slug, kind = "note") {
    const samples = {
      note: [
        { title: "p95 jump on /api/proposals",            body: "p95 ticked from 410ms to 720ms after the last deploy. Spot-checked: the new audit_log insert is synchronous. Move it to a background queue." },
        { title: "Anthropic 429 sighting",                body: "First 429 today during outlet batch send. Backoff queue lands tomorrow." },
        { title: "Foreman filter edge case",              body: "MST job site, foreman in CST, 'today' bucket was wrong by one day. Reproduced; fix in progress." },
        { title: "Cold start signature",                  body: "Render service cold start measured 2.6s after 20min idle. Ping every 10min works." },
        { title: "Brand voice slip in copy",              body: "Two em dashes found in proposal template body. Replacing with periods + sentence splits." },
      ],
      instruction: [
        { title: "Never inline secrets",                  body: "Use env vars for every key. Don't paste them into the codebase even temporarily." },
        { title: "Always run lint before commit",         body: "npm run lint must pass. If it doesn't, fix it. Don't disable rules." },
        { title: "Match the design system",               body: "Pull tokens from /projects/0735793b-.../colors_and_type.css. Don't invent new colors." },
      ],
    };
    const sample = samples[kind][Math.floor(Math.random() * samples[kind].length)];
    const created_at = new Date().toISOString();
    const repo_path = kind === "note"
      ? `.cappshub/notes/${created_at.slice(0,10)}-${sample.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,28)}.md`
      : ".cappshub/instructions.md";
    const sha = Math.random().toString(16).slice(2, 9);

    window.CC_NOTES.upsert(slug, {
      kind: kind === "note" ? "note" : "instruction",
      title: sample.title,
      body: sample.body,
      source: "slash-command",
      repo_path,
      commit_sha: sha,
    });
    recordEvent({
      slug,
      kind: "slash-command",
      text: kind === "note" ? `/note ${sample.title}` : `/instruct ${sample.title}`,
      actor: "Claude Code (autonomous)",
    });
    return sample;
  }

  /* ─── Connection state (per-repo) ───────────────────────────────── */
  function connectionFor(slug) {
    const app = window.CC_DATA.APPS.find(a => a.slug === slug);
    if (!app) return null;
    if (!app.github_repo) {
      return { connected: false, reason: "No repository linked (drift)." };
    }
    const events = getEventsFor(slug);
    const lastSync = events[0]?.ts || null;
    return {
      connected: true,
      repo: app.github_repo,
      branch: "main",
      cappshub_path: `.cappshub/`,
      hook_installed: true,
      last_sync: lastSync,
      event_count: events.length,
    };
  }

  function connectionSummary() {
    const apps = window.CC_DATA.APPS;
    const connected = apps.filter(a => a.github_repo).length;
    return {
      connected_repos: connected,
      total_repos: apps.filter(a => a.github_repo || a.stage !== "archive").length,
      events_24h: events.filter(e => (NOW - new Date(e.ts)) < 86400000).length,
      events_total: events.length,
    };
  }

  window.CC_INT = {
    SLASH_COMMANDS,
    HOOK_CONFIG,
    cappshubFiles,
    getEvents, getEventsFor, recordEvent, subscribe,
    simulate, connectionFor, connectionSummary,
    labelForSource,
  };
})();
