// Renders the logo concept board to PNGs in /preview/logo-concepts/renders/
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.resolve(__dirname, "../../preview/logo-concepts/index.html");
const OUT = path.resolve(__dirname, "../../preview/logo-concepts/renders");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle0" });
  await sleep(400);

  // full board
  await page.screenshot({ path: path.join(OUT, "00-all-concepts.png"), fullPage: true });
  console.log("✓ 00-all-concepts.png");

  // each concept card
  const ids = [
    ["c1", "01-lumen-wordmark"],
    ["c2", "02-apex-glass"],
    ["c3", "03-prism-pyramid"],
    ["c4", "04-facet-gem"],
    ["c5", "05-converge-flow"],
  ];
  for (const [id, file] of ids) {
    const el = await page.$("#" + id);
    await el.screenshot({ path: path.join(OUT, file + ".png") });
    console.log("✓", file + ".png");
  }

  await browser.close();
  console.log("\nLogo renders written to:", OUT);
}
run().catch((e) => { console.error(e); process.exit(1); });
