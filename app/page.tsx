import { LocalLoreApp } from "@/components/local-lore-app";
import { loreItems } from "@/lib/seed-data";

export default function Home() {
  // The deployed product is deliberately a static catalog. A separate local
  // curation agent updates seed-data.ts and GitHub; Vercel only renders it.
  return <LocalLoreApp initialMissions={loreItems} />;
}
