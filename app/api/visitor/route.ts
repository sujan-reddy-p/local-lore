import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { visitors } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requestIp(request: Request) {
  const directIp = request.headers.get("x-real-ip")?.trim();
  if (directIp) return directIp;

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedFor) return forwardedFor;

  return process.env.NODE_ENV === "development" ? "127.0.0.1" : null;
}

export async function POST(request: Request) {
  const ipAddress = requestIp(request);
  if (!ipAddress) return new NextResponse(null, { status: 204 });

  try {
    const userAgent = request.headers.get("user-agent");
    const db = getDb();
    await db.insert(visitors).values({ ipAddress, userAgent }).onConflictDoUpdate({
      target: visitors.ipAddress,
      set: {
        lastSeenAt: new Date().toISOString(),
        visitCount: sql`${visitors.visitCount} + 1`,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Local Lore visitor capture failed", error);
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
