import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = "B:/Workspace/booking-app/public/flow_captures";
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // Dispositivo móvil (iPhone 13 / 390 x 844)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await contextMobile.newPage();
  await page.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Paso 1: Selección de Servicio
  console.log("Capturing Paso 1 (Mobile)...");
  await page.screenshot({ path: path.join(OUT_DIR, "step1_services_mobile.png") });

  // Seleccionar Kapping y sumar retiro
  const kappingBtn = page.locator("button:has-text('Kapping')").first();
  if (await kappingBtn.isVisible()) {
    await kappingBtn.click();
  }
  const retiroBtn = page.locator("button:has-text('Sumar retiro')").first();
  if (await retiroBtn.isVisible()) {
    await retiroBtn.click();
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, "step1_selected_mobile.png") });

  // Ir a Paso 2
  const nextToStep2 = page.locator("button:has-text('Elegir Día y Hora')").first();
  await nextToStep2.click();
  await page.waitForTimeout(1200);

  // 2. Paso 2: Día y Horarios
  console.log("Capturing Paso 2 (Mobile)...");
  // Seleccionar un horario disponible
  const availableSlot = page.locator("button:has-text('hs')").first();
  if (await availableSlot.isVisible()) {
    await availableSlot.click();
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, "step2_datetime_mobile.png") });

  // Ir a Paso 3
  const nextToStep3 = page.locator("button:has-text('Continuar')").first();
  await nextToStep3.click();
  await page.waitForTimeout(800);

  // 3. Paso 3: Datos de Contacto
  console.log("Capturing Paso 3 (Mobile)...");
  await page.fill("input[placeholder*='Lucía']", "Sofía Martínez");
  await page.fill("input[placeholder*='380']", "380 491-2345");
  await page.fill("textarea", "Diseño con francesitas y brillo sutil");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "step3_form_mobile.png") });

  // 4. Paso 4: Transición / Loading Shutter ("Afinando Pinceles")
  console.log("Capturing Shutter Loading...");
  // Vamos a evaluar la pantalla con el obturador cerrado
  await page.evaluate(() => {
    // Si queremos mostrar el telón directamente
    const iris = document.createElement("div");
    iris.id = "mock-iris";
    iris.className = "fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 text-white";
    iris.style.backgroundColor = "#523450";
    iris.innerHTML = `
      <div style="width: 250px; height: 190px; position: relative; margin-bottom: 12px;">
        <img src="/starbnails-banner.png?v=5" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      <div style="font-family: 'Shrikhand', cursive; font-size: 26px; color: #fde68a; margin-bottom: 6px;">¡AFINANDO PINCELES!</div>
      <div style="font-family: 'Fredoka', sans-serif; font-weight: bold; font-size: 13px; color: #f1f5f9; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span class="material-symbols-outlined" style="font-size: 18px;">sync</span>
        <span>Sincronizando y bloqueando en Google Calendar...</span>
      </div>
    `;
    document.body.appendChild(iris);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, "step4_shutter_mobile.png") });
  await page.evaluate(() => {
    const el = document.getElementById("mock-iris");
    if (el) el.remove();
  });

  // 5. Paso 5: Comprobante de Turno
  console.log("Capturing Paso 5 (Mobile Comprobante)...");
  await page.evaluate(() => {
    localStorage.setItem("nails_studio_active_appointment", JSON.stringify({
      eventId: "mock_event_123",
      date: "2026-11-20",
      time: "17:00",
      name: "Sofía Martínez",
      phone: "380 491-2345",
      service: "Kapping + Retiro de otro salón ($18.000)",
      notes: "Diseño con francesitas",
      createdAt: new Date().toISOString()
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "step5_ticket_mobile.png") });
  await contextMobile.close();

  // 6. Capturas en Escritorio (Desktop 1366 x 768)
  console.log("Capturing Desktop Views...");
  const contextDesktop = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  const pageDesk = await contextDesktop.newPage();
  await pageDesk.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({ path: path.join(OUT_DIR, "step1_services_desktop.png") });

  // Comprobante Desktop
  await pageDesk.evaluate(() => {
    localStorage.setItem("nails_studio_active_appointment", JSON.stringify({
      eventId: "mock_event_123",
      date: "2026-11-20",
      time: "17:00",
      name: "Sofía Martínez",
      phone: "380 491-2345",
      service: "Kapping + Retiro de otro salón ($18.000)",
      notes: "Diseño con francesitas",
      createdAt: new Date().toISOString()
    }));
  });
  await pageDesk.reload({ waitUntil: "networkidle" });
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({ path: path.join(OUT_DIR, "step5_ticket_desktop.png") });
  await contextDesktop.close();

  await browser.close();
  console.log("All flow steps successfully captured in:", OUT_DIR);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
