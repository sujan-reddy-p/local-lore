import { LocalLoreApp } from "@/components/local-lore-app";
import { loreItems } from "@/lib/seed-data";

export default function Home() {
  // The product renders the bundled catalog; local research publishes Git snapshots.
  return <LocalLoreApp initialMissions={loreItems} />;
}
