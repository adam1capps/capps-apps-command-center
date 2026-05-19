import { CC } from "@/lib/tokens";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: 18,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-space-mono), ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: CC.MUTED,
        }}
      >
        capps apps command center
      </p>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: CC.INK,
          letterSpacing: "-0.01em",
          margin: 0,
          maxWidth: 640,
        }}
      >
        Production app coming online.
      </h1>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: CC.MUTED,
          margin: 0,
          maxWidth: 560,
        }}
      >
        Phase 1 PR 2 placeholder. The public showcase ships in Phase 3.
      </p>
    </main>
  );
}
