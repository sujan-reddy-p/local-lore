export type SourceDefinition = {
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
  reviewStatus: "approved_for_display" | "needs_source_review";
};
