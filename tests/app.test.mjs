// Browser tests for Daily OS. Run from this folder: npm install && npx playwright install chromium && npm test
// Times carry an explicit -05:00 offset because the pages run in America/Chicago (CDT).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE_URL = "file://" + path.join(ROOT, "index.html");
const KEY = "dailyos:v4";
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

/* opens the app at a fixed wall-clock time; `data` is merged into the saved state before the real load */
async function open({ time = "2026-09-26T12:00:00-05:00", tz = "America/Chicago", width = 390, height = 844, data, url = FILE_URL, touch = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, timezoneId: tz, hasTouch: touch, isMobile: touch, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/service worker|sw\.js/i.test(m.text())) errors.push(m.text()); });
  await page.clock.install({ time: new Date(time) });
  await page.goto(url);
  if (data) {
    await page.evaluate(([k, d]) => { const cur = JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(Object.assign(cur, d))); }, [KEY, data]);
    await page.reload();
  }
  return { ctx, page, errors };
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
const checkNext = (page) => page.locator('.row[data-a="toggle"]:not(.done)').first().click({ position: { x: 60, y: 20 } });
async function checkN(page, n) { for (let i = 0; i < n; i++) await checkNext(page); }
const tab = (page, t) => page.click(`.tab[data-t="${t}"]`);
const day = 24 * 3600 * 1000;

test("every tab renders without errors on phone and desktop", async () => {
  for (const width of [390, 1280]) {
    const { ctx, page, errors } = await open({ width });
    for (const t of ["today", "build", "journal", "stats", "more"]) {
      await tab(page, t);
      assert.ok(await page.locator("main .card").count() > 0, `${t} has content`);
    }
    await tab(page, "more");
    await page.click('[data-a="glance"]');
    await page.click('.sheet [data-a="closeSheet"]');
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

// The repo is public, so the first-launch content has to stay generic. Personal setups come from a restored backup, never from the source.
test("a first launch starts from the generic starter content", async () => {
  const { ctx, page } = await open();
  const d = await saved(page);
  assert.deepEqual(d.s.rel.map((x) => x.label), ["Quality time with someone you love", "Guilt-free downtime", "Media kept intentional", "Time for a hobby"]);
  assert.deepEqual(d.projects.map((x) => x.title), ["Side project", "Certification or course", "Learn an instrument", "Write a book"]);
  await ctx.close();
});

test("the journal never drops old entries", async () => {
  const entries = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, text: "entry " + i, tag: "Idea", t: "9:00 AM", date: "2026-01-01" }));
  const { ctx, page } = await open({ data: { entries } });
  await tab(page, "journal");
  await page.fill("#draftbox", "entry 1000");
  await page.click('[data-a="log"]');
  const d = await saved(page);
  assert.equal(d.entries.length, 1001);
  assert.ok(d.entries.some((e) => e.text === "entry 999"));
  await ctx.close();
});

test("journal search filters entries", async () => {
  const entries = [
    { id: 1, text: "Ran 5k by the river", tag: "Idea", t: "7:00 AM", date: "2026-09-25" },
    { id: 2, text: "Book club notes", tag: "Creativity", t: "8:00 PM", date: "2026-09-25" },
    { id: 3, text: "River cleanup idea", tag: "Productivity", t: "9:00 PM", date: "2026-09-24" },
  ];
  const { ctx, page } = await open({ data: { entries } });
  await tab(page, "journal");
  await page.fill("#jsearch", "river");
  assert.equal(await page.locator("#jlist .entry").count(), 2);
  await page.fill("#jsearch", "creativity");
  assert.equal(await page.locator("#jlist .entry").count(), 1);
  await page.fill("#jsearch", "zzz");
  assert.match(await page.locator("#jlist").textContent(), /No entries match/);
  await ctx.close();
});

test("a check-off in the seconds after the day ends counts for the day on screen", async () => {
  const { ctx, page } = await open({ time: "2026-09-26T23:59:40-05:00", data: { settings: { dayStart: 0, remind: "21:00" } } });
  await checkN(page, 10); // 77%
  await page.clock.fastForward(25000); // 00:00:05, before the 30 s rollover tick
  await checkNext(page); // 85% for the 26th
  await page.clock.fastForward(40000);
  const h = (await saved(page)).history;
  assert.equal(h.find((r) => r.date === "2026-09-26").pct, 85);
  assert.equal(h.find((r) => r.date === "2026-09-27").pct, 0);
  await ctx.close();
});

