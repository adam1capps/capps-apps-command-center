import type { ReactNode } from "react";

import { CC } from "@/lib/tokens";
import type { Issue } from "@/lib/derive";

// Shared detail-page layout bits, ported from prototype/ui-detail.jsx:317-410.

// Two-column row that collapses to one column under 960px (see globals.css).
export function Row({ children }: { children: ReactNode }) {
  return <div className="cc-detail-row">{children}</div>;
}

export function Card({
  title,
  right,
  accent,
  children,
}: {
  title: string;
  right?: ReactNode;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 10,
        padding: "16px 18px",
        borderTop: accent ? `2px solid ${accent}` : `1px solid ${CC.HAIR}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: 10.5,
            fontWeight: 700,
            color: CC.INK,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          {title}
        </div>
        {right && <div>{right}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function QuickStat({
  label,
  value,
  color,
  last,
}: {
  label: string;
  value: string | number;
  color?: string;
  last?: boolean;
}) {
  return (
    <div style={{ padding: "16px 16px", borderRight: last ? "none" : `1px solid ${CC.HAIR_2}` }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: color ?? CC.INK,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontFamily:
            typeof value === "number"
              ? "var(--font-space-mono), monospace"
              : "inherit",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10,
          color: CC.MUTED,
          marginTop: 7,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function IssuesBanner({ issues }: { issues: Issue[] }) {
  return (
    <div
      style={{
        marginBottom: 24,
        background: "#FFF6E6",
        border: "1px solid #F5C77A",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10.5,
          color: "#8A5A00",
          letterSpacing: ".08em",
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        {issues.length} ISSUE{issues.length > 1 ? "S" : ""} REQUIRING ATTENTION
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 10,
        }}
      >
        {issues.map((i, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              borderRadius: 6,
              padding: "10px 12px",
              border: "1px solid #F5DCA0",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 9,
                fontWeight: 700,
                color: "#8A5A00",
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              {i.kind}
            </div>
            <div style={{ fontSize: 13.5, color: CC.INK, fontWeight: 600, marginTop: 2 }}>
              {i.title}
            </div>
            {i.detail && (
              <div style={{ fontSize: 12, color: CC.MUTED, marginTop: 2 }}>{i.detail}</div>
            )}
            <div style={{ fontSize: 12, color: CC.MUTED, marginTop: 4, fontStyle: "italic" }}>
              → {i.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const pillBtnStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${CC.HAIR}`,
  color: CC.INK,
  padding: "7px 12px",
  borderRadius: 7,
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
};

export function launchBtnStyle(accent: string): React.CSSProperties {
  return {
    background: accent,
    color: accent === "#D4E04F" ? "#1F1F1F" : "#fff",
    padding: "8px 16px",
    borderRadius: 7,
    border: "none",
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}
