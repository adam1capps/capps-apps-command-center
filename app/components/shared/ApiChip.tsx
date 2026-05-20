import { CC } from "@/lib/tokens";

// Ported from prototype/ui-shared.jsx:116-126.
export function ApiChip({ name }: { name: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-space-mono), ui-monospace, monospace",
        fontSize: 10.5,
        color: CC.MUTED,
        background: CC.SURFACE_2,
        border: `1px solid ${CC.HAIR}`,
        padding: "1px 6px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
}
