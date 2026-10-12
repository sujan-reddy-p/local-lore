import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { activityArtworks } from "../lib/activity-artwork.ts";
import vinyl from "lucide-react/dist/esm/icons/disc-3.mjs";
import concert from "lucide-react/dist/esm/icons/piano.mjs";
import running from "lucide-react/dist/esm/icons/footprints.mjs";
import cycling from "lucide-react/dist/esm/icons/bike.mjs";
import park from "lucide-react/dist/esm/icons/trees.mjs";
import garden from "lucide-react/dist/esm/icons/flower-2.mjs";
import museum from "lucide-react/dist/esm/icons/landmark.mjs";
import library from "lucide-react/dist/esm/icons/book-open.mjs";
import cinema from "lucide-react/dist/esm/icons/clapperboard.mjs";
import theater from "lucide-react/dist/esm/icons/drama.mjs";
import food from "lucide-react/dist/esm/icons/utensils-crossed.mjs";
import coffee from "lucide-react/dist/esm/icons/coffee.mjs";
import market from "lucide-react/dist/esm/icons/store.mjs";
import art from "lucide-react/dist/esm/icons/palette.mjs";
import making from "lucide-react/dist/esm/icons/hammer.mjs";
import drive from "lucide-react/dist/esm/icons/route.mjs";
import water from "lucide-react/dist/esm/icons/waves.mjs";
import overlook from "lucide-react/dist/esm/icons/binoculars.mjs";
import nightlife from "lucide-react/dist/esm/icons/martini.mjs";
import community from "lucide-react/dist/esm/icons/handshake.mjs";

// Run: npx tsx scripts/generate-map-icons.mjs. The app never parses SVG or fonts.
const icons = { vinyl, concert, running, cycling, park, garden, museum, library, cinema, theater, food, coffee, market, art, making, drive, water, overlook, nightlife, community };
const output = new URL("../public/map-icons/", import.meta.url);
await mkdir(output, { recursive: true });
for (const [name, { color }] of Object.entries(activityArtworks)) {
  const paths = renderToStaticMarkup(createElement(icons[name], { color, strokeWidth: 1.7, size: 24 }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><!-- Lucide ISC/MIT; license in LICENSE.txt. Field-guide composition by Local Lore. --><rect x="3" y="4" width="58" height="58" rx="17" fill="#0b1713" fill-opacity=".35"/><rect x="4" y="3" width="56" height="56" rx="15" fill="#172b23" stroke="${color}" stroke-width="1.5"/><path d="M18 7h18" stroke="${color}" stroke-opacity=".22" stroke-linecap="round"/><g transform="translate(13 12) scale(1.58)" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
  await writeFile(new URL(`${name}.svg`, output), svg);
  await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL(`${name}.png`, output)));
}
await copyFile(new URL("../node_modules/lucide-react/LICENSE", import.meta.url), new URL("LICENSE.txt", output));
console.log(`Generated ${Object.keys(activityArtworks).length} licensed activity badges (SVG sources + 2× PNGs).`);
