import {
  createIngestionRun,
  expirePastEventOccurrences,
  finishIngestionRun,
  listDueSources,
  recordCandidateDecision,
  recordSourceObservation,
} from "@/db/repository";
import { normalizeStructuredEvent } from "@/lib/ingestion/normalize-event";
import { checkPublicPage } from "@/lib/ingestion/page-check";

function nextCheckAt(refreshHours: number, failed: boolean) {
  const hours = failed ? Math.min(refreshHours * 2, 24 * 14) : refreshHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export async function runDailyRefresh() {
  const runId = await createIngestionRun();
  let fetched = 0;
  let unchanged = 0;
  let normalized = 0;
  let pendingReview = 0;
  let rejected = 0;
  const published = 0;
  try {
    const due = await listDueSources(new Date(), 20);
    for (const source of due) {
      const result = await checkPublicPage({
        url: source.canonicalUrl,
        etag: source.etag,
        lastModified: source.lastModified,
        contentHash: source.contentHash,
      });
      fetched += 1;
      if (!result.changed) unchanged += 1;
      normalized += result.eventCount;
      if (result.error) rejected += 1;
      if (result.changed && !result.error) {
        const observedAt = new Date().toISOString();
        for (const event of result.events) {
          const candidate = normalizeStructuredEvent(event, source, observedAt, result.contentHash);
          if ("reason" in candidate) {
            rejected += 1;
            await recordCandidateDecision({
              sourceId: source.id,
              runId,
              externalId: event.externalId,
              decision: "discarded",
              reasons: [candidate.reason],
              candidate: { sourceEvent: event },
            });
            continue;
          }
          await recordCandidateDecision({
            sourceId: source.id,
            runId,
            externalId: candidate.occurrence.externalId,
            decision: "needs_review",
            reasons: ["Human review required before publication"],
            candidate: candidate.occurrence,
          });
          pendingReview += 1;
        }
      }
      await recordSourceObservation({
        sourceId: source.id,
        runId,
        statusCode: result.statusCode,
        changed: result.changed,
        etag: result.etag,
        lastModified: result.lastModified,
        contentHash: result.contentHash,
        contentType: result.contentType,
        extractedEventCount: result.eventCount,
        extractedEvents: result.events,
        error: result.error,
        nextCheckAt: nextCheckAt(source.refreshHours, Boolean(result.error)),
      });
    }
    const expired = await expirePastEventOccurrences();
    await finishIngestionRun(runId, { status: "completed", fetched, unchanged, normalized, pendingReview, published, rejected });
    return { runId, fetched, unchanged, discoveredStructuredEvents: normalized, pendingReview, published, rejected, expired };
  } catch (error) {
    await finishIngestionRun(runId, {
      status: "failed", fetched, unchanged, normalized, pendingReview, published, rejected,
      error: error instanceof Error ? error.message : "Source refresh failed",
    });
    throw error;
  }
}
