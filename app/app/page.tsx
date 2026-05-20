import { PublicHeader } from "@/components/showcase/PublicHeader";
import { PublicFooter } from "@/components/showcase/PublicFooter";
import { getShowcaseApps } from "@/lib/db-queries";
import { CC } from "@/lib/tokens";

// Rendered per-request: the showcase reads live data from Neon, and the
// build environment cannot reach the database. The Phase 4 poller keeps the
// underlying snapshots fresh; revisit caching in Phase 14 polish.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const showcase = await getShowcaseApps();

  return (
    <>
      <PublicHeader />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>
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
            Live index of the apps running across Roof MRI, ReDry, MindReadir,
            and Capps Apps consulting. Updates itself every six hours from HTTP
            pings and the GitHub API. No screenshots, no marketing renders.
          </p>
        </div>

        <div
          style={{
            border: `1px solid ${CC.HAIR}`,
            borderRadius: 10,
            background: CC.SURFACE_2,
            padding: "28px 24px",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 13,
            color: CC.MUTED,
          }}
        >
          {showcase.length} apps ready for the showcase grid. Layout lands in
          the next slice.
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
