import { createHash } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import palette from "../activity-palette.json" with { type: "json" };
import { bayAreaDate, bayAreaInstant } from "./time.mjs";
import { validateProposal } from "./schema.mjs";

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function atomicJsonWrite(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temp, path);
}

export async function withLock(path, fn) {
  let handle;
  try {
    handle = await open(path, "wx");
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`discovery lock exists: ${path}`);
    throw error;
  }
  try {
    return await fn();
  } finally {
    await handle.close();
    await unlink(path).catch(() => {});
  }
}

function stableSourceId(url) {
  return `discovery-${createHash("sha256").update(url).digest("hex").slice(0, 18)}`;
}

function availability(candidate) {
  if (candidate.date) return "scheduled";
  return "evergreen";
}

function timeSlot(candidate) {
  if (!candidate.startTime) return "Now";
  const hour = Number(candidate.startTime.slice(0, 2));
  return hour < 16 ? "Now" : "Tonight";
}

function formatFor(candidate, existing) {
  if (candidate.status === "refresh") return existing.format;
  const text = `${candidate.title} ${candidate.description} ${candidate.why}`.toLowerCase();
  if (/\b(workshop|class)\b/.test(text)) return "Class";
  if (/\bvolunteering\b/.test(text)) return "Volunteer";
  if (/\bmarket\b/.test(text)) return "Market";
  if (/\b(concert|live performance)\b/.test(text)) return "Live";
  return { Outside: "Adventure", Move: "Adventure", Eat: "Food", Community: "Meetup", Make: "Culture", Listen: "Culture", Learn: "Culture", "After dark": "Culture" }[candidate.category];
}

function recordFromCandidate(candidate, order, existing, runId) {
  const startsAt = candidate.date && candidate.startTime ? bayAreaInstant(candidate.date, candidate.startTime) : null;
  const endsAt = candidate.date && candidate.endTime && (!candidate.startTime || candidate.endTime >= candidate.startTime) ? bayAreaInstant(candidate.date, candidate.endTime) : null;
  const record = {
    ...existing,
    id: candidate.id,
    title: candidate.title,
    kicker: candidate.title,
    category: candidate.category,
    neighborhood: candidate.neighborhood,
    venue: candidate.venue,
    coordinates: candidate.map?.route?.[0] ?? candidate.coordinates,
    accent: existing?.accent ?? palette[candidate.category],
    description: candidate.description,
    why: candidate.why,
    zoneRadiusM: existing?.zoneRadiusM ?? 140,
    time: candidate.date ? `${candidate.date}${candidate.startTime ? ` ${candidate.startTime}` : ""}` : "Check official source",
    timeSlot: timeSlot(candidate),
    duration: candidate.duration,
    price: candidate.price,
    vibe: existing?.vibe ?? [],
    accessibility: existing?.accessibility ?? "Check the official source for current access details",
    distance: existing?.distance ?? "Varies",
    format: formatFor(candidate, existing),
    traits: existing?.traits ?? [],
    ...(candidate.map ? { map: candidate.map } : {}),
    reviewStatus: "approved_for_display",
    catalogOrder: existing?.catalogOrder ?? order,
    sourceStatus: candidate.date ? "verified-live" : "agentic-directory",
    checkedAt: bayAreaDate(new Date(candidate.observedAt)),
    researchRunId: runId,
    evidence: candidate.evidence,
    schedule: {
      kind: availability(candidate),
      ...(candidate.date ? { dates: [candidate.date], expiresAt: candidate.date } : {}),
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
    },
  };
  if (existing?.image) record.image = existing.image;
  return record;
}

function recordContent(record) {
  return JSON.stringify({ ...record, researchRunId: null, evidence: record.evidence?.map(({ url, quote }) => ({ url, quote })) });
}

