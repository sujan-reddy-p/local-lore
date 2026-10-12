import assert from "node:assert/strict";
import test from "node:test";
import { prepareCatalog } from "../lib/discovery/publisher.mjs";
import { validateProposal } from "../lib/discovery/schema.mjs";
import { bayAreaInstant } from "../lib/discovery/time.mjs";
import { quoteMatches, sourcedRouteMatches } from "../lib/discovery/evidence.mjs";
import { robotsAllows } from "../lib/discovery/robots.mjs";

const NOW = new Date("2026-10-12T18:00:00Z");
const STAMP = "2026-10-12T17:00:00Z";
const ACCESS = { method: "public-page", policyUrl: "https://example.org/policy", quote: "Public information may be accessed" };
const catalog = (sources = []) => ({ schemaVersion: 1, migrationState: "catalog_ready", approvalBasis: "maintainer_assumed_accurate_for_existing_site_content", sourceCount: sources.length, recordCount: sources.reduce((sum, group) => sum + group.records.length, 0), sources });
function candidate(overrides = {}) {
  return { id: "demo-activity", title: "A real activity", description: "Do the activity.", why: "A useful local hour.", category: "Outside", neighborhood: "Downtown", venue: "Demo venue", coordinates: [-122.4, 37.78], canonicalUrl: "https://example.org/calendar", observedAt: STAMP, timezone: "America/Los_Angeles", date: null, startTime: null, endTime: null, price: null, duration: null, image: null, map: null, access: ACCESS, evidence: [{ url: "https://example.org/calendar", quote: "Event details and public access policy", observedAt: STAMP }, { url: "https://example.org/policy", quote: "Public information may be accessed", observedAt: STAMP }], status: "new", ...overrides };
}
function proposal(candidates = [], overrides = {}) {
  return { schemaVersion: 1, run: { runId: "run-one", startedAt: STAMP, configHash: "x", model: "test" }, observations: [{ sourceUrl: "https://example.org/calendar", observedAt: STAMP, result: "checked" }], candidates, omissions: [], ...overrides };
}
function group(url, records, checkedAt = "2026-10-10") {
  const id = `source-${url.slice(-1)}`;
  return { source: { id, key: id, name: "Demo venue", kind: "organizer-page", canonicalUrl: url, attribution: "Demo venue", allowsAutomatedFetch: false, allowsImageReuse: false, refreshHours: 24, enabled: true }, reviewStatus: "approved_for_display", lastCatalogCheckedAt: checkedAt, records };
}
function record(id, order, schedule, overrides = {}) {
  return { id, title: id, venue: "Venue", catalogOrder: order, checkedAt: "2026-10-10", sourceStatus: "agentic-directory", schedule, ...overrides };
}

test("empty successful research retains evergreen and recurring records and global order", () => {
  const first = group("https://example.org/a", [record("evergreen", 2, { kind: "evergreen" }), record("recurring", 0, { kind: "recurring" })]);
  const second = group("https://example.org/b", [record("scheduled", 1, { kind: "scheduled", dates: ["2026-10-12"] })]);
  const result = prepareCatalog(catalog([first, second]), proposal([]), { now: NOW });
  assert.deepEqual(result.catalog.sources.flatMap(item => item.records).sort((a, b) => a.catalogOrder - b.catalogOrder).map(item => [item.id, item.catalogOrder]), [["recurring", 0], ["scheduled", 1], ["evergreen", 2]]);
});

test("scheduled occurrence expires after Pacific midnight, not UTC midnight", () => {
  const scheduled = record("today", 0, { kind: "scheduled", dates: ["2026-10-12"] });
  const beforePacificMidnight = new Date("2026-10-13T06:59:00Z");
  const result = prepareCatalog(catalog([group("https://example.org/a", [scheduled])]), proposal([]), { now: beforePacificMidnight });
  assert.deepEqual(result.catalog.sources[0].records.map(item => item.id), ["today"]);
  const afterPacificMidnight = prepareCatalog(catalog([group("https://example.org/a", [scheduled])]), proposal([]), { now: new Date("2026-10-13T07:01:00Z") });
  assert.equal(afterPacificMidnight.catalog.recordCount, 0);
});

