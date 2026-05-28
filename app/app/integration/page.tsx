import Link from "next/link";

import { HookConfigBlock } from "@/components/integration/HookConfigBlock";
import { LiveEventFeed } from "@/components/integration/LiveEventFeed";
import { HOOK_CONFIG, SLASH_COMMANDS } from "@/lib/cappshub-spec";
import {
  getConnectedRepos,
  getIntegrationSummary,
  getRecentEvents,
} from "@/lib/db-queries";
import { CC } from "@/lib/tokens";

// Phase 12B port of prototype/ui-integration.jsx:289-506. Authenticated via
// proxy.ts matcher (added `/integration(.*)`). Server component renders the
// static structure + initial data; LiveEventFeed appends new rows via SSE.
export const dynamic = "force-dynamic";

export default async function IntegrationPage() {
  const [events, connectedApps, summary] = await Promise.all([
    getRecentEvents(50),
    getConnectedRepos(),
    getIntegrationSummary(),
  ]);

  // appId -> {slug, name} map for the feed to link rows to /app/[slug].
  const slugMap: Record<string, { slug: string; name: string }> = {};
  for (const a of connectedApps) {
    slugMap[a.id] = { slug: a.slug, name: a.name };
  }

  const initialFeed = events.map((e) => ({
    id: e.id,
    appId: e.appId,
    kind: e.kind,
    text: e.text,
    actor: e.actor,
    createdAt: e.createdAt.toISOString(),
  }));

  const hookJson = JSON.stringify(HOOK_CONFIG, null, 2);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CC.SURFACE_2,
        animation: "ccFade .14s ease-out",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 20,
          borderBottom: `1px solid ${CC.HAIR}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              background: "transparent",
              border: `1px solid ${CC.HAIR}`,
              color: CC.INK,
              padding: "6px 12px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            ← Command Center
          </Link>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11.5,
              color: CC.MUTED,
            }}
          >
            integration <span style={{ color: CC.INK, fontWeight: 700 }}>· Claude Code</span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: CC.MUTED,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: CC.H_HEALTHY,
                animation: "ccConnPulse 2.6s ease-in-out infinite",
              }}
            />
            connected
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 80px" }}>
        <section style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: CC.MUTED,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Claude Code · Capps Apps integration
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: CC.INK,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Notes flow both ways.
            <br />
            <span style={{ color: CC.MUTED }}>
              You and Claude Code share one source of truth.
            </span>
          </h1>
          <p
            style={{
              maxWidth: 720,
              marginTop: 14,
              fontSize: 16,
              color: CC.MUTED,
              lineHeight: 1.55,
            }}
          >
            Every repo carries a{" "}
            <code
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 13.5,
                background: CC.HAIR_2,
                padding: "1px 6px",
                borderRadius: 3,
                color: CC.NAVY,
              }}
            >
              .cappshub/
            </code>{" "}
            folder. Slash commands and the PostToolUse hook write into it from inside Claude
            Code. A GitHub webhook pushes those changes to this dashboard within seconds, no
            waiting on the 6 hour poll.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            background: "#fff",
            border: `1px solid ${CC.HAIR}`,
            borderRadius: 10,
            marginBottom: 32,
            overflow: "hidden",
          }}
        >
          <QStat n={summary.connectedRepos} label="Connected repos" />
          <QStat n={summary.events24h} label="Events · 24h" />
          <QStat n={summary.eventsTotal} label="Events · all-time" />
          <QStat n={SLASH_COMMANDS.length} label="Slash commands" last />
        </div>

        <Section
          title="Slash commands"
          subtitle="Type these inside Claude Code while working in any connected repo."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {SLASH_COMMANDS.map((s) => (
              <div
                key={s.cmd}
                style={{
                  background: "#fff",
                  border: `1px solid ${CC.HAIR}`,
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: CC.NAVY,
                  }}
                >
                  {s.cmd}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: CC.MUTED,
                    marginTop: 4,
                    lineHeight: 1.45,
                  }}
                >
                  {s.summary}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    padding: "7px 9px",
                    background: CC.SURFACE_2,
                    borderRadius: 4,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: CC.INK,
                    overflow: "auto",
                  }}
                >
                  {s.cmd} {s.args}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10.5,
                    color: CC.MUTED_2,
                    marginTop: 6,
                    fontStyle: "italic",
                  }}
                >
                  writes to {s.writesTo}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Hook contract"
          subtitle="Drop this into ~/.claude/settings.json. Hooks fire on every Edit/Write and on Claude's Notification events."
        >
          <HookConfigBlock json={hookJson} />
        </Section>

        <Section
          title=".cappshub/ folder spec"
          subtitle="Every connected repo carries this folder. Claude Code reads and writes it; the dashboard mirrors it."
        >
          <div
            style={{
              background: "#fff",
              border: `1px solid ${CC.HAIR}`,
              borderRadius: 8,
              padding: "12px 16px",
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              lineHeight: 1.75,
              color: CC.INK,
            }}
          >
            <div>
              <span style={{ marginRight: 6 }}>📁</span> <strong>.cappshub/</strong>
            </div>
            <div style={{ paddingLeft: 18 }}>
              ├── <strong>instructions.md</strong>{" "}
              <span style={fileNote}>durable directives, /instruct appends</span>
            </div>
            <div style={{ paddingLeft: 18 }}>
              ├── <strong>plan.json</strong>{" "}
              <span style={fileNote}>Claude Code plan; /plan add|done|drop</span>
            </div>
            <div style={{ paddingLeft: 18 }}>
              └── <strong>notes/</strong>
            </div>
            <div style={{ paddingLeft: 36 }}>    ├── 2026-05-15-render-cold-start.md</div>
            <div style={{ paddingLeft: 36 }}>    ├── 2026-05-16-stripe-500s.md</div>
            <div style={{ paddingLeft: 36 }}>    └── ...</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ marginRight: 6 }}>📄</span> <strong>CLAUDE.md</strong>{" "}
              <span style={fileNote}>auto-generated header + slash command reference</span>
            </div>
          </div>
        </Section>

        <Section
          title="Live event stream"
          subtitle="Newest first. Appends in real time as Claude Code emits hooks or GitHub pushes land."
        >
          <LiveEventFeed initial={initialFeed} slugMap={slugMap} />
        </Section>

        <Section
          title="Connected repos"
          subtitle="All repositories eligible for the webhook plus .cappshub/ sync."
        >
          <div
            style={{
              background: "#fff",
              border: `1px solid ${CC.HAIR}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {connectedApps.map((a, i) => (
              <Link
                key={a.id}
                href={`/app/${a.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "11px 16px",
                    borderBottom:
                      i < connectedApps.length - 1 ? `1px solid ${CC.HAIR_2}` : "none",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: CC.H_HEALTHY,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CC.INK }}>
                      {a.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10.5,
                        color: CC.MUTED_2,
                      }}
                    >
                      {a.githubRepo}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 11,
                      color: CC.MUTED,
                    }}
                  >
                    {a.stage}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ marginBottom: 12 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: CC.INK,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <div style={{ fontSize: 13, color: CC.MUTED, marginTop: 4, maxWidth: 720 }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function QStat({ n, label, last }: { n: number; label: string; last?: boolean }) {
  return (
    <div
      style={{
        padding: "20px 22px",
        borderRight: last ? "none" : `1px solid ${CC.HAIR}`,
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: CC.INK,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10.5,
          color: CC.MUTED,
          marginTop: 8,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

const fileNote: React.CSSProperties = {
  color: "#94A3B8",
  marginLeft: 6,
  fontSize: 10.5,
};
