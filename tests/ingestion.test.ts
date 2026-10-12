import assert from "node:assert/strict";
import test from "node:test";
import { extractIcalEvents } from "@/lib/ingestion/ical-events";
import { extractJsonLdEvents } from "@/lib/ingestion/json-ld-events";
import { normalizeStructuredEvent } from "@/lib/ingestion/normalize-event";
import { checkPublicPage } from "@/lib/ingestion/page-check";

const source = {
  id: "source-test",
  key: "test-calendar",
  name: "Test Calendar",
  canonicalUrl: "https://events.example/calendar.ics",
  timezone: "America/Los_Angeles",
};

test("iCalendar preserves TZID-local times, UID, URL, and unescaped text", () => {
  const events = extractIcalEvents([
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:summer-1",
    "URL:https://events.example/summer-1",
    "SUMMARY:Outdoor\, music",
    "DTSTART;TZID=America/Los_Angeles:20260708T193000",
    "DTEND;TZID=America/Los_Angeles:20260708T210000",
    "LOCATION:Golden Gate Park",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n"));
  assert.equal(events.length, 1);
  assert.equal(events[0].title, "Outdoor, music");
  assert.equal(events[0].startsAt, "2026-07-08T19:30:00");
  assert.equal(events[0].timezone, "America/Los_Angeles");
  assert.equal(events[0].externalId, "summer-1");
  assert.equal(events[0].venue, "Golden Gate Park");
});

test("JSON-LD extracts event identity, venue coordinates, and offer price", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@graph": [{
      "@type": "https://schema.org/Event",
      "@id": "https://events.example/e/42",
      name: "Public astronomy night",
      startDate: "2026-07-08T19:00:00-07:00",
      location: {
        "@type": "Place",
        name: "Observatory",
        address: { streetAddress: "1 Observatory Way" },
        geo: { longitude: "-122.45", latitude: 37.76 },
      },
      offers: { price: "12.50", priceCurrency: "USD" },
    }],
  })}</script>`;
  const [event] = extractJsonLdEvents(html);
  assert.equal(event.title, "Public astronomy night");
  assert.equal(event.externalId, "https://events.example/e/42");
  assert.equal(event.address, "1 Observatory Way");
  assert.equal(event.longitude, -122.45);
  assert.equal(event.latitude, 37.76);
  assert.equal(event.price, 12.5);
  assert.equal(event.currency, "USD");
});

test("normalization converts local event time using the source timezone and is stable", () => {
  const event = {
    externalId: "summer-1",
    externalUrl: "https://events.example/summer-1",
    title: "Outdoor music",
    startsAt: "2026-07-08T19:30:00",
    timezone: "America/Los_Angeles",
  };
  const first = normalizeStructuredEvent(event, source, "2026-06-01T12:00:00Z", "hash-a");
  const second = normalizeStructuredEvent(event, source, "2026-06-02T12:00:00Z", "hash-b");
  assert.ok("occurrence" in first && "occurrence" in second);
  if (!("occurrence" in first) || !("occurrence" in second)) return;
  assert.equal(first.occurrence.startsAt, "2026-07-09T02:30:00.000Z");
  assert.equal(first.occurrence.id, second.occurrence.id);
  assert.notEqual(first.occurrence.sourceSnapshotHash, second.occurrence.sourceSnapshotHash);
});

test("normalization rejects nonexistent and ambiguous daylight-saving local times", () => {
  for (const startsAt of ["2026-03-08T02:30:00", "2026-11-01T01:30:00"]) {
    assert.deepEqual(
      normalizeStructuredEvent({ title: "DST boundary", startsAt }, source, "2026-01-01T00:00:00Z"),
      { reason: "missing-or-ambiguous-start-time" },
    );
  }
});

test("normalization rejects insecure event links and missing start times", () => {
  assert.deepEqual(
    normalizeStructuredEvent({ title: "Bad link", startsAt: "2026-07-08T19:00:00-07:00", externalUrl: "http://events.example" }, source, "2026-01-01T00:00:00Z"),
    { reason: "non-https-event-url" },
  );
  assert.deepEqual(
    normalizeStructuredEvent({ title: "No date" }, source, "2026-01-01T00:00:00Z"),
    { reason: "missing-or-ambiguous-start-time" },
  );
});

test("normalization rejects invalid timezone names and out-of-range coordinates", () => {
  assert.deepEqual(
    normalizeStructuredEvent({ title: "Bad timezone", startsAt: "2026-07-08T19:00:00Z", timezone: "Mars/Olympus" }, source, "2026-01-01T00:00:00Z"),
    { reason: "invalid-timezone" },
  );
  assert.deepEqual(
    normalizeStructuredEvent({ title: "Bad coordinates", startsAt: "2026-07-08T19:00:00Z", longitude: -181, latitude: 38 }, source, "2026-01-01T00:00:00Z"),
    { reason: "invalid-coordinates" },
  );
});

test("HTTP 304 keeps the prior snapshot hash and conditional request validators", async () => {
  const originalFetch = globalThis.fetch;
  const response = new Response(null, { status: 304, headers: { etag: '"v2"' } });
  Object.defineProperty(response, "url", { value: "https://events.example/calendar.ics" });
  let requestHeaders: Headers | undefined;
  globalThis.fetch = async (_input, init) => {
    requestHeaders = new Headers(init?.headers);
    return response;
  };
  try {
    const result = await checkPublicPage({
      url: source.canonicalUrl,
      etag: '"v1"',
      lastModified: "Wed, 01 Jul 2026 00:00:00 GMT",
      contentHash: "previous-hash",
    });
    assert.equal(result.statusCode, 304);
    assert.equal(result.changed, false);
    assert.equal(result.contentHash, "previous-hash");
    assert.equal(result.etag, '"v2"');
    assert.equal(requestHeaders?.get("if-none-match"), '"v1"');
    assert.equal(requestHeaders?.get("if-modified-since"), "Wed, 01 Jul 2026 00:00:00 GMT");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
