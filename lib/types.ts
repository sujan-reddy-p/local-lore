import type { MultiPolygon, Polygon } from "geojson";

export const categories = ["Outside", "Move", "Make", "Listen", "Eat", "Learn", "Community", "After dark"] as const;
export type Category = (typeof categories)[number];

export type MissionFormat = "Adventure" | "Class" | "Culture" | "Food" | "Live" | "Market" | "Meetup" | "Volunteer";
export type AvailabilityKind = "evergreen" | "recurring" | "scheduled" | "seasonal" | "conditions";
export type MissionTrait = "dog-friendly" | "photogenic" | "date-idea" | "family" | "weird" | "cozy" | "scenic" | "drive" | "romantic" | "social";

export type MissionSchedule = {
  kind: AvailabilityKind;
  daysOfWeek?: number[];
  dates?: string[];
  startsAt?: string;
  endsAt?: string;
  expiresAt?: string;
};

export type MissionImage = {
  url: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  license?: string;
  licenseUrl?: string;
  kind?: "event" | "venue" | "logo";
};

export type MissionSourceStatus = "curated-seed" | "verified-live" | "agentic-directory";

export type LoreItem = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  why: string;
  category: Category;
  neighborhood: string;
  venue: string;
  city?: string;
  coordinates: [number, number];
  zoneRadiusM: number;
  time: string;
  timeSlot: "Now" | "Tonight" | "Weekend";
  duration: number | null;
  price: number | null;
  vibe: ("solo" | "friends" | "outdoors" | "quiet" | "social")[];
  accessibility: string;
  websiteUrl?: string;
  source: { name: string; url: string; status: MissionSourceStatus; checkedAt: string };
  accent: string;
  distance: string;
  format?: MissionFormat;
  traits?: MissionTrait[];
  schedule?: MissionSchedule;
  map?: {
    kind: "area" | "venue" | "route";
    route?: [number, number][];
    sourceUrl?: string;
    boundary?: Polygon | MultiPolygon;
    evidence?: string;
    routeType?: "course" | "connection";
  };
  image?: MissionImage;
  hotspot?: boolean;
  featured?: boolean;
};
