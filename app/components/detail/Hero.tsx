import { CategoryPill } from "@/components/shared/CategoryPill";
import { HealthDot } from "@/components/shared/HealthDot";
import { HostingMark } from "@/components/shared/HostingMark";
import { StagePill } from "@/components/shared/StagePill";
import { relDate } from "@/lib/format";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";
import type { App, StatusSnapshot } from "@/db/schema";

// Ported from prototype/ui-detail.jsx:88-118.
export function Hero({
  app,
  snapshot,
}: {
  app: App;
  snapshot: StatusSnapshot | null;
}) {
  const cat = CC.CATS[app.category as Category] ?? CC.CATS.internal;
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <HealthDot score={snapshot?.healthScore ?? "stale"} size={10} pulse />
        <StagePill stage={app.stage} />
        <CategoryPill cat={app.category} />
        <HostingMark hosting={app.hosting} />
        <span
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
            color: CC.MUTED_2,
            marginLeft: "auto",
          }}
        >
          polled {relDate(snapshot?.checkedAt ?? null)}
        </span>
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 700,
          color: CC.INK,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {app.name}
      </h1>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 16,
          color: CC.MUTED,
          lineHeight: 1.5,
          maxWidth: 720,
        }}
      >
        {app.description}
      </p>
      {app.liveUrl && (
        <a
          href={app.liveUrl}
          target="_blank"
          rel="noopener"
          style={{
            marginTop: 10,
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 12.5,
            color: cat.primary,
            textDecoration: "none",
          }}
        >
          {app.liveUrl} ↗
        </a>
      )}
    </section>
  );
}
