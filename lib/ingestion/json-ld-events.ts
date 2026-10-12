export type StructuredSourceEvent = {
  externalId?: string;
  externalUrl?: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  endsTimezone?: string;
  venue?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  price?: number;
  currency?: string;
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

function numeric(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : undefined;
}

function price(value: unknown) {
  const direct = numeric(value);
  if (direct !== undefined) return direct;
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
        const types = Array.isArray(type) ? type : [type];
        const isEvent = types.some((entry) =>
          typeof entry === "string" && (/^(Event|EventSeries)$/.test(entry) || /[/#:]Event(?:Series)?$/.test(entry)),
        );
        if (!isEvent) continue;
        const title = text(value.name);
        if (!title) continue;
        const location = value.location && typeof value.location === "object" ? value.location as Record<string, unknown> : undefined;
        const geo = location?.geo && typeof location.geo === "object" ? location.geo as Record<string, unknown> : undefined;
        const offers = Array.isArray(value.offers) ? value.offers[0] : value.offers;
        const offer = offers && typeof offers === "object" ? offers as Record<string, unknown> : undefined;
        events.push({
          externalId: text(value.identifier) ?? text(value["@id"]),
          externalUrl: text(value.url) ?? text(value["@id"]),
          title,
          description: text(value.description)?.slice(0, 4000),
          startsAt: text(value.startDate),
          endsAt: text(value.endDate),
          venue: location ? text(location.name) : text(value.location),
          address: location ? typeof location.address === "string" ? location.address : text((location.address as Record<string, unknown> | undefined)?.streetAddress) : undefined,
          longitude: numeric(geo?.longitude),
          latitude: numeric(geo?.latitude),
          price: offer ? price(offer.price ?? offer.lowPrice) : undefined,
          currency: offer ? text(offer.priceCurrency) : undefined,
        });
      }
    } catch {
      // A malformed JSON-LD block must not fail the rest of a source refresh.
    }
  }
  return events;
}