test("known end instant expires during its date while evergreen remains", () => {
  const ended = record("ended", 0, { kind: "scheduled", dates: ["2026-10-12"], endsAt: "2026-10-12T17:00:00Z" });
  const evergreen = record("evergreen", 1, { kind: "evergreen" });
  const result = prepareCatalog(catalog([group("https://example.org/a", [ended, evergreen])]), proposal([]), { now: NOW });
  assert.deepEqual(result.catalog.sources[0].records.map(item => item.id), ["evergreen"]);
});

test("refresh changes only the target record and leaves sibling provenance untouched", () => {
  const target = candidate({ status: "refresh" });
  const sibling = record("sibling", 1, { kind: "evergreen" }, { sourceStatus: "verified-live", checkedAt: "2026-10-09" });
  const targetRecord = { ...record(target.id, 0, { kind: "evergreen" }), title: target.title, venue: target.venue, description: target.description, why: target.why, category: target.category, neighborhood: target.neighborhood, coordinates: target.coordinates, time: "Check official source", timeSlot: "Now", duration: null, price: null, format: "Adventure", evidence: target.evidence };
  const result = prepareCatalog(catalog([group(target.canonicalUrl, [targetRecord, sibling])]), proposal([target]), { now: NOW });
  const updated = result.catalog.sources[0].records.find(item => item.id === "sibling");
  assert.equal(updated.sourceStatus, "verified-live");
  assert.equal(updated.checkedAt, "2026-10-09");
});

test("retirement requires explicit cancellation or permanent closure evidence", () => {
  for (const quote of ["Closed Mondays; open the rest of the week", "The event has not been cancelled"]) {
    const retiring = candidate({ status: "retire", evidence: [{ url: "https://example.org/calendar", quote, observedAt: STAMP }, { url: "https://example.org/policy", quote: "Public information may be accessed", observedAt: STAMP }] });
    assert.throws(() => prepareCatalog(catalog([group(retiring.canonicalUrl, [record(retiring.id, 0, { kind: "evergreen" })])]), proposal([retiring]), { now: NOW }));
  }
  const closure = candidate({ status: "retire", evidence: [{ url: "https://example.org/calendar", quote: "The event is permanently closed", observedAt: STAMP }, { url: "https://example.org/policy", quote: "Public information may be accessed", observedAt: STAMP }] });
  assert.equal(prepareCatalog(catalog([group(closure.canonicalUrl, [record(closure.id, 0, { kind: "evergreen" })])]), proposal([closure]), { now: NOW }).catalog.recordCount, 0);
});

test("duplicate same experience, venue, and date is rejected across source URLs", () => {
  const existing = record("existing", 0, { kind: "scheduled", dates: ["2026-10-20"] }, { title: "A real activity", venue: "Demo venue" });
  const duplicate = candidate({ date: "2026-10-20", canonicalUrl: "https://example.org/other", evidence: [{ url: "https://example.org/other", quote: "Event details and public access policy", observedAt: STAMP }, { url: "https://example.org/policy", quote: "Public information may be accessed", observedAt: STAMP }] });
  assert.throws(() => prepareCatalog(catalog([group("https://example.org/a", [existing])]), proposal([duplicate]), { now: NOW }));
});

test("out-of-radius, impossible-date, and invalid route geometry are rejected; geometry-free route is valid", () => {
  const cases = [candidate({ coordinates: [-121.4, 38.5] }), candidate({ date: "2026-02-30" }), candidate({ map: { kind: "route", route: [[-122.4, 37.78]], sourceUrl: "https://example.org/route" }, evidence: [{ url: "https://example.org/calendar", quote: "Event details and public access policy", observedAt: STAMP }, { url: "https://example.org/policy", quote: "Public information may be accessed", observedAt: STAMP }, { url: "https://example.org/route", quote: "Route information and trail details", observedAt: STAMP }] })];
  for (const value of cases) assert.notEqual(validateProposal(proposal([value]), { now: NOW }).length, 0);
  const startOnly = candidate({ map: { kind: "route" } });
  assert.equal(validateProposal(proposal([startOnly]), { now: NOW }).length, 0);
});

