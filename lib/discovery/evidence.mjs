const ENTITY_LOOKUP = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
const HTML_ENTITY_PATTERN = /&(#(?:x[\da-f]+|\d+)|amp|apos|gt|lt|nbsp|quot);/gi;
const MARKDOWN_LINK_PATTERN = /!?\[([^\]]*)\]\([^)]*\)/g;
const RAW_COORDINATE_PATTERN = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const HEMISPHERE_PATTERN = /([-+]?(?:\d+\.?\d*|\.\d+))\s*(?:°\s*)?([NSEW])\b/gi;
const DMS_PATTERN = /(\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)\s*['′]\s*(\d+(?:\.\d+)?)\s*["″]?\s*([NSEW])\b/gi;
const JSON_PREFIX_PATTERN = /(?:^|\n)---\s*\n/;

function decodeEntities(text) {
  return text.replace(HTML_ENTITY_PATTERN, (entity, code) => {
    if (code[0] !== "#") return ENTITY_LOOKUP[code.toLowerCase()] ?? entity;
    const numeric = code[1]?.toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 0x10ffff) return entity;
    try { return String.fromCodePoint(numeric); } catch { return entity; }
  });
}

function normalizeText(text, markdown) {
  let normalized = text.normalize("NFKC");
  if (markdown) {
    normalized = normalized.replace(MARKDOWN_LINK_PATTERN, "$1");
    normalized = normalized.replace(/^\s{0,3}#{1,6}\s+/gm, "");
    normalized = normalized.replace(/[*_~`]/g, "");
    normalized = decodeEntities(normalized);
  }
  return normalized.replace(/\s+/gu, " ").trim().toLocaleLowerCase("en-US");
}

export function quoteMatches(sourceText, quote) {
  if (typeof sourceText !== "string" || typeof quote !== "string" || !quote.trim()) return false;
  const raw = normalizeText(sourceText, false);
  const needle = normalizeText(quote, false);
  if (needle && raw.includes(needle)) return true;
  const json = extractJson(sourceText);
  if (json) {
    const fragment = quote.replace(/"(?:\\.|[^"\\])*"|\s+/g, token => token.startsWith('"') ? token : "");
    if (JSON.stringify(json).includes(fragment)) return true;
  }
  return normalizeText(sourceText, true).includes(normalizeText(quote, true));
}

function addCoordinate(output, value, hemisphere = null) {
  if (!Number.isFinite(value)) return;
  let result = value;
  if (hemisphere) {
    const direction = hemisphere.toUpperCase();
    if (direction === "W" || direction === "S") result = -Math.abs(value);
    else result = Math.abs(value);
  }
  output.push(result);
}

export function coordinateValues(sourceText) {
  if (typeof sourceText !== "string") return [];
  const values = [];
  for (const match of sourceText.matchAll(DMS_PATTERN)) {
    const degrees = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    if (minutes >= 60 || seconds >= 60) continue;
    addCoordinate(values, degrees + minutes / 60 + seconds / 3600, match[4]);
  }
  const withoutDms = sourceText.replace(DMS_PATTERN, " ");
  for (const match of withoutDms.matchAll(HEMISPHERE_PATTERN)) addCoordinate(values, Number(match[1]), match[2]);
  for (const match of withoutDms.matchAll(RAW_COORDINATE_PATTERN)) addCoordinate(values, Number(match[0]));
  return values;
}

function extractJson(sourceText) {
  if (typeof sourceText !== "string") return null;
  const separator = sourceText.match(JSON_PREFIX_PATTERN);
  const body = separator ? sourceText.slice(separator.index + separator[0].length) : sourceText;
  const start = body.search(/[\[{]/);
  if (start < 0) return null;
  try { return JSON.parse(body.slice(start)); } catch { return null; }
}

function validPosition(position) {
  return Array.isArray(position) && position.length >= 2 && position.every(Number.isFinite);
}

function collectLineStrings(value, output) {
  if (!value || typeof value !== "object") return false;
  if (value.type === "LineString") {
    if (!Array.isArray(value.coordinates) || value.coordinates.length < 2 || !value.coordinates.every(validPosition)) return false;
    output.push(value.coordinates);
    return true;
  }
  if (value.type === "Feature") return collectLineStrings(value.geometry, output);
  if (value.type === "FeatureCollection") {
    return Array.isArray(value.features) && value.features.length > 0 && value.features.every(feature => collectLineStrings(feature, output));
  }
  return false;
}

function routeSequence(route) {
  if (Array.isArray(route) && route.every(validPosition)) return route;
  if (route && typeof route === "object" && route.type === "LineString" && Array.isArray(route.coordinates) && route.coordinates.every(validPosition)) return route.coordinates;
  if (route && typeof route === "object" && route.coordinates && Array.isArray(route.coordinates)) return route.coordinates;
  return null;
}

function positionsEqual(left, right) {
  return left.length === right.length && left.every((position, index) => position.length === right[index].length && position.every((value, axis) => Math.abs(value - right[index][axis]) <= 0.000001));
}

export function sourcedRouteMatches(sourceText, route) {
  const expected = routeSequence(route);
  if (!expected || expected.length < 2) return false;
  const json = extractJson(sourceText);
  if (!json) return false;
  const lines = [];
  if (!collectLineStrings(json, lines)) return false;
  return lines.some(line => positionsEqual(line, expected));
}
