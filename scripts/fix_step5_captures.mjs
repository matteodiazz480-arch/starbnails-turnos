import { chromium } from "playwright";
import path from "path";

const OUT_DIR = "B:/Workspace/booking-app/public/flow_captures";

async function fixCaptures() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // 1. Mobile Step 5
  console.log("Capturing Mobile Step 5 (Ticket)...");
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageMobile = await contextMobile.newPage();
  
  await pageMobile.route("**/api/book*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ exists: true, active: true }),
    });
  });

  await pageMobile.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await pageMobile.evaluate(() => {
    localStorage.setItem("nails_studio_active_appointment", JSON.stringify({
      eventId: "mock_event_starbnails_123",
      date: "2026-11-20",
      time: "17:00",
      name: "Sofía Martínez",
      phone: "380 491-2345",
      service: "Kapping + Retiro de otro salón ($18.000)",
      notes: "Diseño con francesitas",
      createdAt: new Date().toISOString()
    }));
  });
  await pageMobile.reload({ waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(1500);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, "step5_ticket_mobile.png") });
  await contextMobile.close();

  // 2. Desktop Step 5
  console.log("Capturing Desktop Step 5 (Ticket)...");
  const contextDesktop = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  const pageDesktop = await contextDesktop.newPage();

  await pageDesktop.route("**/api/book*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ exists: true, active: true }),
    });
  });

  await pageDesktop.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await pageDesktop.evaluate(() => {
    localStorage.setItem("nails_studio_active_appointment", JSON.stringify({
      eventId: "mock_event_starbnails_123",
      date: "2026-11-20",
      time: "17:00",
      name: "Sofía Martínez",
      phone: "380 491-2345",
      service: "Kapping + Retiro de otro salón ($18.000)",
      notes: "Diseño con francesitas",
      createdAt: new Date().toISOString()
    }));
  });
  await pageDesktop.reload({ waitUntil: "networkidle" });
  await pageDesktop.waitForTimeout(1500);
  await pageDesktop.screenshot({ path: path.join(OUT_DIR, "step5_ticket_desktop.png") });
  await contextDesktop.close();

  await browser.close();
  console.log("Step 5 captures updated successfully!");
}

fixCaptures().catch(console.error);
