/* Seed data for Capps Apps Command Center.
 * Mirrors the inventory in the brief plus a synthetic latest status_snapshot
 * for each app (what the 6-hour poller would have written).
 */

const CATEGORIES = {
  roofmri:   { id: "roofmri",   label: "Roof MRI",     primary: "#1E2C55", accent: "#00BD70" },
  redry:     { id: "redry",     label: "ReDry",        primary: "#1E2C55", accent: "#E99A3F" },
  mindreadir:{ id: "mindreadir",label: "MindReadir",   primary: "#6B4DE0", accent: "#1E2C55" },
  cappsapps: { id: "cappsapps", label: "Capps Apps",   primary: "#1F1F1F", accent: "#D4E04F" },
  internal:  { id: "internal",  label: "Internal",     primary: "#64748B", accent: "#1A8F96" },
};

const STAGES = ["idea","building","mvp","live","polishing","mature","archive"];

const STAGE_LABEL = {
  idea: "Idea",
  building: "Building",
  mvp: "MVP",
  live: "Live",
  polishing: "Polishing",
  mature: "Mature",
  archive: "Archive",
};

// Synthetic "now" so days_since_commit values are stable.
const NOW = new Date("2026-05-18T08:00:00Z");
const days = (d) => Math.floor((NOW - new Date(d)) / 86400000);

