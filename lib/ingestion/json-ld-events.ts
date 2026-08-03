export type StructuredSourceEvent = {
  externalUrl?: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  venue?: string;
  address?: string;
  price?: number;
};

function flatten(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (!value || typeof value !== "object") return [];
  const item = value as Record<string, unknown>;
  return [item, ...flatten(item["@graph"])];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function price(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/\$?([0-9]+(?:\.[0-9]{1,2})?)/);
    return match ? Number(match[1]) : undefined;
  }
  return undefined;
}

export function extractJsonLdEvents(html: string): StructuredSourceEvent[] {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const events: StructuredSourceEvent[] = [];
  for (const script of scripts) {
    try {
      const values = flatten(JSON.parse(script[1]));
      for (const value of values) {
        const type = value["@type"];
        const isEvent = type === "Event" || type === "EventSeries" || Array.isArray(type) && type.includes("Event");
        if (!isEvent) continue;
        const title = text(value.name);
        if (!title) continue;
        const location = value.location && typeof value.location === "object" ? value.location as Record<string, unknown> : undefined;
        const offers = Array.isArray(value.offers) ? value.offers[0] : value.offers;
        const offer = offers && typeof offers === "object" ? offers as Record<string, unknown> : undefined;
        events.push({
          externalUrl: text(value.url) ?? text(value["@id"]), title,
          description: text(value.description)?.slice(0, 1200), startsAt: text(value.startDate), endsAt: text(value.endDate),
          venue: location ? text(location.name) : undefined,
          address: location ? typeof location.address === "string" ? location.address : text((location.address as Record<string, unknown> | undefined)?.streetAddress) : undefined,
          price: offer ? price(offer.price) : undefined,
        });
      }
    } catch {
      // A malformed JSON-LD block must not fail the rest of a source refresh.
    }
  }
  return events;
}
