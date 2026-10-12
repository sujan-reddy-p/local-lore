import type { Category, LoreItem } from "./types";
import palette from "./activity-palette.json";

export type ArtworkKind = "vinyl" | "concert" | "running" | "cycling" | "park" | "garden" | "museum" | "library" | "cinema" | "theater" | "food" | "coffee" | "market" | "art" | "making" | "drive" | "water" | "overlook" | "nightlife" | "community";

// Lucide ISC/MIT paths, composed into a consistent field-guide badge offline.
export const activityArtworks: Record<ArtworkKind, { icon: string; color: string }> = {
  vinyl: { icon: "disc-3", color: palette.Listen }, concert: { icon: "piano", color: palette.Listen },
  running: { icon: "footprints", color: palette.Move }, cycling: { icon: "bike", color: palette.Move },
  park: { icon: "trees", color: palette.Outside }, garden: { icon: "flower-2", color: palette.Outside },
  museum: { icon: "landmark", color: palette.Learn }, library: { icon: "book-open", color: palette.Learn },
  cinema: { icon: "clapperboard", color: palette["After dark"] }, theater: { icon: "drama", color: palette["After dark"] },
  food: { icon: "utensils-crossed", color: palette.Eat }, coffee: { icon: "coffee", color: palette.Eat },
  market: { icon: "store", color: palette.Eat }, art: { icon: "palette", color: palette.Make },
  making: { icon: "hammer", color: palette.Make }, drive: { icon: "route", color: palette.Move },
  water: { icon: "waves", color: palette.Move }, overlook: { icon: "binoculars", color: palette.Outside },
  nightlife: { icon: "martini", color: palette["After dark"] }, community: { icon: "handshake", color: palette.Community },
};
const categoryArtwork: Record<Category, ArtworkKind> = {
  Outside: "park", Move: "running", Make: "making", Listen: "concert", Eat: "food", Learn: "museum", Community: "community", "After dark": "nightlife",
};

/** Choose the subject, not a generic category emoji. Does not infer availability. */
export function activityArtwork(item: LoreItem): ArtworkKind {
  const subject = `${item.venue} ${item.title}`;
  const movement = item.category === "Move" || item.category === "Outside" || item.category === "Community";
  if (/\b(amoeba|vinyl|record shop|record store|music store)\b/i.test(subject)) return "vinyl";
  if (/\b(cinema|film|feature|movie|screening|4 star|roxie|balboa theater)\b/i.test(subject)) return "cinema";
  if (/\b(play|theatre|theater|improv|comedy)\b/i.test(subject)) return "theater";
  if (/\b(bike|bicycle|cycling|pedal)\b/i.test(subject)) return "cycling";
  if (movement && /\b(run|running|jog|track)\b/i.test(subject)) return "running";
  if (/\b(library|book|books|bookstore|reading)\b/i.test(subject)) return "library";
  if (/\b(garden|gardens|botanical|flower|flowers|farm)\b/i.test(subject)) return "garden";
  if (/\b(coffee|cafe|café|espresso|tea)\b/i.test(subject)) return "coffee";
  if (/\b(market|pantry|grocer|groceries)\b/i.test(subject)) return "market";
  if (/\b(museum|academy|history|historic)\b/i.test(subject)) return "museum";
  if (/\b(gallery|galleries|art|paint|painting|ceramic|ceramics)\b/i.test(subject)) return "art";
  if (/\b(drive|driving|car|road trip)\b/i.test(subject)) return "drive";
  if (/\b(overlook|overlooks|view|views|sunset|skyline|panorama|terraces)\b/i.test(subject)) return "overlook";
  if (/\b(beach|bay|ocean|water|pier|paddl|swim)\b/i.test(subject)) return "water";
  if (movement && /\b(walk|hike|stair|stairs|steps)\b/i.test(subject)) return "running";
  return categoryArtwork[item.category];
}
