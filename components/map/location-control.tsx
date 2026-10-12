"use client";

import LocateFixed from "lucide-react/dist/esm/icons/locate-fixed.mjs";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { BAY_AREA_BOUNDS } from "@/lib/region";

const LOCAL_HOSTNAMES: Record<string, true> = { localhost: true, "127.0.0.1": true, "::1": true, "[::1]": true };
const LOCATION_ZOOM = 12.5;

type LocationState = "idle" | "requesting" | "centered" | "unchanged" | "denied" | "unavailable" | "outside";

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES[hostname] === true || hostname.endsWith(".localhost");
}

function isInsideBayArea(longitude: number, latitude: number): boolean {
  const [[west, south], [east, north]] = BAY_AREA_BOUNDS;
  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}

const statusLabels: Partial<Record<LocationState, string>> = {
  requesting: "Requesting your location…",
  centered: "Showing your area.",
  unchanged: "Location found; map view unchanged.",
  denied: "Location denied. Enable it in browser settings.",
  unavailable: "Your location is unavailable right now.",
  outside: "Your location is outside the covered Bay Area.",
};

export function LocationControl({ mapRef }: { mapRef: RefObject<MapLibreMap | null> }) {
  const [state, setState] = useState<LocationState>("idle");
  const [deployed, setDeployed] = useState(false);
  const mountedRef = useRef(true);
  const attemptedRef = useRef(false);
  const requestRef = useRef(0);
  const activeRef = useRef(false);
  const pendingMapRef = useRef<{ map: MapLibreMap; handler: () => void } | null>(null);
  const localHost = typeof window !== "undefined" && isLocalHostname(window.location.hostname);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || isLocalHostname(window.location.hostname) || activeRef.current || !mountedRef.current) return;
    const token = ++requestRef.current;
    activeRef.current = true;
    setState("requesting");

    const finish = (next: LocationState) => {
      if (!mountedRef.current || token !== requestRef.current) return;
      activeRef.current = false;
      pendingMapRef.current = null;
      setState(next);
    };
    if (!window.isSecureContext || !navigator.geolocation) {
      finish("unavailable");
      return;
    }

    const initialMap = mapRef.current;
    const initialCenter = initialMap?.getCenter();
    const initialZoom = initialMap?.getZoom();
    const cameraChanged = (map: MapLibreMap) => {
      if (!initialCenter || initialZoom === undefined) return false;
      const center = map.getCenter();
      return Math.abs(center.lng - initialCenter.lng) > 0.0001 || Math.abs(center.lat - initialCenter.lat) > 0.0001 || Math.abs(map.getZoom() - initialZoom) > 0.01;
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        if (!mountedRef.current || token !== requestRef.current) return;
        const { longitude, latitude } = position.coords;
        if (!isInsideBayArea(longitude, latitude)) {
          finish("outside");
          return;
        }
        const center = () => {
          if (!mountedRef.current || token !== requestRef.current) return;
          const map = mapRef.current;
          if (!map || map.isMoving() || cameraChanged(map)) {
            finish("unchanged");
            return;
          }
          map.easeTo({ center: [longitude, latitude], zoom: LOCATION_ZOOM, duration: 650, essential: false });
          finish("centered");
        };
        const map = mapRef.current;
        if (!map) finish("unavailable");
        else if (map.isStyleLoaded()) center();
        else {
          pendingMapRef.current = { map, handler: center };
          map.once("idle", center);
        }
      },
      error => {
        if (!mountedRef.current || token !== requestRef.current) return;
        finish(error.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }, [mapRef]);

  useEffect(() => {
    mountedRef.current = true;
    if (localHost) return () => { mountedRef.current = false; };
    let canceled = false;
    queueMicrotask(() => {
      if (!canceled) setDeployed(true);
      if (canceled || attemptedRef.current) return;
      attemptedRef.current = true;
      requestLocation();
    });
    return () => {
      canceled = true;
      mountedRef.current = false;
      requestRef.current += 1;
      activeRef.current = false;
      const pending = pendingMapRef.current;
      if (pending) pending.map.off("idle", pending.handler);
      pendingMapRef.current = null;
    };
  }, [localHost, requestLocation]);

  if (!deployed) return null;
  const message = statusLabels[state];
  return (
    <div className="location-control">
      <button type="button" className="location-control__button" onClick={requestLocation} disabled={state === "requesting"} aria-label="Use my location" title="Use my location">
        <LocateFixed aria-hidden="true" />
      </button>
      {message && <span className="location-control__status" role="status">{message}</span>}
    </div>
  );
}