const APPS = [
  // ─── Roof MRI ────────────────────────────────────────────────────────────
  { name:"Roof MRI Website", slug:"roof-mri-website", category:"roofmri",
    description:"Marketing site and PHD Scale reference.",
    live_url:"https://roof-mri.com", custom_domain:"roof-mri.com",
    github_repo:"adam1capps/roof-mri-main-website", hosting:"netlify",
    stage:"mature", visible_on_showcase:true,
    next_move:"Refresh case-study section with Rackley data.",
    blockers:null,
    api_dependencies:["SendGrid","Plausible"],
    snap:{ url_status:200, url_response_ms:184, last_commit_at:"2026-04-22", last_commit_msg:"copy: tighten PHD Scale callouts" } },

  { name:"Proposals App", slug:"proposals-roofmri", category:"roofmri",
    description:"Generates Rackley moisture-detection proposals from intake form.",
    live_url:"https://proposals.roof-mri.com", custom_domain:"proposals.roof-mri.com",
    github_repo:"adam1capps/roof-mri-backend", hosting:"netlify+render",
    stage:"live", visible_on_showcase:true,
    next_move:"Wire Render service health to status dot.",
    blockers:null,
    api_dependencies:["Anthropic","Neon","SendGrid","Render"],
    snap:{ url_status:200, url_response_ms:412, last_commit_at:"2026-05-12", last_commit_msg:"fix: PDF orientation on letter size" } },

  { name:"MRI Connect", slug:"mri-connect", category:"roofmri",
    description:"Contractor portal for certified Rackley installers.",
    live_url:"https://connect.roof-mri.com", custom_domain:"connect.roof-mri.com",
    github_repo:"adam1capps/roof-mri-connect", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Add @re-dry.com login gate for staff view.",
    blockers:null,
    api_dependencies:["Clerk","Neon"],
    snap:{ url_status:200, url_response_ms:236, last_commit_at:"2026-05-09", last_commit_msg:"feat: certificate verification endpoint" } },

  { name:"Pro Trainers Presentation", slug:"pro-trainers", category:"roofmri",
    description:"Slide deck site used in PHD certification classes.",
    live_url:"https://protraining.roof-mri.com", custom_domain:"protraining.roof-mri.com",
    github_repo:"adam1capps/roof-mri-training-presentation-pro", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Replace lesson 4 video with re-recorded version.",
    blockers:"Waiting on edited footage from production.",
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:198, last_commit_at:"2026-03-30", last_commit_msg:"content: add lesson 6 slide notes" } },

  { name:"App Guide", slug:"app-guide", category:"roofmri",
    description:"In-product help index for the Roof MRI app suite.",
    live_url:"https://appguide.roof-mri.com", custom_domain:"appguide.roof-mri.com",
    github_repo:"adam1capps/roof-mri-app-guide", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Index the warranty app's new screens.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:152, last_commit_at:"2026-05-02", last_commit_msg:"docs: vent placement walkthrough" } },

  { name:"Certificate Generator", slug:"certificate-generator", category:"roofmri",
    description:"PHD Scale certificate PDFs for trained contractors.",
    live_url:"https://certifications.roof-mri.com", custom_domain:"certifications.roof-mri.com",
    github_repo:"adam1capps/mri_certificate_generator", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Pull recipient list from Connect instead of CSV upload.",
    blockers:null,
    api_dependencies:["Neon"],
    snap:{ url_status:200, url_response_ms:267, last_commit_at:"2026-04-18", last_commit_msg:"feat: batch download zip" } },

  { name:"Rackley Reports", slug:"rackley-reports", category:"roofmri",
    description:"Customer-facing moisture report viewer for Rackley jobs.",
    live_url:"https://rackley.roof-mri.com", custom_domain:"rackley.roof-mri.com",
    github_repo:"adam1capps/rackley-roof-mri-reports", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Add per-roof drill-down from index page.",
    blockers:null,
    api_dependencies:["Neon","Mapbox"],
    snap:{ url_status:200, url_response_ms:309, last_commit_at:"2026-05-15", last_commit_msg:"feat: PDF export with thermal overlay" } },

  { name:"Warranty Management App", slug:"warranty-management", category:"roofmri",
    description:"Warranty claim intake and certified-roof registry.",
    live_url:"https://warranty-app-kofu.onrender.com", custom_domain:null,
    github_repo:"adam1capps/warranty-management-app", hosting:"netlify+render",
    stage:"live", visible_on_showcase:false,
    next_move:"Move from Render free tier to paid; cold starts hurting UX.",
    blockers:null,
    api_dependencies:["Render","Neon","SendGrid"],
    snap:{ url_status:200, url_response_ms:1840, last_commit_at:"2026-05-07", last_commit_msg:"chore: bump renderer image" } },

  { name:"Training Site", slug:"training-site", category:"roofmri",
    description:"Legacy training portal predating Pro Trainers.",
    live_url:"https://training.roof-mri.com", custom_domain:"training.roof-mri.com",
    github_repo:null, hosting:"netlify (manual)",
    stage:"polishing", visible_on_showcase:false,
    next_move:"Decide: redirect to protraining or rehost in a repo.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:178, last_commit_at:null, last_commit_msg:null } },

  { name:"Moisture Detection", slug:"moisture-detection", category:"roofmri",
    description:"Landing for the moisture-detection training program.",
    live_url:"https://moisture-detection.roof-mri.com", custom_domain:"moisture-detection.roof-mri.com",
    github_repo:null, hosting:"netlify (manual)",
    stage:"polishing", visible_on_showcase:false,
    next_move:"Move source into a repo; currently only on the Netlify drop.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:202, last_commit_at:null, last_commit_msg:null } },

  { name:"Eric/Adam Example", slug:"eric-adam-example", category:"roofmri",
    description:"Reference build used to walk Eric through the stack.",
    live_url:"https://adamericexample.roof-mri.com", custom_domain:"adamericexample.roof-mri.com",
    github_repo:"adam1capps/eric-adam-example", hosting:"netlify",
    stage:"live", visible_on_showcase:false,
    next_move:"Archive once handoff is signed off.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:124, last_commit_at:"2026-02-04", last_commit_msg:"walkthrough: routing example" } },

  // ─── ReDry ───────────────────────────────────────────────────────────────
  { name:"ReDry Website", slug:"redry-website", category:"redry",
    description:"Main commercial site for the Rapid-Vent rental program.",
    live_url:"https://re-dry.com", custom_domain:"re-dry.com",
    github_repo:"adam1capps/ReDry-Website", hosting:"netlify",
    stage:"mature", visible_on_showcase:true,
    next_move:"New hero copy from the 2026 messaging refresh.",
    blockers:null,
    api_dependencies:["SendGrid","Plausible"],
    snap:{ url_status:200, url_response_ms:165, last_commit_at:"2026-04-29", last_commit_msg:"content: update fleet count" } },

  { name:"Job Lifecycle / Job Board", slug:"job-lifecycle", category:"redry",
    description:"Internal board tracking every Rapid-Vent rental from intake to return.",
    live_url:"https://jobboard.re-dry.com", custom_domain:"jobboard.re-dry.com",
    github_repo:"adam1capps/job_lifecycle_app", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Surface days-since-status-change on each card.",
    blockers:null,
    api_dependencies:["Neon","Clerk","SendGrid"],
    snap:{ url_status:200, url_response_ms:289, last_commit_at:"2026-05-14", last_commit_msg:"feat: filter by foreman" } },

  { name:"Flyby (3D)", slug:"flyby", category:"redry",
    description:"Three.js flyby of a wet roof showing dry-down progression.",
    live_url:"https://flyby.re-dry.com", custom_domain:"flyby.re-dry.com",
    github_repo:"adam1capps/flyby-redry", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Bake camera path for the new sales pitch.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:421, last_commit_at:"2026-05-06", last_commit_msg:"feat: time-of-day toggle" } },

  { name:"Vent Placement", slug:"vent-placement", category:"redry",
    description:"Web app for laying out Rapid-Vents on a roof plan.",
    live_url:"https://vents.re-dry.com", custom_domain:"vents.re-dry.com",
    github_repo:"adam1capps/redry-vent-placement", hosting:"netlify+render",
    stage:"live", visible_on_showcase:true,
    next_move:"Contractor read-only view with PHD-scale overlay.",
    blockers:null,
    api_dependencies:["Neon","Anthropic","Render"],
    snap:{ url_status:200, url_response_ms:312, last_commit_at:"2026-05-16", last_commit_msg:"feat: address > roof > project tree" } },

  { name:"Accounting Software", slug:"accounting", category:"redry",
    description:"Internal-only accounting workspace; replaces QBO export hacks.",
    live_url:"https://redry-accounting-app.netlify.app", custom_domain:null,
    github_repo:"adam1capps/accounting-software", hosting:"netlify",
    stage:"mvp", visible_on_showcase:false,
    next_move:"Map chart of accounts to the new categories.",
    blockers:"Waiting on bookkeeper signoff for category list.",
    api_dependencies:["Neon","Plaid"],
    snap:{ url_status:200, url_response_ms:341, last_commit_at:"2026-05-10", last_commit_msg:"feat: invoice import" } },

  { name:"Proposal Builder", slug:"proposal-builder", category:"redry",
    description:"Render-only service that compiles Rapid-Vent proposals from job data.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/redry-proposal-app", hosting:"render",
    stage:"mvp", visible_on_showcase:false,
    next_move:"Front-end shell; service runs but has no UI.",
    blockers:null,
    api_dependencies:["Render","Anthropic"],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-04-26", last_commit_msg:"feat: scope-of-work generator" } },

  { name:"Invoice Manager", slug:"invoice-manager", category:"redry",
    description:"One-off invoice viewer for rental accounts.",
    live_url:"https://invoice.re-dry.com", custom_domain:"invoice.re-dry.com",
    github_repo:"adam1capps/invoice-manager", hosting:"netlify (manual)",
    stage:"polishing", visible_on_showcase:false,
    next_move:"Reconcile with the new Accounting app; likely deprecate.",
    blockers:null,
    api_dependencies:[],
    // drift: live but no repo backing? brief says drift item — keep repo but mark drift_detected anyway via manual deploy
    snap:{ url_status:500, url_response_ms:1240, last_commit_at:"2025-11-04", last_commit_msg:"fix: stripe webhook idempotency" } },

  { name:"ReDry Links", slug:"redry-links", category:"redry",
    description:"Short-link hub used in printed material.",
    live_url:"https://redry-links.netlify.app", custom_domain:null,
    github_repo:null, hosting:"netlify (manual)",
    stage:"live", visible_on_showcase:false,
    next_move:"Move to a repo so deploys aren't drag-and-drop.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:118, last_commit_at:null, last_commit_msg:null } },

  { name:"LinkedIn Outreach", slug:"li-outreach", category:"redry",
    description:"Lead-gen target list and message templates for ReDry sales.",
    live_url:"https://redry-li-outreach.netlify.app", custom_domain:null,
    github_repo:null, hosting:"netlify (manual)",
    stage:"live", visible_on_showcase:false,
    next_move:"Repo it; pair with the LinkedIn App for sending.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:142, last_commit_at:null, last_commit_msg:null } },

  { name:"2026 Internship", slug:"internship-2026", category:"redry",
    description:"Recruiting page for the 2026 ReDry field internship.",
    live_url:"https://redry-2026-internship.netlify.app", custom_domain:null,
    github_repo:null, hosting:"netlify (manual)",
    stage:"live", visible_on_showcase:false,
    next_move:"Add custom domain once we choose redry.jobs or careers.re-dry.com.",
    blockers:null,
    api_dependencies:["SendGrid"],
    snap:{ url_status:200, url_response_ms:171, last_commit_at:null, last_commit_msg:null } },

  // ─── MindReadir ──────────────────────────────────────────────────────────
  { name:"MindReadir Press Engine", slug:"mindreadir-press", category:"mindreadir",
    description:"Press-release engine for MindReadir announcements.",
    live_url:"https://mindreadir.com", custom_domain:"mindreadir.com",
    github_repo:"adam1capps/mindreadir-press-app", hosting:"netlify+render",
    stage:"live", visible_on_showcase:true,
    next_move:"Move LLM calls from Render worker to direct fetch.",
    blockers:null,
    api_dependencies:["Anthropic","Render","Neon","SendGrid"],
    snap:{ url_status:200, url_response_ms:498, last_commit_at:"2026-05-11", last_commit_msg:"feat: outlet targeting" } },

  // ─── Capps Apps ──────────────────────────────────────────────────────────
  { name:"LightUp Proposal", slug:"lightup", category:"cappsapps",
    description:"Consulting proposal landing page for the LightUp engagement.",
    live_url:"https://cappsapps.ai/lightup", custom_domain:"cappsapps.ai",
    github_repo:"adam1capps/lightup", hosting:"netlify",
    stage:"live", visible_on_showcase:true,
    next_move:"Add scope-extension addendum section.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:108, last_commit_at:"2026-05-08", last_commit_msg:"copy: tighten deliverables list" } },

  { name:"Capps Apps Proposals", slug:"cappsapps-proposals", category:"cappsapps",
    description:"Template engine for new Capps Apps consulting proposals.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/cappsapps-proposals", hosting:"none",
    stage:"building", visible_on_showcase:false,
    next_move:"Pick a template structure and lock the first three sections.",
    blockers:null,
    api_dependencies:["Anthropic"],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-02-19", last_commit_msg:"scaffold: route shell" } },

  // ─── Internal / Other ────────────────────────────────────────────────────
  { name:"The Hub App", slug:"hub-app", category:"internal",
    description:"Internal dispatcher used to route inbound work to the right portfolio app.",
    live_url:"https://thehubapp.netlify.app", custom_domain:null,
    github_repo:"adam1capps/hub-dispatch", hosting:"netlify",
    stage:"live", visible_on_showcase:false,
    next_move:"Roll into this Command Center.",
    blockers:null,
    api_dependencies:["Neon"],
    snap:{ url_status:200, url_response_ms:204, last_commit_at:"2026-04-11", last_commit_msg:"feat: routing rule editor" } },

  { name:"Hub App Scanner", slug:"hub-app-scanner", category:"internal",
    description:"launchd job that walks the local code directory and reports orphan repos.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/hub-app-scanner", hosting:"local",
    stage:"live", visible_on_showcase:false,
    next_move:"Push results to Neon so the Command Center can read them.",
    blockers:null,
    api_dependencies:["Neon"],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-05-13", last_commit_msg:"feat: detect netlify-only deploys" } },

  { name:"TaskLine App", slug:"taskline", category:"internal",
    description:"Personal task line; minimal, single-stream.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/taskline-app", hosting:"none",
    stage:"building", visible_on_showcase:false,
    next_move:"Decide if this stays personal or becomes a portfolio app.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-01-21", last_commit_msg:"init: schema sketch" } },

  { name:"Smart Bookkeeper", slug:"smart-bookkeeper", category:"internal",
    description:"Categorization layer over Plaid transactions for the ReDry books.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/smart-bookkeeper", hosting:"none",
    stage:"building", visible_on_showcase:false,
    next_move:"Fold into the ReDry Accounting app.",
    blockers:null,
    api_dependencies:["Plaid","Anthropic"],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-03-02", last_commit_msg:"feat: rule engine prototype" } },

  { name:"LinkedIn App", slug:"linkedin-app", category:"internal",
    description:"Sender service paired with the ReDry outreach target list.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/linkedin-app", hosting:"none",
    stage:"building", visible_on_showcase:false,
    next_move:"Stalled. Pick up after LinkedIn API approval lands.",
    blockers:"Awaiting LinkedIn Marketing Developer Platform access.",
    api_dependencies:["LinkedIn"],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-02-28", last_commit_msg:"scaffold: auth flow" } },

  { name:"Gravimetric Readings App", slug:"gravimetric-readings", category:"internal",
    description:"Logbook for lab gravimetric moisture readings used to calibrate PHD Scale.",
    live_url:"https://gravimetrics-app.netlify.app", custom_domain:null,
    github_repo:"adam1capps/gravimetric-readings-app", hosting:"netlify+render",
    stage:"mvp", visible_on_showcase:false,
    next_move:"Add CSV import from the lab's USB scale.",
    blockers:null,
    api_dependencies:["Render","Neon"],
    snap:{ url_status:200, url_response_ms:367, last_commit_at:"2026-04-04", last_commit_msg:"feat: reading entry form" } },

  { name:"Grid & Report Workflow", slug:"grid-report", category:"internal",
    description:"Internal grid editor and report renderer used for ad-hoc QA.",
    live_url:"https://helpful-seahorse-755ba9.netlify.app", custom_domain:null,
    github_repo:"adam1capps/grid-and-report-workflow", hosting:"netlify",
    stage:"mvp", visible_on_showcase:false,
    next_move:"Give it a custom domain or sunset.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:404, url_response_ms:96, last_commit_at:"2026-03-19", last_commit_msg:"feat: report renderer v2" } },

  { name:"TruHome Experience", slug:"truhome", category:"internal",
    description:"Client-specific landing experience for the TruHome pilot.",
    live_url:"https://truhome-experience.netlify.app", custom_domain:null,
    github_repo:"adam1capps/truhomeexperience", hosting:"netlify",
    stage:"mvp", visible_on_showcase:false,
    next_move:"Decide whether TruHome continues; if not, archive.",
    blockers:null,
    api_dependencies:[],
    snap:{ url_status:200, url_response_ms:221, last_commit_at:"2026-02-12", last_commit_msg:"feat: walkthrough video block" } },

  // ─── Archive candidates ──────────────────────────────────────────────────
  { name:"roof-mri-website (empty)", slug:"roof-mri-website-stub", category:"roofmri",
    description:"Empty stub repo. Superseded by roof-mri-main-website.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/roof-mri-website", hosting:"none",
    stage:"archive", visible_on_showcase:false,
    next_move:null, blockers:null, api_dependencies:[],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2025-04-02", last_commit_msg:"init" } },

  { name:"roof-mri-frontend (stub)", slug:"roof-mri-frontend", category:"roofmri",
    description:"Empty stub repo. No live deploy.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/roof-mri-frontend", hosting:"none",
    stage:"archive", visible_on_showcase:false,
    next_move:null, blockers:null, api_dependencies:[],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2025-05-18", last_commit_msg:"init" } },

  { name:"roofwarrantymanagement (readme)", slug:"roofwarrantymanagement", category:"roofmri",
    description:"README only. Superseded by warranty-management-app.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/roofwarrantymanagement", hosting:"none",
    stage:"archive", visible_on_showcase:false,
    next_move:null, blockers:null, api_dependencies:[],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2025-07-30", last_commit_msg:"init README" } },

  { name:"redry-website-03042026 (dup)", slug:"redry-website-dup", category:"redry",
    description:"Working-copy duplicate of ReDry-Website. Safe to archive.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/redry-website-03042026", hosting:"none",
    stage:"archive", visible_on_showcase:false,
    next_move:null, blockers:null, api_dependencies:[],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2026-03-04", last_commit_msg:"backup snapshot" } },

  { name:"personal-brand (readme)", slug:"personal-brand", category:"cappsapps",
    description:"README only. Placeholder for a future personal site.",
    live_url:null, custom_domain:null,
    github_repo:"adam1capps/personal-brand", hosting:"none",
    stage:"archive", visible_on_showcase:false,
    next_move:null, blockers:null, api_dependencies:[],
    snap:{ url_status:null, url_response_ms:null, last_commit_at:"2025-09-11", last_commit_msg:"init" } },
];

/* ─── Derive snapshot fields the poller would compute ────────────────────── */
function deriveSnapshot(app) {
  const s = app.snap || {};
  const last = s.last_commit_at ? new Date(s.last_commit_at) : null;
  const days_since_commit = last ? days(s.last_commit_at) : null;

  let health = "healthy";
  if (app.stage === "archive") {
    health = "archive";
  } else if (s.url_status != null && s.url_status !== 200) {
    health = "broken";
  } else if (app.live_url && !app.github_repo) {
    health = "warning"; // drift (we still color the dot yellow)
  } else if (app.live_url && days_since_commit != null && days_since_commit > 60) {
    health = "warning";
  } else if (app.stage === "building" && days_since_commit != null && days_since_commit > 60) {
    health = "stale";
  } else if (!app.live_url && app.stage !== "building" && app.stage !== "idea") {
    health = "warning";
  }

  const drift_detected = Boolean(app.live_url && !app.github_repo);

  return {
    url_status: s.url_status ?? null,
    url_response_ms: s.url_response_ms ?? null,
    last_commit_at: s.last_commit_at ?? null,
    days_since_commit,
    last_commit_msg: s.last_commit_msg ?? null,
    health_score: health,
    drift_detected,
    checked_at: NOW.toISOString(),
  };
}

// Bake the derived snapshot onto each app.
APPS.forEach(a => { a.status = deriveSnapshot(a); });

/* ─── Issue surfacing (drives Needs Attention view) ──────────────────────── */
function getIssues(app) {
  const out = [];
  const s = app.status;
  if (app.stage === "archive") return out;

  if (s.url_status != null && s.url_status !== 200) {
    out.push({
      kind: "broken",
      severity: 1,
      title: `Site responded ${s.url_status}`,
      detail: app.live_url,
      action: "Check Netlify deploy log and DNS.",
    });
  }
  if (s.drift_detected) {
    out.push({
      kind: "drift",
      severity: 2,
      title: "Live site has no repo backing it",
      detail: "Drag-and-drop deploy. Source lives only on Netlify.",
      action: "Move source into a repo; reconnect Netlify to it.",
    });
  }
  if (app.stage === "building" && s.days_since_commit != null && s.days_since_commit > 60) {
    out.push({
      kind: "stalled",
      severity: 3,
      title: `Stalled in development (${s.days_since_commit}d since last commit)`,
      detail: s.last_commit_msg ? `Last: "${s.last_commit_msg}"` : "",
      action: "Decide: ship the MVP cut, hand off, or archive.",
    });
  }
  if (s.url_response_ms != null && s.url_response_ms > 1500 && s.url_status === 200) {
    out.push({
      kind: "slow",
      severity: 3,
      title: `Slow response (${s.url_response_ms}ms)`,
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

window.CC_DATA = { APPS, CATEGORIES, STAGES, STAGE_LABEL, getIssues, NOW };
