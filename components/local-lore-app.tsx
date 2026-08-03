"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right.mjs";
import Bot from "lucide-react/dist/esm/icons/bot.mjs";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.mjs";
import Clock3 from "lucide-react/dist/esm/icons/clock-3.mjs";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days.mjs";
import CarFront from "lucide-react/dist/esm/icons/car-front.mjs";
import Compass from "lucide-react/dist/esm/icons/compass.mjs";
import Hammer from "lucide-react/dist/esm/icons/hammer.mjs";
import Layers3 from "lucide-react/dist/esm/icons/layers-3.mjs";
import LocateFixed from "lucide-react/dist/esm/icons/locate-fixed.mjs";
import Map from "lucide-react/dist/esm/icons/map.mjs";
import Moon from "lucide-react/dist/esm/icons/moon.mjs";
import Music2 from "lucide-react/dist/esm/icons/music-2.mjs";
import PawPrint from "lucide-react/dist/esm/icons/paw-print.mjs";
import Search from "lucide-react/dist/esm/icons/search.mjs";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal.mjs";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.mjs";
import Sunset from "lucide-react/dist/esm/icons/sunset.mjs";
import Utensils from "lucide-react/dist/esm/icons/utensils.mjs";
import Users from "lucide-react/dist/esm/icons/users.mjs";
import Wallet from "lucide-react/dist/esm/icons/wallet.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import Image from "next/image";
import { Protocol } from "pmtiles";
import { useEffect, useMemo, useRef, useState } from "react";
import { activityZoneCollection, categoryGlyph, categoryKey, featuredLore, missionPointCollection } from "@/lib/activity-zones";
import { dateChoices, dateKey, dateLabel, isAvailableOn } from "@/lib/availability";
import { createMapStyle, SF_BOUNDS, SF_HOME } from "@/lib/map-style";
import { categories, type Category, type LoreItem, type MissionFormat, type MissionTrait } from "@/lib/types";

type QuickFilter = "Today" | "Free" | "Outside" | "Social";
type TimeFilter = "Any time" | "Now" | "Tonight" | "Weekend";
type BudgetFilter = "Any budget" | "Free" | "Under $20";
type CuriosityFilter = "Food ritual" | "Live music" | "Sunset" | "After dark" | "Make something" | "Odd & local" | "Scenic drive";
const quickFilters: QuickFilter[] = ["Today", "Free", "Outside", "Social"];
const timeFilters: TimeFilter[] = ["Any time", "Now", "Tonight", "Weekend"];
const budgetFilters: BudgetFilter[] = ["Any budget", "Free", "Under $20"];
const curiosityFilters = [
  { label:"Food ritual", icon:Utensils },
  { label:"Live music", icon:Music2 },
  { label:"Sunset", icon:Sunset },
  { label:"After dark", icon:Moon },
  { label:"Make something", icon:Hammer },
  { label:"Odd & local", icon:Sparkles },
  { label:"Scenic drive", icon:CarFront },
] satisfies { label:CuriosityFilter; icon:typeof Utensils }[];
const traitFilters: { label:string; value:MissionTrait }[] = [
  {label:"Bring the dog",value:"dog-friendly"},{label:"Photogenic",value:"photogenic"},{label:"Date idea",value:"date-idea"},
  {label:"Cozy",value:"cozy"},{label:"A little weird",value:"weird"},{label:"Worth a drive",value:"drive"},
];

const fallbackFormat: Record<Category,MissionFormat> = {
  Outside:"Adventure", Move:"Meetup", Make:"Class", Listen:"Live", Eat:"Food", Learn:"Culture", Community:"Volunteer", "After dark":"Live",
};

function formatOf(item:LoreItem) { return item.format ?? fallbackFormat[item.category]; }
function sourceHost(url:string) {
  try { return new URL(url).hostname.replace(/^www\./,""); } catch { return "source link"; }
}

function curiosityMatch(item:LoreItem, curiosity:CuriosityFilter|null) {
  if (!curiosity) return true;
  if (curiosity === "Food ritual") return item.category === "Eat";
  if (curiosity === "Live music") return item.category === "Listen" || item.format === "Live";
  if (curiosity === "Sunset") return item.timeSlot === "Tonight" && (item.vibe.includes("outdoors") || item.traits?.includes("scenic"));
  if (curiosity === "After dark") return item.category === "After dark";
  if (curiosity === "Make something") return item.category === "Make";
  if (curiosity === "Odd & local") return item.traits?.includes("weird") ?? false;
  return item.traits?.includes("drive") ?? false;
}

