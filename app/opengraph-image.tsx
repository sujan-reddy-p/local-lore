import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Local Lore — a curated map of memorable things to do in San Francisco";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const zones = [
  { left: 178, top: 158, size: 118, color: "#f06e5d", icon: "↗" },
  { left: 396, top: 234, size: 154, color: "#d99b41", icon: "♫" },
  { left: 616, top: 128, size: 132, color: "#8bbd7c", icon: "✦" },
  { left: 792, top: 262, size: 122, color: "#d66e96", icon: "⌁" },
  { left: 968, top: 152, size: 104, color: "#78b9c4", icon: "◌" },
  { left: 755, top: 426, size: 96, color: "#b78ad3", icon: "☾" },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#071817",
          color: "#f6f0dd",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at 52% 48%, rgba(43, 102, 86, 0.62), transparent 41%), linear-gradient(135deg, #0b2723 0%, #09201e 48%, #061311 100%)",
            display: "flex",
            height: "100%",
            position: "absolute",
            width: "100%",
          }}
        />
        <div
          style={{
            backgroundImage:
              "linear-gradient(114deg, transparent 0 14%, rgba(183, 211, 192, 0.13) 14.15% 14.38%, transparent 14.52% 100%), linear-gradient(45deg, transparent 0 26%, rgba(183, 211, 192, 0.1) 26.15% 26.34%, transparent 26.5% 100%), linear-gradient(78deg, transparent 0 48%, rgba(183, 211, 192, 0.09) 48.1% 48.28%, transparent 48.45% 100%), linear-gradient(152deg, transparent 0 67%, rgba(183, 211, 192, 0.1) 67.1% 67.3%, transparent 67.45% 100%)",
            display: "flex",
            inset: 0,
            opacity: 0.9,
            position: "absolute",
          }}
        />
        <svg
          aria-hidden="true"
          height="630"
          viewBox="0 0 1200 630"
          width="1200"
          style={{ left: 0, position: "absolute", top: 0 }}
        >
          <path d="M0 0H162L139 92L187 162L140 234L168 325L97 396L115 512L0 569Z" fill="#08211f" />
          <path d="M1038 0H1200V630H1086L1051 534L1080 455L1027 378L1061 299L1014 210Z" fill="#061513" />
          <path d="M0 569L115 512L97 396L168 325L140 234L187 162L139 92L162 0" fill="none" stroke="#4d9282" strokeWidth="3" opacity="0.55" />
          <path d="M1038 0L1014 210L1061 299L1027 378L1080 455L1051 534L1086 630" fill="none" stroke="#4d9282" strokeWidth="3" opacity="0.45" />
          <path d="M316 0C360 104 350 167 438 238C530 312 567 373 583 630" fill="none" stroke="#84c8bd" strokeWidth="3" opacity="0.24" />
          <path d="M697 0C674 99 742 175 718 265C688 383 737 451 713 630" fill="none" stroke="#84c8bd" strokeWidth="2" opacity="0.22" />
          <path d="M145 460C353 403 488 452 648 412C814 371 967 392 1058 336" fill="none" stroke="#84c8bd" strokeWidth="3" opacity="0.2" />
        </svg>

        {zones.map((zone) => (
          <div
            key={`${zone.left}-${zone.top}`}
            style={{
              alignItems: "center",
              background: `${zone.color}30`,
              border: `2px solid ${zone.color}`,
              borderRadius: 999,
              boxShadow: `0 0 0 16px ${zone.color}12, 0 0 42px ${zone.color}55`,
              display: "flex",
              height: zone.size,
              justifyContent: "center",
              left: zone.left,
              position: "absolute",
              top: zone.top,
              width: zone.size,
            }}
          >
            <span style={{ color: "#fff9e9", fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{zone.icon}</span>
          </div>
        ))}

        <div
          style={{
            background: "rgba(6, 25, 23, 0.84)",
            border: "1px solid rgba(203, 229, 207, 0.22)",
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            left: 56,
            padding: "28px 30px 26px",
            position: "absolute",
            top: 48,
            width: 420,
          }}
        >
          <div style={{ alignItems: "center", color: "#d7e8c6", display: "flex", fontSize: 18, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
            San Francisco / Today
          </div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, marginTop: 14 }}>
            Local Lore
          </div>
          <div style={{ color: "#d4dfd0", display: "flex", fontSize: 23, lineHeight: 1.35, marginTop: 16 }}>
            A living map of memorable ways into the city.
          </div>
        </div>

        <div style={{ bottom: 46, display: "flex", left: 56, position: "absolute" }}>
          <div style={{ alignItems: "center", background: "#e9d8a3", borderRadius: 999, color: "#19312d", display: "flex", fontSize: 21, fontWeight: 700, padding: "14px 20px" }}>
            Where next?
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
