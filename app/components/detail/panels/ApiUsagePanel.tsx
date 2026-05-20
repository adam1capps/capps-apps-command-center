import { CC } from "@/lib/tokens";
import type { ApiUsage } from "@/lib/intel";

import { Empty } from "../primitives";

// Ported from prototype/ui-detail.jsx:669-704.
export function ApiUsagePanel({ rows }: { rows: ApiUsage[] }) {
  if (rows.length === 0) return <Empty text="No external APIs." />;
  const max = Math.max(...rows.map((r) => r.calls), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {rows.map((r) => (
        <div key={r.name}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12.5,
              marginBottom: 3,
            }}
          >
            <span style={{ color: CC.INK, fontWeight: 600 }}>{r.name}</span>
            <span style={{ fontFamily: "var(--font-space-mono), monospace", color: CC.MUTED }}>
              {r.calls.toLocaleString()} calls
              {r.fails > 0 && <span style={{ color: CC.H_BROKEN }}> · {r.fails} fails</span>}
              <span style={{ color: CC.MUTED_2 }}> · p95 {r.p95Ms}ms</span>
            </span>
          </div>
          <div style={{ height: 6, background: CC.HAIR_2, borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${(r.calls / max) * 100}%`,
                height: "100%",
                background: r.fails > 0 ? CC.H_WARN : CC.NAVY,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