function matches(item:LoreItem, quick:QuickFilter[], query:string, category:Category|"All", time:TimeFilter, budget:BudgetFilter, curiosity:CuriosityFilter|null, traits:MissionTrait[], date:Date|null) {
  if (quick.includes("Today") && item.timeSlot === "Weekend") return false;
  if (quick.includes("Free") && item.price !== 0) return false;
  if (quick.includes("Outside") && !item.vibe.includes("outdoors")) return false;
  if (quick.includes("Social") && !item.vibe.includes("social")) return false;
  if (category !== "All" && item.category !== category) return false;
  if (time !== "Any time" && item.timeSlot !== time) return false;
  if (budget === "Free" && item.price !== 0) return false;
  if (budget === "Under $20" && item.price > 20) return false;
  if (!curiosityMatch(item,curiosity)) return false;
  if (traits.length && !traits.every(trait => item.traits?.includes(trait))) return false;
  if (date && !isAvailableOn(item,date)) return false;
  const haystack = [item.title,item.kicker,item.description,item.why,item.neighborhood,item.venue,item.category,formatOf(item),...item.vibe,...(item.traits ?? [])].join(" ").toLowerCase();
  const needles = query.trim().toLowerCase().split(/\s+/).filter(word => word.length > 2 && !["and","little","with","something"].includes(word));
  if (needles.length && !needles.every(needle => haystack.includes(needle))) return false;
  return true;
}

function makeMissionIcon(glyph:string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0,0,64,64);
  context.fillStyle = "#0c120f";
  context.font = "800 34px 'Avenir Next', 'Segoe UI Symbol', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph,32,33);
  return context.getImageData(0,0,64,64);
}

