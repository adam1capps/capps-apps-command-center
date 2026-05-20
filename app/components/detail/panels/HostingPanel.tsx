import { CC } from "@/lib/tokens";
import { relDate } from "@/lib/format";
import type { Deploy, HostingDetail } from "@/lib/intel";

import { Empty, labelMonoSm } from "../primitives";

// Ported from prototype/ui-detail.jsx:609-664.
export function HostingPanel({
  hosting,
  deploys,
}: {
  hosting: HostingDetail | null;
  deploys: Deploy[];
}) {
  if (!hosting) return <Empty text="No hosting configured." />;
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 12,
          color: CC.INK,
          marginBottom: 8,
        }}
      >
        <div>provider · {hosting.provider}</div>
        <div>branch · {hosting.branch}</div>
        <div>build · {hosting.buildCmd}</div>
        <div>ssl · expires {relDate(hosting.sslExpires)}</div>
      </div>

      <div style={{ ...labelMonoSm(), marginTop: 12, marginBottom: 6 }}>Recent deploys</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {deploys.slice(0, 4).map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px 8px",
              background: CC.SURFACE_2,
              borderRadius: 4,
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11,
            }}
          >
            <span style={{ display: "inline-flex", gap: 8 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  marginTop: 5,
                  flex: "none",
                  background: d.status === "succeeded" ? CC.H_HEALTHY : CC.H_BROKEN,
                }}
              />
              <span style={{ color: CC.INK }}>
                {d.branch} · {d.sha}
              </span>
            </span>
            <span style={{ color: CC.MUTED_2 }}>{relDate(d.when)}</span>
          </div>
        ))}
      </div>

      <div style={{ ...labelMonoSm(), marginTop: 12, marginBottom: 6 }}>
        Env vars ({hosting.envVarNames.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {hosting.envVarNames.map((n) => (
          <span
            key={n}
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 10.5,
              color: CC.MUTED,
              background: CC.SURFACE_2,
              padding: "2px 6px",
              borderRadius: 3,
              border: `1px solid ${CC.HAIR}`,
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
