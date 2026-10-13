import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateSourceCatalog } from "../scripts/validate-source-catalog.mjs";

const source = {
  id: "source-1",
  key: "source-1",
  name: "Test source",
  canonicalUrl: "https://example.test/",
  enabled: true,
  refreshHours: 24,
};
const baseRecord = {
  id: "mission-1",
  catalogOrder: 0,
  reviewStatus: "approved_for_display",
  coordinates: [-122.42, 37.78],
  price: null,
  duration: null,
  city: "San Francisco",
  websiteUrl: "https://venue.example.test/visit",
};
function catalog(record = {}) {
  const mission = { ...baseRecord, ...record };
  return {
    schemaVersion: 1,
    migrationState: "catalog_ready",
    approvalBasis: "maintainer_assumed_accurate_for_existing_site_content",
    sourceCount: 1,
    recordCount: 1,
    sources: [{
      source,
      reviewStatus: "approved_for_display",
      lastCatalogCheckedAt: "2026-10-12",
      records: [mission],
    }],
  };
}
function errors(record) {
  return validateSourceCatalog(catalog(record), { projectRoot: process.cwd() });
}

test("requires a visitor website separately from API source evidence", () => {
  assert.ok(errors({ websiteUrl: undefined }).some((issue) => issue.includes("Visitor website")));
  for (const websiteUrl of [
    "https://data.example.test/resource/parks.json?limit=100",
    "https://gis.example.test/FeatureServer/0/query?f=json",
  ]) {
    assert.ok(errors({ websiteUrl }).some((issue) => issue.includes("API evidence endpoint")));
  }
  const candidate = catalog();
  candidate.sources[0].source = {
    ...source,
    canonicalUrl: "https://data.example.test/resource/parks.json",
  };
  assert.deepEqual(validateSourceCatalog(candidate), []);
});
const boundary = {
  type: "Polygon",
  coordinates: [
    [[-122.44, 37.76], [-122.40, 37.76], [-122.40, 37.80], [-122.44, 37.80], [-122.44, 37.76]],
    [[-122.43, 37.77], [-122.41, 37.77], [-122.41, 37.79], [-122.43, 37.79], [-122.43, 37.77]],
  ],
};

test("accepts source-backed polygon holes only when the anchor lies in filled area", () => {
  const map = { kind: "venue", boundary, sourceUrl: "https://example.test/map", evidence: "Official venue map" };
  assert.deepEqual(errors({ coordinates: [-122.435, 37.78], map }), []);
  assert.ok(errors({ map }).some((issue) => issue.includes("boundary geometry or mission anchor containment")));
});

test("rejects unclosed, geographically out-of-scope, and unsupported boundary geometries", () => {
  const map = { kind: "area", sourceUrl: "https://example.test/map", evidence: "Official map", boundary };
  const unclosed = structuredClone(map);
  unclosed.boundary.coordinates[0].pop();
  assert.ok(errors({ map: unclosed }).some((issue) => issue.includes("boundary geometry")));
  const outOfBounds = structuredClone(map);
  outOfBounds.boundary.coordinates[0][0][0] = -130;
  assert.ok(errors({ map: outOfBounds }).some((issue) => issue.includes("boundary geometry")));
});

test("validates route geometry, route types, and two-endpoint connections", () => {
  const route = {
    kind: "route",
    sourceUrl: "https://example.test/route",
    routeType: "course",
    route: [[-122.42, 37.78], [-122.41, 37.79], [-122.40, 37.80]],
  };
  assert.deepEqual(errors({ map: route }), []);
  assert.ok(errors({ map: { ...route, routeType: "unknown" } }).some((issue) => issue.includes("Invalid routeType")));
  assert.ok(errors({ map: { ...route, routeType: "connection" } }).some((issue) => issue.includes("exactly two endpoints")));
  assert.deepEqual(errors({ map: { ...route, routeType: "connection", route: route.route.slice(0, 2) } }), []);
  assert.ok(errors({ map: { ...route, route: [[-122.42, 37.78], [NaN, 37.79]] } }).some((issue) => issue.includes("Invalid route geometry")));
});

