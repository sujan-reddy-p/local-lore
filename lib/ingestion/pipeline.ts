import { createHash } from "node:crypto";
import type { SourceAdapter, NormalizedMission } from "../adapters/source-adapter";
import type { LoreItem } from "../types";

export type ReviewReason = "low-confidence" | "missing-source" | "invalid-location" | "duplicate" | "expired";
export type ReviewItem = { record:NormalizedMission; reasons:ReviewReason[] };
export type PipelineResult = { publishable:LoreItem[]; review:ReviewItem[]; rejected:number };

const stableId = (sourceKey:string, externalId:string) => createHash("sha256").update(`${sourceKey}:${externalId}`).digest("hex").slice(0,18);

function reviewReasons(record:NormalizedMission, seen:Set<string>, today:string):ReviewReason[] {
  const reasons:ReviewReason[] = [];
  if (!record.source.url.startsWith("https://")) reasons.push("missing-source");
  const [longitude,latitude] = record.coordinates;
  if (longitude < -122.62 || longitude > -122.25 || latitude < 37.60 || latitude > 37.94) reasons.push("invalid-location");
  if (record.confidence < 0.78) reasons.push("low-confidence");
  if (record.schedule?.expiresAt && record.schedule.expiresAt < today) reasons.push("expired");
  const fingerprint = `${record.title.toLowerCase()}|${record.venue.toLowerCase()}|${record.coordinates.map(value => value.toFixed(3)).join(",")}`;
  if (seen.has(fingerprint)) reasons.push("duplicate");
  seen.add(fingerprint);
  return reasons;
}

export async function runAdapter(adapter:SourceAdapter, now=new Date()):Promise<PipelineResult> {
  if (!adapter.policy.allowsAutomatedFetch) return {publishable:[],review:[],rejected:0};
  const checkedAt = now.toISOString().slice(0,10);
  const raw = await adapter.fetch();
  const normalized = raw.map(record => adapter.normalize(record,checkedAt)).filter((record):record is NormalizedMission => Boolean(record));
  const seen = new Set<string>();
  const publishable:LoreItem[] = [];
  const review:ReviewItem[] = [];
  for (const record of normalized) {
    const reasons = reviewReasons(record,seen,checkedAt);
    if (reasons.length) review.push({record,reasons});
    else {
      const {externalId:sourceExternalId,confidence:_confidence,lastSeenAt:_lastSeenAt,...mission} = record;
      void _confidence;
      void _lastSeenAt;
      publishable.push({...mission,id:stableId(adapter.key,sourceExternalId)});
    }
  }
  return {publishable,review,rejected:raw.length-normalized.length};
}
