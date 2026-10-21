import { google, calendar_v3 } from "googleapis";

const TIMEZONE = process.env.TIMEZONE || "America/Argentina/Buenos_Aires";
// Cada turno dura 1 hora y 15 minutos (75 min)
const SLOT_DURATION_MINUTES = 75;

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
  SLOT_DURATION_MINUTES,
};

/**
 * Convierte "YYYY-MM-DD" + "HH:mm" a un ISO con offset local (usando la TZ configurada).
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
 * Configuración de horarios según el día de la semana (Lunes a Sábado):
 * - Lunes (1): desde 17:00 (4 turnos de 1h 15m)
 * - Martes (2): desde 18:30 (3 turnos de 1h 15m)
 * - Miércoles (3): desde 16:00 (4 turnos de 1h 15m)
 * - Jueves (4): desde 18:30 (3 turnos de 1h 15m)
 * - Viernes (5): desde 17:00 (4 turnos de 1h 15m)
 * - Sábado (6): desde 16:00 (4 turnos de 1h 15m)
 * - Domingo (0): cerrado
 */
const DAY_SCHEDULE: Record<number, { startMinutes: number; maxSlots: number } | null> = {
  0: null, // Domingo cerrado
  1: { startMinutes: 17 * 60, maxSlots: 4 }, // Lunes 17:00
  2: { startMinutes: 18 * 60 + 30, maxSlots: 3 }, // Martes 18:30
  3: { startMinutes: 16 * 60, maxSlots: 4 }, // Miércoles 16:00
  4: { startMinutes: 18 * 60 + 30, maxSlots: 3 }, // Jueves 18:30
  5: { startMinutes: 17 * 60, maxSlots: 4 }, // Viernes 17:00
  6: { startMinutes: 16 * 60, maxSlots: 4 }, // Sábado 16:00
};

/**
 * Genera los bloques horarios del día según la agenda configurada (1h 15min por turno).
 */
export function generateDaySlots(date: string) {
  const [y, month, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, month - 1, d)).getUTCDay();
  const schedule = DAY_SCHEDULE[dayOfWeek];

  if (!schedule) return [];

  const slots: { time: string; isoStart: string; isoEnd: string }[] = [];

  for (let i = 0; i < schedule.maxSlots; i++) {
    const m = schedule.startMinutes + i * SLOT_DURATION_MINUTES;
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
