import { createHash } from "node:crypto";
import { StringDecoder } from "node:string_decoder";
import { appendFile, mkdir, open, readFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CATALOG_PATH = resolve(ROOT, "data/source-catalog.json");
const LEDGER_PATH = resolve(ROOT, "data/source-audit-reports.jsonl");
const LOCK_PATH = resolve(ROOT, ".source-audit.lock");
const AGENT_PATH = resolve(ROOT, ".omp/agents/source-auditor.md");
const AUTHORIZATION = "one_time_read_only_source_audit_2026-10-11";
const REPORT_KEYS = [
  "sourceId", "sourceName", "canonicalUrl", "finalUrl", "sourceStatus", "identityAssessment",
  "scopeAssessment", "contentType", "recommendation", "fetchPermission", "confidence", "evidence",
  "cadenceAssessment", "recordAssessments", "limitations", "humanFollowUp",
];
const CADENCE_KEYS = [
  "sourceDeclaredUpdateFrequency", "latestVisibleUpdate", "observedChangeIntervalHours",
  "recommendedCheckIntervalHours", "recommendationBasis", "confidence", "rationale",
];
const RECORD_KEYS = ["recordId", "supportStatus", "contentType", "verifiedFacts", "unsupportedFields", "reason"];
const MODEL_RE = /^model:\s*(\S+)\s*$/m;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_EVENT_CHARS = 256 * 1024;
const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: REPORT_KEYS,
  properties: {
    sourceId: { type: "string" },
    sourceName: { type: "string" },
    canonicalUrl: { type: "string" },
    finalUrl: { type: ["string", "null"] },
    sourceStatus: { enum: ["reachable", "redirected", "not_found", "blocked", "unknown"] },
    identityAssessment: { enum: ["matches", "mismatch", "unclear"] },
    scopeAssessment: { enum: ["in_scope", "out_of_scope", "unclear"] },
    contentType: { enum: ["official_calendar", "official_page", "directory", "public_feed", "unknown"] },
    recommendation: { enum: ["keep_for_human_review", "recheck_or_replace_url", "candidate_for_removal", "out_of_scope_candidate", "insufficient_evidence"] },
    fetchPermission: { const: "not_granted" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "observation", "evidenceType"],
        properties: {
          claim: { type: "string" },
          observation: { type: "string" },
          evidenceType: { enum: ["direct", "inference"] },
        },
      },
    },
    cadenceAssessment: {
      type: "object",
      additionalProperties: false,
      required: CADENCE_KEYS,
      properties: {
        sourceDeclaredUpdateFrequency: { type: ["string", "null"] },
        latestVisibleUpdate: { type: ["string", "null"] },
        observedChangeIntervalHours: { type: ["number", "null"], exclusiveMinimum: 0 },
        recommendedCheckIntervalHours: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
        recommendationBasis: { enum: ["documented_source_terms", "explicit_source_guidance", "repeated_observations", "conservative_source_type_estimate", "unknown"] },
        confidence: { enum: ["low", "medium", "high"] },
        rationale: { type: "string" },
      },
    },
    recordAssessments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: RECORD_KEYS,
        properties: {
          recordId: { type: "string" },
          supportStatus: { enum: ["supported", "contradicted", "not_seen_on_checked_page", "inconclusive"] },
          contentType: { enum: ["evergreen", "recurring", "dated_event", "seasonal", "unknown"] },
          verifiedFacts: { type: "array", items: { type: "string" } },
          unsupportedFields: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
      },
    },
    limitations: { type: "array", items: { type: "string" } },
    humanFollowUp: { type: "array", items: { type: "string" } },
  },
};

 

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isRecord(value) && keys.length === Object.keys(value).length && keys.every((key) => Object.hasOwn(value, key));
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableString(value) {
  return value === null || typeof value === "string";
}

function isNullablePositiveNumber(value) {
  return value === null || (Number.isFinite(value) && value > 0);
}

export function sourceSnapshotHash(group) {
  return createHash("sha256").update(JSON.stringify(group)).digest("hex");
}

