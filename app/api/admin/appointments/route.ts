import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient, getCalendarId } from "@/lib/googleCalendar";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/appointments?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Obtiene los eventos/turnos reales de Google Calendar.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const now = new Date();
    // Por defecto, desde el inicio del día de hoy hasta 30 días adelante
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59);

    const timeMin = startDate ? new Date(`${startDate}T00:00:00`).toISOString() : defaultStart.toISOString();
    const timeMax = endDate ? new Date(`${endDate}T23:59:59`).toISOString() : defaultEnd.toISOString();

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items || [];

    const appointments = items
      .filter((ev) => ev.status !== "cancelled")
      .map((ev) => {
        const startRaw = ev.start?.dateTime || ev.start?.date || "";
        const endRaw = ev.end?.dateTime || ev.end?.date || "";
        const description = ev.description || "";
        const summary = ev.summary || "Turno";

        // Extraer datos estructurados si están en la descripción
        const clientMatch = description.match(/Cliente:\s*([^\n]+)/i);
        const serviceMatch = description.match(/Servicio:\s*([^\n]+)/i);
        const phoneMatch = description.match(/Tel[ée]fono[^:]*:\s*([^\n]+)/i);
        const notesMatch = description.match(/Notas:\s*([^\n]+)/i);

        // Fallbacks
        const clientName = clientMatch ? clientMatch[1].trim() : summary.replace(/^Turno:\s*/i, "").split("-")[0]?.trim() || "Clienta";
        const service = serviceMatch ? serviceMatch[1].trim() : summary.includes("-") ? summary.split("-")[1]?.trim() : "Manicuría";
        const phone = phoneMatch ? phoneMatch[1].trim() : "";
        const notes = notesMatch ? notesMatch[1].trim() : "";

        // Fecha y hora en formato legible
        let dateStr = "";
        let timeStr = "";
        if (startRaw) {
          const d = new Date(startRaw);
          dateStr = d.toLocaleDateString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).split("/").reverse().join("-"); // YYYY-MM-DD

          timeStr = d.toLocaleTimeString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }

        // Estimación de seña y monto
        let price = 13000;
        if (service.toLowerCase().includes("kapping")) price = 15000;
        if (service.toLowerCase().includes("soft")) price = 16000;
        if (service.toLowerCase().includes("retiro")) price += 3000;

        return {
          id: ev.id,
          summary,
          clientName,
          service,
          phone,
          notes,
          start: startRaw,
          end: endRaw,
          date: dateStr,
          time: timeStr,
          deposit: 5000,
          estimatedTotal: price,
          htmlLink: ev.htmlLink,
        };
      });

    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    console.error("[/api/admin/appointments] error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al cargar turnos del administrador" },
      { status: 500 }
    );
  }
}
