import { CC } from "@/lib/tokens";
import { relDate } from "@/lib/format";
import type { StatusSnapshot } from "@/db/schema";
import type { AppIntel } from "@/lib/intel";

import { Empty } from "../primitives";

interface FeedItem {
  kind: string;
  when: Date;
  text: string;
  color: string;
}

// Ported from prototype/ui-detail.jsx:443-498.
export function ActivityFeed({
  snapshot,
  intel,
}: {
  snapshot: StatusSnapshot | null;
  intel: AppIntel;
}) {
  const items: FeedItem[] = [];

  if (snapshot) {
    items.push({
      kind: "check",
      when: snapshot.checkedAt,
      text: snapshot.urlStatus
        ? `Status check ${snapshot.urlStatus} · ${snapshot.urlResponseMs ?? "n/a"}ms`
        : "Status check skipped (no live URL)",
      color:
        snapshot.urlStatus === 200
          ? CC.H_HEALTHY
          : snapshot.urlStatus
            ? CC.H_BROKEN
            : CC.MUTED_2,
    });
  }

  intel.deploys.slice(0, 3).forEach((d) =>
    items.push({
      kind: "deploy",
      when: d.when,
      text: `Deploy ${d.status} · ${d.branch} @ ${d.sha} · ${d.durationS}s`,
      color: d.status === "succeeded" ? CC.H_HEALTHY : CC.H_BROKEN,
    }),
  );

  if (snapshot?.lastCommitAt) {
    items.push({
      kind: "commit",
      when: snapshot.lastCommitAt,
      text: `Commit · ${snapshot.lastCommitMsg ?? "n/a"}`,
      color: "#6B4DE0",
    });
  }

  items.sort((a, b) => b.when.getTime() - a.when.getTime());

  if (items.length === 0) return <Empty text="No recorded activity." />;

  const shown = items.slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {shown.map((it, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: "8px 0",
            borderBottom: idx < shown.length - 1 ? `1px solid ${CC.HAIR_2}` : "none",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: it.color,
              flex: "none",
              marginTop: 7,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: CC.INK }}>{it.text}</div>
            <div
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 10.5,
                color: CC.MUTED_2,
                marginTop: 2,
              }}
            >
              {relDate(it.when)} · {it.kind}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
