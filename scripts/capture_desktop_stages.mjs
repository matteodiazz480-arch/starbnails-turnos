import { chromium } from "playwright";
import path from "path";

const OUT_DIR = "B:/Workspace/booking-app/public/flow_captures";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto("https://starbnailslr.netlify.app/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Step 1 Desktop clean
  console.log("Desktop Step 1 clean...");
  await page.screenshot({ path: path.join(OUT_DIR, "step1_clean_desktop.png") });

  // 2. Step 1 Desktop selected (Kapping + Retiro)
  console.log("Desktop Step 1 selected...");
  await page.locator("button:has-text('Kapping')").first().click();
  await page.locator("button:has-text('Sumar retiro')").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "step1_selected_desktop.png") });

  // 3. Step 2 Desktop (Día y Horarios)
  console.log("Desktop Step 2 datetime...");
  await page.locator("button:has-text('Elegir Día y Hora')").first().click();
  await page.waitForTimeout(1000);
  const slotBtn = page.locator("button:has-text('hs')").first();
  if (await slotBtn.isVisible()) {
    await slotBtn.click();
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "step2_datetime_desktop.png") });

  // 4. Step 3 Desktop (Formulario)
  console.log("Desktop Step 3 form...");
  await page.locator("button:has-text('Continuar')").first().click();
  await page.waitForTimeout(800);
  await page.fill("input[placeholder*='Lucía']", "Sofía Martínez");
  await page.fill("input[placeholder*='380']", "380 491-2345");
  await page.fill("textarea", "Diseño con francesitas y glitter");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "step3_form_desktop.png") });

  await browser.close();
  console.log("Desktop stages captured successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
