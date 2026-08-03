import { createHash } from "node:crypto";
import { extractJsonLdEvents, type StructuredSourceEvent } from "./json-ld-events";
import { extractIcalEvents } from "./ical-events";

export type PageCheckInput = {
  url: string;
  etag?: string | null;
  lastModified?: string | null;
  contentHash?: string | null;
};

export type PageCheckResult = {
  statusCode: number;
  changed: boolean;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  contentType: string | null;
  eventCount: number;
  events: StructuredSourceEvent[];
  error?: string;
};

export async function checkPublicPage(input: PageCheckInput): Promise<PageCheckResult> {
  const headers = new Headers({ "User-Agent": "LocalLoreBot/0.1 (+https://local-lore-five.vercel.app)" });
  if (input.etag) headers.set("If-None-Match", input.etag);
  if (input.lastModified) headers.set("If-Modified-Since", input.lastModified);
  try {
    const response = await fetch(input.url, { headers, redirect: "follow", signal: AbortSignal.timeout(12_000) });
    const contentType = response.headers.get("content-type");
    if (response.status === 304) return { statusCode: 304, changed: false, etag: input.etag ?? null, lastModified: input.lastModified ?? null, contentHash: null, contentType, eventCount: 0, events: [] };
    if (!response.ok) return { statusCode: response.status, changed: false, etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified"), contentHash: null, contentType, eventCount: 0, events: [], error: `HTTP ${response.status}` };
    const body = await response.text();
    const contentHash = createHash("sha256").update(body).digest("hex");
    const events = contentType?.includes("calendar") ? extractIcalEvents(body) : contentType?.includes("html") ? extractJsonLdEvents(body) : [];
    return {
      statusCode: response.status,
      changed: contentHash !== input.contentHash,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      contentHash,
      contentType,
      eventCount: events.length,
      events,
    };
  } catch (error) {
    return { statusCode: 0, changed: false, etag: input.etag ?? null, lastModified: input.lastModified ?? null, contentHash: null, contentType: null, eventCount: 0, events: [], error: error instanceof Error ? error.message : "Fetch failed" };
  }
}
