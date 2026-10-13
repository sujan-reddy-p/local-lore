import assert from "node:assert/strict";
import test from "node:test";
import { activityScene, type ActivityOutline } from "@/lib/activity-zones";
import { loreItems } from "@/lib/seed-data";
import type { LoreItem } from "@/lib/types";

const template = loreItems[0];
const item = (id: string, changes: Partial<LoreItem> = {}): LoreItem => ({
  ...template,
  id,
  title: `Activity ${id}`,
  venue: `Venue ${id}`,
  coordinates: [-122.42, 37.78],
  zoneRadiusM: 60,
  map: { kind: "venue" },
  ...changes,
});
const polygon: ActivityOutline = {
  type: "Polygon",
  coordinates: [
    [[-122.43, 37.77], [-122.41, 37.77], [-122.41, 37.79], [-122.43, 37.79], [-122.43, 37.77]],
    [[-122.425, 37.775], [-122.415, 37.775], [-122.415, 37.785], [-122.425, 37.785], [-122.425, 37.775]],
  ],
};

test("source boundary outranks learned context and preserves polygon holes", () => {
  const source = item("source", { coordinates: [-122.428, 37.78], map: { kind: "venue", boundary: polygon, sourceUrl: "https://example.test/map", evidence: "Official map" } });
  const native: ActivityOutline = { type: "Polygon", coordinates: [[[-122.421, 37.779], [-122.419, 37.779], [-122.419, 37.781], [-122.421, 37.781], [-122.421, 37.779]]] };
  const scene = activityScene([source], [source.id], new Map([[source.id, native]]));
  assert.deepEqual(scene.zones.features[0].geometry, polygon);
  assert.equal(scene.zones.features[0].geometry.type, "Polygon");
  if (scene.zones.features[0].geometry.type !== "Polygon") throw new Error("source boundary changed geometry type");
  assert.equal(scene.zones.features[0].geometry.coordinates[1].length, 5);
  assert.equal(scene.zones.features[0].properties?.fallback, false);
});

test("malformed or unsupported boundary evidence falls back to a locator", () => {
  const malformed = item("malformed", {
    map: { kind: "venue", boundary: { type: "Polygon", coordinates: [] } as unknown as ActivityOutline, sourceUrl: "https://example.test/map", evidence: "Invalid shape" },
  });
  const scene = activityScene([malformed], [malformed.id]);
  assert.equal(scene.zones.features[0].properties?.fallback, true);
  assert.equal(scene.zones.features[0].geometry.type, "Polygon");
});

test("every visible mission without accepted context receives a clamped locator circle", () => {
  const small = item("small", { zoneRadiusM: 1 });
  const large = item("large", { coordinates: [-122.40, 37.78], zoneRadiusM: 500 });
  const scene = activityScene([small, large], [small.id, large.id]);
  assert.equal(scene.zones.features.length, 2);
  for (const feature of scene.zones.features) {
    assert.equal(feature.geometry.type, "Polygon");
    assert.equal(feature.properties?.fallback, true);
    assert.equal(feature.properties?.areaM2, 0);
  }
  const radiusMeters = (feature: typeof scene.zones.features[number]) => {
    if (feature.geometry.type !== "Polygon") throw new Error("locator is not polygon geometry");
    const ring = feature.geometry.coordinates[0];
    const [longitude, latitude] = ring[0];
    return Math.hypot((longitude - ring[8][0]) * 111_320 * Math.cos(latitude * Math.PI / 180), (latitude - ring[8][1]) * 111_320) / Math.SQRT2;
  };
  assert.ok(Math.abs(radiusMeters(scene.zones.features[0]) - 25) < 1);
  assert.ok(Math.abs(radiusMeters(scene.zones.features[1]) - 100) < 1);
});

test("routes keep their mission point and use a locator instead of park geometry", () => {
  const route = item("route", {
    coordinates: [-122.42, 37.78],
    map: { kind: "route", boundary: polygon, sourceUrl: "https://example.test/route", evidence: "Source map", route: [[-122.42, 37.78], [-122.41, 37.79]], routeType: "course" },
  });
  const scene = activityScene([route], [route.id]);
  assert.equal(scene.zones.features.length, 1);
  assert.equal(scene.zones.features[0].properties?.fallback, true);
  assert.deepEqual(scene.points.features[0].geometry.coordinates, route.coordinates);
  assert.deepEqual(scene.routes.features[0].geometry.coordinates[0], route.coordinates);
});

test("unclosed and zero-area sourced rings fall back to honest locator geometry", () => {
  const unclosed = structuredClone(polygon);
  unclosed.coordinates[0].pop();
  const degenerate: ActivityOutline = { type: "Polygon", coordinates: [[[-122.42, 37.78], [-122.41, 37.79], [-122.40, 37.80], [-122.42, 37.78]]] };
  for (const boundary of [unclosed, degenerate]) {
    const mission = item("invalid-ring", { map: { kind: "venue", boundary, sourceUrl: "https://example.test/map", evidence: "Source map" } });
    const feature = activityScene([mission], [mission.id]).zones.features[0];
    assert.equal(feature.properties?.fallback, true);
    assert.equal(feature.geometry.type, "Polygon");
  }
});

test("malformed route geometry is omitted while the route retains its point locator", () => {
  const route = item("bad-course", {
    map: { kind: "route", sourceUrl: "https://example.test/course", routeType: "course", route: [[-122.42, 37.78], [Number.NaN, 37.79]] },
  });
  const scene = activityScene([route], [route.id]);
  assert.equal(scene.routes.features.length, 0);
  assert.equal(scene.zones.features[0].properties?.fallback, true);
  assert.deepEqual(scene.points.features[0].geometry.coordinates, route.coordinates);
});

test("connection geometry requires exactly two finite endpoints", () => {
  const connection = item("bad-connection", {
    map: { kind: "route", sourceUrl: "https://example.test/connection", routeType: "connection", route: [[-122.42, 37.78], [-122.41, 37.79], [-122.40, 37.80]] },
  });
  assert.equal(activityScene([connection], [connection.id]).routes.features.length, 0);
});

test("nearby shared venue missions deduplicate to one point anchor", () => {
  const first = item("one", { venue: "Shared venue" });
  const second = item("two", { venue: "Shared venue", coordinates: [-122.4198, 37.78] });
  const scene = activityScene([first, second], [first.id, second.id]);
  assert.equal(scene.points.features.length, 1);
  assert.equal(scene.points.features[0].properties?.count, 2);
  assert.equal(scene.zones.features.length, 2);
});

test("connection route metadata remains typed and directed geometry ordered A to B", () => {
  const connection = item("connection", {
    map: { kind: "route", sourceUrl: "https://example.test/connection", routeType: "connection", route: [[-122.42, 37.78], [-122.41, 37.79]] },
  });
  const scene = activityScene([connection], [connection.id]);
  assert.equal(scene.routes.features[0].properties?.routeType, "connection");
  assert.deepEqual(scene.routes.features[0].geometry.coordinates, connection.map?.route);
});
