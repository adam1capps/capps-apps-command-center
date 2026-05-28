import { auth } from "@clerk/nextjs/server";
import { asc, gt } from "drizzle-orm";

import { db } from "@/db/client";
import { integrationEvents } from "@/db/schema";

// SSE stream for the dashboard. Polls `integration_events` every 1.5s for rows
// newer than the previously sent one and pushes them to the connected client as
// SSE `integration-event` messages. Heartbeats every 30s as `: ping` comments
// keep the connection alive through proxies that close idle sockets.
//
// Why polling and not an in-process broadcaster: serverless functions are
// isolated per-invocation, so a memory broadcaster only sees events from the
// same instance that handled the POST. Polling the DB works across instances
// for free at the cost of one Neon round-trip per tick. At human-scale
// dashboard usage that is cheap.
//
// Browsers' EventSource auto-reconnects when the connection closes, so a short
// platform-imposed maxDuration is fine: each new connection picks up from the
// most recent event timestamp and continues uninterrupted.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 30_000;
const BATCH_LIMIT = 50;

const encoder = new TextEncoder();

export async function GET(request: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return new Response("unauthorized", { status: 401 });

  let lastSeen = new Date();
  let polling = false;
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let poller: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (poller) clearInterval(poller);
        try {
          controller.close();
        } catch {
          // Already closed; ignore.
        }
      };

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      // Ack the connection so the client knows the stream is open.
      send(`event: ready\ndata: {"ok":true}\n\n`);

      heartbeat = setInterval(() => {
        send(`: ping\n\n`);
      }, HEARTBEAT_INTERVAL_MS);

      const tick = async () => {
        if (closed || polling) return;
        polling = true;
        try {
          const rows = await db
            .select()
            .from(integrationEvents)
            .where(gt(integrationEvents.createdAt, lastSeen))
            .orderBy(asc(integrationEvents.createdAt))
            .limit(BATCH_LIMIT);
          for (const row of rows) {
            send(`event: integration-event\ndata: ${JSON.stringify(row)}\n\n`);
            lastSeen = row.createdAt;
          }
        } catch {
          // Swallow transient query errors so the stream keeps running; the
          // next tick will retry. A persistent error will manifest as zero
          // events, and the client can reconnect.
        } finally {
          polling = false;
        }
      };

      poller = setInterval(() => {
        void tick();
      }, POLL_INTERVAL_MS);

      request.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export function POST(): Response {
  return new Response("method not allowed", { status: 405 });
}
