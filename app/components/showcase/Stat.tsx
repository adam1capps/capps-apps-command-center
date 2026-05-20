import { CC } from "@/lib/tokens";

// Ported from prototype/ui-showcase.jsx:127-144.
export function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ padding: "22px 22px", borderRight: `1px solid ${CC.HAIR}` }}>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: CC.INK,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 11,
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
