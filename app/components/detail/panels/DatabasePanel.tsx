import { CC } from "@/lib/tokens";
import { relDate } from "@/lib/format";
import type { Database } from "@/lib/intel";

import { Empty } from "../primitives";

// Ported from prototype/ui-detail.jsx:565-604.
export function DatabasePanel({ db }: { db: Database | null }) {
  if (!db) return <Empty text="No database connected to this app." />;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 12.5,
            color: CC.INK,
            fontWeight: 700,
          }}
        >
          {db.name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.MUTED_2,
          }}
        >
          {db.totalRows.toLocaleString()} rows · {db.sizeMb}MB
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {db.tables.map((t) => (
          <div
            key={t.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 8px",
              background: CC.SURFACE_2,
              borderRadius: 4,
              fontFamily: "var(--font-space-mono), monospace",
              fontSize: 12,
            }}
          >
            <span style={{ color: CC.INK }}>{t.name}</span>
            <span style={{ color: CC.MUTED_2, fontSize: 11 }}>
              {t.rows.toLocaleString()} rows · {relDate(t.lastWrite)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <a
          href="https://console.neon.tech"
          target="_blank"
          rel="noopener"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 11,
            color: CC.NAVY,
            textDecoration: "none",
          }}
        >
          Open in Neon console ↗
        </a>
      </div>
    </div>
  );
}
