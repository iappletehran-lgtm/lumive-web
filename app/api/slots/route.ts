import { NextRequest, NextResponse } from "next/server";
import { getSlots, resolveEventType } from "@/lib/cal";

export const runtime = "nodejs";

/**
 * Available Cal.com slots for the /book calendar. Keeps CAL_API_KEY server-side.
 * Params: start, end (YYYY-MM-DD) and tz (IANA timezone). Returns slots grouped
 * by date plus the event duration. Degrades to empty (ok:false) if Cal is not
 * configured, so the page can show a friendly fallback.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const tz = searchParams.get("tz") || "UTC";

  if (!start || !end) {
    return NextResponse.json({ ok: false, error: "Missing start/end." }, { status: 400 });
  }

  if (!process.env.CAL_API_KEY) {
    return NextResponse.json({ ok: false, error: "Scheduling is not configured." }, { status: 503 });
  }

  try {
    const [et, slots] = await Promise.all([resolveEventType(), getSlots({ start, end, timeZone: tz })]);
    return NextResponse.json({
      ok: true,
      durationMinutes: et?.lengthInMinutes ?? 30,
      slots,
    });
  } catch (err) {
    console.error("[slots] failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Could not load availability." }, { status: 502 });
  }
}
