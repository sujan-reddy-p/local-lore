import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import { loreItems } from "./seed-data";
import type { Category, LoreItem } from "./types";

type Coordinate = [number, number];

export const categoryGlyph: Record<Category,string> = {
  Outside:"↗",
  Move:"⌁",
  Make:"✦",
  Listen:"♫",
  Eat:"◆",
  Learn:"◎",
  Community:"∞",
  "After dark":"☾",
};

function activityFootprint([longitude, latitude]:Coordinate, radiusM:number): Coordinate[] {
  const latitudeDegrees = radiusM / 111_320;
  const longitudeDegrees = radiusM / (111_320 * Math.cos(latitude * Math.PI / 180));
  const points = Array.from({ length:16 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 16;
    return [longitude + Math.cos(angle) * longitudeDegrees, latitude + Math.sin(angle) * latitudeDegrees] as Coordinate;
  });
  return [...points, points[0]];
}

export const featuredLore = loreItems;

export const categoryKey = (category:Category) => category.toLowerCase().replaceAll(" ","-");

export function activityZoneCollection(items:LoreItem[], ids:string[]): FeatureCollection<Polygon> {
  const allowed = new Set(ids);
  const features = items.filter(item => allowed.has(item.id)).map<Feature<Polygon>>(item => ({
    type:"Feature",
    id:item.id,
    properties:{ id:item.id, title:item.title, category:item.category, accent:item.accent, glyph:categoryGlyph[item.category], hotspot:item.hotspot === true },
    geometry:{ type:"Polygon", coordinates:[activityFootprint(item.coordinates,item.zoneRadiusM)] },
  }));
  return { type:"FeatureCollection", features };
}

export function missionPointCollection(items:LoreItem[], ids:string[]): FeatureCollection<Point> {
  const allowed = new Set(ids);
  const features = items.filter(item => allowed.has(item.id)).map<Feature<Point>>(item => ({
    type:"Feature",
    id:item.id,
    properties:{ id:item.id, title:item.title, category:item.category, accent:item.accent, iconKey:categoryKey(item.category), neighborhood:item.neighborhood },
    geometry:{ type:"Point", coordinates:item.coordinates },
  }));
  return { type:"FeatureCollection", features };
}
