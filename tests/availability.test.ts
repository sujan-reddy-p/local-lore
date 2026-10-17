import assert from "node:assert/strict";
import test from "node:test";
import type { LoreItem } from "@/lib/types";
import { isAvailableOn, isExpired } from "@/lib/availability";

function mission(schedule: NonNullable<LoreItem["schedule"]>): LoreItem {
  return {
    id: "availability-test",
    title: "Test mission",
    kicker: "Test",
    description: "A test activity.",
    why: "Regression coverage.",
    category: "Outside",
    neighborhood: "San Francisco",
    venue: "Test venue",
    coordinates: [-122.4, 37.8],
    zoneRadiusM: 100,
    time: "Daytime",
    timeSlot: "Now",
    duration: 60,
    price: 0,
    vibe: ["outdoors"],
    accessibility: "Unknown",
    source: { name: "Test source", url: "https://example.test", status: "curated-seed", checkedAt: "2026-01-01" },
    accent: "#8edcc4",
    distance: "Nearby",
    schedule,
  };
}

test("scheduled date and YYYY-MM-DD expiration retain their final Bay Area day", () => {
  const event = mission({ kind: "scheduled", dates: ["2026-10-12"], expiresAt: "2026-10-12" });
  assert.equal(isExpired(event, new Date("2026-10-13T06:59:59Z")), false);
  assert.equal(isExpired(event, new Date("2026-10-13T07:00:00Z")), true);
});

test("ISO expiration timestamp expires at the instant, not the next calendar day", () => {
  const event = mission({ kind: "scheduled", expiresAt: "2026-10-12T19:00:00-07:00" });
  assert.equal(isExpired(event, new Date("2026-10-13T01:59:59Z")), false);
  assert.equal(isExpired(event, new Date("2026-10-13T02:00:00Z")), true);
});

test("finite event end timestamps expire immediately after the end", () => {
  const event = mission({ kind: "scheduled", endsAt: "2026-10-12T19:00:00-07:00" });
  assert.equal(isExpired(event, new Date("2026-10-13T01:59:59Z")), false);
  assert.equal(isExpired(event, new Date("2026-10-13T02:00:00Z")), true);
});

test("recurring weekday schedules match only their configured Bay Area weekdays and do not age out", () => {
  const recurring = mission({ kind: "recurring", daysOfWeek: [1, 3] });
  assert.equal(isAvailableOn(recurring, new Date("2026-10-12T19:00:00Z")), true); // Monday in the Bay Area.
  assert.equal(isAvailableOn(recurring, new Date("2026-10-13T19:00:00Z")), false);
  assert.equal(isExpired(recurring, new Date("2036-10-12T19:00:00Z")), false);
});

test("monthly weekdays match their numbered Bay Area occurrences across DST and month boundaries", () => {
  const museum = mission({ kind: "recurring", monthly: [{ dayOfWeek: 0, weeks: [1, 3] }] });
  assert.equal(isAvailableOn(museum, new Date("2026-10-11T19:00:00Z")), false);
  assert.equal(isAvailableOn(museum, new Date("2026-11-01T19:00:00Z")), true);
  assert.equal(isAvailableOn(museum, new Date("2026-11-02T07:30:00Z")), true);
  assert.equal(isAvailableOn(museum, new Date("2026-11-02T08:00:00Z")), false);
  assert.equal(isAvailableOn(museum, new Date("2026-11-08T19:00:00Z")), false);
  assert.equal(isAvailableOn(museum, new Date("2026-11-15T19:00:00Z")), true);
  assert.equal(isAvailableOn(museum, new Date("2026-11-29T19:00:00Z")), false);
  assert.equal(isAvailableOn(museum, new Date("2026-12-06T19:00:00Z")), true);
  assert.equal(isAvailableOn(museum, new Date("2027-01-03T19:00:00Z")), true);
  assert.equal(isExpired(museum, new Date("2036-11-08T19:00:00Z")), false);
  const fifthSunday = mission({ kind: "recurring", monthly: [{ dayOfWeek: 0, weeks: [5] }] });
  assert.equal(isAvailableOn(fifthSunday, new Date("2026-05-31T19:00:00Z")), true);
  assert.equal(isAvailableOn(fifthSunday, new Date("2026-06-28T19:00:00Z")), false);
});

