import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Local Lore map shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Local Lore — Find your San Francisco today<\/title>/i);
  assert.doesNotMatch(html, /handpicked ways into the city/i);
  assert.match(html, /Explore all missions/i);
  assert.match(html, /class="all-time"/i);
  assert.match(html, />All<\/span><b>time<\/b>/i);
  assert.match(html, /aria-label="Interactive mission map of San Francisco and the Bay"/i);
  assert.doesNotMatch(html, /Every icon is locked to its activity zone/i);
  assert.doesNotMatch(html, /starter|taking shape|Building your site/i);
});

test("keeps map interaction and source attribution in the product code", async () => {
  const [app, seed, zones, style, css, imageManifest] = await Promise.all([
    readFile(new URL("../components/local-lore-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/seed-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/activity-zones.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/map-style.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/mission-images.ts", import.meta.url), "utf8"),
  ]);

  assert.match(app, /dragPan:\s*true/);
  assert.match(app, /dragRotate:\s*true/);
  assert.match(app, /touchZoomRotate:\s*true/);
  assert.match(app, /touchPitch:\s*true/);
  assert.doesNotMatch(app, /NavigationControl/);
  assert.match(app, /Show the whole San Francisco map/);
  assert.match(app, /Food ritual/);
  assert.match(app, /icon:Utensils/);
  assert.match(app, /source checked/);
  assert.equal((seed.match(/\{ id:/g) ?? []).length + (seed.match(/\bmission\("/g) ?? []).length, 212);
  assert.match(seed, /status:\s*"curated-seed"/);
  assert.match(seed, /https:\/\//);
  assert.match(zones, /zoneRadiusM/);
  assert.match(zones, /item\.coordinates/);
  assert.match(app, /missionPointCollection/);
  assert.match(app, /visibleMissionCount/);
  assert.match(app, /zones\.setData\(activityZoneCollection\(visibleIds\)\)/);
  assert.match(app, /points\.setData\(missionPointCollection\(visibleIds\)\)/);
  assert.doesNotMatch(app, /mapLoaded/);
  assert.match(style, /mission-clusters/);
  assert.match(style, /glyphs:/);
  assert.match(app, /dateChoices/);
  assert.match(app, /What sounds good\?/);
  assert.match(app, /mission-tile/);
  assert.match(app, /mobile-discovery/);
  assert.doesNotMatch(app, /ideas on the map/);
  assert.match(seed, /dog-friendly/);
  assert.match(seed, /Scenic route/);
  assert.match(seed, /Wikimedia Commons/);
  assert.match(seed, /attachMissionImages/);
  assert.doesNotMatch(seed, /mission\("dogpatch-boulders",/);
  assert.doesNotMatch(seed, /mission\("exploratorium",/);
  const manifestSection = imageManifest.match(/localMissionImageIds = \[([\s\S]*?)\] as const/);
  assert.ok(manifestSection);
  const localImageIds = [...manifestSection[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(localImageIds.length >= 100);
  await Promise.all(localImageIds.map((id) => access(new URL(`../public/images/missions/${id}.jpg`, import.meta.url))));
  assert.match(css, /\.mission-browser/);
  assert.match(css, /\.mission-results[^}]*grid-template-columns/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
