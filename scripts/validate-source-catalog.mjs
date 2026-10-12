import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogPath = process.argv.find((arg) => arg.startsWith("--catalog="))?.slice("--catalog=".length) ?? resolve(root, "data/source-catalog.json");
const catalog = JSON.parse(readFileSync(resolve(catalogPath), "utf8"));
const issues = [];
const sourceIds = new Set();
const sourceKeys = new Set();
const missionIds = new Set();
const orders = new Set();
let missionCount = 0;

if (catalog.schemaVersion !== 1) issues.push("Unsupported catalog schemaVersion");
if (catalog.migrationState !== "catalog_ready") issues.push("Catalog migrationState must be catalog_ready");
if (catalog.approvalBasis !== "maintainer_assumed_accurate_for_existing_site_content") issues.push("Catalog approval basis is missing");
if (!Array.isArray(catalog.sources)) issues.push("sources must be an array");
for (const group of catalog.sources ?? []) {
  const source = group.source;
  if (!source?.id || !source?.key || !source?.name || !source?.canonicalUrl) {
    issues.push(`Incomplete source identity: ${source?.id ?? "<missing id>"}`);
    continue;
  }
  if (sourceIds.has(source.id)) issues.push(`Duplicate source id: ${source.id}`);
  if (sourceKeys.has(source.key)) issues.push(`Duplicate source key: ${source.key}`);
  sourceIds.add(source.id);
  sourceKeys.add(source.key);
  try {
    if (new URL(source.canonicalUrl).protocol !== "https:") issues.push(`Source URL must use HTTPS: ${source.id}`);
  } catch {
    issues.push(`Invalid source URL: ${source.id}`);
  }
  if (source.allowsAutomatedFetch && !source.termsUrl) issues.push(`Automated source requires a terms URL: ${source.id}`);
  if (!Number.isFinite(source.refreshHours) || source.refreshHours <= 0) issues.push(`Invalid refreshHours: ${source.id}`);
  if (!Array.isArray(group.records)) issues.push(`records must be an array: ${source.id}`);
  if (!["approved_for_display", "needs_source_review"].includes(group.reviewStatus)) issues.push(`Invalid source review state: ${source.id}`);
  if (group.reviewStatus === "needs_source_review" && source.enabled) {
    issues.push(`Unreviewed source must remain disabled: ${source.id}`);
  }
  if (Array.isArray(group.records)) {
    const hasRecords = group.records.length > 0;
    if ((group.reviewStatus === "approved_for_display") !== hasRecords) {
      issues.push(`Source review state does not match its record group: ${source.id}`);
    }
    if (hasRecords && !/^\d{4}-\d{2}-\d{2}$/.test(group.lastCatalogCheckedAt ?? "")) {
      issues.push(`Legacy catalog date is missing or malformed: ${source.id}`);
    }
  }

  for (const record of Array.isArray(group.records) ? group.records : []) {
    missionCount += 1;
    if (!record.id || missionIds.has(record.id)) issues.push(`Missing or duplicate mission id: ${record.id ?? "<missing>"}`);
    else missionIds.add(record.id);
    if (record.reviewStatus !== "approved_for_display") issues.push(`Record is not approved for display: ${record.id}`);
    if (!Number.isInteger(record.catalogOrder) || orders.has(record.catalogOrder)) issues.push(`Missing or duplicate catalog order: ${record.id}`);
    else orders.add(record.catalogOrder);
    if (record.source) issues.push(`Duplicate source metadata belongs on the source group, not ${record.id}`);
    const [longitude, latitude] = record.coordinates ?? [];
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
      issues.push(`Invalid longitude/latitude: ${record.id}`);
    }
    if (record.image?.url?.startsWith("/images/")) {
      if (!existsSync(resolve(root, "public", record.image.url.slice(1)))) issues.push(`Missing local image: ${record.id} (${record.image.url})`);
    }
  }
}

if (catalog.sourceCount !== sourceIds.size) issues.push(`sourceCount metadata mismatch: expected ${sourceIds.size}, found ${catalog.sourceCount}`);
if (catalog.recordCount !== missionCount) issues.push(`recordCount metadata mismatch: expected ${missionCount}, found ${catalog.recordCount}`);
if (orders.size !== missionCount || [...orders].some((order) => order < 0 || order >= missionCount)) issues.push("catalogOrder must cover each record exactly once from 0 to recordCount - 1");

if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${sourceIds.size} source groups and ${missionCount} display-eligible catalog records; source access and image rights are separate requirements.`);
}
