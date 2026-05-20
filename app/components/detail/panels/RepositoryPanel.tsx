import { CC } from "@/lib/tokens";
import type { AppIntel } from "@/lib/intel";

import { Empty, labelMonoSm } from "../primitives";

const LANG_COLORS = ["#1E2C55", "#00BD70", "#E99A3F", "#6B4DE0"];

// Ported from prototype/ui-detail.jsx:502-560.
export function RepositoryPanel({
  intel,
  githubRepo,
}: {
  intel: AppIntel;
  githubRepo: string | null;
}) {
  if (!githubRepo) return <Empty text="No repository linked (drift)." />;
  const { commits, languages, contributors } = intel;
  const max = Math.max(...commits.weekly, 1);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 56,
          marginBottom: 10,
        }}
      >
        {commits.weekly.map((v, i) => (
          <div
            key={i}
            title={`${v} commits`}
            style={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              minHeight: 2,
              background: i === commits.weekly.length - 1 ? CC.NAVY : `${CC.NAVY}55`,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 10.5,
          color: CC.MUTED_2,
          marginBottom: 14,
        }}
      >
        <span>12 weeks ago</span>
        <span>
          {commits.total} commits total · {contributors} contributor
          {contributors !== 1 ? "s" : ""}
        </span>
        <span>this week</span>
      </div>

      {languages.length > 0 && (
        <>
          <div style={labelMonoSm()}>Languages</div>
          <div
            style={{
              display: "flex",
              height: 8,
              borderRadius: 3,
              overflow: "hidden",
              marginTop: 6,
              marginBottom: 8,
              border: `1px solid ${CC.HAIR_2}`,
            }}
          >
            {languages.map((l, idx) => (
              <div
                key={l.name}
                title={`${l.name} ${l.pct}%`}
                style={{
                  width: `${l.pct}%`,
                  background: LANG_COLORS[idx] ?? CC.MUTED_2,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {languages.map((l, idx) => (
              <span
                key={l.name}
                style={{
                  fontSize: 11.5,
                  color: CC.MUTED,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: LANG_COLORS[idx] ?? CC.MUTED_2,
                  }}
                />
                {l.name}{" "}
                <span style={{ fontFamily: "var(--font-space-mono), monospace", color: CC.MUTED_2 }}>
                  {l.pct}%
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