test("route records without sourced geometry stay valid start-first", () => {
  assert.deepEqual(errors({ map: { kind: "route" } }), []);
  assert.ok(errors({ map: { kind: "route", route: [[-122.42, 37.78], [-122.41, 37.79]] } }).some((issue) => issue.includes("Route requires an HTTPS sourceUrl")));
});

test("allows unavailable nullable price and duration but rejects invalid numeric facts", () => {
  assert.deepEqual(errors({ price: null, duration: null }), []);
  assert.ok(errors({ price: -1 }).some((issue) => issue.includes("Invalid price")));
  assert.ok(errors({ duration: 0 }).some((issue) => issue.includes("Invalid duration")));
});

test("rejects impossible and inverted scheduled dates without requiring expiry for evergreen schedules", () => {
  assert.deepEqual(errors({ schedule: { kind: "evergreen" } }), []);
  assert.deepEqual(errors({ schedule: { kind: "recurring", daysOfWeek: [0, 6] } }), []);
  assert.ok(errors({ schedule: { kind: "recurring", daysOfWeek: [7] } }).some((issue) => issue.includes("Invalid recurring weekdays")));
  assert.ok(errors({ schedule: { kind: "scheduled", dates: ["2026-02-30"] } }).some((issue) => issue.includes("requires valid dates")));
  assert.ok(errors({ schedule: { kind: "scheduled", startsAt: "2026-11-01", endsAt: "2026-10-31" } }).some((issue) => issue.includes("ends before it starts")));
  assert.ok(errors({ schedule: { kind: "scheduled", dates: ["2026-10-12"], expiresAt: "2026-10-11" } }).some((issue) => issue.includes("falls after expiry")));
});

test("interprets date-only schedule bounds as inclusive Bay Area calendar days", () => {
  assert.deepEqual(errors({ schedule: { kind: "scheduled", startsAt: "2026-11-14T12:00:00-08:00", endsAt: "2026-11-14" } }), []);
  assert.ok(errors({ schedule: { kind: "scheduled", startsAt: "2026-11-14T12:00:00-08:00", endsAt: "2026-11-13" } }).some(issue => issue.includes("ends before it starts")));
  assert.deepEqual(errors({ schedule: { kind: "scheduled", startsAt: "2026-11-14", endsAt: "2026-11-15T07:59:59Z" } }), []);
  assert.ok(errors({ schedule: { kind: "scheduled", startsAt: "2026-11-14", endsAt: "2026-11-14T07:59:59Z" } }).some(issue => issue.includes("ends before it starts")));
});

test("validates complete image metadata, HTTPS remote references, and existing local public files", () => {
  const temp = mkdtempSync(join(tmpdir(), "local-lore-validator-"));
  const publicImages = join(temp, "public", "images", "missions");
  mkdirSync(publicImages, { recursive: true });
  writeFileSync(join(publicImages, "photo.jpg"), "image");
  try {
    const image = { url: "/images/missions/photo.jpg", alt: "A useful description", credit: "Creator permission", sourceUrl: "https://example.test/photo" };
    assert.deepEqual(validateSourceCatalog(catalog({ image }), { projectRoot: temp }), []);
    assert.ok(validateSourceCatalog(catalog({ image: { ...image, url: "/images/missions/missing.jpg" } }), { projectRoot: temp }).some((issue) => issue.includes("Missing or invalid local image")));
    assert.ok(validateSourceCatalog(catalog({ image: { ...image, sourceUrl: "http://example.test/photo" } }), { projectRoot: temp }).some((issue) => issue.includes("Image source URL must use HTTPS")));
    assert.ok(validateSourceCatalog(catalog({ image: { ...image, credit: " " } }), { projectRoot: temp }).some((issue) => issue.includes("Image credit is required")));
    assert.ok(validateSourceCatalog(catalog({ image: { ...image, url: "https://example.test/photo.jpg", kind: "poster" } }), { projectRoot: temp }).some((issue) => issue.includes("Invalid image kind")));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
