import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { CC } from "@/lib/tokens";
import { Mark } from "./Mark";

const signInButtonStyle: React.CSSProperties = {
  background: CC.NAVY,
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
};

const navLink: React.CSSProperties = {
  fontSize: 13,
  color: CC.MUTED,
  textDecoration: "none",
  fontWeight: 500,
};

// Ported from prototype/app.jsx:361-399. The prototype's "Sign in" button
// called onSwitchRoute; production routes to /sign-in (a plain link until
// Clerk lands in Phase 5, which swaps it for <SignInButton>).
export function PublicHeader() {
  return (
    <header
      style={{
        borderBottom: `1px solid ${CC.HAIR}`,
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mark dark={false} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: CC.INK }}>
              Capps Apps
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: CC.MUTED,
                fontFamily: "var(--font-space-mono), monospace",
                letterSpacing: ".06em",
              }}
            >
              portfolio · cappsapps.ai
            </div>
          </div>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="#portfolio" style={navLink}>
            Portfolio
          </a>
          <a href="#stack" style={navLink}>
            Stack
          </a>
          <a
            href="https://cappsapps.ai"
            target="_blank"
            rel="noopener"
            style={navLink}
          >
            Consulting
          </a>
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button style={signInButtonStyle}>Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <a href="/dashboard" style={navLink}>
              Dashboard
            </a>
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
