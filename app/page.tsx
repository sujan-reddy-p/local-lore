import { LocalLoreApp } from "@/components/local-lore-app";
import { bootstrapSeedCatalog, listPublishedMissions } from "@/db/repository";
import { loreItems } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  let missions = loreItems;
  try {
    const published = await listPublishedMissions();
    if (published.length) missions = published;
    else await bootstrapSeedCatalog();
  } catch {
    // The static catalog is intentionally the safe fallback for first run and database outages.
  }
  return <LocalLoreApp initialMissions={missions} />;
}
