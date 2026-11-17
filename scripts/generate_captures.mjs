import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = "B:/Workspace/booking-app/public/pdf_assets";
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const mockAppointments = [
  {
    id: "app_1",
    summary: "Turno: Camila Perez - Semipermanente",
    clientName: "Camila Perez",
    service: "Semipermanente",
    phone: "3804112233",
    notes: "Esmaltado en tono nude con deco minimalista",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 75 * 60000).toISOString(),
    date: new Date().toISOString().split("T")[0],
    time: "17:00",
    deposit: 5000,
    estimatedTotal: 13000,
  },
  {
    id: "app_2",
    summary: "Turno: Sofia Gomez - Kapping Gel",
    clientName: "Sofia Gomez",
    service: "Kapping Gel",
    phone: "3804556677",
    notes: "Uña natural con refuerzo de gel",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 75 * 60000).toISOString(),
    date: new Date().toISOString().split("T")[0],
    time: "18:15",
    deposit: 5000,
    estimatedTotal: 15000,
  },
  {
    id: "app_3",
    summary: "Turno: Lucia Fernandez - Soft Gel + Retiro",
    clientName: "Lucia Fernandez",
    service: "Soft Gel + Retiro de otro salón",
    phone: "3804889900",
    notes: "Retiro previo de acrílico y set nuevo almendrado",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 75 * 60000).toISOString(),
    date: new Date().toISOString().split("T")[0],
    time: "19:30",
    deposit: 5000,
    estimatedTotal: 19000,
  },
  {
    id: "app_4",
    summary: "Turno: Valentina Diaz - Kapping",
    clientName: "Valentina Diaz",
    service: "Kapping",
    phone: "3804223344",
    notes: "Mantenimiento mensual",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 75 * 60000).toISOString(),
    date: new Date().toISOString().split("T")[0],
    time: "20:45",
    deposit: 5000,
    estimatedTotal: 15000,
  },
  {
    id: "app_5",
    summary: "Turno: Martina Benitez - Semipermanente",
    clientName: "Martina Benitez",
    service: "Semipermanente",
    phone: "3804667788",
    notes: "",
    start: new Date(Date.now() + 86400000).toISOString(),
    end: new Date(Date.now() + 86400000 + 75 * 60000).toISOString(),
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "18:30",
    deposit: 5000,
    estimatedTotal: 13000,
  },
];

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // 1. Client Mobile (390 x 844 - iPhone 13/14)
  console.log("1. Capturing Client Mobile...");
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(1500);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, "client_mobile.png") });
  await contextMobile.close();

  // 2. Client Desktop (1366 x 768)
  console.log("2. Capturing Client Desktop...");
  const contextDesktop = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await pageDesktop.waitForTimeout(1500);
  await pageDesktop.screenshot({ path: path.join(OUT_DIR, "client_desktop.png") });
  await contextDesktop.close();

  // 3. Admin PIN Screen (Mobile)
  console.log("3. Capturing Admin PIN screen...");
  const contextAdminPin = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageAdminPin = await contextAdminPin.newPage();
  await pageAdminPin.addInitScript(() => {
    localStorage.setItem("starbnails_admin_pin", "1234");
    sessionStorage.removeItem("starbnails_admin_auth");
  });
  await pageAdminPin.goto("https://starbnailslr.netlify.app/admin", { waitUntil: "networkidle" });
  await pageAdminPin.waitForTimeout(1000);
  await pageAdminPin.screenshot({ path: path.join(OUT_DIR, "admin_pin_mobile.png") });
  await contextAdminPin.close();

  // 4. Admin Dashboard Mobile (Populated with Naranja X Style)
  console.log("4. Capturing Admin Dashboard Mobile...");
  const contextAdminDashMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageAdminDashMobile = await contextAdminDashMobile.newPage();
  await pageAdminDashMobile.route("**/api/admin/appointments", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, appointments: mockAppointments }),
    });
  });
  await pageAdminDashMobile.addInitScript(() => {
    localStorage.setItem("starbnails_admin_pin", "1234");
    sessionStorage.setItem("starbnails_admin_auth", "true");
  });
  await pageAdminDashMobile.goto("https://starbnailslr.netlify.app/admin", { waitUntil: "networkidle" });
  await pageAdminDashMobile.waitForTimeout(1500);
  await pageAdminDashMobile.screenshot({ path: path.join(OUT_DIR, "admin_dashboard_mobile.png") });

  // 5. Admin Detail Modal (Bottom Sheet WhatsApp / Cancel)
  console.log("5. Capturing Admin Detail Modal...");
  // Click on first appointment
  const firstCard = pageAdminDashMobile.locator("h4:has-text('Camila Perez')").first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await pageAdminDashMobile.waitForTimeout(800);
    await pageAdminDashMobile.screenshot({ path: path.join(OUT_DIR, "admin_detail_modal.png") });
  }
  await contextAdminDashMobile.close();

  // 6. Admin Dashboard Desktop (1366 x 768)
  console.log("6. Capturing Admin Dashboard Desktop...");
  const contextAdminDesktop = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  const pageAdminDesktop = await contextAdminDesktop.newPage();
  await pageAdminDesktop.route("**/api/admin/appointments", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, appointments: mockAppointments }),
    });
  });
  await pageAdminDesktop.addInitScript(() => {
    localStorage.setItem("starbnails_admin_pin", "1234");
    sessionStorage.setItem("starbnails_admin_auth", "true");
  });
  await pageAdminDesktop.goto("https://starbnailslr.netlify.app/admin", { waitUntil: "networkidle" });
  await pageAdminDesktop.waitForTimeout(1500);
  await pageAdminDesktop.screenshot({ path: path.join(OUT_DIR, "admin_dashboard_desktop.png") });
  await contextAdminDesktop.close();

  await browser.close();
  console.log("All screenshots successfully captured in:", OUT_DIR);
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