export function LocalLoreApp({initialMissions}:{initialMissions?:LoreItem[]}) {
  const catalog = initialMissions?.length ? initialMissions : featuredLore;
  const [activeQuick, setActiveQuick] = useState<QuickFilter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category|"All">("All");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Any time");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("Any budget");
  const [curiosityFilter, setCuriosityFilter] = useState<CuriosityFilter|null>(null);
  const [activeTraits, setActiveTraits] = useState<MissionTrait[]>([]);
  const [calendar] = useState(() => dateChoices());
  const [selectedDateKey, setSelectedDateKey] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LoreItem | null>(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const searchNode = useRef<HTMLInputElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const hoveredMissionRef = useRef<string | null>(null);

  const selectedDate = selectedDateKey === "all" ? null : calendar.find(date => dateKey(date) === selectedDateKey) ?? calendar[0];
  const visible = useMemo(() => catalog.filter(item => matches(item,activeQuick,query,selectedCategory,timeFilter,budgetFilter,curiosityFilter,activeTraits,selectedDate)), [catalog,activeQuick,query,selectedCategory,timeFilter,budgetFilter,curiosityFilter,activeTraits,selectedDate]);
  const filterCount = activeQuick.length + activeTraits.length + (curiosityFilter ? 1 : 0) + (selectedCategory === "All" ? 0 : 1) + (timeFilter === "Any time" ? 0 : 1) + (budgetFilter === "Any budget" ? 0 : 1) + (query ? 1 : 0);

  const choose = (item:LoreItem, zoom = 14.6) => {
    setSelected(item);
    if (window.innerWidth < 720) setDiscoverOpen(false);
    mapRef.current?.easeTo({ center:item.coordinates, zoom, pitch:56, bearing:mapRef.current.getBearing(), duration:850, essential:true });
  };

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    const archiveUrl = new URL("/maps/san-francisco.pmtiles?v=20260722-padded-2", window.location.href).href;
    const allIds = catalog.map(item => item.id);
    const map = new maplibregl.Map({
      container:mapNode.current,
      style:createMapStyle(archiveUrl,activityZoneCollection(catalog,allIds),missionPointCollection(catalog,allIds)),
      ...SF_HOME,
      maxBounds:SF_BOUNDS,
      minZoom:10.25,
      maxZoom:17.4,
      maxPitch:72,
      dragPan:true,
      dragRotate:true,
      pitchWithRotate:true,
      touchZoomRotate:true,
      touchPitch:true,
      scrollZoom:true,
      boxZoom:true,
      keyboard:true,
      cooperativeGestures:false,
      renderWorldCopies:false,
      attributionControl:false,
      canvasContextAttributes:{ antialias:true },
    });

    map.on("styleimagemissing",event => {
      const category = categories.find(value => `mission-${categoryKey(value)}`===event.id);
      if (!category || map.hasImage(event.id)) return;
      const image = makeMissionIcon(categoryGlyph[category]);
      if (image) map.addImage(event.id,image,{pixelRatio:2});
    });

    map.dragPan.enable();
    map.dragRotate.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map.addControl(new maplibregl.AttributionControl({ compact:true }),"bottom-right");

    const reportMapHealth = () => {
      if (!mapNode.current) return;
      const source = map.getSource("san-francisco") as (ReturnType<MapLibreMap["getSource"]> & { loaded?:()=>boolean }) | undefined;
      const sourceLoaded = source?.loaded?.() ?? false;
      mapNode.current.dataset.mapHealth = JSON.stringify({ ready:map.isStyleLoaded()&&sourceLoaded, styleLoaded:map.isStyleLoaded(), sourceLoaded, buildings:map.getLayer("sf-buildings-3d") ? map.queryRenderedFeatures({layers:["sf-buildings-3d"]}).length : 0, clusters:map.getLayer("mission-clusters") ? map.queryRenderedFeatures({layers:["mission-clusters"]}).length : 0, zones:map.getLayer("zone-fill") ? map.queryRenderedFeatures({layers:["zone-fill"]}).length : 0, neighborhoodLabels:map.getLayer("places_subplace") ? map.queryRenderedFeatures({layers:["places_subplace"]}).length : 0, zoom:Number(map.getZoom().toFixed(2)), pitch:Number(map.getPitch().toFixed(1)), bearing:Number(map.getBearing().toFixed(1)), center:[Number(map.getCenter().lng.toFixed(4)),Number(map.getCenter().lat.toFixed(4))] });
    };
    let lastHealthReport = 0;
    map.on("render",() => {
      const now = performance.now();
      if (now-lastHealthReport>1200) { lastHealthReport=now; reportMapHealth(); }
    });
    map.on("error",event => {
      if (mapNode.current) mapNode.current.dataset.mapError = event.error?.message ?? "Unknown map error";
      console.error("Local Lore map error:",event.error?.message ?? event);
    });
    map.on("load",() => {
      for (const category of categories) {
        const image = makeMissionIcon(categoryGlyph[category]);
        const name = `mission-${categoryKey(category)}`;
        if (image && !map.hasImage(name)) map.addImage(name,image,{ pixelRatio:2 });
      }
    });

    let animationFrame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animateCenters = (time:number) => {
      if (!map.getLayer("mission-pulse")) { animationFrame = requestAnimationFrame(animateCenters); return; }
      const wave = (Math.sin(time / 820) + 1) / 2;
      map.setPaintProperty("mission-pulse","circle-radius",12 + wave * 6);
      map.setPaintProperty("mission-pulse","circle-stroke-opacity",0.38 - wave * 0.26);
      animationFrame = requestAnimationFrame(animateCenters);
    };
    if (!reducedMotion) animationFrame = requestAnimationFrame(animateCenters);

    const itemFromEvent = (event:MapMouseEvent & { features?:maplibregl.MapGeoJSONFeature[] }) => {
      const id = event.features?.[0]?.properties?.id as string|undefined;
      return catalog.find(candidate => candidate.id === id);
    };
    const showMission = (event:MapMouseEvent & { features?:maplibregl.MapGeoJSONFeature[] }) => {
      const item = itemFromEvent(event);
      if (!item || hoveredMissionRef.current === item.id) return;
      if (map.getLayer("zone-hover")) map.setFilter("zone-hover",["==",["get","id"],item.id]);
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = new maplibregl.Popup({ closeButton:false, closeOnClick:false, offset:18, className:"mission-map-popup" })
        .setLngLat(item.coordinates)
        .setHTML(`${item.image?`<div class="popup-art has-photo"><img src="${item.image.url}" alt=""></div>`:`<div class="popup-art" style="--popup-accent:${item.accent}"><b>${categoryGlyph[item.category]}</b><strong>${item.venue}</strong><i>${item.neighborhood}</i></div>`}<div class="popup-copy"><span>${formatOf(item)} · ${item.neighborhood}</span><strong>${item.title}</strong><small>${item.time} · ${item.price ? `$${item.price}` : "Free"}</small></div>`)
        .addTo(map);
      hoveredMissionRef.current = item.id;
    };
    const hideMission = () => {
      map.getCanvas().style.cursor = "";
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      hoveredMissionRef.current = null;
      if (map.getLayer("zone-hover")) map.setFilter("zone-hover",["==",["get","id"],"__none__"]);
    };
    for (const layer of ["zone-fill","zone-overview-glow","mission-hit"]) {
      map.on("mouseenter",layer,() => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mousemove",layer,showMission);
      map.on("mouseleave",layer,hideMission);
      map.on("click",layer,event => { const item = itemFromEvent(event); if (item) choose(item); });
    }
    map.on("mouseenter","mission-clusters",() => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave","mission-clusters",() => { map.getCanvas().style.cursor = ""; });
    map.on("click","mission-clusters",async event => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id as number|undefined;
      if (!feature || clusterId === undefined || feature.geometry.type !== "Point") return;
      const source = map.getSource("mission-points") as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({center:feature.geometry.coordinates as [number,number],zoom:Math.min(zoom,14.2),pitch:52,duration:650,essential:true});
    });

    mapRef.current = map;
    return () => {
      cancelAnimationFrame(animationFrame);
      hoverPopupRef.current?.remove();
      map.remove();
      maplibregl.removeProtocol("pmtiles");
      mapRef.current = null;
    };
  },[]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const visibleIds = visible.map(item => item.id);
    const syncVisibleMissions = () => {
      const zones = map.getSource("activity-zones") as GeoJSONSource|undefined;
      const points = map.getSource("mission-points") as GeoJSONSource|undefined;
      if (!zones || !points) return false;
      zones.setData(activityZoneCollection(catalog,visibleIds));
      points.setData(missionPointCollection(catalog,visibleIds));
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      hoveredMissionRef.current = null;
      if (map.getLayer("zone-hover")) map.setFilter("zone-hover",["==",["get","id"],"__none__"]);
      if (mapNode.current) mapNode.current.dataset.visibleMissionCount = String(visibleIds.length);
      return true;
    };
    if (syncVisibleMissions()) return;
    map.once("styledata",syncVisibleMissions);
    return () => { map.off("styledata",syncVisibleMissions); };
  },[catalog,visible]);

  useEffect(() => {
    if (!selected || visible.some(item => item.id === selected.id)) return;
    const visibleIds = new Set(visible.map(item => item.id));
    queueMicrotask(() => setSelected(current => current && !visibleIds.has(current.id) ? null : current));
  },[selected,visible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const filter:maplibregl.FilterSpecification = ["==",["get","id"],selected?.id ?? "__none__"];
    for (const layer of ["zone-selected","zone-selected-edge","mission-selected"]) if (map.getLayer(layer)) map.setFilter(layer,filter);
  },[selected]);

  useEffect(() => {
    const onKey = (event:KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); setDiscoverOpen(true); requestAnimationFrame(() => searchNode.current?.focus()); }
      if (event.key === "Escape") { setDiscoverOpen(false); setSelected(null); }
    };
    window.addEventListener("keydown",onKey);
    return () => window.removeEventListener("keydown",onKey);
  },[]);

  const toggleQuick = (filter:QuickFilter) => {
    if (filter === "Today" && !activeQuick.includes(filter)) setSelectedDateKey(dateKey(calendar[0]));
    setActiveQuick(current => current.includes(filter) ? current.filter(value => value !== filter) : [...current,filter]);
  };
  const toggleTrait = (trait:MissionTrait) => setActiveTraits(current => current.includes(trait) ? current.filter(value => value !== trait) : [...current,trait]);
  const clearFilters = () => { setActiveQuick([]); setSelectedCategory("All"); setTimeFilter("Any time"); setBudgetFilter("Any budget"); setCuriosityFilter(null); setActiveTraits([]); setQuery(""); };
  const resetMap = () => mapRef.current?.easeTo({ ...SF_HOME, duration:850, essential:true });
  const orbitMap = () => { const map=mapRef.current; if (map) map.easeTo({ bearing:map.getBearing()+35, pitch:Math.max(48,map.getPitch()), duration:650, essential:true }); };
  const cycleTilt = () => { const map=mapRef.current; if (!map) return; const pitch=map.getPitch(); map.easeTo({ pitch:pitch<20?46:pitch<61?70:0, duration:600, essential:true }); };

  return <main className="lore-app">
    <section className="lore-map" aria-label="Interactive mission map of San Francisco and the Bay">
      <div ref={mapNode} className="map-canvas"/>
      <div className="map-vignette"/>

      <div className="intent-panel">
        <div className="map-brand">
          <span className="brand-agent-face" aria-hidden="true"><Bot/></span>
          <div><strong>Local Lore</strong><small>Curated by Claude, the Lore agent</small></div>
        </div>
        <h1>Where next?</h1>
        <div className="intent-actions">
          <button className="find-missions" onClick={() => { setDiscoverOpen(true); requestAnimationFrame(() => searchNode.current?.focus()); }}><Search/><span className="explore-label-wide">Explore all missions</span><span className="explore-label-short">Explore</span><ChevronRight/></button>
          <div className="intent-filters" aria-label="Quick activity filters">
            {quickFilters.map(filter => <button key={filter} className={activeQuick.includes(filter)?"active":""} onClick={() => toggleQuick(filter)}>{filter}</button>)}
          </div>
          <div className="curiosity-filters" aria-label="Browse curious plans">
            {curiosityFilters.map(({label,icon:Icon}) => <button key={label} className={curiosityFilter===label?"active":""} onClick={() => setCuriosityFilter(current => current===label?null:label)}><Icon/><span>{label}</span></button>)}
          </div>
          <div className="date-rail" aria-label="Plan by date">
            <CalendarDays/>
            <button className={`all-time${selectedDateKey==="all"?" active":""}`} onClick={() => setSelectedDateKey("all")}><span>All</span><b>time</b></button>
            {calendar.map((date,index) => <button key={dateKey(date)} className={selectedDateKey===dateKey(date)?"active":""} onClick={() => setSelectedDateKey(dateKey(date))}><span>{dateLabel(date,index)}</span><b>{date.getDate()}</b></button>)}
          </div>
        </div>
      </div>

      <div className="camera-actions" aria-label="Map view controls">
        <button className={`lore-agent-button${agentOpen?" active":""}`} onClick={() => setAgentOpen(open => !open)} aria-label="How Local Lore works" aria-expanded={agentOpen} data-label="About the Lore agent"><Bot/></button>
        <button onClick={orbitMap} aria-label="Rotate map 35 degrees" data-label="Rotate"><Compass/></button>
        <button onClick={cycleTilt} aria-label="Cycle map tilt" data-label="Tilt / top-down"><Layers3/></button>
        <button onClick={resetMap} aria-label="Show the whole San Francisco map" data-label="Whole city"><LocateFixed/></button>
      </div>
      <AnimatePresence>
        {agentOpen && <motion.aside className="lore-agent-popover" role="dialog" aria-label="About the Local Lore agent" initial={{opacity:0,y:-8,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.96}} transition={{duration:.18}}>
          <div className="lore-agent-mark"><Bot/><span>LORE AGENT</span></div>
          <strong>A living field guide, not a feed.</strong>
          <p>Local Lore keeps a rolling directory of memorable ways into San Francisco. A local research agent checks approved sources, curates what is worth finding, and publishes catalog updates through GitHub.</p>
          <p className="lore-agent-note">Always confirm details with the original organizer.</p>
          <button onClick={() => setAgentOpen(false)} aria-label="Close Lore agent message"><X/>Got it</button>
        </motion.aside>}
      </AnimatePresence>
      <p className="agent-disclaimer">Agent-maintained directory · confirm details with the organizer</p>

      <AnimatePresence>
        {discoverOpen && <MissionBrowser
          items={visible} query={query} setQuery={setQuery} category={selectedCategory} setCategory={setSelectedCategory}
          time={timeFilter} setTime={setTimeFilter} budget={budgetFilter} setBudget={setBudgetFilter}
          traits={activeTraits} onTrait={toggleTrait}
          activeQuick={activeQuick} onQuick={toggleQuick} curiosity={curiosityFilter} setCuriosity={setCuriosityFilter}
          calendar={calendar} selectedDateKey={selectedDateKey} setSelectedDateKey={setSelectedDateKey}
          filterCount={filterCount} onClear={clearFilters} onClose={() => setDiscoverOpen(false)} onChoose={choose} searchRef={searchNode}
        />}
      </AnimatePresence>

      <ActivityCard item={selected} onClose={() => setSelected(null)}/>
      {!visible.length && <div className="no-results"><Map/><strong>No missions match that mix yet.</strong><button onClick={clearFilters}>Show every mission</button></div>}
    </section>
  </main>;
}

