import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Next 16 renamed middleware to proxy. Clerk's clerkMiddleware is exported as
// the default proxy. It runs on every matched request to attach auth context;
// it only enforces auth on the protected routes below.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/app/(.*)"]);

const ALLOWED_DOMAIN = "@re-dry.com";

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  await auth.protect();

  // Defense in depth on top of the Clerk dashboard sign-up allowlist. Requires
  // a custom session-token claim `email` (Clerk dashboard -> Sessions). When
  // the claim is absent the dashboard restriction is the sole gate, so we do
  // not hard-block signed-in users here.
  const { sessionClaims } = await auth();
  const email = (sessionClaims as { email?: string } | null)?.email;
  if (email && !email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return NextResponse.redirect(new URL("/sign-in?denied=domain", req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
