import { CC, STAGE_TINT } from "@/lib/tokens";
import type { Stage } from "@/lib/tokens";

// Ported from prototype/ui-shared.jsx:90-101.
export function StagePill({ stage }: { stage: string }) {
  const c = STAGE_TINT[stage as Stage] ?? CC.MUTED;
  return (
    <span
      style={{
        fontFamily: "var(--font-space-mono), ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: c,
        background: `${c}14`,
        border: `1px solid ${c}33`,
        padding: "2px 7px",
        borderRadius: 999,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {stage}
    </span>
  );
}
