import { validCronRequest } from "@/lib/agent/config";
import { runDailyRefresh } from "@/lib/ingestion/daily-refresh";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!validCronRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ ok: true, ...(await runDailyRefresh()) });
  } catch {
    return Response.json({ ok: false, error: "Ingestion run failed" }, { status: 500 });
  }
}
