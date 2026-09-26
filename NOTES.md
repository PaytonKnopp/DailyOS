# Notes

Internal working notes for whoever (probably just me) picks this project back up. Not user-facing.

## Privacy: this repo is public and served by GitHub Pages

**No API keys, tokens, or credentials exist anywhere in this codebase.** The app makes zero network calls, so there's nothing to leak on that front.

**The starter content is generic.** The seed functions (`fresh()`, `seedKanban()`, `seedProjects()`) only fill the app the very first time it opens on a device, and they now hold neutral placeholders ("Quality time with someone you love", "Side project", …). A test checks that a first launch starts from the generic content. Everything you actually enter lives only in your device's storage and is never in the repo.

**Older commits still contain the original personal seed content** (names, employer, courses, project list). Removing it from GitHub entirely means rewriting `master`'s history and force-pushing, which breaks any existing clones and doesn't reach forks or caches. It's low-sensitivity, so this was left as is; do the rewrite deliberately if you ever want it gone.

## What's fully working

- Mobile-first layout with a bottom tab bar (Today / Build / Journal / Stats / More); on wide screens the tab bar floats and cards sit in two columns.
- Installable home-screen app: `manifest.webmanifest`, iOS meta tags and `apple-touch-icon`, safe-area padding for the notch and home indicator, and `sw.js` for offline use. The navigation is served from cache and refreshed in the background. When a new service worker takes over, an open app shows "Daily OS was updated · Reload"; the app also checks for a new version whenever it comes back to the foreground (at most hourly).
- All checklists (mission, non-negotiables, mind & momentum, relationships, optimize): tap a row to toggle; ⋯ opens a sheet to edit (label, detail line, emoji, timer length, which days it repeats), move up/down, or delete.
- **Rest days:** a habit can repeat on chosen weekdays. On its off days it's shown dimmed as "Rest day · not counted today" and is left out of readiness, the streak and habit stats. A day where every habit rests counts as 100%.
- **Timers on any habit** (minutes, set in Edit). One runs at a time, off wall-clock time, and its state is saved, so it keeps going if the phone locks or iOS closes the app. When it ends the habit is checked off. The seeds put 5 min on silent thought and 30 min on reading.
- **Day end hour** (More → Settings, default 3 AM): the day turns over at that hour instead of midnight, so late nights count toward the day they belong to. Dates everywhere (header, journal, history) use this logical day.
- Delete, daily reset and restore all show an Undo toast instead of a confirm dialog (restore also asks to confirm first, since it replaces everything).
- Pointer-event drag-to-reorder on every list via the ⠿ handle. It works with touch and mouse, auto-scrolls near the screen edges, and moves build-board cards between columns (on phones you can drop onto the Willing/Building/Shipped segment buttons).
- Academic focus: add/remove/rename sliders, ±5% buttons.
- Build board: segmented single column on phones, three columns on wide screens; arrows or drag to move cards.
- Project portfolio: status filter chips, progress slider, expandable status/start date/notes, delete with undo.
- Journal: custom categories (add from +, remove via Edit), entries grouped by day, edit text and category, **search** (text and category), no entry limit. The unsent draft survives the app closing.
- Consistency engine: current streak (an unfinished today doesn't zero it), best-ever streak, 7-day average, goal days in the last 30, readiness heatmap (as many weeks as fit: ~4 months on a phone, up to a year on a wide screen). `GOAL` (80%) is near the top of the script.
- **Tap any day on the heatmap** for its detail: score, habits done and missed, wins, losses and that day's journal entries.
- **Week in review:** the last 7 full days against the 7 before (average readiness, goal days, wins, losses, journal entries) plus the strongest habit and the one needing attention.
- **Habit consistency:** every habit's 30-day hit rate, current run, and a 14-day strip (done / missed / rest / today).
- **Check-in reminder** (More → Settings): creates a daily repeating calendar event with an alert (.ics), and shows the iPhone Shortcuts steps for a notification.
- Celebration toasts when today crosses the goal and at 100%, plus light haptics on Android.
- Daily rollover also triggers while the app stays open (every 30 s and whenever it comes back to the foreground). Half-typed text in an add field survives re-renders.
- Backup (JSON) and CSV use the share sheet on phones (Save to Files / iCloud / Drive) and a normal download on desktop. Restore validates the file, sanitizes every value that reaches the page, and never half-applies a bad one. A "last backup" date and a More-tab dot nudge you after 7 days. The CSV has one row per day: score, habits done and missed, wins and losses.
- Glance summary (in a sheet) and Print; the printed page includes projects too.
- Data migration: saves from every earlier version load unchanged. On the first launch after this update, the last unfinished day gets its full record written before it resets.

## Fixed along the way

- **Dates were UTC, not local** (mobile redesign). Dates now come from the device's local calendar.
- **Category names with an apostrophe couldn't be selected** (mobile redesign). All actions go through `data-*` attributes and one delegated listener, with every value HTML-escaped.
- **No rollover while the app stayed open** (mobile redesign).
- **Import could leave broken state behind; save failures were silent; hover-only controls were unreachable on touch** (mobile redesign).
- **The journal silently deleted its oldest entry once it passed 1,000.** No cap now.
- **A check-off in the ~30 s between the day ending and the rollover tick was filed under the new day and then wiped**, which could cost the previous day its streak. Readiness is recorded under the day the on-screen checklist belongs to (`S.date`).
- **Wins and losses were deleted every midnight with no record**, and history only kept one % per day. Each day's record now keeps both.
- **The 7-day average skipped days you never opened the app**, which made it look better than it was. Those days now count as 0 (only after your first day of use).
- **An emoji couldn't be removed from a seeded habit** (it fell back to the built-in icon). Clearing the field now clears it.

## Known limitations

- **No cross-device or cross-browser sync.** See README's storage section. On iPhone, Safari and the installed home-screen app also keep separate storage.
- **Hosting is required for the home-screen install.** Service workers and install only work over HTTPS (or localhost).
- **No push notifications.** Web push needs a server; reminders go through the calendar or iOS Shortcuts instead.
- **Past days can't be edited.** The day-end hour covers the common "checked it after midnight" case.
- **Habit-by-habit history starts with this version.** Days recorded earlier only have their overall %.
- **Single-file architecture.** HTML/CSS/JS all live in `index.html`; only the manifest, service worker and icons are separate. If you split it, add the new files to `SHELL` in `sw.js`.
- **Icons are pre-rendered.** `icons/icon.svg` is the source; if you change it, re-render the PNGs (180 apple-touch-icon, 192, 512, 512 maskable, 32 favicon).

## Tests

`tests/` holds browser tests (Node's built-in test runner + Playwright) that cover every behavior above: rollover and the day-end hour, rest days, history records, stats, timers surviving a restart, backup/restore round-trips and sanitizing, the reminder file, upgrades from older saves, and offline loading through the service worker. They run on every push via `.github/workflows/tests.yml`. Locally:

```
cd tests && npm ci && npx playwright install chromium && npm test
```

The app itself still has no dependencies; `tests/` is the only place with a `package.json`.

## Decisions made that aren't obvious from the code

- **Vanilla JS, no framework, no bundler** — so the whole thing stays a single portable file with zero `npm install`, zero build tooling, and zero external dependencies (a hard requirement after an earlier CDN-dependent version failed to load offline).
- **`localStorage` over IndexedDB** — the data volume (checklists, journal entries, a small record per day) is well within `localStorage`'s ~5 MB; a year of daily use is a few hundred KB. If storage ever fills, the save-failure toast appears.
- **Day records** (`history[]`): `{date, pct, done:[ids], open:[ids], wins?:[text], losses?:[text]}`. `open` means scheduled but not done; a habit resting that day is in neither list. `names` maps every habit id ever seen to its label and emoji, so old days still read correctly after a habit is renamed or deleted.
- **Settings live in the data** (`settings: {dayStart, remind}`), so they travel with backups. UI-only preferences (`dailyos:ui`: last tab, build-board column, project filter, dismissed install tip, the running timer, the journal draft) stay under their own key and never go into backups.
- **The day-end hour only ever moves the day forward.** If you set it later just after the day already turned over, the new day simply keeps running until the clock catches up; nothing is merged back.
- **Default day end is 3 AM**, not midnight: the checklist has bedtime habits, and midnight made them impossible to check off late.
- **Undo over confirm dialogs** — on a phone, confirm dialogs are slow and easy to tap through; a 5-second Undo is both faster and safer.
- **Streak threshold hardcoded at 80%** (`var GOAL=80`) — deliberate, to keep the standard meaningful and consistent day to day.
- **The `localStorage` key is literally `"dailyos:v4"`** even though the payload's version field is `5`. Renaming the key would orphan existing data; if you ever clean this up, do it as an explicit migration (read the old key once, copy to the new one).
- **Reset button is intentionally partial** — a *daily* reset: it clears today's checks and today's wins/losses, and keeps projects, academic progress, the journal, categories and history.
- **Bump `VERSION` in `sw.js` whenever `index.html` or the icons change**, so installed copies re-cache and show the "updated" prompt.

## Ideas for what's next

- Optional simple sync (e.g., a Gist-based or tiny self-hosted backend) if phone + laptop use becomes common.
- Drag project cards between status columns, mirroring the build board.
- Optional light theme.
