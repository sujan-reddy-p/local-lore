export const CANDIDATE_KEYS = ["id", "title", "description", "why", "category", "neighborhood", "venue", "coordinates", "canonicalUrl", "observedAt", "timezone", "date", "startTime", "endTime", "price", "duration", "image", "map", "access", "evidence", "status"];
export const PROPOSAL_KEYS = ["schemaVersion", "run", "observations", "candidates", "omissions"];
import { bayAreaDate } from "./time.mjs";
const CATEGORIES = { Outside: true, Move: true, Make: true, Listen: true, Eat: true, Learn: true, Community: true, "After dark": true };
const STATUSES = { new: true, refresh: true, retire: true };
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function distanceKm([lon, lat], [originLon, originLat]) {
  const r = Math.PI / 180;
  const dLat = (lat - originLat) * r;
  const dLon = (lon - originLon) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * r) * Math.cos(originLat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timestamp(value) {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().replace(".000Z", "Z") === value.replace(".000Z", "Z");
}

function publicHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") && !/^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)|\.(?:local|internal)$|:/i.test(url.hostname);
  } catch { return false; }
}

function withinCoverage(point, origin, radiusKm, bounds) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && point[0] >= bounds[0][0] && point[0] <= bounds[1][0] && point[1] >= bounds[0][1] && point[1] <= bounds[1][1] && distanceKm(point, origin) <= radiusKm;
}

export function validateCandidate(candidate, { origin = [-122.42, 37.78], radiusKm = 75, bounds = [[-123.1, 36.55], [-121.4, 38.5]], now = new Date(), runStartedAt = null, maxDays = 30 } = {}) {
  const issues = [];
  if (!isObject(candidate) || Object.keys(candidate).length !== CANDIDATE_KEYS.length || CANDIDATE_KEYS.some(key => !Object.hasOwn(candidate, key))) return ["candidate keys must exactly match the proposal schema"];
  for (const key of ["id", "title", "description", "why", "neighborhood", "venue"]) if (typeof candidate[key] !== "string" || !candidate[key].trim()) issues.push(`${key} must be non-empty`);
  if (typeof candidate.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,95}$/.test(candidate.id)) issues.push("id must be a stable lowercase slug");
  if (!Object.hasOwn(CATEGORIES, candidate.category)) issues.push("category is not supported");
  if (!Object.hasOwn(STATUSES, candidate.status)) issues.push("status is invalid");
  if (!withinCoverage(candidate.coordinates, origin, radiusKm, bounds)) issues.push("coordinates outside configured coverage or invalid");
  if (!publicHttps(candidate.canonicalUrl)) issues.push("canonicalUrl must be a public HTTPS URL");
  if (candidate.timezone !== "America/Los_Angeles") issues.push("timezone must match Bay Area local time");
  if (!timestamp(candidate.observedAt) || Date.parse(candidate.observedAt) > now.getTime() + 300_000) issues.push("observedAt must be a valid non-future ISO UTC timestamp");
  if (runStartedAt && Date.parse(candidate.observedAt) < Date.parse(runStartedAt)) issues.push("observedAt predates this run");
  if (candidate.date !== null) {
    if (!isIsoDate(candidate.date)) issues.push("date must be a real ISO calendar date or null");
    else if (candidate.status !== "retire") {
      const today = bayAreaDate(now);
      const last = new Date(`${today}T12:00:00Z`);
      last.setUTCDate(last.getUTCDate() + maxDays);
      if (candidate.date < today || candidate.date > last.toISOString().slice(0, 10)) issues.push("date is outside the rolling discovery window");
    }
  }
  for (const key of ["startTime", "endTime"]) if (candidate[key] !== null && (typeof candidate[key] !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(candidate[key]))) issues.push(`${key} must be HH:MM or null`);
  if (candidate.date === null && (candidate.startTime !== null || candidate.endTime !== null)) issues.push("clock times require a sourced occurrence date");
  if (candidate.price !== null && (!Number.isFinite(candidate.price) || candidate.price < 0)) issues.push("price must be non-negative or null");
  if (candidate.duration !== null && (!Number.isFinite(candidate.duration) || candidate.duration <= 0)) issues.push("duration must be positive or null");
  if (candidate.image !== null) issues.push("image must be null unless separately rights-verified");
  if (candidate.map !== null) {
    if (!isObject(candidate.map) || !["area", "venue", "route"].includes(candidate.map.kind) || Object.keys(candidate.map).some(key => !["kind", "route", "sourceUrl"].includes(key))) issues.push("map must have a supported kind and known fields");
    if (candidate.map?.route !== undefined && (candidate.map.kind !== "route" || !Array.isArray(candidate.map.route) || candidate.map.route.length < 2 || candidate.map.route.length > 2000 || candidate.map.route.some(point => !withinCoverage(point, origin, radiusKm, bounds)) || !publicHttps(candidate.map.sourceUrl))) issues.push("route geometry requires 2–2000 in-coverage points and a public source URL");
    if (candidate.map?.sourceUrl !== undefined && !publicHttps(candidate.map.sourceUrl)) issues.push("map sourceUrl must be public HTTPS");
  }
  if (!isObject(candidate.access) || !["public-page", "feed", "open-data"].includes(candidate.access.method) || !publicHttps(candidate.access.policyUrl) || typeof candidate.access.quote !== "string" || candidate.access.quote.trim().length < 8 || candidate.access.quote.length > 600) issues.push("access requires a documented permitted method, public policy URL, and short source-backed basis");
  if (!Array.isArray(candidate.evidence) || !candidate.evidence.length) issues.push("evidence requires source observations");
  else {
    for (const evidence of candidate.evidence) {
      if (!isObject(evidence) || !publicHttps(evidence.url) || typeof evidence.quote !== "string" || evidence.quote.trim().length < 8 || evidence.quote.length > 600 || !timestamp(evidence.observedAt)) { issues.push("evidence requires public HTTPS, a short literal quote, and a valid observation time"); continue; }
      if (runStartedAt && Date.parse(evidence.observedAt) < Date.parse(runStartedAt)) issues.push("evidence predates this run");
      if (Date.parse(evidence.observedAt) > now.getTime() + 300_000) issues.push("evidence timestamp is in the future");
    }
    if (!candidate.evidence.some(evidence => evidence?.url === candidate.canonicalUrl)) issues.push("evidence must include the primary canonical source");
    if (candidate.map?.route && !candidate.evidence.some(evidence => evidence?.url === candidate.map.sourceUrl)) issues.push("route source must be included in evidence");
    if (candidate.access && !candidate.evidence.some(evidence => evidence?.url === candidate.access.policyUrl && typeof evidence.quote === "string" && evidence.quote.includes(candidate.access.quote))) issues.push("access policy basis must be included in read-source evidence");
    if (candidate.status === "retire" && !candidate.evidence.some(evidence => evidence?.url === candidate.canonicalUrl && typeof evidence.quote === "string" && /\bcancel(?:led|ed)\b|permanently closed|closed permanently|closed for good|no longer offered|discontinued/i.test(evidence.quote) && !/\b(?:not|never|isn't|hasn't)\s+(?:been\s+)?cancel(?:led|ed)/i.test(evidence.quote))) issues.push("retire requires explicit cancellation, discontinuation, or permanent closure evidence");
  }
  return issues;
}

