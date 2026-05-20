import { SignIn } from "@clerk/nextjs";

import { CC } from "@/lib/tokens";

// Catch-all sign-in route so Clerk can render its sub-paths (factor-two, sso
// callback, etc.). Forced dynamic so the build never prerenders a Clerk
// component before the publishable key is available.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: CC.NAVY,
        padding: "48px 24px",
      }}
    >
      <SignIn />
    </main>
  );
}
