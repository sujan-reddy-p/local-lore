import { and, asc, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db/client";
import { candidateDecisions, eventOccurrences, eventReviews, eventRevisions, sources } from "@/db/schema";
import type { NormalizedEventOccurrence } from "@/lib/ingestion/normalize-event";

function usage(): never {
  throw new Error([
    "Usage:",
    "  npm run events:review -- pending [--limit 20]",
    '  npm run events:review -- approve <candidate-id> --note "human review note"',
    '  npm run events:review -- reject <candidate-id> --note "human review note"',
  ].join("\n"));
}

function option(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1]?.trim() : undefined;
}

function parseOccurrence(value: unknown, sourceId: string): NormalizedEventOccurrence {
  if (!value || typeof value !== "object") throw new Error("Candidate payload is not an event object.");
  const occurrence = value as Partial<NormalizedEventOccurrence>;
  if (
    typeof occurrence.id !== "string" || typeof occurrence.externalId !== "string" ||
    occurrence.sourceId !== sourceId || typeof occurrence.sourceUrl !== "string" ||
    typeof occurrence.title !== "string" || typeof occurrence.startsAt !== "string" ||
    typeof occurrence.timezone !== "string" || typeof occurrence.confidence !== "number" ||
    typeof occurrence.sourceObservedAt !== "string" || !occurrence.sourceData
  ) throw new Error("Candidate payload is missing required normalized event fields.");
  return occurrence as NormalizedEventOccurrence;
}

async function listPending(limit: number) {
  const db = getDb();
  const rows = await db.select({
    id: candidateDecisions.id,
    externalId: candidateDecisions.externalId,
    reasons: candidateDecisions.reasons,
    candidate: candidateDecisions.candidate,
    sourceName: sources.name,
    sourceUrl: sources.canonicalUrl,
    createdAt: candidateDecisions.createdAt,
  }).from(candidateDecisions)
    .innerJoin(sources, eq(candidateDecisions.sourceId, sources.id))
    .where(eq(candidateDecisions.decision, "needs_review"))
    .orderBy(asc(candidateDecisions.createdAt))
    .limit(limit);
  console.log(JSON.stringify(rows.map((row) => {
    const event = row.candidate as Partial<NormalizedEventOccurrence>;
    return {
      id: row.id,
      title: event.title,
      startsAt: event.startsAt,
      venue: event.venue,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      reasons: row.reasons,
      createdAt: row.createdAt,
    };
  }), null, 2));
}

async function decide(action: "approve" | "reject", candidateId: string, note: string) {
  const db = getDb();
  const [row] = await db.select({
    id: candidateDecisions.id,
    sourceId: candidateDecisions.sourceId,
    decision: candidateDecisions.decision,
    candidate: candidateDecisions.candidate,
    sourceStatus: sources.reviewStatus,
    enabled: sources.enabled,
    allowsAutomatedFetch: sources.allowsAutomatedFetch,
  }).from(candidateDecisions)
    .innerJoin(sources, eq(candidateDecisions.sourceId, sources.id))
    .where(eq(candidateDecisions.id, candidateId))
    .limit(1);
  if (!row) throw new Error(`Candidate not found: ${candidateId}`);
  if (row.decision !== "needs_review") throw new Error(`Candidate is already ${row.decision}; only pending candidates can be reviewed.`);
  if (action === "approve" && (row.sourceStatus !== "approved_for_display" || row.enabled !== 1 || row.allowsAutomatedFetch !== 1)) {
    throw new Error("Cannot publish: the source is not currently approved, enabled, and explicitly permitted for automated fetching.");
  }
  const occurrence = action === "approve" ? parseOccurrence(row.candidate, row.sourceId) : undefined;
  const actor = process.env.USER?.trim() || "local-cli";
  const now = new Date().toISOString();

  const outcome = await db.transaction(async (tx) => {
    const [lockedSource] = await tx.select({
      reviewStatus: sources.reviewStatus,
      enabled: sources.enabled,
      allowsAutomatedFetch: sources.allowsAutomatedFetch,
    }).from(sources).where(eq(sources.id, row.sourceId)).for("update");
    if (action === "approve" && (!lockedSource || lockedSource.reviewStatus !== "approved_for_display" || lockedSource.enabled !== 1 || lockedSource.allowsAutomatedFetch !== 1)) {
      throw new Error("Cannot publish: the source is not currently approved, enabled, and explicitly permitted for automated fetching.");
    }
    const [claimed] = await tx.update(candidateDecisions)
      .set({ decision: action === "approve" ? "approved" : "rejected" })
      .where(and(eq(candidateDecisions.id, candidateId), eq(candidateDecisions.decision, "needs_review")))
      .returning({ id: candidateDecisions.id });
    if (!claimed) throw new Error("Candidate was reviewed by another process; reload the pending list.");

    if (!occurrence) {
      await tx.insert(eventReviews).values({
        id: crypto.randomUUID(), candidateId, action: "rejected", actor, note,
      });
      return { decision: "rejected", eventId: null };
    }

    const [existing] = await tx.select().from(eventOccurrences).where(and(
      eq(eventOccurrences.sourceId, row.sourceId),
      eq(eventOccurrences.externalId, occurrence.externalId),
    )).limit(1);
    const after = {
      ...occurrence,
      description: occurrence.description ?? null,
      endsAt: occurrence.endsAt ?? null,
      venue: occurrence.venue ?? null,
      address: occurrence.address ?? null,
      longitude: occurrence.longitude ?? null,
      latitude: occurrence.latitude ?? null,
      price: occurrence.price ?? null,
      currency: occurrence.currency ?? null,
      sourceSnapshotHash: occurrence.sourceSnapshotHash ?? null,
      expiresAt: occurrence.expiresAt ?? null,
      status: "published" as const,
      publishedAt: existing?.publishedAt ?? now,
      lastSeenAt: now,
      updatedAt: now,
    };
    if (existing) {
      await tx.update(eventOccurrences).set(after).where(eq(eventOccurrences.id, existing.id));
      await tx.insert(eventRevisions).values({
        id: crypto.randomUUID(), eventId: existing.id, actor,
        before: existing, after,
      });
    } else {
      await tx.insert(eventOccurrences).values({
        ...after,
        firstSeenAt: now,
        createdAt: now,
      });
      await tx.insert(eventRevisions).values({
        id: crypto.randomUUID(), eventId: occurrence.id, actor,
        before: null, after,
      });
    }
    const eventId = existing?.id ?? occurrence.id;
    await tx.update(candidateDecisions).set({ eventId }).where(eq(candidateDecisions.id, candidateId));
    await tx.insert(eventReviews).values({
      id: crypto.randomUUID(), eventId, candidateId,
      action: existing ? "updated" : "approved", actor, note,
    });
    return { decision: existing ? "updated and published" : "approved and published", eventId };
  });
  console.log(JSON.stringify({ candidateId, ...outcome }, null, 2));
}

async function main() {
  const [command, candidateId, ...args] = process.argv.slice(2);
  if (command === "pending") {
    const parsed = Number(option([candidateId ?? "", ...args], "--limit") ?? 20);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) throw new Error("--limit must be an integer from 1 to 100.");
    await listPending(parsed);
    return;
  }
  if (command !== "approve" && command !== "reject") usage();
  const note = option(args, "--note");
  if (!candidateId || !note || note.length > 1000) throw new Error("A candidate ID and a --note between 1 and 1000 characters are required.");
  await decide(command, candidateId, note);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
