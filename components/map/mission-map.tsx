"use client";

import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent, VectorTileSource } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { useEffect, useEffectEvent, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { activityScene, matchActivityOutlines, type ActivityOutline, type OutlineFeature } from "@/lib/activity-zones";
import { missionWhen } from "@/lib/mission-presentation";
import { createMapStyle } from "@/lib/map-style";
import { MAP_ARCHIVE_PATH, MAP_ARCHIVE_SHA256 } from "@/lib/map-archive";
import { BAY_AREA_BOUNDS, BAY_AREA_HOME } from "@/lib/region";
import type { LoreItem } from "@/lib/types";
import { MissionMedia } from "@/components/missions/mission-media";

const hoverLayers = ["zone-hover", "zone-hover-edge", "route-hover", "route-hover-direction", "mission-hover"];
const selectedLayers = ["zone-selected", "zone-selected-edge", "route-selected", "route-selected-direction", "mission-selected"];
const hitLayers = ["mission-hit", "mission-clusters", "route-hit", "activity-locator", "zone-fill"];
const outlineCache = new WeakMap<MapLibreMap, Map<string, ActivityOutline>>();
const visibleIdsCache = new WeakMap<MapLibreMap, string[]>();
const catalogCache = new WeakMap<MapLibreMap, LoreItem[]>();
const focusCache = new WeakMap<MapLibreMap, { hover: string | null; selected: string | null }>();

function emphasize(map: MapLibreMap, mode: "hover" | "selected", id: string | null) {
  const focus = focusCache.get(map) ?? { hover: null, selected: null };
  focus[mode] = id;
  focusCache.set(map, focus);
  for (const layer of mode === "hover" ? hoverLayers : selectedLayers) {
    const focused: maplibregl.FilterSpecification = layer.startsWith("mission-")
      ? ["in", `,${id ?? "__none__"},`, ["coalesce", ["get", "ids"], ""]]
      : ["==", ["get", "id"], id ?? "__none__"];
    const filter: maplibregl.FilterSpecification = layer.endsWith("-direction")
      ? ["all", focused, ["==", ["get", "routeType"], "connection"]]
      : focused;
    if (map.getLayer(layer)) map.setFilter(layer, filter);
  }
  if (map.getLayer("route-hit")) map.setFilter("route-hit", ["any", ["==", ["get", "id"], focus.hover ?? "__none__"], ["==", ["get", "id"], focus.selected ?? "__none__"]]);
}


export function MissionMap({ catalog, visible, selected, mapRef, onChoose }: {
  catalog: LoreItem[];
  visible: LoreItem[];
  selected: LoreItem | null;
  mapRef: RefObject<MapLibreMap | null>;
  onChoose: (item: LoreItem) => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<(() => void) | null>(null);
  const [preview, setPreview] = useState<{ item: LoreItem; group: LoreItem[]; container: HTMLElement } | null>(null);
  const choose = useEffectEvent(onChoose);
  const selectedId = useEffectEvent(() => selected?.id);
  const byId = useMemo(() => Object.fromEntries(catalog.map(item => [item.id, item])), [catalog]);
  const sceneState = useMemo(() => ({ catalog, byId, ids: visible.map(item => item.id), outlines: outlineCache }), [catalog, byId, visible]);
  const readScene = useEffectEvent(() => sceneState);
  const previousCatalogRef = useRef(catalog);

  useEffect(() => {
    const previous = previousCatalogRef.current;
    previousCatalogRef.current = catalog;
    if (previous !== catalog && mapRef.current) {
      outlineCache.set(mapRef.current, new Map());
    }
  }, [catalog, mapRef]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const initialCatalog = readScene().catalog;
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    const allIds = initialCatalog.map(item => item.id);
    const archiveUrl = new URL(`${MAP_ARCHIVE_PATH}?v=${MAP_ARCHIVE_SHA256}`, window.location.href).href;
    const scene = activityScene(initialCatalog, allIds);
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: createMapStyle(archiveUrl, scene.zones, scene.points, scene.routes),
      ...BAY_AREA_HOME,
      maxBounds: BAY_AREA_BOUNDS,
      minZoom: 7.8,
      maxZoom: 18,
      maxPitch: 72,
      dragPan: true,
      dragRotate: true,
      pitchWithRotate: true,
      touchZoomRotate: true,
      touchPitch: true,
      scrollZoom: true,
      boxZoom: true,
      keyboard: true,
      cooperativeGestures: false,
      renderWorldCopies: false,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
    });
    map.touchZoomRotate.enableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;
    visibleIdsCache.set(map, allIds);
    catalogCache.set(map, initialCatalog);
    let outlineCatalog: LoreItem[] | null = null;
    let outlineIds: string[] | null = null;
    let outlineView = "";
    const refreshOutlines = () => {
      if (!map.isStyleLoaded() || map.getZoom() < 14) return;
      const latest = readScene();
      const center = map.getCenter();
      const view = `${center.lng}:${center.lat}:${map.getZoom()}:${map.getPitch()}:${map.getBearing()}`;
      if (outlineCatalog === latest.catalog && outlineIds === latest.ids && outlineView === view) return;
      outlineCatalog = latest.catalog;
      outlineIds = latest.ids;
      outlineView = view;
      const activeIds = new Set(latest.ids);
      const current = latest.outlines.get(map) ?? new Map<string, ActivityOutline>();
      const bounds = map.getBounds();
      const unresolved = latest.catalog.filter(item => activeIds.has(item.id) && bounds.contains(item.coordinates) && !current.has(item.id) && !item.map?.boundary);
      if (!unresolved.length) return;
      const candidates = (["buildings", "landuse"] as const).flatMap(sourceLayer =>
        map.querySourceFeatures("san-francisco", { sourceLayer }).flatMap(feature => {
          if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") return [];
          const properties = { ...(feature.properties ?? {}), __layer: sourceLayer };
          return [{ type: "Feature", id: feature.id, properties, geometry: feature.geometry } as unknown as OutlineFeature];
        }),
      );
      const matches = matchActivityOutlines(unresolved, candidates);
      if (!matches.size) return;
      const next = new Map(current);
      for (const [id, geometry] of matches) next.set(id, geometry);
      latest.outlines.set(map, next);
      const scene = activityScene(latest.catalog, latest.ids, next);
      const zones = map.getSource("activity-zones") as GeoJSONSource | undefined;
      const points = map.getSource("mission-points") as GeoJSONSource | undefined;
      if (zones) zones.setData(scene.zones);
      if (points) points.setData(scene.points);
    };
    let popup: maplibregl.Popup | null = null;
    let hoveredId: string | null = null;
    let leaveTimer: number | undefined;
    let previewPointerInside = false;
    let previewFocused = false;
    const cancelLeave = () => {
      window.clearTimeout(leaveTimer);
      leaveTimer = undefined;
    };
    const dismiss = () => {
      cancelLeave();
      popup?.remove();
      popup = null;
      hoveredId = null;
      previewPointerInside = false;
      previewFocused = false;
      map.getCanvas().style.cursor = "";
      emphasize(map, "hover", null);
      setPreview(null);
    };
    dismissRef.current = dismiss;
    const scheduleLeave = () => {
      if (!leaveTimer && !previewPointerInside && !previewFocused && popup) leaveTimer = window.setTimeout(dismiss, 160);
    };
    const show = (item: LoreItem, group: LoreItem[] = []) => {
      if (item.id === selectedId() && group.length <= 1) { dismiss(); return; }
      cancelLeave();
      if (hoveredId === item.id) return;
      popup?.remove();
      previewPointerInside = false;
      previewFocused = false;
      const container = document.createElement("div");
      container.addEventListener("mouseenter", () => { previewPointerInside = true; cancelLeave(); });
      container.addEventListener("mouseleave", () => { previewPointerInside = false; scheduleLeave(); });
      container.addEventListener("focusin", () => { previewFocused = true; cancelLeave(); });
      container.addEventListener("focusout", event => {
        if (event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return;
        previewFocused = false;
        scheduleLeave();
      });
      hoveredId = item.id;
      emphasize(map, "hover", group.some(entry => entry.id === selectedId()) ? null : item.id);
      popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, focusAfterOpen: false, offset: 26, maxWidth: "320px", className: "mission-map-popup" })
        .setLngLat(item.coordinates)
        .setDOMContent(container)
        .addTo(map);
      setPreview({ item, group, container });
    };
    const featuresAt = (event: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: hitLayers.filter(layer => map.getLayer(layer)) });
      // Center targets win over overlapping footprints; clusters win over overview areas.
      return features.find(feature => feature.layer.id === "mission-hit")
        ?? features.find(feature => feature.layer.id === "mission-clusters")
        ?? features[0];
    };
    map.on("mousemove", event => {
      if (map.isMoving() || previewFocused) return;
      const feature = featuresAt(event);
      map.getCanvas().style.cursor = feature ? "pointer" : "";
      const byId = readScene().byId;
      const group = feature?.properties?.ids ? String(feature.properties.ids).split(",").map(id => byId[id]).filter((entry): entry is LoreItem => Boolean(entry)) : [];
      const item = feature?.properties?.id ? byId[String(feature.properties.id)] : undefined;
      if (item) show(item, group);
      else scheduleLeave();
    });
    map.on("mouseout", scheduleLeave);
    map.on("movestart", dismiss);
    map.on("click", async event => {
      const feature = featuresAt(event);
      if (!feature) { dismiss(); return; }
      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (feature.layer.id === "mission-clusters" && clusterId !== undefined && feature.geometry.type === "Point") {
        dismiss();
        const source = map.getSource("mission-points") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        if (mapRef.current !== map) return;
        map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: Math.min(zoom, map.getMaxZoom()), pitch: 52, duration: 650, essential: false });
      } else {
        const byId = readScene().byId;
        const item = byId[String(feature.properties?.id)];
        const group = feature.properties?.ids ? String(feature.properties.ids).split(",").map(id => byId[id]).filter((entry): entry is LoreItem => Boolean(entry)) : [];
        if (item) {
          if (group.length > 1) show(item, group);
          else { dismiss(); choose(item); }
        }
      }
    });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    map.on("load", refreshOutlines);
    const reportHealth = () => {
      if (!mapNode.current) return;
      const source = map.getSource("san-francisco") as VectorTileSource | undefined;
      const count = (layer: string) => map.getLayer(layer) ? map.queryRenderedFeatures({ layers: [layer] }).length : 0;
      mapNode.current.dataset.mapHealth = JSON.stringify({
        ready: map.isStyleLoaded() && (source?.loaded?.() ?? false),
        styleLoaded: map.isStyleLoaded(), sourceLoaded: source?.loaded?.() ?? false,
        buildings: count("sf-buildings-3d"), clusters: count("mission-clusters"), zones: count("zone-fill"), neighborhoodLabels: count("places_subplace"),
        zoom: Number(map.getZoom().toFixed(2)), pitch: Number(map.getPitch().toFixed(1)), bearing: Number(map.getBearing().toFixed(1)),
        center: [Number(map.getCenter().lng.toFixed(4)), Number(map.getCenter().lat.toFixed(4))],
      });
    };
    let lastReport = 0;
    map.on("render", () => {
      const now = performance.now();
      if (now - lastReport > 1200) { lastReport = now; reportHealth(); }
    });
    map.on("idle", reportHealth);
    map.on("idle", refreshOutlines);
    map.on("error", event => {
      if (mapNode.current) mapNode.current.dataset.mapError = event.error?.message ?? "Unknown map error";
      console.error("Local Lore map error:", event.error?.message ?? event);
    });
    return () => {
      cancelLeave();
      popup?.remove();
      window.removeEventListener("keydown", onKey);
      dismissRef.current = null;
      map.off("idle", refreshOutlines);
      map.remove();
      maplibregl.removeProtocol("pmtiles");
      mapRef.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ids = sceneState.ids;
    const sync = () => {
      const zones = map.getSource("activity-zones") as GeoJSONSource | undefined;
      const points = map.getSource("mission-points") as GeoJSONSource | undefined;
      const routes = map.getSource("activity-routes") as GeoJSONSource | undefined;
      if (!zones || !points || !routes) return false;
      const currentCatalog = readScene().catalog;
      const previous = visibleIdsCache.get(map);
      const sameIds = previous?.length === ids.length && previous.every((id, index) => id === ids[index]);
      if (sameIds && catalogCache.get(map) === currentCatalog) {
        if (mapNode.current) mapNode.current.dataset.visibleMissionCount = String(ids.length);
        return true;
      }
      if (mapNode.current) mapNode.current.dataset.visibleMissionCount = String(ids.length);
      visibleIdsCache.set(map, ids);
      catalogCache.set(map, currentCatalog);
      const scene = activityScene(currentCatalog, ids, outlineCache.get(map));
      zones.setData(scene.zones);
      routes.setData(scene.routes);
      points.setData(scene.points);
      dismissRef.current?.();
      return true;
    };
    // Source updates temporarily make isStyleLoaded false without another load event.
    if (!sync()) map.once("load", sync);
    return () => { map.off("load", sync); };
  }, [sceneState, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    dismissRef.current?.();
    const sync = () => emphasize(map, "selected", selected?.id ?? null);
    if (map.getLayer("zone-selected")) sync();
    else map.once("load", sync);
    return () => { map.off("load", sync); };
  }, [catalog, selected, mapRef]);

  return <>
    <div ref={mapNode} className="map-canvas ph-no-capture" />
    {preview && (preview.item.id !== selected?.id || preview.group.length > 1) && createPortal(<article className="mission-preview" aria-label={`Preview: ${preview.item.venue}`} style={{ "--preview-accent": preview.item.accent } as React.CSSProperties}>
      {preview.group.length > 1 ? <div className="mission-preview-copy">
        <h2>{preview.item.venue}</h2>
        <div className="mission-preview-choices" aria-label="Activities at this location">
          {preview.group.map(item => <button key={item.id} type="button" aria-pressed={item.id === selected?.id} onClick={() => { onChoose(item); dismissRef.current?.(); }} onMouseEnter={() => { if (mapRef.current) emphasize(mapRef.current, "hover", item.id === selected?.id ? null : item.id); }} onFocus={() => { if (mapRef.current) emphasize(mapRef.current, "hover", item.id === selected?.id ? null : item.id); }}>
            <strong>{item.title}</strong>
            {item.schedule?.kind === "scheduled" && <span>{missionWhen(item)}</span>}
          </button>)}
        </div>
      </div> : <>
        <MissionMedia key={preview.item.id} item={preview.item} variant="preview" />
        <div className="mission-preview-copy">
          <h2>{preview.item.schedule?.kind === "scheduled" ? preview.item.title : preview.item.venue}</h2>
          <p className="mission-preview-kicker">{preview.item.description}</p>
          <div className="mission-preview-facts"><span>{preview.item.schedule?.kind === "scheduled" ? missionWhen(preview.item) : preview.item.duration == null ? "Time varies" : `~${preview.item.duration} h`}</span><strong>{preview.item.price == null ? "Not listed" : preview.item.price === 0 ? "Free" : `$${preview.item.price}`}</strong></div>
        </div>
      </>}
    </article>, preview.container)}
  </>;
}