test("late nights count toward the day until the day-end hour (default 3 AM)", async () => {
  const { ctx, page } = await open({ time: "2026-09-26T21:00:00-05:00" });
  await checkN(page, 10);
  await page.clock.fastForward(3.5 * 3600 * 1000); // 00:30 on the 27th
  assert.equal((await saved(page)).s.date, "2026-09-26", "still the 26th after midnight");
  await checkNext(page); // read before bed, checked at 12:30 AM
  assert.equal(await page.locator(".streak b").textContent(), "1");
  await page.clock.fastForward(3 * 3600 * 1000); // 03:30
  const d = await saved(page);
  assert.equal(d.s.date, "2026-09-27");
  assert.equal(d.history.find((r) => r.date === "2026-09-26").pct, 85);
  await ctx.close();
});

test("the day-end setting can be changed from More", async () => {
  const { ctx, page } = await open({ time: "2026-09-27T01:30:00-05:00" });
  assert.equal((await saved(page)).s.date, "2026-09-26");
  await tab(page, "more");
  await page.selectOption('select[data-ch="dayStart"]', "0");
  const d = await saved(page);
  assert.equal(d.settings.dayStart, 0);
  assert.equal(d.s.date, "2026-09-27", "moving the day end earlier rolls straight into the new day");
  await ctx.close();
});

test("each day keeps which habits were done, plus its wins and losses", async () => {
  const { ctx, page } = await open({ time: "2026-09-26T12:00:00-05:00" });
  await checkN(page, 11);
  await tab(page, "journal");
  await page.fill("#add-wins", "Shipped the thing");
  await page.press("#add-wins", "Enter");
  await page.fill("#add-losses", "Skipped lunch");
  await page.press("#add-losses", "Enter");
  await page.clock.fastForward(day);
  const d = await saved(page);
  const rec = d.history.find((r) => r.date === "2026-09-26");
  assert.equal(rec.done.length, 11);
  assert.equal(rec.open.length, 2);
  assert.deepEqual(rec.wins, ["Shipped the thing"]);
  assert.deepEqual(rec.losses, ["Skipped lunch"]);
  assert.deepEqual(d.s.wins, [], "today starts clean");
  await tab(page, "stats");
  await page.click('.cell[data-k="2026-09-26"]');
  const sheet = await page.locator(".sheet").textContent();
  assert.match(sheet, /Shipped the thing/);
  assert.match(sheet, /Skipped lunch/);
  assert.match(sheet, /Missed · 2/);
  await ctx.close();
});

test("rest days are not counted against you", async () => {
  const { ctx, page } = await open({ time: "2026-09-26T12:00:00-05:00" }); // a Saturday
  await page.locator('.row[data-id="n2"] [data-a="more"]').click();
  await page.click('.sheet [data-a="edit"]');
  await page.click('#ed-days [data-i="6"]');
  await page.click('.sheet [data-a="saveEdit"]');
  assert.equal(await page.locator('.row.off[data-id="n2"]').count(), 1);
  assert.match(await page.locator(".pills").textContent(), /0\/12 done/);
  await checkN(page, 10);
  assert.equal(await page.locator(".ring-v b").textContent(), "83%");
  await ctx.close();
});

