"use client";

import CalendarDays from "lucide-react/dist/esm/icons/calendar-days.mjs";
import CarFront from "lucide-react/dist/esm/icons/car-front.mjs";
import Compass from "lucide-react/dist/esm/icons/compass.mjs";
import Hammer from "lucide-react/dist/esm/icons/hammer.mjs";
import Layers3 from "lucide-react/dist/esm/icons/layers-3.mjs";
import LocateFixed from "lucide-react/dist/esm/icons/locate-fixed.mjs";
import Menu from "lucide-react/dist/esm/icons/menu.mjs";
import Moon from "lucide-react/dist/esm/icons/moon.mjs";
import Music2 from "lucide-react/dist/esm/icons/music-2.mjs";
import Search from "lucide-react/dist/esm/icons/search.mjs";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal.mjs";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.mjs";
import Sunset from "lucide-react/dist/esm/icons/sunset.mjs";
import Utensils from "lucide-react/dist/esm/icons/utensils.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { LocationControl } from "@/components/map/location-control";
import { MissionMap } from "@/components/map/mission-map";
import { missionFormat } from "@/components/missions/mission-media";
import { MissionDetail } from "@/components/missions/mission-detail";
import { dateChoices, dateKey, discoveryDates, isAvailableOn, isExpired } from "@/lib/availability";
import { BAY_AREA_HOME } from "@/lib/region";
import type { LoreItem } from "@/lib/types";
type Interest = "Food ritual" | "Live music" | "Sunset" | "After dark" | "Make something" | "Odd & local" | "Scenic drive";
const interests = [
  { value: "Food ritual", label: "Food", icon: Utensils },
  { value: "Live music", label: "Music", icon: Music2 },
  { value: "Scenic drive", label: "Drives", icon: CarFront },
  { value: "Sunset", label: "Sunsets", icon: Sunset },
  { value: "After dark", label: "After dark", icon: Moon },
  { value: "Make something", label: "Make", icon: Hammer },
  { value: "Odd & local", label: "Unusual", icon: Sparkles },
] satisfies { value: Interest; label: string; icon: typeof Utensils }[];

function interestMatch(item: LoreItem, interest: Interest | null) {
  if (!interest) return true;
  if (interest === "Food ritual") return item.category === "Eat";
  if (interest === "Live music") return item.category === "Listen" || item.format === "Live";
  if (interest === "Sunset") return item.timeSlot === "Tonight" && (item.vibe.includes("outdoors") || item.traits?.includes("scenic"));
  if (interest === "After dark") return item.category === "After dark";
  if (interest === "Make something") return item.category === "Make";
  if (interest === "Odd & local") return item.traits?.includes("weird") ?? false;
  return item.traits?.includes("drive") ?? false;
}

function matches(item: LoreItem, budget: number | null, duration: number | null, interest: Interest | null, dates: Date[], referenceDate: Date) {
  if (isExpired(item, referenceDate)) return false;
  if (budget !== null && (item.price === null || item.price > budget)) return false;
  if (duration !== null && (item.duration === null || item.duration > duration)) return false;
  if (!interestMatch(item, interest)) return false;
  if (dates.length && !dates.some(date => isAvailableOn(item, date))) return false;
  return true;
}