export function validateReport(report, group) {
  const issues = [];
  const source = group?.source;
  const expectedRecordIds = (group?.records ?? []).map((record) => record.id).sort();
  if (!hasExactKeys(report, REPORT_KEYS)) {
    const actualKeys = isRecord(report) ? Object.keys(report) : [];
    const missing = REPORT_KEYS.filter((key) => !actualKeys.includes(key));
    const extra = actualKeys.filter((key) => !REPORT_KEYS.includes(key));
    return [`Report fields do not match the strict source-audit schema; missing=${JSON.stringify(missing)}, extra=${JSON.stringify(extra)}.`];
  }
  if (report.sourceId !== source?.id) issues.push("sourceId does not match the assigned source group.");
  if (report.sourceName !== source?.name) issues.push("sourceName does not match the assigned source group.");
  if (report.canonicalUrl !== source?.canonicalUrl) issues.push("canonicalUrl does not match the assigned source group.");
  if (!isNullableString(report.finalUrl)) issues.push("finalUrl must be a string or null.");
  if (!["reachable", "redirected", "not_found", "blocked", "unknown"].includes(report.sourceStatus)) issues.push("Invalid sourceStatus.");
  if (!["matches", "mismatch", "unclear"].includes(report.identityAssessment)) issues.push("Invalid identityAssessment.");
  if (!["in_scope", "out_of_scope", "unclear"].includes(report.scopeAssessment)) issues.push("Invalid scopeAssessment.");
  if (!["official_calendar", "official_page", "directory", "public_feed", "unknown"].includes(report.contentType)) issues.push("Invalid contentType.");
  if (!["keep_for_human_review", "recheck_or_replace_url", "candidate_for_removal", "out_of_scope_candidate", "insufficient_evidence"].includes(report.recommendation)) issues.push("Invalid recommendation.");
  if (report.fetchPermission !== "not_granted") issues.push("Automated fetch permission must remain not_granted.");
  if (!Number.isFinite(report.confidence) || report.confidence < 0 || report.confidence > 1) issues.push("confidence must be a number from 0 to 1.");
  if (!Array.isArray(report.evidence) || !report.evidence.every((item) => hasExactKeys(item, ["claim", "observation", "evidenceType"]) && typeof item.claim === "string" && typeof item.observation === "string" && ["direct", "inference"].includes(item.evidenceType))) issues.push("evidence must contain claim, observation, and direct/inference type.");

  const cadence = report.cadenceAssessment;
  if (!hasExactKeys(cadence, CADENCE_KEYS)) {
    issues.push("cadenceAssessment does not match the strict cadence schema.");
  } else {
    if (!isNullableString(cadence.sourceDeclaredUpdateFrequency)) issues.push("sourceDeclaredUpdateFrequency must be a string or null.");
    if (!isNullableString(cadence.latestVisibleUpdate)) issues.push("latestVisibleUpdate must be a string or null.");
    if (!isNullablePositiveNumber(cadence.observedChangeIntervalHours)) issues.push("observedChangeIntervalHours must be a positive number or null.");
    if (cadence.recommendedCheckIntervalHours !== null && (!Number.isInteger(cadence.recommendedCheckIntervalHours) || cadence.recommendedCheckIntervalHours <= 0)) issues.push("recommendedCheckIntervalHours must be a positive integer or null.");
    if (!["documented_source_terms", "explicit_source_guidance", "repeated_observations", "conservative_source_type_estimate", "unknown"].includes(cadence.recommendationBasis)) issues.push("Invalid cadence recommendationBasis.");
    if (!["low", "medium", "high"].includes(cadence.confidence)) issues.push("Invalid cadence confidence.");
    if (typeof cadence.rationale !== "string") issues.push("cadence rationale must be a string.");
    if (cadence.recommendationBasis === "unknown" && cadence.recommendedCheckIntervalHours !== null) issues.push("Unknown cadence basis must not invent a recommended interval.");
    if (cadence.observedChangeIntervalHours !== null && cadence.recommendationBasis !== "repeated_observations") issues.push("An observed change interval requires repeated-observation evidence.");
  }

  if (!Array.isArray(report.recordAssessments)) {
    issues.push("recordAssessments must be an array.");
  } else {
    const actualRecordIds = report.recordAssessments.map((item) => item?.recordId).sort();
    if (JSON.stringify(actualRecordIds) !== JSON.stringify(expectedRecordIds)) issues.push("recordAssessments must include each assigned record exactly once.");
    for (const item of report.recordAssessments) {
      if (!hasExactKeys(item, RECORD_KEYS)) {
        issues.push(`Record assessment ${item?.recordId ?? "<unknown>"} does not match its strict schema.`);
        continue;
      }
      if (!["supported", "contradicted", "not_seen_on_checked_page", "inconclusive"].includes(item.supportStatus)) issues.push(`Invalid supportStatus for ${item.recordId}.`);
      if (!["evergreen", "recurring", "dated_event", "seasonal", "unknown"].includes(item.contentType)) issues.push(`Invalid record contentType for ${item.recordId}.`);
      if (!isStringArray(item.verifiedFacts) || !isStringArray(item.unsupportedFields) || typeof item.reason !== "string") issues.push(`Invalid evidence fields for ${item.recordId}.`);
    }
  }
  if (!isStringArray(report.limitations) || !isStringArray(report.humanFollowUp)) issues.push("limitations and humanFollowUp must be arrays of strings.");
  return issues;
}

