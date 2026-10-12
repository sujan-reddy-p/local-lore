import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { appendFile } from "node:fs/promises";

function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)));
  }
  const value = address.toLowerCase();
  return isIP(address) === 6 && !/^(::(?:1)?$|::ffff:|f[cd]|fe[89ab]|ff)/.test(value);
}

/** Explicitly loaded only by the research runner; ordinary coding sessions are unaffected. */
export default function discoveryGuard(omp) {
  let searches = 0;
  let reads = 0;
  const lastRead = new Map();
  const crawlDelays = new Map();
  omp.on("tool_call", async event => {
    if (event.toolName === "web_search") {
      if (++searches > 20) return { block: true, reason: "Research search limit reached; finish with supported findings." };
      return;
    }
    if (event.toolName !== "read") return { block: true, reason: "Research permits public web search and HTTPS page reads only." };
    if (++reads > 80) return { block: true, reason: "Research page limit reached; finish with supported findings." };
    let url;
    try { url = new URL(event.input.path); } catch { return { block: true, reason: "Local files and internal resources are unavailable to research." }; }
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || /(^|\.)(localhost|local|internal)$/.test(url.hostname)) {
      return { block: true, reason: "Research source must be an ordinary public HTTPS URL." };
    }
    try {
      const addresses = await lookup(url.hostname, { all: true });
      if (!addresses.length || addresses.some(({ address }) => !publicAddress(address))) return { block: true, reason: "Private and local network sources are not research inputs." };
    } catch { return { block: true, reason: "Source hostname could not be resolved." }; }
    const waitMs = (crawlDelays.get(url.hostname) ?? 2000) - (Date.now() - (lastRead.get(url.hostname) ?? 0));
    if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastRead.set(url.hostname, Date.now());
  });
  omp.on("tool_result", async event => {
    if (event.toolName !== "read" || !process.env.LOCAL_DISCOVERY_TRACE) return;
    const text = (event.content ?? []).filter(part => part.type === "text").map(part => part.text).join("\n");
    const failed = Boolean(event.isError) || /\nMethod: failed\b/.test(text);
    if (!failed && new URL(event.input.path).pathname.endsWith("/robots.txt")) {
      const delays = [...text.matchAll(/^\s*Crawl-delay:\s*(\d+(?:\.\d+)?)/gim)].map(match => Number(match[1]) * 1000);
      if (delays.length) crawlDelays.set(new URL(event.input.path).hostname, Math.max(2000, ...delays));
    }
    await appendFile(process.env.LOCAL_DISCOVERY_TRACE, `${JSON.stringify({ url: event.input.path, finalUrl: event.details?.finalUrl ?? event.input.path, observedAt: new Date().toISOString(), error: failed, text: text.slice(0, 1_000_000) })}\n`);
  });
}