function MissionBrowser({items,query,setQuery,category,setCategory,time,setTime,budget,setBudget,traits,onTrait,activeQuick,onQuick,curiosity,setCuriosity,calendar,selectedDateKey,setSelectedDateKey,filterCount,onClear,onClose,onChoose,searchRef}:{
  items:LoreItem[]; query:string; setQuery:(value:string)=>void; category:Category|"All"; setCategory:(value:Category|"All")=>void;
  time:TimeFilter; setTime:(value:TimeFilter)=>void; budget:BudgetFilter; setBudget:(value:BudgetFilter)=>void;
  traits:MissionTrait[]; onTrait:(value:MissionTrait)=>void;
  activeQuick:QuickFilter[]; onQuick:(value:QuickFilter)=>void; curiosity:CuriosityFilter|null; setCuriosity:(value:CuriosityFilter|null)=>void;
  calendar:Date[]; selectedDateKey:string; setSelectedDateKey:(value:string)=>void;
  filterCount:number; onClear:()=>void; onClose:()=>void; onChoose:(item:LoreItem)=>void; searchRef:React.RefObject<HTMLInputElement|null>;
}) {
  const reduce = useReducedMotion();
  return <motion.aside className="mission-browser" initial={reduce?false:{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:24}} transition={{duration:.24}} aria-label="Browse missions">
    <div className="browser-head"><div><small>Browse the city</small><strong>What sounds good?</strong></div><button onClick={onClose} aria-label="Close mission browser"><X/></button></div>
    <label className="mission-search"><Search/><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Try “sunset”, “dogs”, or “live music”" aria-label="Describe the kind of mission you want"/><kbd>/</kbd></label>
    <div className="prompt-row" aria-label="Discovery prompts">
      {["quiet and scenic","dog-friendly","a little weird","live","photogenic"].map(prompt => <button key={prompt} className={query===prompt?"active":""} onClick={() => setQuery(query===prompt?"":prompt)}>{prompt}</button>)}
    </div>
    <div className="mobile-discovery" aria-label="Mobile discovery controls">
      <div><span>Quick pick</span><div className="mobile-filter-row">{quickFilters.map(filter => <button key={filter} className={activeQuick.includes(filter)?"active":""} onClick={() => onQuick(filter)}>{filter}</button>)}</div></div>
      <div><span>Follow a thread</span><div className="mobile-filter-row">{curiosityFilters.map(({label,icon:Icon}) => <button key={label} className={curiosity===label?"active":""} onClick={() => setCuriosity(curiosity===label?null:label)}><Icon/><b>{label}</b></button>)}</div></div>
      <div><span>Plan by date</span><div className="mobile-filter-row mobile-date-row"><button className={selectedDateKey==="all"?"active":""} onClick={() => setSelectedDateKey("all")}>All time</button>{calendar.map((date,index) => <button key={dateKey(date)} className={selectedDateKey===dateKey(date)?"active":""} onClick={() => setSelectedDateKey(dateKey(date))}>{dateLabel(date,index)} {date.getDate()}</button>)}</div></div>
    </div>
    <div className="filter-block category-block"><span>Pick a world</span><div className="category-grid">
      <button className={category==="All"?"active":""} onClick={() => setCategory("All")}><SlidersHorizontal/><em>Surprise me</em></button>
      {categories.map(value => <button key={value} className={category===value?"active":""} onClick={() => setCategory(value)}><b>{categoryGlyph[value]}</b><em>{value}</em></button>)}
    </div></div>
    <div className="filter-block"><span>Make it feel like</span><div className="trait-pills">{traitFilters.map(({label,value}) => <button key={value} className={traits.includes(value)?"active":""} onClick={() => onTrait(value)}>{value==="dog-friendly"&&<PawPrint/>}{label}</button>)}</div></div>
    <div className="filter-columns">
      <div className="filter-block"><span>When</span><div className="filter-pills">{timeFilters.map(value => <button key={value} className={time===value?"active":""} onClick={() => setTime(value)}>{value}</button>)}</div></div>
      <div className="filter-block"><span>Budget</span><div className="filter-pills">{budgetFilters.map(value => <button key={value} className={budget===value?"active":""} onClick={() => setBudget(value)}>{value}</button>)}</div></div>
    </div>
    {filterCount>0&&<div className="result-bar"><span>Your current mix</span><button onClick={onClear}>View all missions</button></div>}
    <div className="mission-results">
      {items.map(item => <button key={item.id} className="mission-tile" onClick={() => onChoose(item)} style={{"--row-accent":item.accent} as React.CSSProperties}>
        <MissionTileVisual item={item}/><span><small>{item.hotspot?"Hotspot · ":""}{item.neighborhood} · {formatOf(item)}</small><strong>{item.title}</strong><em>{item.time} · {item.price?`$${item.price}`:"Free"}</em></span>
      </button>)}
    </div>
  </motion.aside>;
}

