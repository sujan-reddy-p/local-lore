import type { LoreItem } from "../types";

export type RawSourceRecord = Record<string, unknown>;
export type SourceKind = "official-calendar" | "public-feed" | "organizer-page" | "curated-seed";

export type SourcePolicy = {
  kind: SourceKind;
  canonicalUrl: string;
  attribution: string;
  termsUrl?: string;
  allowsAutomatedFetch: boolean;
  allowsImageReuse: boolean;
  refreshMinutes: number;
};

export type NormalizedMission = Omit<LoreItem, "id"> & {
  externalId: string;
  confidence: number;
  lastSeenAt: string;
};

export interface SourceAdapter {
  readonly key: string;
  readonly sourceName: string;
  readonly policy: SourcePolicy;
  fetch(signal?: AbortSignal): Promise<RawSourceRecord[]>;
  normalize(record: RawSourceRecord, checkedAt: string): NormalizedMission | null;
}

export function canRun(adapter: SourceAdapter) {
  return adapter.policy.allowsAutomatedFetch && adapter.policy.kind !== "organizer-page";
}

// Organizer pages that do not explicitly allow automation stay human-curated.
// Every adapter preserves the canonical organizer URL and passes normalized
// records through validation and review before anything becomes visible.
