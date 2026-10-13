import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const discoveryConfig = JSON.parse(readFileSync(resolve(root, "data/discovery-config.json"), "utf8"));
const [minLongitude, minLatitude] = discoveryConfig.bounds[0];
const [maxLongitude, maxLatitude] = discoveryConfig.bounds[1];
const [originLongitude, originLatitude] = discoveryConfig.origin;
const EARTH_RADIUS_KM = 6371.0088;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const bayCalendar = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });

function calendarDay(value) {
  if (DATE_PATTERN.test(value)) return value;
  const parts = bayCalendar.formatToParts(new Date(value));
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type).value).join("-");
}

function validUrl(value, protocol = "https:") {
  try {
    return typeof value === "string" && new URL(value).protocol === protocol;
  } catch {
    return false;
  }
}

function parseFiniteDate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  if (DATE_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date.getTime();
  }
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function insideRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
    if (Math.abs(cross) < 1e-12 && x >= Math.min(xi, xj) && x <= Math.max(xi, xj) && y >= Math.min(yi, yj) && y <= Math.max(yi, yj)) return true;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, rings) {
  return insideRing(point, rings[0]) && !rings.slice(1).some((hole) => insideRing(point, hole));
}

function validCoordinate(coordinate) {
  return Array.isArray(coordinate) && coordinate.length === 2
    && Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])
    && coordinate[0] >= -180 && coordinate[0] <= 180 && coordinate[1] >= -90 && coordinate[1] <= 90
    && coordinate[0] >= minLongitude && coordinate[0] <= maxLongitude
    && coordinate[1] >= minLatitude && coordinate[1] <= maxLatitude;
}

function validRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4 || !ring.every(validCoordinate)
    || ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) return false;
  let area = 0;
  for (let index = 0; index < ring.length - 1; index++) {
    area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return Math.abs(area) > 0;
}


function validPolygonCoordinates(coordinates, anchor) {
  if (!Array.isArray(coordinates) || coordinates.length === 0 || !coordinates.every(validRing)) return false;
  return pointInPolygon(anchor, coordinates);
}

function geometryContainsAnchor(geometry, anchor) {
  if (!validCoordinate(anchor) || !geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return false;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return Array.isArray(polygons) && polygons.length > 0 && polygons.every((polygon) =>
    Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing)
  ) && polygons.some((polygon) => validPolygonCoordinates(polygon, anchor));
}

function distanceKm([longitude, latitude]) {
  const radians = Math.PI / 180;
  const lat1 = originLatitude * radians;
  const lat2 = latitude * radians;
  const deltaLat = (latitude - originLatitude) * radians;
  const deltaLongitude = (longitude - originLongitude) * radians;
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function validateSchedule(record, issues) {
  const schedule = record.schedule;
  if (!schedule) return;
  const label = record.id;
  if (!["evergreen", "recurring", "scheduled", "seasonal", "conditions"].includes(schedule.kind)) {
    issues.push(`Invalid schedule kind: ${label}`);
    return;
  }
  for (const field of ["startsAt", "endsAt", "expiresAt"]) {
    if (schedule[field] !== undefined && parseFiniteDate(schedule[field]) === null) issues.push(`Invalid schedule ${field}: ${label}`);
  }
  if (schedule.startsAt && schedule.endsAt) {
    const start = parseFiniteDate(schedule.startsAt);
    const end = parseFiniteDate(schedule.endsAt);
    if (start !== null && end !== null) {
      const inverted = DATE_PATTERN.test(schedule.startsAt) || DATE_PATTERN.test(schedule.endsAt)
        ? calendarDay(schedule.endsAt) < calendarDay(schedule.startsAt)
        : end < start;
      if (inverted) issues.push(`Schedule ends before it starts: ${label}`);
    }
  }
  if (schedule.kind === "recurring" && schedule.daysOfWeek !== undefined
    && (!Array.isArray(schedule.daysOfWeek) || !schedule.daysOfWeek.every((day) => Number.isInteger(day) && day >= 0 && day <= 6))) {
    issues.push(`Invalid recurring weekdays: ${label}`);
  }
  if (schedule.kind === "scheduled") {
    const datesValid = schedule.dates !== undefined && Array.isArray(schedule.dates)
      && schedule.dates.length > 0 && schedule.dates.every((date) => DATE_PATTERN.test(date) && parseFiniteDate(date) !== null);
    const hasFiniteBound = [schedule.endsAt, schedule.expiresAt].some((date) => date !== undefined && parseFiniteDate(date) !== null);
    if (!datesValid && !hasFiniteBound) issues.push(`Scheduled record requires valid dates or a finite end/expiry: ${label}`);
    if (datesValid && schedule.expiresAt && parseFiniteDate(schedule.expiresAt) !== null) {
      const expiry = parseFiniteDate(schedule.expiresAt);
      if (schedule.dates.some((date) => parseFiniteDate(date) > expiry)) issues.push(`Schedule date falls after expiry: ${label}`);
    }
  }
}

function validateImage(record, publicRoot, issues) {
  const image = record.image;
  if (image === undefined || image === null) return;
  const label = record.id;
  for (const field of ["url", "alt", "credit", "sourceUrl"]) {
    if (typeof image[field] !== "string" || !image[field].trim()) issues.push(`Image ${field} is required: ${label}`);
  }
  if (typeof image.url === "string" && image.url.startsWith("/images/")) {
    const localPath = resolve(publicRoot, `.${image.url}`);
    const rel = relative(publicRoot, localPath);
    if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
      || !existsSync(localPath)) issues.push(`Missing or invalid local image: ${label} (${image.url})`);
  } else if (typeof image.url === "string" && !validUrl(image.url)) {
    issues.push(`Image URL must use HTTPS or a valid local public image path: ${label}`);
  }
  if (typeof image.sourceUrl === "string" && !validUrl(image.sourceUrl)) issues.push(`Image source URL must use HTTPS: ${label}`);
  if (image.kind !== undefined && !["event", "venue", "logo"].includes(image.kind)) issues.push(`Invalid image kind: ${label}`);
  if (image.licenseUrl !== undefined && !validUrl(image.licenseUrl)) issues.push(`Image licenseUrl must use HTTPS: ${label}`);
}

