"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right.mjs";
import Clock3 from "lucide-react/dist/esm/icons/clock-3.mjs";
import Info from "lucide-react/dist/esm/icons/info.mjs";
import Users from "lucide-react/dist/esm/icons/users.mjs";
import Wallet from "lucide-react/dist/esm/icons/wallet.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";
import type { CSSProperties } from "react";
import { missionDescription } from "@/lib/mission-copy";
import { missionWhen } from "@/lib/mission-presentation";
import type { LoreItem } from "@/lib/types";
import { MissionMedia } from "./mission-media";
import { MissionStatus } from "./mission-status";

export function MissionDetail({ item, onClose }: { item: LoreItem | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const scheduled = item?.schedule?.kind === "scheduled";
  return <AnimatePresence>{item && <motion.aside className="activity-card has-visual" aria-label={`Place: ${item.venue}`} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .2 }} style={{ "--accent": item.accent } as CSSProperties}>
    <MissionMedia item={item} variant="detail" />
    <button className="card-close" onClick={onClose} aria-label="Close activity"><X /></button>
    <h2>{scheduled ? item.title : item.venue}</h2>
    {scheduled && <p className="card-venue">{item.venue}</p>}
    <p className="card-purpose">{missionDescription(item)}</p>
    <dl className="card-facts">
      <div><dt><Clock3 aria-hidden="true" />{scheduled ? "When" : "Visit time"}</dt><dd title={scheduled ? "Event time in America/Los_Angeles" : "Approximate activity time; travel excluded"}>{scheduled ? missionWhen(item) : item.duration === null ? "Time varies" : `~${item.duration} h`}</dd></div>
      <div><dt><Wallet aria-hidden="true" />Cost</dt><dd>{item.price === null ? "Not listed" : item.price === 0 ? "Free" : `$${item.price}`}</dd></div>
      <div><dt><Users aria-hidden="true" />Company</dt><dd>{item.vibe.includes("social") ? "Social" : item.vibe.includes("solo") ? "Solo OK" : "Any"}</dd></div>
    </dl>
    <div className="card-actions">
      <a className="card-source-link" href={item.source.url} target="_blank" rel="noreferrer">Visit website <ArrowUpRight /></a>
      <details key={item.id} className="card-information"><summary aria-label="Source, accessibility, and photo information" title="Source and photo information"><Info /></summary><div className="card-information-body">
        <MissionStatus item={item} />
        {item.accessibility && <p>{item.accessibility}</p>}
        {item.image && <p>Photo: {item.image.credit}{item.image.sourceUrl && <> · <a href={item.image.sourceUrl} target="_blank" rel="noreferrer">Source</a></>}{item.image.license && <> · {item.image.license}</>}</p>}
      </div></details>
    </div>
  </motion.aside>}</AnimatePresence>;
}
