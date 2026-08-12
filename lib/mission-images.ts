import type { LoreItem, MissionImage } from "./types";

/**
 * The primary local image for each mission. Keep alternates beside it using
 * `-2` / `-3` suffixes; only this unsuffixed asset is rendered by default.
 *
 * User-confirmed creator permission is recorded in the generated image
 * record. Attribution remains available in data but is not part of the UI.
 */
export const localMissionImageIds = [
  "academy-nightlife","alcatraz-layered-history","alemany-farm","alemany-market","angel-island-loop","asian-art","audium-sound","baker-beach-run","bandshell","batteries-bluffs","beat-museum","bi-rite-picnic","bike-party","black-cat","blue-heron-boat","book-arts","botanical-world-tour","bottom-hill","cable-car-museum","cafe-du-nord","calacademy-nightlife","cartoon-art","castro-film","castro-movie-palace","castro-theatre-tour","chapel-calendar","chapel-show","china-live","chinatown-tasting","city-guides-chinatown","city-guides-victorian","city-guides-waterfront","community-music","conservatory-flowers","conservatory-microclimates","crosstown-trail","dance-mission","dandelion-chocolate","dandelion-tour","dna-lounge","dogpatch-boulders","dolphin-swim","eight-wheels","embarcadero-bike","embarcadero-night-lights","exploratorium","ferry-building-pantry","ferry-market","ferry-sampler","filbert-steps","food-bank","fort-funston-dog","fort-mason-food-trucks","fort-mason-market","fort-point-roof","gamh-balcony","glen-canyon-loop","glide","glide-volunteer","golden-gate-promenade","ggp-archery","gleneagles-footgolf","herons-head","independent-show","japantown-snacks","jfk-rollers","kezar-laps","kilowatt-show","kittea","lands-end","letterform","long-now-interval","marshalls-beach","mclaren-bike","midway","minnesota-street","mission-cliffs","mission-community-market","mission-market","mount-davidson","musee-mecanique","museum-craft-design","noisebridge","north-beach-food","oakland-lake-merritt-market","oakland-swan-market","odc-drop-in","outerlands-brunch","amoeba-instore","clement-market","panorama-park","parks-volunteer","pier-seven","precita-mural-walk","presidio-bike","presidio-drive","presidio-lovers-lane","presidio-popup","presidio-stewards","presidio-stewardship","public-works","randall","randall-ceramics","randall-climb","rickshaw-small-show","rickshaw-stop","root-division","roundabout-trail","roxie-film","salesforce-park","scrap-materials","sf-ballet","sf-etsy-market","sf-library-main","sf-spca","sfjazz","sfmoma-floor","sfmoma-one-floor","sfpl-random","somarts","stern-grove","sunday-streets","surfrider-cleanup","swan-oyster-bar","tartine-morning","tea-garden-hour","treasure-island-museum","treasure-padel","tunnel-tops","twin-peaks","walt-disney-family-museum","workshop-sf","ybca-unfamiliar","ybg-festival",
] as const;

const localMissionImageIdSet = new Set<string>(localMissionImageIds);

function localImageFor(item:LoreItem):MissionImage {
  return {
    url:`/images/missions/${item.id}.jpg`,
    alt:`Local Lore mission image for ${item.venue}`,
    credit:"Used with creator permission",
    sourceUrl:item.source.url,
    license:"Creator permission confirmed by Local Lore",
  };
}

/** Applies local primaries while preserving the existing licensed Commons records. */
export function attachMissionImages(items:LoreItem[]):LoreItem[] {
  return items.map(item => localMissionImageIdSet.has(item.id) ? {...item,image:localImageFor(item)} : item);
}
