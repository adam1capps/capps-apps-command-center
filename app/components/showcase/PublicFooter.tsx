import { CC } from "@/lib/tokens";

// Ported from prototype/app.jsx:401-418. The prototype's right-hand "last
// sync 12m ago" was synthetic; real sync timing lands with the Phase 4
// poller, so the right cell shows the domain until then.
export function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${CC.HAIR}`,
        background: "#fff",
        padding: "28px 24px",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: 11,
          color: CC.MUTED,
        }}
      >
        <div>© 2026 Capps Apps · adam capps</div>
        <div>hub.cappsapps.ai</div>
      </div>
    </footer>
  );
}
