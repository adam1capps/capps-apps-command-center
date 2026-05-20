// Netlify Scheduled Function. Cron is declared in the root netlify.toml
// ([functions."poll-status"] schedule = "0 */6 * * *"). Runs every 6 hours,
// writing one fresh status_snapshots row per app.

import { runPoll } from "../../lib/poller";

export default async function handler(): Promise<Response> {
  const result = await runPoll();
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