export function prepareCatalog(catalog, proposal, { now = new Date() } = {}) {
  const issues = validateProposal(proposal, { now });
  if (issues.length) throw new Error(`proposal rejected: ${issues.join("; ")}`);
  const next = structuredClone(catalog);
  const groups = new Map(next.sources.map((group) => [group.source.canonicalUrl, group]));
  let changed = 0;
  const incomingIds = new Set(proposal.candidates.map((candidate) => candidate.id));
  const today = bayAreaDate(now);
  for (const group of next.sources) {
    const before = group.records.length;
    group.records = group.records.filter(record => {
      if (incomingIds.has(record.id) || record.schedule?.kind !== "scheduled") return true;
      const endsAt = record.schedule.endsAt;
      if (typeof endsAt === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(endsAt) && Date.parse(endsAt) < now.getTime()) return false;
      const dates = record.schedule.dates;
      return !Array.isArray(dates) || dates.length === 0 || dates.some(date => date >= today);
    });
    changed += before - group.records.length;
  }
  let order = Math.max(-1, ...next.sources.flatMap((group) => group.records.map((record) => record.catalogOrder ?? -1))) + 1;
  const recordsById = new Map(next.sources.flatMap((group) => group.records.map((record) => [record.id, { group, record }])));
  for (const candidate of proposal.candidates) {
    const existingEntry = recordsById.get(candidate.id);
    if (candidate.status === "retire") {
      if (!existingEntry) continue;
      if (existingEntry.group.source.canonicalUrl !== candidate.canonicalUrl) throw new Error(`Retirement source does not match ${candidate.id}`);
      existingEntry.group.records = existingEntry.group.records.filter((record) => record.id !== candidate.id);
      recordsById.delete(candidate.id);
      changed += 1;
      continue;
    }
    if (existingEntry && existingEntry.group.source.canonicalUrl !== candidate.canonicalUrl) throw new Error(`candidate ${candidate.id} changes canonical source`);
    if (candidate.status === "refresh" && candidate.date && existingEntry?.record.schedule?.kind !== "scheduled") throw new Error("A dated occurrence must not replace an evergreen activity");
    if (candidate.status === "refresh" && !existingEntry) throw new Error(`Cannot refresh unknown activity ${candidate.id}`);
    let group = groups.get(candidate.canonicalUrl);
    if (!group) {
      const sourceId = stableSourceId(candidate.canonicalUrl);
      group = {
        source: {
          id: sourceId,
          key: sourceId,
          name: candidate.venue,
          kind: "organizer-page",
          canonicalUrl: candidate.canonicalUrl,
          attribution: candidate.venue,
          allowsAutomatedFetch: true,
          termsUrl: candidate.access.policyUrl,
          automationBasis: candidate.access,
          allowsImageReuse: false,
          refreshHours: 24,
          enabled: true,
        },
        reviewStatus: "approved_for_display",
        lastCatalogCheckedAt: proposal.run.startedAt.slice(0, 10),
        records: [],
      };
      next.sources.push(group);
      groups.set(candidate.canonicalUrl, group);
    }
    const existing = existingEntry?.record ?? group.records.find((record) => record.id === candidate.id);
    const duplicate = [...recordsById.values()].find(({ record }) => record.id !== candidate.id && record.venue.toLowerCase() === candidate.venue.toLowerCase() && record.title.toLowerCase() === candidate.title.toLowerCase() && (candidate.date === null ? record.schedule?.kind !== "scheduled" : record.schedule?.dates?.includes(candidate.date)));
    if (duplicate) throw new Error(`candidate ${candidate.id} duplicates ${duplicate.record.id} at ${candidate.venue}`);
    const replacement = recordFromCandidate(candidate, order, existing, proposal.run.runId);
    if (existing) {
      if (recordContent(existing) !== recordContent(replacement)) {
        Object.assign(existing, replacement);
        changed += 1;
      }
    } else {
      group.records.push(replacement);
      recordsById.set(candidate.id, { group, record: replacement });
      order += 1;
      changed += 1;
    }
    for (const record of group.records) if (!record.checkedAt) record.checkedAt = group.lastCatalogCheckedAt;
    const previousAccess = JSON.stringify({
      allowsAutomatedFetch: group.source.allowsAutomatedFetch,
      termsUrl: group.source.termsUrl,
      automationBasis: group.source.automationBasis,
    });
    group.source.allowsAutomatedFetch = true;
    group.source.termsUrl = candidate.access.policyUrl;
    group.source.automationBasis = candidate.access;
    if (previousAccess !== JSON.stringify({
      allowsAutomatedFetch: group.source.allowsAutomatedFetch,
      termsUrl: group.source.termsUrl,
      automationBasis: group.source.automationBasis,
    })) changed += 1;
    group.lastCatalogCheckedAt = bayAreaDate(new Date(proposal.run.startedAt));
  }
  for (const [index, record] of next.sources.flatMap(group => group.records).sort((a, b) => a.catalogOrder - b.catalogOrder).entries()) {
    if (record.catalogOrder !== index) changed += 1;
    record.catalogOrder = index;
  }
  for (const group of next.sources) {
    group.reviewStatus = group.records.length ? "approved_for_display" : "needs_source_review";
    group.source.enabled = group.records.length > 0;
  }
  next.sourceCount = next.sources.length;
  next.recordCount = next.sources.reduce((count, group) => count + group.records.length, 0);
  return { catalog: next, changed };
}

export async function applyProposal({ proposalPath, catalogPath, outputPath = catalogPath, lockPath = `${outputPath}.lock`, dryRun = false }) {
  return withLock(lockPath, async () => {
    const proposal = await readJson(resolve(proposalPath));
    const catalogFile = await readFile(resolve(catalogPath));
    const catalog = JSON.parse(catalogFile.toString("utf8"));
    const catalogHash = createHash("sha256").update(JSON.stringify(catalog)).digest("hex");
    if (proposal.run.catalogHash && proposal.run.catalogHash !== catalogHash) throw new Error("proposal catalog hash does not match current catalog");
    const result = prepareCatalog(catalog, proposal);
    if (!dryRun && result.changed > 0) await atomicJsonWrite(resolve(outputPath), result.catalog);
    return { changed: result.changed, outputPath: resolve(outputPath), dryRun: Boolean(dryRun) };
  });
}
