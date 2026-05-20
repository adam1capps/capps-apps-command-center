import { runPoll } from "@/lib/poller";

// Manual poll trigger, guarded by the X-Trigger-Token secret. Lets us run a
// poll without waiting for the 6h cron. Never cached.
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.X_TRIGGER_TOKEN;
  const provided = request.headers.get("x-trigger-token");

  if (!expected || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await runPoll();
  return Response.json(result);
}
