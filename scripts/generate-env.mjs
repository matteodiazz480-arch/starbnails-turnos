import fs from "fs";
import path from "path";

// 👇 CAMBIÁ ESTO por el nombre real de tu JSON
const jsonPath = "./nombre-del-json.json";

if (!fs.existsSync(jsonPath)) {
  console.error("❌ No encontré:", jsonPath);
  console.error("   Cambiá la variable jsonPath con el nombre real.");
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const envContent = `GOOGLE_CLIENT_EMAIL=${sa.client_email}
GOOGLE_PRIVATE_KEY="${sa.private_key.replace(/\n/g, "\\n")}"
GOOGLE_CALENDAR_ID=primary
TIMEZONE=America/Argentina/Buenos_Aires
BUSINESS_START_HOUR=9
BUSINESS_END_HOUR=18
SLOT_DURATION_MINUTES=60
`;

fs.writeFileSync(".env.local", envContent);
console.log("✅ .env.local regenerado");
console.log("   El GOOGLE_PRIVATE_KEY quedó con \\n literales.");