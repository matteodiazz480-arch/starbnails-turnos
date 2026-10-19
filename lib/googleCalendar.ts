import { google, calendar_v3 } from "googleapis";

const TIMEZONE = process.env.TIMEZONE || "America/Argentina/Buenos_Aires";
const BUSINESS_START_HOUR = Number(process.env.BUSINESS_START_HOUR ?? 9);
const BUSINESS_END_HOUR = Number(process.env.BUSINESS_END_HOUR ?? 18);
const SLOT_DURATION_MINUTES = Number(process.env.SLOT_DURATION_MINUTES ?? 60);

let cachedClient: calendar_v3.Calendar | null = null;

/**
 * Crea (y cachea) un cliente autenticado con la Service Account.
 */
export function getCalendarClient(): calendar_v3.Calendar {
  if (cachedClient) return cachedClient;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, "");
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ?.trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Faltan credenciales de Google (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY)."
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  cachedClient = google.calendar({ version: "v3", auth });
  return cachedClient;
}

export function getCalendarId(): string {
  const id = process.env.GOOGLE_CALENDAR_ID?.trim().replace(/^["']|["']$/g, "");
  if (!id) throw new Error("Falta GOOGLE_CALENDAR_ID en las variables de entorno.");
  return id;
}

export const config = {
  TIMEZONE,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
  SLOT_DURATION_MINUTES,
};

/**
 * Convierte "YYYY-MM-DD" + "HH:mm" a un ISO con offset local (usando la TZ configurada).
 * Para simplificar, se genera un Date en UTC y se agrega el offset vía Intl.
 */
export function buildDateTimeISO(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const naiveUTC = Date.UTC(y, m - 1, d, hh, mm, 0);
  const offsetMinutes = getTimezoneOffsetMinutes(new Date(naiveUTC), TIMEZONE);
  const realUTC = new Date(naiveUTC - offsetMinutes * 60_000);
  return realUTC.toISOString();
}

/**
 * Devuelve el offset (minutos) de una zona horaria para un instante dado.
 */
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return (asUTC - date.getTime()) / 60_000;
}

/**
 * Genera los bloques horarios del día según la jornada configurada.
 */
export function generateDaySlots(date: string) {
  const slots: { time: string; isoStart: string; isoEnd: string }[] = [];
  const startMin = BUSINESS_START_HOUR * 60;
  const endMin = BUSINESS_END_HOUR * 60;

  for (let m = startMin; m + SLOT_DURATION_MINUTES <= endMin; m += SLOT_DURATION_MINUTES) {
    const hh = Math.floor(m / 60)
      .toString()
      .padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    const time = `${hh}:${mm}`;

    const endTotal = m + SLOT_DURATION_MINUTES;
    const endHH = Math.floor(endTotal / 60)
      .toString()
      .padStart(2, "0");
    const endMM = (endTotal % 60).toString().padStart(2, "0");
    const endTime = `${endHH}:${endMM}`;

    slots.push({
      time,
      isoStart: buildDateTimeISO(date, time),
      isoEnd: buildDateTimeISO(date, endTime),
    });
  }

  return slots;
}

/**
 * Consulta freebusy para un rango y devuelve los intervalos ocupados.
 */
export async function getBusyIntervals(
  timeMinISO: string,
  timeMaxISO: string
): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendarClient();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      timeZone: TIMEZONE,
      items: [{ id: getCalendarId() }],
    },
  });

  const busy = res.data.calendars?.[getCalendarId()]?.busy ?? [];
  return busy.map((b) => ({
    start: b.start ?? "",
    end: b.end ?? "",
  }));
}
