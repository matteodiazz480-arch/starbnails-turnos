import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";

console.log("🔍 Verificando configuración del entorno...");

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ No se encontró el archivo .env.local");
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const requiredKeys = ["GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_CALENDAR_ID"];
let missing = false;

for (const key of requiredKeys) {
  if (!process.env[key]) {
    console.error(`❌ Falta la variable requerida: ${key}`);
    missing = true;
  }
}

if (missing) {
  process.exit(1);
}

console.log("✅ Variables de entorno presentes:");
console.log("   - GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
console.log("   - GOOGLE_CALENDAR_ID :", process.env.GOOGLE_CALENDAR_ID);
console.log("   - TIMEZONE           :", process.env.TIMEZONE || "(default: America/Argentina/Buenos_Aires)");
console.log("   - BUSINESS HOURS     :", `${process.env.BUSINESS_START_HOUR || 9}hs a ${process.env.BUSINESS_END_HOUR || 18}hs`);

console.log("\n📡 Probando conexión con la API de Google Calendar...");

try {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const calId = process.env.GOOGLE_CALENDAR_ID;

  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: nextHour.toISOString(),
      items: [{ id: calId }],
    },
  });

  const calendarErrors = res.data.calendars?.[calId]?.errors;
  if (calendarErrors && calendarErrors.length > 0) {
    console.error("⚠️ Error retornado por Google Calendar para este Calendar ID:", calendarErrors);
  } else {
    console.log("✅ Conexión exitosa a Google Calendar.");
    console.log("   ¡Todo listo para recibir reservas!");
  }
} catch (err) {
  console.error("❌ Error conectando a Google Calendar:", err.message);
  process.exit(1);
}