"use client";

import * as React from "react";
import Image from "next/image";
import { activityArtwork } from "@/lib/activity-artwork";
import type { LoreItem, MissionFormat } from "@/lib/types";

export type MissionMediaVariant = "preview" | "detail";

type MissionMediaProps = {
  item: LoreItem;
  variant: MissionMediaVariant;
};

const fallbackFormats: Record<LoreItem["category"], MissionFormat> = {
  Outside: "Adventure",
  Move: "Meetup",
  Make: "Class",
  Listen: "Live",
  Eat: "Food",
  Learn: "Culture",
  Community: "Volunteer",
  "After dark": "Live",
};

/** The editorial format shown when a catalog record has no explicit format. */
export function missionFormat(item: LoreItem): MissionFormat {
  return item.format ?? fallbackFormats[item.category];
}

function MissionFallback({ item }: { item: LoreItem }) {
  return (
    <div className="mission-media__fallback" aria-label={`${item.venue}, ${item.neighborhood}`}>
      <Image className="mission-media__artwork" src={`/map-icons/${activityArtwork(item)}.png`} width={64} height={64} alt="" unoptimized />
    </div>
  );
}

function MissionMediaBody({ item, variant }: MissionMediaProps) {
  const image = item.image;
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(image ? "loading" : "error");
  const hasImage = Boolean(image && status === "loaded");
  const imageKind = image?.kind ?? "event";

  return (
    <>
      <div className={`mission-media__frame mission-media__frame--${variant}`} data-photo-state={image ? status : "missing"}>
        {image && status !== "error" ? (
          <Image
            className={`mission-media__image mission-media__image--${status} mission-media__image--${imageKind}`}
            src={image.url}
            alt={variant === "detail" ? image.alt : ""}
            fill
            unoptimized
            sizes={variant === "detail" ? "(max-width: 720px) 100vw, 400px" : "320px"}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        ) : null}
        {!hasImage && <MissionFallback item={item} />}
      </div>
    </>
  );
}

export function MissionMedia({ item, variant }: MissionMediaProps) {
  const imageKey = `${item.image?.url ?? "fallback"}:${item.image?.kind ?? "event"}`;
  return (
    <div className={`mission-media mission-media--${variant}`} style={{ "--mission-accent": item.accent } as React.CSSProperties}>
      <MissionMediaBody key={imageKey} item={item} variant={variant} />
    </div>
  );
}
