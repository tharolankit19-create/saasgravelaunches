/**
 * Refresh the screenshot baked into the social card.
 *
 * The landing OG image (src/app/opengraph-image.tsx) embeds public/og-app.png —
 * a real capture of the live leaderboard, because a drawn mock-up reads as a
 * mock-up. Re-run this whenever the board looks meaningfully different:
 *
 *   node scripts/refresh-og-shot.mjs                  # against production
 *   TARGET=http://localhost:3000 node scripts/refresh-og-shot.mjs
 *
 * Needs playwright available (`npx playwright install chromium` once).
 */
import { chromium } from "playwright";
import path from "node:path";

const TARGET = process.env.TARGET || "https://ls.saasgrave.org";
const OUT = path.join(process.cwd(), "public", "og-app.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${TARGET}/leaderboard`, { waitUntil: "networkidle", timeout: 45_000 });
await page.waitForTimeout(2500);

// Drop the sticky masthead so the crop is pure app content.
await page.evaluate(() => {
  const h = document.querySelector("header");
  if (h) h.style.display = "none";
});
await page.evaluate(() => window.scrollTo(0, 250));
await page.waitForTimeout(1200);

await page.screenshot({ path: OUT, clip: { x: 60, y: 60, width: 1160, height: 640 } });
await browser.close();

console.log(`Saved ${OUT} from ${TARGET}`);
