// Generates a structured visual preview pack of the Lumive AI site.
// Usage: node scripts/screenshots.mjs   (dev server must be running on BASE)
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = process.env.PREVIEW_BASE || "http://localhost:4010";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../../preview/screenshots");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Scroll through the page in steps to trigger IntersectionObservers
// (reveals + animated counters), then return to top.
async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await sleep(600);
}

// Force reveal-on-scroll elements visible + freeze animations for clean full-page shots.
const REVEAL_CSS = `
  .reveal{opacity:1!important;transform:none!important;transition:none!important}
  *{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}
`;

async function openAssistant(page) {
  await page.evaluate(() => {
    const b = document.querySelector('button[aria-label="Open the Lumive AI Assistant"]');
    if (b) b.click();
  });
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await sleep(700);
}

async function sendToAssistant(page, text) {
  await page.evaluate((t) => {
    const input = document.querySelector('[role="dialog"] input');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, t);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const form = input.closest("form");
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  }, text);
  await sleep(2600); // wait for paced replies + cards
}

async function shotEl(page, selector, file) {
  const el = await page.$(selector);
  if (!el) {
    console.warn("  ! missing selector:", selector);
    return;
  }
  await el.screenshot({ path: path.join(OUT, file) });
  console.log("  ✓", file);
}

async function run() {
  await mkdir(path.join(OUT, "sections"), { recursive: true });
  await mkdir(path.join(OUT, "assistant"), { recursive: true });

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });

  // ---------- DESKTOP ----------
  const desk = await browser.newPage();
  await desk.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desk.goto(BASE, { waitUntil: "networkidle0" });
  await desk.addStyleTag({ content: REVEAL_CSS });
  await autoScroll(desk);

  // full-length home
  await desk.screenshot({ path: path.join(OUT, "01-home-desktop-full.png"), fullPage: true });
  console.log("✓ 01-home-desktop-full.png");

  // key sections
  await shotEl(desk, "#top", "sections/hero.png");
  await shotEl(desk, "#trust", "sections/trust.png");
  await shotEl(desk, "#story", "sections/storytelling.png");
  await shotEl(desk, "#services", "sections/services.png");
  await shotEl(desk, "#process", "sections/process-timeline.png");
  await shotEl(desk, "#framework", "sections/90-day-framework.png");
  await shotEl(desk, "#readiness", "sections/ai-readiness.png");
  await shotEl(desk, "#why", "sections/why-lumive.png");
  await shotEl(desk, "#founder", "sections/founder.png");
  await shotEl(desk, "#contact", "sections/contact.png");
  await shotEl(desk, "#book", "sections/final-cta.png");
  await shotEl(desk, "footer", "sections/footer.png");

  // assistant — desktop open (greeting)
  await openAssistant(desk);
  await desk.screenshot({ path: path.join(OUT, "assistant/assistant-desktop-open.png") });
  console.log("✓ assistant-desktop-open.png");

  // assistant — desktop services answer
  await sendToAssistant(desk, "What services do you offer?");
  await desk.screenshot({ path: path.join(OUT, "assistant/assistant-desktop-services.png") });
  console.log("✓ assistant-desktop-services.png");

  // assistant — desktop WhatsApp/Telegram contact state
  await sendToAssistant(desk, "I want to talk to a real person now");
  await desk.screenshot({ path: path.join(OUT, "assistant/assistant-desktop-contacts.png") });
  console.log("✓ assistant-desktop-contacts.png");

  await desk.close();

  // ---------- MOBILE ----------
  const mob = await browser.newPage();
  await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
  await mob.goto(BASE, { waitUntil: "networkidle0" });
  await mob.addStyleTag({ content: REVEAL_CSS });
  await autoScroll(mob);

  await mob.screenshot({ path: path.join(OUT, "02-home-mobile-full.png"), fullPage: true });
  console.log("✓ 02-home-mobile-full.png");

  // assistant — mobile open (full screen)
  await openAssistant(mob);
  await mob.screenshot({ path: path.join(OUT, "assistant/assistant-mobile-open.png") });
  console.log("✓ assistant-mobile-open.png");

  // assistant — mobile WhatsApp/Telegram contact state
  await sendToAssistant(mob, "I want to talk to a real person now");
  await mob.screenshot({ path: path.join(OUT, "assistant/assistant-mobile-contacts.png") });
  console.log("✓ assistant-mobile-contacts.png");

  await mob.close();

  // ---------- LUMIVE LAB (desktop) ----------
  const lab = await browser.newPage();
  await lab.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await lab.goto(BASE + "/lab", { waitUntil: "networkidle0" });
  await lab.addStyleTag({ content: REVEAL_CSS });
  await autoScroll(lab);
  await lab.screenshot({ path: path.join(OUT, "03-lumive-lab-desktop-full.png"), fullPage: true });
  console.log("✓ 03-lumive-lab-desktop-full.png");
  await lab.close();

  // ---------- LUMIVE LAB (mobile) ----------
  const labm = await browser.newPage();
  await labm.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
  await labm.goto(BASE + "/lab", { waitUntil: "networkidle0" });
  await labm.addStyleTag({ content: REVEAL_CSS });
  await autoScroll(labm);
  await labm.screenshot({ path: path.join(OUT, "04-lumive-lab-mobile-full.png"), fullPage: true });
  console.log("✓ 04-lumive-lab-mobile-full.png");
  await labm.close();

  await browser.close();
  console.log("\nPreview pack written to:", OUT);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
