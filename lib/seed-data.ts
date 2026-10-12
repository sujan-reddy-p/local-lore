import sourceCatalog from "@/data/source-catalog.json";
import type { SourceDefinition } from "./source-types";
import type { LoreItem, MissionSourceStatus } from "./types";

type CatalogRecord = Omit<LoreItem, "source"> & {
  catalogOrder: number;
  reviewStatus: "approved_for_display";
  sourceStatus?: MissionSourceStatus;
  checkedAt?: string;
};
type SourceGroup = {
  source: Omit<SourceDefinition, "reviewStatus">;
  reviewStatus: "approved_for_display" | "needs_source_review";
  lastCatalogCheckedAt: string | null;
  records: CatalogRecord[];
};
type SourceCatalog = {
  schemaVersion: 1;
  migrationState: "catalog_ready";
  approvalBasis: "maintainer_assumed_accurate_for_existing_site_content";
  sourceCount: number;
  recordCount: number;
  sources: SourceGroup[];
};

const catalog = sourceCatalog as SourceCatalog;
const groups = catalog.sources;


const orderedCatalogRecords = groups
  .flatMap(({ source, reviewStatus, lastCatalogCheckedAt, records }) =>
    records.map((record) => {
      if (reviewStatus !== "approved_for_display" || record.reviewStatus !== "approved_for_display") {
        throw new Error(`Catalog approval missing for ${record.id}`);
      }
      return {
        catalogOrder: record.catalogOrder,
        mission: {
          ...record,
          source: {
            name: source.name,
            url: source.canonicalUrl,
            status: record.sourceStatus ?? (source.kind === "curated-seed" ? "curated-seed" : "agentic-directory"),
            checkedAt: record.checkedAt ?? lastCatalogCheckedAt ?? "unknown",
          },
        } as LoreItem,
      };
    }),
  )
  .sort((a, b) => a.catalogOrder - b.catalogOrder);

export const catalogOrderById = new Map<string, number>(orderedCatalogRecords.map(({ mission, catalogOrder }) => [mission.id, catalogOrder]));
export const loreItems: LoreItem[] = orderedCatalogRecords.map(({ mission }) => mission);
