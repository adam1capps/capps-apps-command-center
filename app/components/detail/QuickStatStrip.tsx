import { CC } from "@/lib/tokens";
import type { App, StatusSnapshot } from "@/db/schema";
import type { AppIntel } from "@/lib/intel";

import { QuickStat } from "./primitives";

// Ported from prototype/ui-detail.jsx:122-138. Notes count stays 0 until the
// notes table lands in Phase 9.
export function QuickStatStrip({
  app,
  snapshot,
  intel,
  notesCount = 0,
}: {
  app: App;
  snapshot: StatusSnapshot | null;
  intel: AppIntel;
  notesCount?: number;
}) {
  const status = snapshot?.urlStatus ?? null;
  const ms = snapshot?.urlResponseMs ?? null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 0,
        background: "#fff",
        border: `1px solid ${CC.HAIR}`,
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      <QuickStat
        label="HTTP"
        value={status ?? "n/a"}
        color={status === 200 ? CC.H_HEALTHY : CC.H_BROKEN}
      />
      <QuickStat
        label="Response"
        value={ms != null ? `${ms}ms` : "n/a"}
        color={ms != null && ms > 1500 ? CC.H_WARN : CC.INK}
      />
      <QuickStat label="Commits" value={intel.commits.total || "n/a"} />
      <QuickStat label="Tables" value={intel.database?.tables.length || "n/a"} />
      <QuickStat label="APIs" value={app.apiDependencies.length || "n/a"} />
      <QuickStat label="Notes" value={notesCount} last />
    </div>
  );
}