test("Pacific clock conversion rejects ambiguous and nonexistent DST times", () => {
  assert.equal(bayAreaInstant("2026-11-01", "01:30"), null);
  assert.equal(bayAreaInstant("2026-03-08", "02:30"), null);
  assert.equal(bayAreaInstant("2026-10-12", "10:00"), "2026-10-12T17:00:00.000Z");
});

test("identical same-day facts are a no-op across run IDs and observation times", () => {
  const initial = candidate();
  const first = prepareCatalog(catalog(), proposal([initial]), { now: NOW });
  const later = candidate({ observedAt: "2026-10-12T17:30:00Z", evidence: [{ url: "https://example.org/calendar", quote: "Event details and public access policy", observedAt: "2026-10-12T17:30:00Z" }, { url: "https://example.org/policy", quote: "Public information may be accessed", observedAt: "2026-10-12T17:30:00Z" }] });
  const secondProposal = proposal([later], { run: { runId: "run-two", startedAt: "2026-10-12T17:30:00Z", configHash: "y", model: "test" }, observations: [{ sourceUrl: "https://example.org/calendar", observedAt: "2026-10-12T17:30:00Z", result: "checked" }] });
  const second = prepareCatalog(first.catalog, secondProposal, { now: NOW });
  assert.equal(second.changed, 0);
});

test("a dated occurrence cannot overwrite its evergreen parent activity", () => {
  const occurrence = candidate({ status: "refresh", date: "2026-10-20" });
  const current = catalog([group(occurrence.canonicalUrl, [record(occurrence.id, 0, { kind: "evergreen" })])]);
  assert.throws(() => prepareCatalog(current, proposal([occurrence]), { now: NOW }));
  assert.equal(current.sources[0].records[0].schedule.kind, "evergreen");
});

test("evidence preserves contiguous facts across rendered Markdown and JSON formatting", () => {
  assert.equal(quoteMatches("Visit [the garden](https://example.org) &amp; explore.", "the garden & explore."), true);
  assert.equal(quoteMatches('{\n "latitude": 37.3,\n "longitude": -122.4\n}', '"latitude":37.3,"longitude":-122.4'), true);
  assert.equal(quoteMatches("Doors open at noon. Tickets sell on Friday.", "Doors open at noon on Friday."), false);
  assert.equal(quoteMatches('{"latitude":37.3,"longitude":-122.4}', '"latitude":37.4,"longitude":-122.4'), false);
  assert.equal(quoteMatches('{"latitude":37.3}', '"latitude":37.4,"latitude":37.3'), false);
});

test("course evidence must contain the complete ordered route", () => {
  const route = [[-122.4, 37.7], [-122.41, 37.71], [-122.42, 37.72]];
  const source = JSON.stringify({ type: "LineString", coordinates: route });
  assert.equal(sourcedRouteMatches(source, route), true);
  assert.equal(sourcedRouteMatches(source, [...route].reverse()), false);
  assert.equal(sourcedRouteMatches(source, route.slice(0, 2)), false);
});

test("robots uses longest matching rule with Allow winning equal specificity", () => {
  const text = "User-agent: *\nDisallow: /private\nAllow: /private/public$\nDisallow: /same\nAllow: /same\n";
  assert.equal(robotsAllows(text, "https://example.org/private/secret"), false);
  assert.equal(robotsAllows(text, "https://example.org/private/public"), true);
  assert.equal(robotsAllows(text, "https://example.org/private/public?extra=1"), false);
  assert.equal(robotsAllows(text, "https://example.org/same"), true);
  assert.equal(robotsAllows("An unavailable policy", "https://example.org/"), false);
});