function collectAssistantTexts(value, output) {
  if (Array.isArray(value)) {
    for (const item of value) collectAssistantTexts(item, output);
    return;
  }
  if (!isRecord(value)) return;
  if (value.role === "assistant" && Array.isArray(value.content)) {
    const text = value.content.filter((part) => isRecord(part) && part.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n");
    if (text.trim()) output.push(text);
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== "content" && key !== "text") collectAssistantTexts(child, output);
  }
}

export function assistantMessageLines(line) {
  if (line.length > MAX_EVENT_CHARS) return [];
  let value;
  try { value = JSON.parse(line); } catch { return []; }
  const texts = [];
  collectAssistantTexts(value, texts);
  return texts.map((text) => JSON.stringify({ role: "assistant", content: [{ type: "text", text }] }));
}

function parseJsonCandidates(text) {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return [JSON.parse(cleaned)];
  } catch {
    const candidates = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < cleaned.length; index += 1) {
      const char = cleaned[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === "{") {
        if (depth === 0) start = index;
        depth += 1;
      } else if (char === "}" && depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          try { candidates.push(JSON.parse(cleaned.slice(start, index + 1))); } catch { /* keep searching for a complete object */ }
          start = -1;
        }
      }
    }
    return candidates;
  }
}

export function extractReport(output, group) {
  const texts = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { collectAssistantTexts(JSON.parse(line), texts); } catch { /* OMP diagnostics may share stdout. */ }
  }
  const sourceId = group.source.id;
  for (const text of texts.reverse()) {
    for (const candidate of parseJsonCandidates(text).reverse()) {
      if (candidate?.sourceId === sourceId) {
        const issues = validateReport(candidate, group);
        if (issues.length === 0) return candidate;
        throw new Error(`Subagent report failed validation: ${issues.join(" ")}`);
      }
    }
  }
  throw new Error(`OMP output did not contain a valid source-audit report for ${sourceId}.`);
}

function reportHistory(rows, sourceId) {
  return rows.filter((row) => row.kind === "source-audit" && row.status === "completed" && row.sourceId === sourceId)
    .slice(-3)
    .map((row) => ({
      completedAt: row.completedAt,
      sourceStatus: row.report.sourceStatus,
      latestVisibleUpdate: row.report.cadenceAssessment.latestVisibleUpdate,
      evidence: row.report.evidence,
      cadenceAssessment: row.report.cadenceAssessment,
      recordAssessments: row.report.recordAssessments,
    }));
}

export function selectPendingGroups(catalog, rows, { sourceId, limit } = {}) {
  let groups = catalog.sources;
  if (sourceId) {
    groups = groups.filter((group) => group.source.id === sourceId);
    if (groups.length === 0) throw new Error(`Source group not found: ${sourceId}`);
  }
  const completed = new Set(rows.filter((row) => row.kind === "source-audit" && row.status === "completed").map((row) => `${row.sourceId}:${row.sourceSnapshotHash}`));
  const pending = groups.filter((group) => !completed.has(`${group.source.id}:${sourceSnapshotHash(group)}`));
  return Number.isInteger(limit) ? pending.slice(0, limit) : pending;
}