test("habit stats, the honest 7-day average and the week review read the history", async () => {
  const ids = ["ms1", "n1", "n2", "n3", "n4", "n5", "m1", "m2", "m3", "r1", "r2", "r3", "r4"];
  const history = [];
  for (let i = 10; i >= 1; i--) {
    const date = new Date(2026, 8, 26 - i).toLocaleDateString("en-CA");
    if (i === 4) continue; // a skipped day: never opened the app
    const done = i % 2 ? ids : ids.filter((x) => x !== "n2");
    history.push({ date, pct: Math.round((done.length / 13) * 100), done, open: ids.filter((x) => !done.includes(x)), wins: ["w" + i] });
  }
  const { ctx, page, errors } = await open({ time: "2026-09-26T12:00:00-05:00", data: { history } });
  await tab(page, "stats");
  // 7 days before today: 100,92,100,(skipped=0),100,92,100 → 83
  assert.equal(await page.locator(".tile").nth(2).locator("b").textContent(), "83%");
  const workout = page.locator(".hb", { hasText: "Workout" });
  assert.match(await workout.locator(".hb-r b").textContent(), /^\d+%$/);
  const sleep = page.locator(".hb", { hasText: "7–9 hours of sleep" });
  assert.match(await sleep.locator(".hb-r small").textContent(), /🔥 3/);
  assert.match(await page.locator(".wk").textContent(), /Wins logged6/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("a timer survives the app being closed and checks its habit off when it ends", async () => {
  const { ctx, page } = await open({ time: "2026-09-26T08:00:00-05:00" });
  await page.click('.row[data-id="m2"] [data-a="silToggle"]');
  await page.clock.fastForward(60 * 1000);
  await page.reload();
  const left = await page.locator("#tm-m2").textContent();
  assert.ok(/^[34]:\d\d$/.test(left), "about 4 minutes left after reopening, got " + left);
  await page.clock.fastForward(5 * 60 * 1000);
  assert.equal(await page.locator('.row[data-id="m2"]').getAttribute("aria-checked"), "true");
  await ctx.close();
});

test("half-typed text in an add field survives a re-render", async () => {
  const { ctx, page } = await open();
  await page.fill("#add-nonNeg", "Stretch for 10 min");
  await checkNext(page);
  assert.equal(await page.inputValue("#add-nonNeg"), "Stretch for 10 min");
  await page.press("#add-nonNeg", "Enter");
  assert.equal(await page.inputValue("#add-nonNeg"), "");
  assert.equal(await page.locator(".row", { hasText: "Stretch for 10 min" }).count(), 1);
  await ctx.close();
});

test("back up and restore round-trips everything, and a damaged file can't inject markup", async () => {
  const { ctx, page, errors } = await open({ width: 1280 });
  await checkN(page, 3);
  await tab(page, "more");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-a="backup"]')]);
  const backup = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  assert.ok(backup.history.length && backup.names && backup.settings);
  backup.s.nonNeg[0].label = "Restored label";
  backup.cats[0].color = 'red"><img src=x onerror=alert(1)>';
  page.once("dialog", (d) => d.accept());
  await page.setInputFiles("#fileimport", { name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await tab(page, "today");
  await page.locator(".row", { hasText: "Restored label" }).waitFor();
  await tab(page, "journal");
  assert.equal(await page.locator("main img").count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("the reminder is a daily repeating calendar event with an alert", async () => {
  const { ctx, page } = await open({ width: 1280 });
  await tab(page, "more");
  await page.click('[data-a="remind"]');
  await page.fill("#rem-time", "21:30");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-a="remindIcs"]')]);
  const ics = fs.readFileSync(await dl.path(), "utf8");
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:\d{8}T213000\r\n/);
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.match(ics, /BEGIN:VALARM/);
  assert.equal((await saved(page)).settings.remind, "21:30");
  await ctx.close();
});

test("saves from the previous version load and upgrade", async () => {
  const { ctx, page, errors } = await open({ time: "2026-09-26T12:00:00-05:00" });
  const old = await saved(page);
  delete old.settings; delete old.names;
  old.s.date = "2026-09-25";
  old.s.mind[1] = { id: "m2", iconKey: "brain", label: "Silent thought", sub: "", done: true, timer: true };
  old.s.nonNeg.forEach((x) => (x.done = true));
  old.s.wins = [{ id: "w1", label: "Old win", done: false }];
  old.history = [{ date: "2026-09-24", pct: 90 }, { date: "2026-09-25", pct: 46 }];
  await page.evaluate(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [KEY, old]);
  await page.reload();
  const d = await saved(page);
  assert.equal(d.s.date, "2026-09-26");
  const y = d.history.find((r) => r.date === "2026-09-25");
  assert.equal(y.done.length, 6, "yesterday's detail is captured on the first launch after the update");
  assert.deepEqual(y.wins, ["Old win"]);
  assert.equal(await page.locator("#tm-m2").textContent(), "5:00");
  await tab(page, "stats");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("installed app: works offline from the service worker cache", async () => {
  const types = { ".html": "text/html", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\/$/, "/index.html"));
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await ctx.setOffline(true);
  await page.reload();
  assert.ok(await page.locator(".hero").count(), "app shell loads offline");
  await ctx.close();
  server.close();
});
