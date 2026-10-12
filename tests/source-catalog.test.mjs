import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../data/source-catalog.json", import.meta.url), "utf8"));
const records = catalog.sources.flatMap((group) => group.records.map((record) => ({ group, record })));

test("source groups preserve the complete catalog under the maintainer accuracy assumption", () => {
  assert.equal(catalog.migrationState, "catalog_ready");
  assert.equal(catalog.approvalBasis, "maintainer_assumed_accurate_for_existing_site_content");
  assert.equal(catalog.sourceCount, catalog.sources.length);
  assert.equal(catalog.recordCount, records.length);
  assert.equal(new Set(catalog.sources.map(({ source }) => source.key)).size, catalog.sources.length);
  assert.equal(new Set(records.map(({ record }) => record.id)).size, records.length);
  assert.ok(records.every(({ record }) => record.reviewStatus === "approved_for_display"));
  assert.ok(catalog.sources.every(({ reviewStatus }) => ["approved_for_display", "needs_source_review"].includes(reviewStatus)));
});

test("every migrated mission has valid source, coordinate, ordering, and image references", async () => {
  const orders = new Set();
  for (const { group, record } of records) {
    assert.equal(record.source, undefined, `${record.id} repeats source metadata instead of inheriting its source group`);
    assert.ok(record.title && record.venue && record.neighborhood, `${record.id} lacks display essentials`);
    assert.equal(Number.isInteger(record.catalogOrder), true, `${record.id} lacks its original display order`);
    assert.equal(orders.has(record.catalogOrder), false, `${record.id} duplicates a display order`);
    orders.add(record.catalogOrder);
    const [longitude, latitude] = record.coordinates;
    assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180, `${record.id} has invalid longitude`);
    assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90, `${record.id} has invalid latitude`);
    assert.equal(new URL(group.source.canonicalUrl).protocol, "https:");
    if (group.source.allowsAutomatedFetch) assert.ok(group.source.termsUrl, `${group.source.id} has no source-policy URL`);
    if (record.image?.url.startsWith("/images/")) await access(new URL(`../public${record.image.url}`, import.meta.url));
  }
  assert.equal(orders.size, records.length);
});