function parseArgs(args) {
  const options = { dryRun: false, sourceId: undefined, limit: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--source-id") options.sourceId = args[++index];
    else if (arg === "--limit") {
      const value = Number(args[++index]);
      if (!Number.isInteger(value) || value <= 0) throw new Error("--limit must be a positive integer.");
      options.limit = value;
    } else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (options.sourceId && !/^[A-Za-z0-9_-]+$/.test(options.sourceId)) throw new Error("--source-id must be a catalog source ID.");
  return options;
}

function usage() {
  return [
    "Usage: npm run sources:audit -- [--dry-run] [--limit N] [--source-id ID]",
    "",
    "Audits one pending source group at a time through the configured source-auditor subagent.",
    "Reports are appended to data/source-audit-reports.jsonl; rerunning resumes completed work.",
    "A completed report is reused only while its source-group snapshot is unchanged.",
  ].join("\n");
}

function auditInput(group, history) {
  const { source, reviewStatus, lastCatalogCheckedAt, records } = group;
  return {
    authorization: AUTHORIZATION,
    sourceGroup: {
      source,
      reviewStatus,
      lastCatalogCheckedAt,
      records: records.map((record) => {
        const auditRecord = { ...record };
        delete auditRecord.image;
        return auditRecord;
      }),
    },
    previousAudits: history,
  };
}

function parentPrompt(input, agentInstructions) {
  const workerTask = [
    "Review exactly this one source group under the supplied one-time human authorization.",
    "Use the source-auditor instructions below, read the source policy first, then read the canonical URL exactly once. No other URL or interaction.",
    agentInstructions,
    "Return strict JSON matching the task's outputSchema. Use null or unknown where evidence is insufficient.",
    "INPUT_JSON:",
    JSON.stringify(input),
  ].join("\n\n");
  return [
    "Call the task tool exactly once with one item. Set agent to `source-auditor`, name to `SourceAudit`, task to the complete WORKER_TASK below, and solutionSpace to `single source evidence review; facts and cadence remain uncertain where the one-page evidence is insufficient`.",
    "Set the task item's outputSchema to OUTPUT_SCHEMA below and schemaMode to `strict`.",
    "Wait for this one subagent to finish; do not launch another task or read any source yourself.",
    "Return only the subagent's JSON report unchanged as the final response.",
    `WORKER_TASK:\n${workerTask}`,
    `OUTPUT_SCHEMA:\n${JSON.stringify(REPORT_SCHEMA)}`,
  ].join("\n\n");
}
function runOmp(prompt, model) {
  return new Promise((resolveRun, rejectRun) => {
    const args = [
      `--model=${model}`,
      "--max-time=900",
      "--mode=json",
      "--tools=task",
      "--auto-approve",
      `--cwd=${ROOT}`,
      "-p",
      prompt,
    ];
    const child = spawn("omp", args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    const decoder = new StringDecoder("utf8");
    const assistantLines = [];
    let assistantBytes = 0;
    let stderr = "";
    let pendingLine = "";
    let discardLine = false;
    let outputError;
    const consumeLine = (line) => {
      if (outputError) return;
      for (const assistantLine of assistantMessageLines(line)) {
        const lineBytes = Buffer.byteLength(assistantLine) + 1;
        if (assistantBytes + lineBytes > MAX_OUTPUT_BYTES) {
          outputError = new Error("OMP assistant output exceeded the 5 MiB safety limit.");
          child.kill("SIGTERM");
          return;
        }
        assistantBytes += lineBytes;
        assistantLines.push(assistantLine);
      }
    };
    const consumeText = (text) => {
      if (outputError) return;
      while (text.length > 0) {
        const newline = text.indexOf("\n");
        const fragment = newline < 0 ? text : text.slice(0, newline);
        if (!discardLine) {
          if (pendingLine.length + fragment.length > MAX_EVENT_CHARS) {
            pendingLine = "";
            if (newline < 0) discardLine = true;
          } else {
            pendingLine += fragment;
          }
        }
        if (newline < 0) break;
        if (!discardLine) consumeLine(pendingLine);
        pendingLine = "";
        discardLine = false;
        text = text.slice(newline + 1);
      }
    };
    child.stdout.on("data", (chunk) => consumeText(decoder.write(chunk)));
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString("utf8")).slice(-8_000); });
    child.on("error", rejectRun);
    child.on("close", (code, signal) => {
      consumeText(decoder.end());
      if (!discardLine && pendingLine.length > 0) consumeLine(pendingLine);
      if (outputError) rejectRun(outputError);
      else resolveRun({ code, signal, stdout: assistantLines.join("\n"), stderr });
    });
  });
}