function ActivityCard({item,onClose}:{item:LoreItem|null;onClose:()=>void}) {
  const reduce = useReducedMotion();
  return <AnimatePresence>{item&&<motion.aside className="activity-card has-visual" initial={reduce?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:14}} transition={{duration:.3}} style={{"--accent":item.accent} as React.CSSProperties}>
    <LoreVisual item={item}/>
    <button className="card-close" onClick={onClose} aria-label="Close activity"><X/></button>
    <span className="card-place">{item.hotspot?"Hotspot · ":""}{item.neighborhood} · {formatOf(item)}</span>
    <h2>{item.title}</h2>
    <p className="card-kicker">{item.kicker}</p>
    <div className="card-facts"><span><Clock3/>{item.time}</span><span><Wallet/>{item.price?`$${item.price}`:"Free"}</span><span><Users/>{item.vibe.includes("social")?"Social":"Easy solo"}</span></div>
    <p className="card-description">{item.description}</p>
    <p className="card-why">Why it is worth it · {item.why}</p>
    <a href={item.source.url} target="_blank" rel="noreferrer">Open {item.source.name} <ArrowUpRight/></a>
    <small>Curated seed · source checked {item.source.checkedAt} · confirm schedule</small>
  </motion.aside>}</AnimatePresence>;
}

