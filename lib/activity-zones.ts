import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import { loreItems } from "./seed-data";
import type { LoreItem } from "./types";
import { activityArtwork } from "./activity-artwork";

type Coordinate = [number, number];
export type ActivityOutline = Polygon | MultiPolygon;
export type OutlineFeature = Feature<ActivityOutline>;
export type ActivityMapKind = "area" | "venue" | "route";
export const featuredLore = loreItems;

const outdoorKinds: Record<string, true> = { park: true, recreation_ground: true, garden: true, cemetery: true, pitch: true, playground: true, sports_centre: true, stadium: true, zoo: true, nature_reserve: true, national_park: true, forest: true, grass: true, meadow: true, allotments: true, village_green: true, beach: true };
const gardenWords = /\b(garden|gardens|botanical|arboretum)\b/i;
const routeWords = /\b(run|running|runner|jog|jogging|race|cycling|cyclist|bike|biking|bicycle|hike|hiking|trail|track|walk|walking|stair|stairs|steps)\b/i;
const nonRouteWords = /\b(garden|gardens|museum|gallery|library|academy|botanical|arboretum)\b/i;

export function activityMapKind(item: LoreItem): ActivityMapKind {
  if (item.map?.kind) return item.map.kind;
  const subject = `${item.title} ${item.venue}`;
  if (gardenWords.test(subject) && item.category !== "Eat") return "area";
  if ((item.category === "Move" || item.category === "Outside" || item.category === "Community") && routeWords.test(subject) && !nonRouteWords.test(subject)) return "route";
  return item.category === "Outside" ? "area" : "venue";
}

function ringArea(ring: Coordinate[]) {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function geometryArea(geometry: ActivityOutline) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.reduce((sum, polygon) => sum + Math.max(0, ringArea(polygon[0] as Coordinate[]) - polygon.slice(1).reduce((holes, ring) => holes + ringArea(ring as Coordinate[]), 0)), 0);
}

function inRing(point: Coordinate, ring: Coordinate[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function contains(geometry: ActivityOutline, point: Coordinate) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(polygon => inRing(point, polygon[0] as Coordinate[]) && !polygon.slice(1).some(ring => inRing(point, ring as Coordinate[])));
}

function touchesTileBoundary(geometry: ActivityOutline) {
  const n = 2 ** 14;
  const epsilon = 1e-7;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(polygon => polygon.some(ring => ring.some(([longitude, latitude]) => {
    const x = (longitude + 180) / 360 * n;
    const latitudeR = latitude * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(latitudeR) + 1 / Math.cos(latitudeR)) / Math.PI) / 2 * n;
    return (Math.abs(x - Math.round(x)) < epsilon || Math.abs(y - Math.round(y)) < epsilon) && x > 0 && x < n && y > 0 && y < n;
  })));
}

/** Loaded OSM geometry is context, never an invented venue boundary. */
export function matchActivityOutlines(items: LoreItem[], candidates: OutlineFeature[]) {
  const prepared = candidates.flatMap(candidate => {
    if (!candidate.geometry || touchesTileBoundary(candidate.geometry)) return [];
    const kind = String(candidate.properties?.kind ?? candidate.properties?.kind_detail ?? "");
    const building = candidate.properties?.__layer === "buildings" || Boolean(candidate.properties?.height);
    return [{ candidate, kind, building, area: geometryArea(candidate.geometry) }];
  });
  const matches = new Map<string, ActivityOutline>();
  for (const item of items) {
    const mapKind = activityMapKind(item);
    if (mapKind === "route") continue;
    const outdoor = mapKind === "area";
    let best: typeof prepared[number] | undefined;
    for (const entry of prepared) {
      const relevant = outdoor ? outdoorKinds[entry.kind] === true : entry.building;
      if (outdoor && gardenWords.test(`${item.title} ${item.venue}`) && entry.kind !== "garden" && !gardenWords.test(String(entry.candidate.properties?.name ?? ""))) continue;
      if (!relevant || entry.area <= 0 || entry.area >= (outdoor ? 0.0012 : 0.00025) || (best && entry.area >= best.area)) continue;
      if (contains(entry.candidate.geometry, item.coordinates)) best = entry;
    }
    if (best) matches.set(item.id, best.candidate.geometry);
  }
  return matches;
}

/** Build one scene so clustering, locators and group selection share the same anchors. */
export function activityScene(items: LoreItem[], ids: string[], outlines: Map<string, ActivityOutline> = new Map()) {
  const allowed = new Set(ids);
  const zones: FeatureCollection<ActivityOutline> = { type: "FeatureCollection", features: [] };
  const points: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };
  const routes: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };
  const byCoordinate = new Map<string, LoreItem[]>();
  const byVenue = new Map<string, LoreItem[][]>();
  const groups: LoreItem[][] = [];
  const baseOutlines = new Set<string>();
  const outlineAreas = new Map<string, number>();
  for (const item of items) {
    if (!allowed.has(item.id)) continue;
    const kind = activityMapKind(item);
    const geometry = kind === "route" ? undefined : outlines.get(item.id);
    if (geometry) {
      const signature = JSON.stringify(geometry.coordinates);
      const areaM2 = geometryArea(geometry) * 111_320 ** 2 * Math.cos(item.coordinates[1] * Math.PI / 180);
      outlineAreas.set(item.id, areaM2);
      zones.features.push({ type: "Feature", id: item.id, properties: { id: item.id, accent: item.accent, base: !baseOutlines.has(signature), areaM2 }, geometry });
      baseOutlines.add(signature);
    }
    if (kind === "route" && item.map?.route && item.map.sourceUrl && item.map.route.length >= 2) {
      routes.features.push({ type: "Feature", id: item.id, properties: { id: item.id, accent: item.accent, sourceUrl: item.map.sourceUrl }, geometry: { type: "LineString", coordinates: item.map.route } });
    }
    const coordinateKey = item.coordinates.join(",");
    const venueKey = item.venue.trim().toLowerCase().replace(/\s+/g, " ");
    const venueGroups = byVenue.get(venueKey) ?? [];
    let group = byCoordinate.get(coordinateKey) ?? venueGroups.find(entries => {
      const [longitude, latitude] = entries[0].coordinates;
      return Math.hypot((item.coordinates[0] - longitude) * 111_320 * Math.cos(latitude * Math.PI / 180), (item.coordinates[1] - latitude) * 111_320) <= 30;
    });
    if (!group) { group = []; groups.push(group); }
    if (!venueGroups.includes(group)) venueGroups.push(group);
    byVenue.set(venueKey, venueGroups);
    byCoordinate.set(coordinateKey, group);
    group.push(item);
  }
  for (const group of groups) {
    const item = group[0];
    const hasOutline = group.some(entry => activityMapKind(entry) !== "route" && outlines.has(entry.id)) && !group.some(entry => activityMapKind(entry) === "route");
    const outlineAreaM2 = hasOutline ? Math.max(...group.map(entry => outlineAreas.get(entry.id) ?? 0)) : 0;
    points.features.push({ type: "Feature", id: item.id, properties: { id: item.id, ids: `,${group.map(entry => entry.id).join(",")},`, count: group.length, hasOutline, outlineAreaM2, accent: item.accent, iconKey: activityArtwork(item) }, geometry: { type: "Point", coordinates: item.coordinates } });
  }
  return { zones, points, routes };
}
