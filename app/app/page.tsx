import { PublicHeader } from "@/components/showcase/PublicHeader";
import { PublicFooter } from "@/components/showcase/PublicFooter";
import { ShowcaseView } from "@/components/showcase/ShowcaseView";
import { getShowcaseApps } from "@/lib/db-queries";

// Rendered per-request: the showcase reads live data from Neon, and the
// build environment cannot reach the database. The Phase 4 poller keeps the
// underlying snapshots fresh; revisit caching in Phase 14 polish.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const showcase = await getShowcaseApps();

  return (
    <>
      <PublicHeader />
      <ShowcaseView apps={showcase} />
      <PublicFooter />
    </>
  );
}