export function LocalLoreApp({ initialMissions: catalog }: { initialMissions: LoreItem[] }) {
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [durationMax, setDurationMax] = useState<number | null>(null);
  const [interest, setInterest] = useState<Interest | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [mapViewOpen, setMapViewOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const calendar = useMemo(() => dateChoices(referenceDate), [referenceDate]);
  const [selectedDateKey, setSelectedDateKey] = useState("all");
  const [query, setQuery] = useState("");
  const searchIndex = useMemo(() => new Map(catalog.map(item => [item.id, [item.title, item.kicker, item.description, item.why, item.city, item.neighborhood, item.venue, item.category, missionFormat(item), ...item.vibe, ...(item.traits ?? [])].join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")])), [catalog]);
  const searchWords = useMemo(() => query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(word => word.length > 2 && !["and", "little", "with", "something"].includes(word)), [query]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId === null ? null : catalog.find(item => item.id === selectedId) ?? null;
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const searchNode = useRef<HTMLInputElement>(null);
  const discoveryToggle = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const discoveryWasOpen = useRef(false);

  useEffect(() => {
    if (discoveryOpen) searchNode.current?.focus();
    else if (discoveryWasOpen.current) discoveryToggle.current?.focus();
    discoveryWasOpen.current = discoveryOpen;
  }, [discoveryOpen]);
  const selectedDates = useMemo(() => discoveryDates(selectedDateKey, referenceDate), [selectedDateKey, referenceDate]);
  const visible = useMemo(() => catalog.filter(item => matches(item, budgetMax, durationMax, interest, selectedDates, referenceDate) && searchWords.every(word => searchIndex.get(item.id)?.includes(word))), [catalog, searchIndex, searchWords, budgetMax, durationMax, interest, selectedDates, referenceDate]);
  const constrained = Boolean(query || interest || budgetMax !== null || durationMax !== null || selectedDateKey !== "all");
  const refinementCount = Number(budgetMax !== null) + Number(durationMax !== null);
  const refinementLabel = [budgetMax === null ? null : budgetMax === 0 ? "Free" : `Up to $${budgetMax}`, durationMax === null ? null : `Up to ${durationMax} h`].filter(Boolean).join(" · ");
  const dateOptions = [{ value: "all", label: "Any day" }, { value: dateKey(calendar[0]), label: "Today" }, { value: dateKey(calendar[1]), label: "Tomorrow" }, { value: "weekend", label: "Weekend" }];
  const customDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDateKey) && !dateOptions.some(option => option.value === selectedDateKey);

  useEffect(() => {
    const storageKey = "local-lore-visitor-recorded";
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "1");
    void fetch("/api/visitor", { method: "POST", credentials: "same-origin", keepalive: true }).catch(() => window.sessionStorage.removeItem(storageKey));
  }, []);

  useEffect(() => {
    const updateReferenceDate = () => setReferenceDate(new Date());
    const interval = window.setInterval(updateReferenceDate, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedId || visible.some(item => item.id === selectedId)) return;
    const visibleIds = new Set(visible.map(item => item.id));
    queueMicrotask(() => setSelectedId(current => current && !visibleIds.has(current) ? null : current));
  }, [selectedId, visible]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const editing = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "/" && !editing) {
        event.preventDefault();
        if (discoveryOpen) searchNode.current?.focus();
        else setDiscoveryOpen(true);
      }
      if (event.key === "Escape") {
        if (discoveryOpen) {
          setDiscoveryOpen(false);
          setRefineOpen(false);
          setSelectedId(null);
          setMapViewOpen(false);
        } else {
          setRefineOpen(false);
          setSelectedId(null);
          setMapViewOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [discoveryOpen]);

  const choose = (item: LoreItem) => {
    const current = catalog.find(candidate => candidate.id === item.id);
    if (!current) return;
    setSelectedId(current.id);
    setRefineOpen(false);
    mapRef.current?.easeTo({ center: current.coordinates, zoom: Math.max(15.5, mapRef.current.getZoom()), pitch: 56, duration: 850, essential: false });
  };
  const clearFilters = () => {
    setBudgetMax(null); setDurationMax(null); setInterest(null); setQuery(""); setSelectedDateKey("all");
  };

  return <main className="lore-app">
    <section className="lore-map" aria-label="Interactive mission map of the San Francisco Bay Area">
      <MissionMap catalog={catalog} visible={visible} selected={selected} mapRef={mapRef} onChoose={choose} />
      <div className="map-vignette" />
      <button ref={discoveryToggle} className="discovery-menu-toggle" hidden={discoveryOpen} type="button" aria-label="Open discovery panel" aria-expanded={discoveryOpen} aria-controls="discovery-rail" onClick={() => setDiscoveryOpen(true)}><Menu aria-hidden="true" /></button>
      <section className={`discovery-rail${discoveryOpen ? " open" : ""}`} id="discovery-rail" aria-label="Discover things to do" aria-hidden={!discoveryOpen} inert={!discoveryOpen}>
        <div className="discovery-heading"><div className="discovery-brand"><Compass aria-hidden="true" /><h1>Local Lore</h1></div><LocationControl mapRef={mapRef} /><button className="discovery-close" type="button" aria-label="Close discovery panel" onClick={() => setDiscoveryOpen(false)}><X aria-hidden="true" /></button></div>
        <div className="discovery-search-row"><label className="discovery-search"><Search aria-hidden="true" /><input ref={searchNode} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search places, music, food…" aria-label="Search things to do" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X /></button>}</label><button className={`filter-toggle${refineOpen ? " active" : ""}`} aria-label="Filter ideas" title="Budget and activity time" aria-expanded={refineOpen} aria-controls="discovery-body" onClick={() => setRefineOpen(open => !open)}><SlidersHorizontal />{refinementCount > 0 && <b>{refinementCount}</b>}</button></div>
        <div className="discovery-body" id="discovery-body">
          {refineOpen ? <section className="idea-refinement" aria-label="Budget and activity time">
            <div className="refine-dial"><label htmlFor="budget-limit">Budget <strong>{budgetMax === null ? "Any budget" : budgetMax === 0 ? "Free" : `Up to $${budgetMax}`}</strong></label><input id="budget-limit" type="range" min="0" max="100" step="5" value={budgetMax ?? 100} onChange={event => setBudgetMax(Number(event.target.value) >= 100 ? null : Number(event.target.value))} aria-label="Maximum activity budget" /></div>
            <div className="refine-dial"><label htmlFor="duration-limit">Time for an activity <strong>{durationMax === null ? "Any length" : `Up to ${durationMax} h`}</strong></label><input id="duration-limit" type="range" min=".5" max="8" step=".5" value={durationMax ?? 8} onChange={event => setDurationMax(Number(event.target.value) >= 8 ? null : Number(event.target.value))} aria-label="Maximum activity duration in hours" /><p>Approximate time. Travel is not included.</p></div>
          </section> : <div className="discovery-interests" aria-label="Activity interests">
            <button className={!interest ? "active" : ""} aria-pressed={!interest} onClick={() => setInterest(null)}><Compass aria-hidden="true" />Anything</button>
            {interests.map(({ value, label, icon: Icon }) => <button key={value} className={interest === value ? "active" : ""} aria-pressed={interest === value} onClick={() => setInterest(current => current === value ? null : value)}><Icon aria-hidden="true" />{label}</button>)}
          </div>}
        </div>
        {refinementLabel && !refineOpen && <p className="refinement-summary">{refinementLabel}</p>}
        {!visible.length && <p className="discovery-empty" role="status">No matches. Try another interest or date, or reset.</p>}
        <div className="discovery-context"><span>Curated ideas · check dates at source</span>{constrained && <button onClick={clearFilters}>Reset all</button>}</div>
        <div className="discovery-dates" aria-label="When to go">
          {dateOptions.map(option => <button key={option.value} className={selectedDateKey === option.value ? "active" : ""} aria-pressed={selectedDateKey === option.value} onClick={() => setSelectedDateKey(option.value)}>{option.label}</button>)}
          <label className={`discovery-date-picker${customDate ? " active" : ""}`}><CalendarDays aria-hidden="true" /><span>Pick a date</span><input type="date" aria-label="Choose a date" value={/^\d{4}-\d{2}-\d{2}$/.test(selectedDateKey) ? selectedDateKey : ""} onChange={event => setSelectedDateKey(event.target.value || "all")} /></label>
        </div>
      </section>
      <div className="map-tools" aria-label="Map controls">
        <button onClick={() => mapRef.current?.zoomIn({ duration: 250, essential: false })} aria-label="Zoom in">+</button>
        <button onClick={() => mapRef.current?.zoomOut({ duration: 250, essential: false })} aria-label="Zoom out">−</button>
        <button onClick={() => setMapViewOpen(open => !open)} aria-label="Map view options" aria-expanded={mapViewOpen}><Compass /></button>
        {mapViewOpen && <div className="map-view-options" aria-label="Map view options">
          <button onClick={() => { const map = mapRef.current; if (map) map.easeTo({ bearing: map.getBearing() + 35, pitch: Math.max(48, map.getPitch()), duration: 650, essential: false }); }}><Compass />Rotate</button>
          <button onClick={() => { const map = mapRef.current; if (map) map.easeTo({ pitch: map.getPitch() < 20 ? 46 : map.getPitch() < 61 ? 70 : 0, duration: 600, essential: false }); }}><Layers3 />Tilt / top-down</button>
          <button onClick={() => mapRef.current?.easeTo({ ...BAY_AREA_HOME, duration: 850, essential: false })}><LocateFixed />Whole region</button>
        </div>}
      </div>
      <MissionDetail item={selected} onClose={() => setSelectedId(null)} />
    </section>
  </main>;
}
