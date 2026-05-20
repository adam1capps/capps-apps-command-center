import { CC } from "@/lib/tokens";

// Ported from prototype/ui-shared.jsx:129-134. Text only, no emoji (brand rule).
export function HostingMark({ hosting }: { hosting: string | null }) {
  if (!hosting || hosting === "none") return null;
  return (
    <span
      style={{
        fontFamily: "var(--font-space-mono), ui-monospace, monospace",
        fontSize: 10,
        color: CC.MUTED_2,
        letterSpacing: ".04em",
      }}
    >
      {hosting}
    </span>
  );
}
