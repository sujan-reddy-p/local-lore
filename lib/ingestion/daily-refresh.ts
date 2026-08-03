import { bootstrapSeedCatalog, createIngestionRun, finishIngestionRun, listDueSources, recordCandidateDecision, recordSourceObservation, upsertAgentMission } from "@/db/repository";
import { normalizeStructuredEvent } from "@/lib/ingestion/normalize-event";
import { checkPublicPage } from "@/lib/ingestion/page-check";

function nextCheckAt(refreshHours: number, failed: boolean) {
  const hours = failed ? Math.min(refreshHours * 2, 24 * 14) : refreshHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export async function runDailyRefresh() {
  await bootstrapSeedCatalog();
  const runId = await createIngestionRun();
  let fetched = 0;
  let unchanged = 0;
  let normalized = 0;
  let rejected = 0;
  let published = 0;
  try {
    const due = await listDueSources(new Date(), 20);
    for (const source of due) {
      const result = await checkPublicPage({ url: source.canonicalUrl, etag: source.etag, lastModified: source.lastModified, contentHash: source.contentHash });
      fetched += 1;
      if (!result.changed) unchanged += 1;
      normalized += result.eventCount;
      if (result.error) rejected += 1;
      if (result.changed && !result.error) {
        for (const event of result.events) {
          const candidate = normalizeStructuredEvent(event, source, new Date().toISOString().slice(0, 10));
          if ("reason" in candidate) {
            rejected += 1;
            await recordCandidateDecision({ sourceId: source.id, runId, decision: "discarded", reasons: [candidate.reason], candidate: event });
            continue;
          }
          // Refreshes preserve deterministic source facts and Local Lore's
          // existing venue framing. AI is intentionally not on this critical
          // path: a slow/free model must never delay a city update.
          await upsertAgentMission({ sourceId: source.id, externalId: candidate.mission.externalId, mission: candidate.mission, runId });
          await recordCandidateDecision({ sourceId: source.id, runId, externalId: candidate.mission.externalId, decision: "published", reasons: [], candidate: event });
          published += 1;
        }
      }
      await recordSourceObservation({
        sourceId: source.id, runId, statusCode: result.statusCode, changed: result.changed,
        etag: result.etag, lastModified: result.lastModified, contentHash: result.contentHash,
        contentType: result.contentType, extractedEventCount: result.eventCount, error: result.error,
        nextCheckAt: nextCheckAt(source.refreshHours, Boolean(result.error)),
      });
    }
    await finishIngestionRun(runId, { status: "completed", fetched, unchanged, normalized, published, rejected });
    return { runId, fetched, unchanged, discoveredStructuredEvents: normalized, published, rejected };
  } catch (error) {
    await finishIngestionRun(runId, { status: "failed", fetched, unchanged, normalized, published, rejected, error: error instanceof Error ? error.message : "Daily refresh failed" });
    throw error;
  }
}