function LoreVisual({item,compact=false}:{item:LoreItem;compact?:boolean}) {
  if (item.image) return <div className={compact?"lore-visual compact":"lore-visual"}><Image src={item.image.url} alt={item.image.alt} fill unoptimized sizes={compact?"48px":"400px"}/><span>{categoryGlyph[item.category]}</span></div>;
  if (compact) return <div className="lore-glyph" style={{"--visual-accent":item.accent} as React.CSSProperties}>{categoryGlyph[item.category]}</div>;
  return <div className="lore-visual place-visual" style={{"--visual-accent":item.accent} as React.CSSProperties}>
    <span className="place-glyph">{categoryGlyph[item.category]}</span><i>{formatOf(item)}</i><strong>{item.venue}</strong><small>{item.neighborhood}</small>
  </div>;
}

function MissionTileVisual({item}:{item:LoreItem}) {
  return <div className={`mission-tile-visual${item.image?" has-image":""}`} style={{"--visual-accent":item.accent} as React.CSSProperties}>
    {item.image?<Image src={item.image.url} alt="" fill unoptimized sizes="220px"/>:<div className="source-site-preview" aria-label={`Official source preview: ${item.source.name}`}>
      <div className="source-browser-bar"><i/><i/><i/><small>{sourceHost(item.source.url)}</small></div>
      <div className="source-browser-body"><b>{categoryGlyph[item.category]}</b><div><span>{item.source.name}</span><small>Official source · open to plan</small></div><em>{item.venue}</em></div>
    </div>}
  </div>;
}
