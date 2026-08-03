import { bootstrapSeedCatalog } from "@/db/repository";
import { validCronRequest } from "@/lib/agent/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!validCronRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await bootstrapSeedCatalog();
  return Response.json({ ok: true, ...result });
}
