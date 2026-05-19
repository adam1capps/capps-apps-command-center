/* Notes + instructions store.
 * Each app can carry any number of items. Two types:
 *   - "instruction" : directive for working on this app (sticky guidance)
 *   - "note"        : observation / log entry / scratchpad
 *
 * Items persist in localStorage under `cc_notes_v1` and survive reloads.
 * The store seeds a few realistic items the first time it runs so the
 * UI doesn't look empty.
 */

(function () {
  const KEY = "cc_notes_v2";
  const SEED = {
    "vent-placement": [
      { kind: "instruction", title: "Use the theme tokens",
        body: "Pull colors/fonts from `frontend/src/constants/theme.js`. SEG_COLORS controls the wall rotation — don't redefine it elsewhere. DM Sans only, 6px radii, navy header.",
        created_at: "2026-05-09T14:00:00Z",
        source: "claude-md", repo_path: ".cappshub/instructions.md", commit_sha: "a91f2c4" },
      { kind: "note", title: "Render cold-start measurement",
        body: "Stopwatch on the Render service: 2.8s first request after 15min idle. After warmup, 280–340ms steady state. If we move proposal generation here, warm with a /healthz ping every 10min.",
        created_at: "2026-05-15T09:20:00Z",
        source: "hook", repo_path: ".cappshub/notes/2026-05-15-render-cold-start.md", commit_sha: "d4e8a17" },
      { kind: "instruction", title: "Contractor view = read-only",
        body: "Contractors must never be able to edit vent placement. The PHD-scale overlay should render but actions are disabled.",
        created_at: "2026-05-11T08:10:00Z",
        source: "claude-md", repo_path: ".cappshub/instructions.md", commit_sha: "a91f2c4" },
    ],
    "job-lifecycle": [
      { kind: "instruction", title: "Foreman filter respects job timezone",
        body: "All filters use the job site timezone, not the foreman's local. There was a bug where MST/CST jobs got mis-bucketed in the 'today' filter.",
        created_at: "2026-05-12T17:45:00Z",
        source: "slash-command", repo_path: ".cappshub/instructions.md", commit_sha: "7c2b119" },
      { kind: "note", title: "Status-change-age request",
        body: "Brandon asked: surface how long a job has been in its current status. Want a soft yellow tint when > 5 days.",
        created_at: "2026-05-14T11:00:00Z",
        source: "manual" },
    ],
    "warranty-management": [
      { kind: "note", title: "Render free tier — moving off",
        body: "1.84s response logged in last poll. That's cold start. Bumping to paid Render service before the next contractor batch ships next Tuesday.",
        created_at: "2026-05-16T19:30:00Z",
        source: "hook", repo_path: ".cappshub/notes/2026-05-16-render-tier.md", commit_sha: "b1d44a0" },
    ],
    "redry-website": [
      { kind: "instruction", title: "Voice rules — REDRY_BRAND.md",
        body: "No em dashes. No emoji. Imperative voice. Imperial units. Phone format: 877.733.7973 (dots, not dashes). Domain: re-dry.com (hyphenated).",
        created_at: "2026-04-29T16:00:00Z",
        source: "claude-md", repo_path: ".cappshub/instructions.md", commit_sha: "e0a9c12" },
    ],
    "invoice-manager": [
      { kind: "note", title: "500s started last Friday",
        body: "Stripe webhook signature mismatch after they rotated keys. Quick fix is to pull the new secret from Stripe dashboard. Probably easier to just deprecate this and route invoicing through the new Accounting app.",
        created_at: "2026-05-16T08:00:00Z",
        source: "slash-command", repo_path: ".cappshub/notes/2026-05-16-stripe-500s.md", commit_sha: "3f8e0b2" },
    ],
    "mri-connect": [
      { kind: "instruction", title: "Cert verification endpoint stays public",
        body: "/api/verify/:cert_id must remain unauthenticated — it's hit from QR codes on printed certificates. Rate-limit but never gate.",
        created_at: "2026-05-09T10:00:00Z",
        source: "claude-md", repo_path: ".cappshub/instructions.md", commit_sha: "5c1aa83" },
    ],
    "mindreadir-press": [
      { kind: "note", title: "Anthropic rate-limit playbook",
        body: "Press generation can burst 6–8 calls in a few seconds when an outlet batch ships. If we start hitting 429s, fall back to Render worker with a backoff queue.",
        created_at: "2026-05-11T12:00:00Z",
        source: "hook", repo_path: ".cappshub/notes/2026-05-11-anthropic-429.md", commit_sha: "9a2c4d5" },
    ],
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }

  // hydrate state (seeded once)
  function init() {
    const existing = load();
    if (existing) return existing;
    const out = {};
    for (const slug in SEED) {
      out[slug] = SEED[slug].map(item => ({
        id: cryptoId(),
        kind: item.kind,
        title: item.title,
        body: item.body,
        created_at: item.created_at,
        updated_at: item.created_at,
        source: item.source || "manual",
        repo_path: item.repo_path || null,
        commit_sha: item.commit_sha || null,
      }));
    }
    save(out);
    return out;
  }

  function cryptoId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "n_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // simple emitter so React components re-render on changes
  const listeners = new Set();
  const emit = () => listeners.forEach(l => l());

  let state = init();

  function getAll() { return state; }
  function getFor(slug) { return state[slug] || []; }
  function countFor(slug) { return (state[slug] || []).length; }

  function upsert(slug, item) {
    const list = state[slug] ? [...state[slug]] : [];
    const idx  = list.findIndex(n => n.id === item.id);
    const now  = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item, updated_at: now };
    } else {
      list.unshift({
        id: item.id || cryptoId(),
        kind: item.kind || "note",
        title: item.title || "Untitled",
        body: item.body || "",
        created_at: now,
        updated_at: now,
        source: item.source || "manual",
        repo_path: item.repo_path || null,
        commit_sha: item.commit_sha || null,
      });
    }
    state = { ...state, [slug]: list };
    save(state); emit();
    return list[idx >= 0 ? idx : 0];
  }

  function remove(slug, id) {
    const list = (state[slug] || []).filter(n => n.id !== id);
    state = { ...state, [slug]: list };
    save(state); emit();
  }

  function findById(id) {
    for (const slug in state) {
      const m = state[slug].find(n => n.id === id);
      if (m) return { slug, note: m };
    }
    return null;
  }

  function reset() {
    localStorage.removeItem(KEY);
    state = init();
    emit();
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  window.CC_NOTES = {
    getAll, getFor, countFor, upsert, remove, findById, subscribe, reset,
    newId: cryptoId,
  };
})();
