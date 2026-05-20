import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import { unique } from "@/lib/format";
import type { App } from "@/db/schema";

import { Stat } from "./Stat";
import { ShowcaseSectionHeader } from "./ShowcaseSectionHeader";
import { ShowcaseCard } from "./ShowcaseCard";

// Ported from prototype/ui-showcase.jsx:5-125. `apps` is the already-filtered
// showcase set (see lib/db-queries.ts getShowcaseApps).
export function ShowcaseView({ apps }: { apps: App[] }) {
  const apis = unique(apps.flatMap((a) => a.apiDependencies)).sort();
  const liveUrls = apps.filter((a) => a.liveUrl).length;
  const customDomains = apps.filter((a) => a.customDomain).length;

  const sections = Object.values(CATEGORIES)
    .map((c) => ({ cat: c, items: apps.filter((a) => a.category === c.id) }))
    .filter((s) => s.items.length > 0);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>
      <div style={{ padding: "56px 0 32px" }}>
        <div
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.MUTED,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          hub.cappsapps.ai · adam capps · portfolio
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: 700,
            color: CC.INK,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
          }}
        >
          Every app I&apos;ve shipped.
          <br />
          <span style={{ color: CC.MUTED }}>One place.</span>
        </h1>
        <p
          style={{
            maxWidth: 620,
            marginTop: 18,
            fontSize: 16.5,
            color: CC.MUTED,
            lineHeight: 1.55,
          }}
        >
          Live index of the apps running across Roof MRI, ReDry, MindReadir, and
          Capps Apps consulting. Updates itself every six hours from HTTP pings
          and the GitHub API. No screenshots, no marketing renders.
        </p>
      </div>

      <div
        id="portfolio"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          border: `1px solid ${CC.HAIR}`,
          borderRadius: 10,
          marginBottom: 56,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Stat n={apps.length} label="Apps shipped" />
        <Stat n={liveUrls} label="Live URLs" />
        <Stat n={customDomains} label="Custom domains" />
        <Stat n={apis.length} label="APIs integrated" />
      </div>

      {sections.map(({ cat, items }) => (
        <section key={cat.id} style={{ marginBottom: 56 }}>
          <ShowcaseSectionHeader label={cat.label} accent={cat.accent} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {items.map((a) => (
              <ShowcaseCard key={a.slug} app={a} />
            ))}
          </div>
        </section>
      ))}

      <section id="stack" style={{ marginBottom: 56 }}>
        <div
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.MUTED,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Stack
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "20px 22px",
            borderRadius: 10,
            border: `1px solid ${CC.HAIR}`,
            background: "#fff",
          }}
        >
          {apis.map((api) => (
            <span
              key={api}
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 12,
                color: CC.INK,
                background: CC.SURFACE_2,
                padding: "5px 10px",
                borderRadius: 4,
                border: `1px solid ${CC.HAIR}`,
              }}
            >
              {api}
            </span>
          ))}
        </div>
      </section>

      <section
        style={{
          background: CC.NAVY,
          color: "#fff",
          borderRadius: 12,
          padding: "40px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
            Want something like this built?
          </div>
          <div style={{ marginTop: 6, color: "#B0C4DE", fontSize: 14 }}>
            Consulting, prototyping, and full-stack builds.
          </div>
        </div>
        <a
          href="https://cappsapps.ai"
          target="_blank"
          rel="noopener"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#D4E04F",
            color: "#1F1F1F",
            padding: "14px 22px",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          cappsapps.ai
          <span
            style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 14 }}
          >
            →
          </span>
        </a>
      </section>
    </div>
  );
}