export function validateSourceCatalog(catalog, { projectRoot = root } = {}) {
  const issues = [];
  const sourceIds = new Set();
  const sourceKeys = new Set();
  const missionIds = new Set();
  const orders = new Set();
  let missionCount = 0;
  const publicRoot = resolve(projectRoot, "public");

  if (catalog?.schemaVersion !== 1) issues.push("Unsupported catalog schemaVersion");
  if (catalog?.migrationState !== "catalog_ready") issues.push("Catalog migrationState must be catalog_ready");
  if (catalog?.approvalBasis !== "maintainer_assumed_accurate_for_existing_site_content") issues.push("Catalog approval basis is missing");
  if (!Array.isArray(catalog?.sources)) issues.push("sources must be an array");
  for (const group of catalog?.sources ?? []) {
    const source = group?.source;
    if (!source?.id || !source?.key || !source?.name || !source?.canonicalUrl) {
      issues.push(`Incomplete source identity: ${source?.id ?? "<missing id>"}`);
      continue;
    }
    if (sourceIds.has(source.id)) issues.push(`Duplicate source id: ${source.id}`);
    if (sourceKeys.has(source.key)) issues.push(`Duplicate source key: ${source.key}`);
    sourceIds.add(source.id);
    sourceKeys.add(source.key);
    if (!validUrl(source.canonicalUrl)) issues.push(`Source URL must use HTTPS: ${source.id}`);
    if (source.allowsAutomatedFetch && !source.termsUrl) issues.push(`Automated source requires a terms URL: ${source.id}`);
    if (!Number.isFinite(source.refreshHours) || source.refreshHours <= 0) issues.push(`Invalid refreshHours: ${source.id}`);
    if (!Array.isArray(group.records)) issues.push(`records must be an array: ${source.id}`);
    if (!["approved_for_display", "needs_source_review"].includes(group.reviewStatus)) issues.push(`Invalid source review state: ${source.id}`);
    if (group.reviewStatus === "needs_source_review" && source.enabled) issues.push(`Unreviewed source must remain disabled: ${source.id}`);
    if (Array.isArray(group.records)) {
      const hasRecords = group.records.length > 0;
      if ((group.reviewStatus === "approved_for_display") !== hasRecords) issues.push(`Source review state does not match its record group: ${source.id}`);
      if (hasRecords && !/^\d{4}-\d{2}-\d{2}$/.test(group.lastCatalogCheckedAt ?? "")) issues.push(`Legacy catalog date is missing or malformed: ${source.id}`);
    }

    for (const record of Array.isArray(group.records) ? group.records : []) {
      missionCount += 1;
      if (!record?.id || missionIds.has(record.id)) issues.push(`Missing or duplicate mission id: ${record?.id ?? "<missing>"}`);
      else missionIds.add(record.id);
      if (record.reviewStatus !== "approved_for_display") issues.push(`Record is not approved for display: ${record.id}`);
      if (!Number.isInteger(record.catalogOrder) || orders.has(record.catalogOrder)) issues.push(`Missing or duplicate catalog order: ${record.id}`);
      else orders.add(record.catalogOrder);
      if (record.source) issues.push(`Duplicate source metadata belongs on the source group, not ${record.id}`);
      if (typeof record.city === "string" && !record.city.trim()) issues.push(`City must not be empty: ${record.id}`);
      if (!Array.isArray(record.coordinates) || record.coordinates.length !== 2
        || !Number.isFinite(record.coordinates[0]) || !Number.isFinite(record.coordinates[1])
        || record.coordinates[0] < -180 || record.coordinates[0] > 180 || record.coordinates[1] < -90 || record.coordinates[1] > 90) {
        issues.push(`Invalid longitude/latitude: ${record.id}`);
      } else {
        if (record.coordinates[0] < minLongitude || record.coordinates[0] > maxLongitude
          || record.coordinates[1] < minLatitude || record.coordinates[1] > maxLatitude) issues.push(`Coordinates outside Bay Area bounds: ${record.id}`);
        if (distanceKm(record.coordinates) > discoveryConfig.radiusKm) issues.push(`Coordinates outside ${discoveryConfig.radiusKm} km San Francisco radius: ${record.id}`);
      }
      if (!validUrl(record.websiteUrl)) {
        issues.push(`Visitor website must use HTTPS: ${record.id}`);
      } else if (/\/resource\/[^/?]+\.json|\/(?:FeatureServer|MapServer)(?:\/|$)|\/api(?:_v2)?\/|\.json$/i.test(new URL(record.websiteUrl).pathname)) {
        issues.push(`Visitor website must not be an API evidence endpoint: ${record.id}`);
      }
      if (record.price !== null && (!Number.isFinite(record.price) || record.price < 0)) issues.push(`Invalid price: ${record.id}`);
      if (record.duration !== null && (!Number.isFinite(record.duration) || record.duration <= 0)) issues.push(`Invalid duration: ${record.id}`);
      const map = record.map;
      if (map !== undefined && !["area", "venue", "route"].includes(map?.kind)) issues.push(`Invalid map kind: ${record.id}`);
      if (map?.kind === "route") {
        if (map.boundary !== undefined) issues.push(`Route records cannot define area boundaries: ${record.id}`);
        if (map.route !== undefined) {
          if (!Array.isArray(map.route) || map.route.length < 2 || !map.route.every((point) => validCoordinate(point) && distanceKm(point) <= discoveryConfig.radiusKm)) issues.push(`Invalid route geometry: ${record.id}`);
          if (!validUrl(map.sourceUrl)) issues.push(`Route requires an HTTPS sourceUrl: ${record.id}`);
          if (map.routeType !== undefined && !["course", "connection"].includes(map.routeType)) issues.push(`Invalid routeType: ${record.id}`);
          if (map.routeType === "connection" && Array.isArray(map.route) && map.route.length !== 2) issues.push(`Connection route must have exactly two endpoints: ${record.id}`);
        }
      } else if (map?.boundary !== undefined) {
        if (!["area", "venue"].includes(map.kind)) issues.push(`Boundaries require area or venue map kind: ${record.id}`);
        if (!validUrl(map.sourceUrl) || typeof map.evidence !== "string" || !map.evidence.trim()) issues.push(`Boundary requires sourceUrl and evidence: ${record.id}`);
        if (!geometryContainsAnchor(map.boundary, record.coordinates)) issues.push(`Invalid boundary geometry or mission anchor containment: ${record.id}`);
      }
      validateSchedule(record, issues);
      validateImage(record, publicRoot, issues);
    }
  }

  if (catalog?.sourceCount !== sourceIds.size) issues.push(`sourceCount metadata mismatch: expected ${sourceIds.size}, found ${catalog?.sourceCount}`);
  if (catalog?.recordCount !== missionCount) issues.push(`recordCount metadata mismatch: expected ${missionCount}, found ${catalog?.recordCount}`);
  if (orders.size !== missionCount || [...orders].some((order) => order < 0 || order >= missionCount)) issues.push("catalogOrder must cover each record exactly once from 0 to recordCount - 1");
  return issues;
}

const catalogPath = process.argv.find((arg) => arg.startsWith("--catalog="))?.slice("--catalog=".length) ?? resolve(root, "data/source-catalog.json");
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(readFileSync(resolve(catalogPath), "utf8"));
  const issues = validateSourceCatalog(catalog);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else {
    const sourceCount = catalog.sources.length;
    console.log(`Validated ${sourceCount} source groups and ${catalog.recordCount} display-eligible catalog records; source access and image rights are separate requirements.`);
  }
}
