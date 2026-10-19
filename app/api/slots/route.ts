import { NextRequest, NextResponse } from "next/server";
import {
  config,
  generateDaySlots,
  getBusyIntervals,
} from "@/lib/googleCalendar";
import type { SlotsResponse } from "@/types/booking";

export const dynamic = "force-dynamic"; // siempre fresco

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Parámetro 'date' inválido. Formato: YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const daySlots = generateDaySlots(date);

    if (daySlots.length === 0) {
      return NextResponse.json<SlotsResponse>({
        date,
        timezone: config.TIMEZONE,
        slots: [],
      });
    }

    const timeMin = daySlots[0].isoStart;
    const timeMax = daySlots[daySlots.length - 1].isoEnd;

    const busy = await getBusyIntervals(timeMin, timeMax);

    const busyRanges = busy.map((b) => ({
      start: new Date(b.start).getTime(),
      end: new Date(b.end).getTime(),
    }));

    const now = Date.now();
    const slots = daySlots.map((s) => {
      const sStart = new Date(s.isoStart).getTime();
      const sEnd = new Date(s.isoEnd).getTime();

      const isPast = sStart <= now;

      // Se considera ocupado si ya pasó o si solapa con algún intervalo busy
      const overlap = busyRanges.some(
        (b) => sStart < b.end && sEnd > b.start
      );

      return {
        time: s.time,
        isoStart: s.isoStart,
        isoEnd: s.isoEnd,
        available: !overlap && !isPast,
      };
    });

    return NextResponse.json<SlotsResponse>({
      date,
      timezone: config.TIMEZONE,
      slots,
    });
  } catch (err) {
    console.error("[/api/slots] error:", err);
    return NextResponse.json(
      { error: "Error consultando la disponibilidad." },
      { status: 500 }
    );
  }
}