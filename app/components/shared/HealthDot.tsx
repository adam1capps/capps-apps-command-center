import { HEALTH } from "@/lib/tokens";
import type { HealthScore } from "@/lib/tokens";

// Ported from prototype/ui-shared.jsx:69-87.
export function HealthDot({
  score,
  size = 8,
  pulse = false,
}: {
  score: string;
  size?: number;
  pulse?: boolean;
}) {
  const h = HEALTH[score as HealthScore] ?? HEALTH.stale;
  return (
    <span
      title={h.label}
      aria-label={h.label}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 999,
        background: h.color,
        boxShadow: pulse ? `0 0 0 0 ${h.color}66` : "none",
        animation:
          pulse && score === "broken" ? "ccPulse 1.6s ease-out infinite" : "none",
        flex: "none",
      }}
    />
  );
}
