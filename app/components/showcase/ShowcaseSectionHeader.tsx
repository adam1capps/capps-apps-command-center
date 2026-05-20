import { CC } from "@/lib/tokens";

// Ported from prototype/ui-showcase.jsx:146-162.
export function ShowcaseSectionHeader({
  label,
  accent,
}: {
  label: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <span
        style={{ width: 14, height: 14, borderRadius: 3, background: accent }}
      />
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: CC.INK,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </h2>
      <div style={{ flex: 1, height: 1, background: CC.HAIR_2 }} />
    </div>
  );
}