test("weekly and monthly weekdays combine without turning monthly sessions into weekly availability", () => {
  const farm = mission({ kind: "recurring", daysOfWeek: [1, 4], monthly: [{ dayOfWeek: 0, weeks: [2] }] });
  assert.equal(isAvailableOn(farm, new Date("2026-10-12T19:00:00Z")), true);
  assert.equal(isAvailableOn(farm, new Date("2026-10-15T19:00:00Z")), true);
  assert.equal(isAvailableOn(farm, new Date("2026-10-04T19:00:00Z")), false);
  assert.equal(isAvailableOn(farm, new Date("2026-10-11T19:00:00Z")), true);
  assert.equal(isAvailableOn(farm, new Date("2026-10-18T19:00:00Z")), false);
});

test("evergreen activities have no implicit TTL", () => {
  assert.equal(isExpired(mission({ kind: "evergreen" }), new Date("2099-01-01T12:00:00Z")), false);
});

test("finite scheduled occurrences are excluded after their last day, including Any day filtering", () => {
  const event = mission({ kind: "scheduled", dates: ["2026-10-10", "2026-10-11"] });
  assert.equal(isExpired(event, new Date("2026-10-12T12:00:00Z")), true);
  assert.equal(isAvailableOn(event, new Date("2026-10-12T19:00:00Z")), false);
});

test("a calendar-day end remains available for date filtering through that Bay Area day", () => {
  const event = mission({ kind: "scheduled", dates: ["2026-10-12"], endsAt: "2026-10-12" });
  assert.equal(isAvailableOn(event, new Date("2026-10-13T06:59:59Z")), true);
  assert.equal(isAvailableOn(event, new Date("2026-10-13T07:00:00Z")), false);
});

test("scheduled ranges include their Bay Area days and respect explicit dates and weekdays", () => {
  const exhibition = mission({ kind: "scheduled", startsAt: "2026-09-19", endsAt: "2026-12-13" });
  assert.equal(isAvailableOn(exhibition, new Date("2026-09-18T19:00:00Z")), false);
  assert.equal(isAvailableOn(exhibition, new Date("2026-09-19T19:00:00Z")), true);
  assert.equal(isAvailableOn(exhibition, new Date("2026-10-13T19:00:00Z")), true);
  assert.equal(isAvailableOn(exhibition, new Date("2026-12-14T07:59:59Z")), true);
  assert.equal(isAvailableOn(exhibition, new Date("2026-12-14T08:00:00Z")), false);
  const weekendRun = mission({ kind: "scheduled", startsAt: "2026-10-01", endsAt: "2026-10-31", daysOfWeek: [0, 6] });
  assert.equal(isAvailableOn(weekendRun, new Date("2026-10-10T19:00:00Z")), true);
  assert.equal(isAvailableOn(weekendRun, new Date("2026-10-12T19:00:00Z")), false);
  const listedDates = mission({ kind: "scheduled", startsAt: "2026-10-01", endsAt: "2026-10-31", dates: ["2026-10-10"] });
  assert.equal(isAvailableOn(listedDates, new Date("2026-10-11T19:00:00Z")), false);
  assert.equal(isAvailableOn(mission({ kind: "scheduled", endsAt: "2026-10-31" }), new Date("2026-10-13T19:00:00Z")), false);
});

test("malformed schedule dates do not cause recurring or evergreen records to expire", () => {
  const recurring = mission({ kind: "recurring", daysOfWeek: [1], expiresAt: "not-a-date" });
  const evergreen = mission({ kind: "evergreen", endsAt: "2026-02-30" });
  const now = new Date("2036-10-12T19:00:00Z");
  assert.equal(isExpired(recurring, now), false);
  assert.equal(isExpired(evergreen, now), false);
});
