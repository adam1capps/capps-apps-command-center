import { CATEGORIES } from "@/lib/constants";
import { CC } from "@/lib/tokens";
import type { Category } from "@/lib/tokens";

// Ported from prototype/ui-shared.jsx:103-114.
export function CategoryPill({ cat }: { cat: string }) {
  const c = CC.CATS[cat as Category] ?? CC.CATS.internal;
  const label = CATEGORIES[cat as Category]?.label ?? cat;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: c.primary,
        background: c.chip,
        padding: "2px 8px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