export function validateProposal(proposal, options = {}) {
  if (!isObject(proposal) || Object.keys(proposal).length !== PROPOSAL_KEYS.length || PROPOSAL_KEYS.some(key => !Object.hasOwn(proposal, key))) return ["proposal keys must exactly match schema"];
  if (proposal.schemaVersion !== 1 || !isObject(proposal.run) || !Array.isArray(proposal.observations) || !Array.isArray(proposal.candidates) || !Array.isArray(proposal.omissions)) return ["invalid proposal envelope"];
  const issues = [];
  const runStartedAt = proposal.run.startedAt;
  if (!timestamp(runStartedAt)) issues.push("run.startedAt must be valid ISO UTC");
  if (typeof proposal.run.runId !== "string" || !proposal.run.runId || typeof proposal.run.model !== "string" || !proposal.run.model) issues.push("run requires an ID and model");
  if (proposal.candidates.length > 80 || proposal.observations.length > 100) issues.push("proposal exceeds bounded run limits");
  const seen = new Set();
  for (const candidate of proposal.candidates) {
    if (seen.has(candidate?.id)) issues.push(`duplicate candidate id ${candidate?.id}`);
    seen.add(candidate?.id);
    issues.push(...validateCandidate(candidate, { ...options, runStartedAt }));
  }
  for (const observation of proposal.observations) {
    if (!isObject(observation) || !publicHttps(observation.sourceUrl) || !["checked", "failed"].includes(observation.result) || !timestamp(observation.observedAt)) issues.push("observations require a public source URL, checked/failed status, and valid ISO time");
    else if (Date.parse(observation.observedAt) < Date.parse(runStartedAt)) issues.push("observation predates this run");
  }
  if (proposal.omissions.some(value => typeof value !== "string")) issues.push("omissions must be text");
  return issues;
}
