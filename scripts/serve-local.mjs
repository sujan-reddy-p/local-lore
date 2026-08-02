import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import worker from "../dist/server/index.js";

const port = Number(process.env.LOCAL_LORE_PORT ?? 3100);
const host = "127.0.0.1";
const assetsRoot = resolve("dist/client");
const mimeTypes = { ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json", ".pmtiles": "application/vnd.pmtiles" };

async function getAsset(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const target = resolve(assetsRoot, `.${pathname}`);
  if (!target.startsWith(`${assetsRoot}${sep}`)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(target);
    const contentType = mimeTypes[extname(target)] ?? "application/octet-stream";
    const range = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      if (start >= body.length || end < start) {
        return new Response(null, { status:416, headers:{ "content-range":`bytes */${body.length}` } });
      }
      const chunk = body.subarray(start, end + 1);
      return new Response(chunk, { status:206, headers:{ "accept-ranges":"bytes", "content-range":`bytes ${start}-${end}/${body.length}`, "content-length":String(chunk.length), "content-type":contentType, "cache-control":"no-store" } });
    }
    return new Response(body, { headers: { "accept-ranges":"bytes", "content-length":String(body.length), "content-type":contentType, "cache-control":"public, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const env = { ASSETS: { fetch: getAsset } };
const executionContext = { waitUntil() {} };

createServer(async (incoming, outgoing) => {
  const url = `http://${host}:${port}${incoming.url ?? "/"}`;
  const request = new Request(url, { method: incoming.method, headers: incoming.headers, ...(incoming.method === "GET" || incoming.method === "HEAD" ? {} : { body: incoming, duplex: "half" }) });
  // Client chunks are requested directly by the browser; serve those before
  // delegating page and RSC requests to the worker.
  const asset = await getAsset(request);
  const response = asset.status === 404 ? await worker.fetch(request, env, executionContext) : asset;
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body || incoming.method === "HEAD") return outgoing.end();
  Readable.fromWeb(response.body).pipe(outgoing);
}).listen(port, host, () => console.log(`Local Lore is live at http://${host}:${port}`));
