import assert from "node:assert/strict";
import test from "node:test";
import {
  assistantMessageLines,
  extractReport,
  selectPendingGroups,
  sourceSnapshotHash,
  validateReport,
} from "../scripts/audit-sources.mjs";

const group = {
  source: {
    id: "source-test",
    name: "Test Source",
    canonicalUrl: "https://example.org/events",
  },
  reviewStatus: "approved_for_display",
  lastCatalogCheckedAt: "2026-08-02",
  records: [{ id: "record-a", title: "Test activity" }],
};

function validReport() {
  return {
    sourceId: group.source.id,
    sourceName: group.source.name,
    canonicalUrl: group.source.canonicalUrl,
    finalUrl: group.source.canonicalUrl,
    sourceStatus: "reachable",
    identityAssessment: "matches",
    scopeAssessment: "in_scope",
    contentType: "official_page",
    recommendation: "keep_for_human_review",
    fetchPermission: "not_granted",
    confidence: 0.7,
    evidence: [{ claim: "Official page", observation: "The page identifies the organization.", evidenceType: "direct" }],
    cadenceAssessment: {
      sourceDeclaredUpdateFrequency: null,
      latestVisibleUpdate: null,
      observedChangeIntervalHours: null,
      recommendedCheckIntervalHours: 720,
      recommendationBasis: "conservative_source_type_estimate",
      confidence: "low",
      rationale: "Monthly recheck is a conservative proposal for a stable page.",
    },
    recordAssessments: [{
      recordId: "record-a",
      supportStatus: "supported",
      contentType: "evergreen",
      verifiedFacts: ["The source identifies the venue."],
      unsupportedFields: ["Current event date"],
      reason: "The page supports the venue identity but lists no dated occurrence.",
    }],
    limitations: ["Only the canonical page was inspected."],
    humanFollowUp: ["Confirm operational access terms before recurring fetching."],
  };
}

test("source audit report enforces record coverage and denies automated fetch permission", () => {
  const report = validReport();
  assert.deepEqual(validateReport(report, group), []);
  assert.deepEqual(validateReport({ ...report, fetchPermission: "granted" }, group), ["Automated fetch permission must remain not_granted."]);
  assert.ok(validateReport({ ...report, recordAssessments: [] }, group).some((issue) => issue.includes("each assigned record exactly once")));
});

test("serial audit output extracts and validates the worker's exact structured report", () => {
  const report = validReport();
  const stream = `${JSON.stringify({
    type: "message_end",
    message: { role: "assistant", content: [{ type: "text", text: JSON.stringify(report) }] },
  })}\n`;
  assert.deepEqual(extractReport(stream, group), report);
  assert.throws(() => extractReport("{}\n", group), /did not contain a valid source-audit report/);
});

test("serial audit output discards oversized non-assistant page payloads", () => {
  const report = validReport();
  const reportLine = JSON.stringify({
    type: "message_end",
    message: { role: "assistant", content: [{ type: "text", text: JSON.stringify(report) }] },
  });
  const oversizedToolLine = JSON.stringify({
    type: "message_end",
    message: { role: "tool", content: [{ type: "text", text: "x".repeat(300_000) }] },
  });
  assert.deepEqual(assistantMessageLines(oversizedToolLine), []);
  const retained = assistantMessageLines(reportLine);
  assert.equal(retained.length, 1);
  assert.deepEqual(extractReport(retained.join("\n"), group), report);
});


test("resume skips only completed reports for the unchanged source snapshot", () => {
  const hash = sourceSnapshotHash(group);
  const rows = [
    { kind: "source-audit", status: "completed", sourceId: group.source.id, sourceSnapshotHash: hash },
    { kind: "source-audit", status: "failed", sourceId: "source-other", sourceSnapshotHash: "old" },
  ];
  assert.deepEqual(selectPendingGroups({ sources: [group] }, rows), []);
  const changed = { ...group, records: [{ ...group.records[0], title: "Updated activity" }] };
  assert.notEqual(sourceSnapshotHash(changed), hash);
  assert.deepEqual(selectPendingGroups({ sources: [changed] }, rows), [changed]);
  assert.deepEqual(selectPendingGroups({ sources: [group] }, rows.slice(1)), [group]);
});
