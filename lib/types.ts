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
};

export type LoreItem = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  why: string;
  category: Category;
  neighborhood: string;
  venue: string;
  coordinates: [number, number];
  zoneRadiusM: number;
  time: string;
  timeSlot: "Now" | "Tonight" | "Weekend";
  duration: number;
  price: number;
  vibe: ("solo" | "friends" | "outdoors" | "quiet" | "social")[];
  accessibility: string;
  source: { name: string; url: string; status: "curated-seed"; checkedAt: string };
  accent: string;
  distance: string;
  format?: MissionFormat;
  traits?: MissionTrait[];
  schedule?: MissionSchedule;
  image?: MissionImage;
  hotspot?: boolean;
  featured?: boolean;
};
