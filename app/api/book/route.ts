import { NextRequest, NextResponse } from "next/server";
import {
  buildDateTimeISO,
  config,
  getBusyIntervals,
  getCalendarClient,
  getCalendarId,
} from "@/lib/googleCalendar";
import type { BookingPayload } from "@/types/booking";

export const dynamic = "force-dynamic";

/**
 * GET /api/book?eventId=xxx
 * Verifica la existencia y estado activo del turno directamente en Google Calendar.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Falta el identificador 'eventId'." },
        { status: 400 }
      );
    }

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    try {
      const res = await calendar.events.get({ calendarId, eventId });
      const event = res.data;

      if (!event || event.status === "cancelled") {
        return NextResponse.json({ exists: false, active: false });
      }

      return NextResponse.json({
        exists: true,
        active: true,
        event: {
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          status: event.status,
        },
      });
    } catch (err: any) {
      if (err?.code === 404 || err?.status === 404) {
        return NextResponse.json({ exists: false, active: false });
      }
      throw err;
    }
  } catch (err: any) {
    console.error("[/api/book GET] error:", err);
    return NextResponse.json(
      { error: "Error al verificar el turno." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/book
 * Crea una nueva reserva en Google Calendar.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BookingPayload>;
    const { date, time, name, phone, service, notes } = body;

    // --- Validaciones ---
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Hora inválida." }, { status: 400 });
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Nombre requerido." }, { status: 400 });
    }
    if (!phone || phone.trim().length < 5) {
      return NextResponse.json({ error: "Teléfono requerido." }, { status: 400 });
    }

    const isoStart = buildDateTimeISO(date, time);
    const sStart = new Date(isoStart).getTime();
    if (sStart <= Date.now()) {
      return NextResponse.json(
        { error: "No es posible reservar un turno en el pasado." },
        { status: 400 }
      );
    }

    const [hh, mm] = time.split(":").map(Number);
    const endTotal = hh * 60 + mm + config.SLOT_DURATION_MINUTES;
    const endHH = Math.floor(endTotal / 60)
      .toString()
      .padStart(2, "0");
    const endMM = (endTotal % 60).toString().padStart(2, "0");
    const isoEnd = buildDateTimeISO(date, `${endHH}:${endMM}`);
    const sEnd = new Date(isoEnd).getTime();

    // --- Verificación de disponibilidad (race condition safe) ---
    const busy = await getBusyIntervals(isoStart, isoEnd);

    const isBusy = busy.some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      return sStart < bEnd && sEnd > bStart;
    });

    if (isBusy) {
      return NextResponse.json(
        { error: "Ese horario ya fue reservado. Elegí otro." },
        { status: 409 }
      );
    }

    // --- Insertar evento ---
    const calendar = getCalendarClient();
    const serviceLabel = service?.trim() || "Servicio General de Uñas";

    const event: any = {
      summary: `Turno: ${name} - ${serviceLabel}`,
      description: [
        `Cliente: ${name}`,
        `Servicio: ${serviceLabel}`,
        `Teléfono / WhatsApp: ${phone}`,
        notes ? `Notas: ${notes}` : null,
        "",
        "Reserva registrada desde el sistema web.",
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: isoStart, timeZone: config.TIMEZONE },
      end: { dateTime: isoEnd, timeZone: config.TIMEZONE },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const created = await calendar.events.insert({
      calendarId: getCalendarId(),
      requestBody: event,
    });

    return NextResponse.json({
      success: true,
      eventId: created.data.id,
      htmlLink: created.data.htmlLink,
      start: isoStart,
      end: isoEnd,
    });
  } catch (err: any) {
    console.error("[/api/book POST] error:", err);

    if (err?.code === 409) {
      return NextResponse.json(
        { error: "Ese horario ya fue reservado. Elegí otro." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la reserva." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/book
 * Cancela una reserva validando existencia y datos del usuario en Google Calendar.
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, phone } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Identificador de reserva no proporcionado." },
        { status: 400 }
      );
    }

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    // 1. Validar que el turno exista en Google Calendar
    let event;
    try {
      const res = await calendar.events.get({ calendarId, eventId });
      event = res.data;
    } catch (err: any) {
      if (err?.code === 404 || err?.status === 404) {
        return NextResponse.json(
          { error: "El turno ya no existe o ya fue cancelado." },
          { status: 404 }
        );
      }
      throw err;
    }

    if (!event || event.status === "cancelled") {
      return NextResponse.json(
        { error: "El turno ya fue cancelado previamente." },
        { status: 400 }
      );
    }

    // 2. Validación de seguridad: verificar coincidencia de teléfono si se proporciona
    if (phone && event.description) {
      const cleanReqPhone = String(phone).replace(/\D/g, "");
      const cleanDescPhone = String(event.description).replace(/\D/g, "");
      if (cleanReqPhone.length >= 6 && !cleanDescPhone.includes(cleanReqPhone)) {
        return NextResponse.json(
          { error: "El teléfono no coincide con el turno registrado." },
          { status: 403 }
        );
      }
    }

    // 3. Eliminar evento del calendario
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return NextResponse.json({
      success: true,
      message: "Turno cancelado exitosamente.",
    });
  } catch (err: any) {
    console.error("[/api/book DELETE] error:", err);
    return NextResponse.json(
      { error: "Error al cancelar la reserva." },
      { status: 500 }
    );
  }
}