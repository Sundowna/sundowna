// End-to-end checks for the site. Run: npm run test:e2e
// Serves this folder on a local port and drives the installed Edge (or Chrome) with Playwright.
// Screenshots go to out/ (git-ignored).
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "out");
await mkdir(out, { recursive: true });
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([\\/])+/, "");
  try {
    const body = await readFile(join(root, path || "index.html"));
    res.writeHead(200, { "content-type": TYPES[extname(path || "index.html")] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

let browser;
for (const channel of ["msedge", "chrome"]) {
  try { browser = await chromium.launch({ channel, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); break; } catch {}
}
if (!browser) { console.error("No Edge or Chrome found"); process.exit(2); }

const results = [];
async function test(name, fn) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try { await fn(page, errors); results.push([name, true]); console.log("PASS", name); }
  catch (e) { results.push([name, false]); console.log("FAIL", name, "\n   ", e.message); }
  finally { await page.close(); }
}
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

// Pixel stats of the hero canvas: how much of it is lit, and how many different hues.
async function heroStats(page) {
  const shot = await page.locator("#heroVortex canvas").screenshot({ path: join(out, "hero.png") });
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = new OffscreenCanvas(img.width, img.height), g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    let lit = 0; const hues = new Set();
    for (let i = 0; i < d.length; i += 16) {
      const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (mx > 60) lit++;
      if (mx > 70 && mx - mn > 35) {
        let h = mx === r ? (gg - b) / (mx - mn) : mx === gg ? 2 + (b - r) / (mx - mn) : 4 + (r - gg) / (mx - mn);
        hues.add(Math.floor(((h * 60 + 360) % 360) / 30));
      }
    }
    return { litShare: lit / (d.length / 16), hueBuckets: hues.size };
  }, shot.toString("base64"));
}

// F-001
await test("F-001 the hero shows a moving 3D attractor behind the heading", async (page, errors) => {
  await page.goto(base + "?ff");
  await page.waitForSelector("#heroVortex canvas", { timeout: 20000 });
  await page.waitForTimeout(2500);
  const s = await heroStats(page);
  assert(s.litShare > 0.005, `hero canvas is almost blank (lit share ${s.litShare.toFixed(4)})`);
  assert(await page.locator("#hero-title").isVisible(), "heading not visible");
  assert(errors.length === 0, "page errors: " + errors.join("; "));
});

// F-002
await test("F-002 the camera label shows the shot number and name", async (page) => {
  await page.goto(base + "?ff");
  await page.waitForSelector(".vortex-shot", { timeout: 20000 });
  const text = (await page.locator(".vortex-shot").innerText()).replace(/\s+/g, " ");
  assert(/Shot 01 \/ Wide/.test(text), `label reads "${text}"`);
  await page.goto(base + "?ff&shot=3");
  await page.waitForSelector(".vortex-shot", { timeout: 20000 });
  const t3 = (await page.locator(".vortex-shot").innerText()).replace(/\s+/g, " ");
  assert(/Shot 03 \/ Along the spine/.test(t3), `?shot=3 label reads "${t3}"`);
});

// F-003
await test("F-003 the hero animates: two frames a second apart differ", async (page) => {
  await page.goto(base + "?ff");
  await page.waitForSelector("#heroVortex canvas", { timeout: 20000 });
  await page.waitForTimeout(1500);
  const a = await page.locator("#heroVortex canvas").screenshot();
  await page.waitForTimeout(1000);
  const b = await page.locator("#heroVortex canvas").screenshot();
  assert(!a.equals(b), "hero did not change between frames");
});

// F-004
await test("F-004 with reduced motion the hero draws one still frame without the shot label", async (page) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.waitForSelector("#heroVortex canvas", { timeout: 20000 });
  await page.waitForTimeout(1500);
  const s = await heroStats(page);
  assert(s.litShare > 0.005, "still frame is blank");
  assert(await page.locator(".vortex-shot").isHidden(), "shot label still visible");
  const a = await page.locator("#heroVortex canvas").screenshot();
  await page.waitForTimeout(800);
  const b = await page.locator("#heroVortex canvas").screenshot();
  assert(a.equals(b), "hero moved with reduced motion on");
});

// F-005
await test("F-005 the hero is drawn in many colours (Spectrum palette)", async (page) => {
  await page.goto(base + "?ff");
  await page.waitForSelector("#heroVortex canvas", { timeout: 20000 });
  await page.waitForTimeout(2500);
  const s = await heroStats(page);
  assert(s.hueBuckets >= 5, `only ${s.hueBuckets} hue groups visible`);
});

await browser.close();
server.close();
const failed = results.filter(([, ok]) => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
