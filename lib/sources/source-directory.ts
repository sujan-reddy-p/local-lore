import { createHash } from "node:crypto";
import { loreItems } from "@/lib/seed-data";

export type SourceDirectoryEntry = {
  id: string;
  key: string;
  name: string;
  kind: "curated-seed" | "official-calendar" | "public-feed" | "organizer-page";
  canonicalUrl: string;
  termsUrl?: string;
  attribution: string;
  allowsAutomatedFetch: boolean;
  allowsImageReuse: boolean;
  refreshHours: number;
  enabled: boolean;
};

export const sourceKey = (name: string, url: string) => createHash("sha256").update(`${name}:${url}`).digest("hex").slice(0, 18);

// Existing curated sources are a discoverable registry, not authorization to crawl.
// An entry must be explicitly promoted with a documented feed/API policy before fetch is enabled.
const curatedSeedSources: SourceDirectoryEntry[] = Array.from(
  new Map(loreItems.map((item) => {
    const { name, url } = item.source;
    const key = sourceKey(name, url);
    return [key, {
      id: `source_${key}`,
      key,
      name,
      kind: "curated-seed" as const,
      canonicalUrl: url,
      attribution: name,
      allowsAutomatedFetch: false,
      allowsImageReuse: false,
      refreshHours: 168,
      enabled: true,
    }];
  })).values(),
);

const officialFeedSources: SourceDirectoryEntry[] = [
  {
    id: "source_sf-rec-park-bandshell-calendar",
    key: "sf-rec-park-bandshell-calendar",
    name: "SF Recreation & Parks · Golden Gate Bandshell Calendar",
    kind: "public-feed",
    canonicalUrl: "https://sfrecpark.org/common/modules/iCalendar/iCalendar.aspx?catID=35&feed=calendar",
    termsUrl: "https://sfrecpark.org/iCalendar.aspx",
    attribution: "San Francisco Recreation & Parks",
    allowsAutomatedFetch: true,
    allowsImageReuse: false,
    refreshHours: 24,
    enabled: true,
  },
];

export const sourceDirectory = [...curatedSeedSources, ...officialFeedSources];