async function readJsonLines(path) {
  let text;
  try { text = await readFile(path, "utf8"); } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { throw new Error(`Invalid JSONL at ${path}:${index + 1}`); }
  }
  return rows;
}

async function appendRow(row) {
  await mkdir(dirname(LEDGER_PATH), { recursive: true });
  await appendFile(LEDGER_PATH, `${JSON.stringify(row)}\n`, "utf8");
}

async function acquireLock() {
  let handle;
  try { handle = await open(LOCK_PATH, "wx"); } catch (error) {
    if (error.code === "EEXIST") throw new Error(`A source audit lock already exists at ${LOCK_PATH}; verify no audit is running before removing a stale lock.`);
    throw error;
  }
  await handle.writeFile(`${process.pid}\n`);
  return async () => {
    await handle.close();
    await unlink(LOCK_PATH).catch((error) => { if (error.code !== "ENOENT") throw error; });
  };
}

function failureRow(group, sourceHash, startedAt, error) {
  return {
    schemaVersion: 1,
    kind: "source-audit",
    status: "failed",
    sourceId: group.source.id,
    sourceName: group.source.name,
    canonicalUrl: group.source.canonicalUrl,
    sourceSnapshotHash: sourceHash,
    authorization: AUTHORIZATION,
    startedAt,
    completedAt: new Date().toISOString(),
    error: String(error).slice(0, 2_000),
  };
}

async function loadAgent() {
  const source = await readFile(AGENT_PATH, "utf8");
  const model = source.match(MODEL_RE)?.[1];
  const instructions = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
  if (!model || !instructions) throw new Error("The source-auditor profile must declare a model and instructions.");
  return { model, instructions };
}
async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    console.log(usage());
    return;
  }
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const rows = await readJsonLines(LEDGER_PATH);
  const pending = selectPendingGroups(catalog, rows, options);
  if (options.dryRun) {
    console.log(JSON.stringify({ pending: pending.length, sourceIds: pending.map((group) => group.source.id) }, null, 2));
    return;
  }
  if (pending.length === 0) {
    console.log("No pending source groups; all current catalog snapshots have completed reports.");
    return;
  }
  const agent = await loadAgent();
  const model = agent.model;
  const releaseLock = await acquireLock();
  let completed = 0;
  try {
    for (const [index, group] of pending.entries()) {
      const sourceHash = sourceSnapshotHash(group);
      const startedAt = new Date().toISOString();
      console.log(`[${index + 1}/${pending.length}] Auditing ${group.source.name} (${group.source.id})`);
      try {
        const input = auditInput(group, reportHistory(rows, group.source.id));
        const result = await runOmp(parentPrompt(input, agent.instructions), model);
        const report = extractReport(result.stdout, group);
        const completedAt = new Date().toISOString();
        const row = {
          schemaVersion: 1,
          kind: "source-audit",
          status: "completed",
          sourceId: group.source.id,
          sourceName: group.source.name,
          canonicalUrl: group.source.canonicalUrl,
          sourceSnapshotHash: sourceHash,
          authorization: AUTHORIZATION,
          model,
          startedAt,
          completedAt,
          ompExitCode: result.code,
          report,
        };
        await appendRow(row);
        rows.push(row);
        completed += 1;
        console.log(`Stored ${group.source.id}: ${report.recommendation}; fetch permission remains not_granted.`);
      } catch (error) {
        await appendRow(failureRow(group, sourceHash, startedAt, error));
        console.error(`Stopped after ${group.source.id}; failure recorded. Rerun later to resume. ${String(error)}`);
        process.exitCode = 1;
        break;
      }
    }
    console.log(`Completed ${completed} source group(s) in this run; ${pending.length - completed} remain pending.`);
  } finally {
    await releaseLock();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
