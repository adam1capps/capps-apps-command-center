import { CC } from "@/lib/tokens";
import type { Traffic } from "@/lib/intel";

import { Empty, labelMonoSm } from "../primitives";

// Ported from prototype/ui-detail.jsx:709-725.
export function TrafficPanel({
  traffic,
  accent,
}: {
  traffic: Traffic | null;
  accent: string;
}) {
  if (!traffic) return <Empty text="No traffic data (no live URL)." />;
  const max = Math.max(...traffic.week, 1);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: CC.INK,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-space-mono), monospace",
          }}
        >
          {traffic.sessions.toLocaleString()}
        </div>
        <div style={labelMonoSm()}>sessions · last 7d</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: 50,
          marginBottom: 12,
        }}
      >
        {traffic.week.map((v, i) => (
          <div
            key={i}
            title={`${v} sessions`}
            style={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              minHeight: 2,
              background: accent,
              borderRadius: 2,
              opacity: 0.6 + 0.4 * (i / 6),
            }}
          />
        ))}
      </div>
      <div style={{ ...labelMonoSm(), marginBottom: 6 }}>Top sources</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {traffic.referrers.map((r) => (
          <div
            key={r.src}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 11.5,
              color: CC.MUTED,
            }}
          >
            <span style={{ color: CC.INK }}>{r.src}</span>
            <span>{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
