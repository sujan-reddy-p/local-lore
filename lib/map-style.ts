import { layers, namedFlavor } from "@protomaps/basemaps";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

export const SF_BOUNDS: [[number, number], [number, number]] = [
  [-122.61, 37.61],
  [-122.26, 37.93],
];

export const SF_HOME = {
  center: [-122.425, 37.78] as [number, number],
  zoom: 11.8,
  pitch: 44,
  bearing: -12,
};

const sourceId = "san-francisco";

export function createMapStyle(
  archiveUrl: string,
  activityZones: FeatureCollection<Polygon>,
  missionPoints: FeatureCollection<Point>,
): StyleSpecification {
  const flavor = {
    ...namedFlavor("dark"),
    background: "#080d0b",
    earth: "#17211f",
    park_a: "#1d3029",
    park_b: "#244039",
    water: "#123438",
    buildings: "#31413d",
    minor_a: "#33413e",
    minor_b: "#3c4b47",
    major: "#52615d",
    highway: "#63716d",
    roads_label_minor: "#91a39e",
    roads_label_minor_halo: "#18221f",
    roads_label_major: "#bdc9c5",
    roads_label_major_halo: "#18221f",
    ocean_label: "#7faaa9",
    subplace_label: "#d0d9d5",
    subplace_label_halo: "#17211f",
    city_label: "#edf2ef",
    city_label_halo: "#17211f",
    pois: undefined,
  };

  const baseLayers = layers(sourceId, flavor, { lang:"en" }).filter(layer => !["roads_shields","roads_oneway"].includes(layer.id)).map<LayerSpecification>((layer) => {
    if (layer.id !== "buildings") return layer;

    return {
      id: "sf-buildings-3d",
      type: "fill-extrusion",
      source: sourceId,
      "source-layer": "buildings",
      minzoom: 11,
      filter: ["in", ["get", "kind"], ["literal", ["building", "building_part"]]],
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "height"], 9],
          0,
          "#202a25",
          18,
          "#34413a",
          45,
          "#536159",
          110,
          "#7d897f",
          220,
          "#a7b1a7",
        ],
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          11,
          0,
          12.7,
          ["coalesce", ["get", "height"], 9],
        ],
        "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.88,
        "fill-extrusion-vertical-gradient": true,
      },
    };
  });

  return {
    version: 8,
    name: "Local Lore — San Francisco",
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    light: {
      anchor: "map",
      color: "#e5eee6",
      intensity: 0.48,
      position: [1.25, 205, 38],
    },
    sources: {
      [sourceId]: {
        type: "vector",
        url: `pmtiles://${archiveUrl}`,
        attribution: "© OpenStreetMap contributors · Protomaps",
      },
      "activity-zones": {
        type: "geojson",
        data: activityZones,
      },
      "mission-points": {
        type: "geojson",
        data: missionPoints,
        cluster: true,
        clusterRadius: 34,
        clusterMaxZoom: 13,
      },
    },
    layers: [
      ...baseLayers,
      {
        id: "zone-overview-glow",
        type: "fill",
        source: "activity-zones",
        maxzoom: 12.35,
        filter: ["==", ["get", "hotspot"], true],
        paint: {
          "fill-color": ["get", "accent"],
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10.2, 0.1, 12.3, 0.18],
        },
      },
      {
        id: "zone-overview-edge",
        type: "line",
        source: "activity-zones",
        maxzoom: 12.35,
        filter: ["==", ["get", "hotspot"], true],
        paint: {
          "line-color": ["get", "accent"],
          "line-width": 1.2,
          "line-opacity": 0.58,
        },
      },
      {
        id: "zone-glow",
        type: "line",
        source: "activity-zones",
        minzoom: 12.2,
        paint: {
          "line-color": ["get", "accent"],
          "line-width": 10,
          "line-opacity": 0.16,
          "line-blur": 8,
        },
      },
      {
        id: "zone-fill",
        type: "fill",
        source: "activity-zones",
        minzoom: 12.2,
        paint: {
          "fill-color": ["get", "accent"],
          "fill-opacity": 0.13,
        },
      },
      {
        id: "zone-volume",
        type: "fill-extrusion",
        source: "activity-zones",
        minzoom: 12.2,
        paint: {
          "fill-extrusion-color": ["get", "accent"],
          "fill-extrusion-base": 1,
          "fill-extrusion-height": 4,
          "fill-extrusion-opacity": 0.12,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      {
        id: "zone-edge",
        type: "line",
        source: "activity-zones",
        minzoom: 12.2,
        paint: {
          "line-color": ["get", "accent"],
          "line-width": 1.2,
          "line-opacity": 0.72,
        },
      },
      {
        id: "zone-hover",
        type: "fill-extrusion",
        source: "activity-zones",
        minzoom: 12.2,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "fill-extrusion-color": ["get", "accent"],
          "fill-extrusion-base": 1,
          "fill-extrusion-height": 11,
          "fill-extrusion-opacity": 0.48,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      {
        id: "zone-selected",
        type: "fill-extrusion",
        source: "activity-zones",
        minzoom: 12.2,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "fill-extrusion-color": ["get", "accent"],
          "fill-extrusion-base": 1,
          "fill-extrusion-height": 9,
          "fill-extrusion-opacity": 0.42,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      {
        id: "zone-selected-edge",
        type: "line",
        source: "activity-zones",
        minzoom: 12.2,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "line-color": ["get", "accent"],
          "line-width": 3.2,
          "line-opacity": 1,
        },
      },
      {
        id: "mission-clusters",
        type: "circle",
        source: "mission-points",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#8edcc4",
          "circle-radius": ["step", ["get", "point_count"], 15, 8, 19, 18, 23],
          "circle-stroke-color": "#20312d",
          "circle-stroke-width": 3,
          "circle-opacity": 0.92,
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
        },
      },
      {
        id: "mission-cluster-count",
        type: "symbol",
        source: "mission-points",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Medium"],
          "text-size": 10,
          "text-allow-overlap": true,
          "text-pitch-alignment": "viewport",
        },
        paint: { "text-color": "#14201d" },
      },
      {
        id: "mission-pulse",
        type: "circle",
        source: "mission-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-radius": 13,
          "circle-stroke-color": ["get", "accent"],
          "circle-stroke-width": 1.4,
          "circle-stroke-opacity": 0.34,
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
        },
      },
      {
        id: "mission-glow",
        type: "circle",
        source: "mission-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "accent"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10.2, 11, 13, 16, 16, 21],
          "circle-opacity": 0.2,
          "circle-blur": 0.55,
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
        },
      },
      {
        id: "mission-dot",
        type: "circle",
        source: "mission-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "accent"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10.2, 6.5, 13, 9.5, 16, 12],
          "circle-stroke-color": "#101713",
          "circle-stroke-width": 2,
          "circle-opacity": 0.94,
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
        },
      },
      {
        id: "mission-symbol",
        type: "symbol",
        source: "mission-points",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["concat", "mission-", ["get", "iconKey"]],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 10.2, 0.42, 13, 0.58, 16, 0.72],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-anchor": "center",
          "icon-pitch-alignment": "viewport",
          "icon-rotation-alignment": "viewport",
        },
      },
      {
        id: "mission-selected",
        type: "circle",
        source: "mission-points",
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10.2, 11, 13, 16, 16, 20],
          "circle-stroke-color": ["get", "accent"],
          "circle-stroke-width": 3,
          "circle-opacity": 1,
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
        },
      },
      {
        id: "mission-hit",
        type: "circle",
        source: "mission-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": 22,
          "circle-opacity": 0.01,
        },
      },
    ],
  };
}
