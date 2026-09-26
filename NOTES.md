# Notes

Internal working notes for whoever (probably just me) picks this project back up. Not user-facing.

## ⚠️ Before making this repo public or sharing the link

**No API keys, tokens, or credentials exist anywhere in this codebase.** Confirmed by scanning the full source for key/secret/token/password/bearer/auth patterns — zero hits. The app makes zero network calls, so there's nothing to leak on that front.

**Personal data IS hardcoded as default/seed content**, not entered at runtime. Anyone who opens `index.html` or views page source sees these before touching anything:

- The name **"Julia"** (relationships checklist default item)
- **"AbaData"** (referenced as the primary employer/mission context, multiple places)
- Specific academic program names: **GT OMSCS**, **MIT xPRO Quantum Computing**
- Specific entertainment preference: **Markiplier / PewDiePie**
- Hobby detail: **sturgeon fishing** ("Project Sturgeon")
- A personal project list baked into the seed data: **KnoppMap, Project Sturgeon, IBM Quantum Cert, EurekaBitz, Project Alexandria, Book, Quantum AbaData Project**, plus a guitar-practice entry

All of this is default/seed data used to populate the app the first time it's opened — every item is editable/deletable at runtime, but the initial values live in the JS source (`fresh()`, `seedProjects()`, `seedKanban()` functions), so they're visible to anyone who opens the file, views source, or browses the repo on GitHub.

**This is fine for a private repo used only by me.** If this repo is ever made public, or if GitHub Pages is enabled on it (which serves the file at a public URL to anyone), this personal information becomes publicly visible. Two options at that point:
1. Leave it — it's mostly low-sensitivity (a first name, an employer name, hobby/entertainment preferences, project names).
2. Genericize the seed data (e.g., "Partner," "Employer," "Course A," generic project placeholders) so the public version ships blank/generic and personalization happens at runtime instead. I can produce that variant on request — it's a small, mechanical edit to the three seed functions.

## What's fully working

- Mobile-first layout with a bottom tab bar (Today / Build / Journal / Stats / More); on wide screens the tab bar floats and cards sit in two columns.
- Installable home-screen app: `manifest.webmanifest`, iOS meta tags and `apple-touch-icon`, safe-area padding for the notch and home indicator, and `sw.js` for offline use. The navigation is served from cache and refreshed in the background, so the app opens instantly and updates on the following launch.
- All checklists (mission, non-negotiables, mind & momentum, relationships, optimize): tap a row to toggle; ⋯ opens a sheet to edit (label, detail line, emoji), move up/down, or delete.
- Delete, daily reset and restore all show an Undo toast instead of a confirm dialog (restore also asks to confirm first, since it replaces everything).
- Pointer-event drag-to-reorder on every list via the ⠿ handle. It works with touch and mouse, auto-scrolls near the screen edges, and moves build-board cards between columns (on phones you can drop onto the Willing/Building/Shipped segment buttons).
- Academic focus: add/remove/rename sliders, ±5% buttons.
- Build board: segmented single column on phones, three columns on wide screens; arrows or drag to move cards.
- Project portfolio: status filter chips, progress slider, expandable status/start date/notes, delete with undo.
- Journal: custom categories (add from +, remove via Edit), entries grouped by day, edit text and category.
- Consistency engine: current streak (an unfinished today doesn't zero it), best-ever streak, 7-day average, goal days in the last 30, 17-week readiness heatmap. `GOAL` (80%) is near the top of the script.
- Celebration toasts when today crosses the goal and at 100%, plus light haptics on Android.
- Silence timer runs off wall-clock time, so it stays accurate when the phone locks or the app is backgrounded.
- Daily rollover uses the local calendar day and also triggers while the app stays open (every 30 s and whenever it comes back to the foreground).
- Backup (JSON) and CSV use the share sheet on phones (Save to Files / iCloud / Drive) and a normal download on desktop. Restore validates the file first and never half-applies a bad one. A "last backup" date and a More-tab dot nudge you after 7 days.
- Glance summary (in a sheet) and Print; the printed page now includes projects too.
- Data migration: a versioned save format (`v: 5`) with a one-time migration that clears an earlier bug's seeded fake history. Saves from before this redesign load unchanged.

## Fixed in the mobile redesign

- **Dates were UTC, not local.** `today()` used `toISOString()`, so in US time zones the day rolled over in the evening (around 7 pm Central), resetting checklists early and filing evening check-ins and journal entries under tomorrow. East of UTC, `addDays(d, 1)` returned the same day, which broke streak counting. Dates now come from the device's local calendar.
- **Category names with an apostrophe couldn't be selected** (they were spliced into an inline `onclick` string). All actions now go through `data-*` attributes and one delegated event listener, with every value HTML-escaped.
- **No midnight rollover while the app stayed open.** Fixed as described above; this matters much more for a home-screen app that iOS keeps suspended in memory.
- **Import could leave broken state behind.** It now validates the file's shape, confirms before replacing, and can be undone.
- **Save failures were silent.** A toast now warns if storage is full or blocked.
- **Hover-only edit/delete controls were unreachable on touch.** Replaced by the ⋯ sheet, which works everywhere.

## Known limitations

- **No cross-device or cross-browser sync.** See README's storage section. On iPhone, Safari and the installed home-screen app also keep separate storage.
- **Hosting is required for the home-screen install.** Service workers and install only work over HTTPS (or localhost). GitHub Pages is public, so the seed content above becomes visible at that URL.
- **Single-file architecture.** HTML/CSS/JS all live in `index.html`; only the manifest, service worker and icons are separate. Splitting into `styles.css` / `app.js` is still trivial if diffs get unwieldy (remember to add them to `SHELL` in `sw.js`).
- **No automated tests in the repo.** The redesign was checked with Playwright scripts (phone and desktop viewports; Chicago and Berlin time zones; drag, undo, rollover, timer, import) but those aren't committed.
- **Icons are pre-rendered.** `icons/icon.svg` is the source; if you change it, re-render the PNGs (180 apple-touch-icon, 192, 512, 512 maskable, 32 favicon).

## Decisions made that aren't obvious from the code

- **Vanilla JS, no framework, no bundler** — chosen specifically so the whole thing stays a single portable file with zero `npm install`, zero build tooling, and zero external dependencies (see README's "API keys / external services" section — this was a hard requirement after an earlier CDN-dependent version failed to load offline).
- **`localStorage` over IndexedDB** — simplicity over scale; the data volume here (checklists, journal entries, project list) is well within `localStorage`'s size limits (roughly 5 MB; a year of daily journaling is a few hundred KB). The journal has no entry cap; if storage ever fills, the save-failure toast appears.
- **UI preferences live under a separate key** (`dailyos:ui`: last tab, build-board column, project filter, dismissed install tip) so they never mix with your data or backups.
- **Undo over confirm dialogs** — on a phone, confirm dialogs are slow and easy to tap through; a 5-second Undo is both faster and safer.
- **Streak threshold hardcoded at 80%** (`var GOAL=80` near the top) rather than user-configurable — deliberate, to keep the standard meaningful and consistent day to day. Easy to change to a variable/setting later if wanted.
- **The `localStorage` key is literally the string `"dailyos:v4"`** even though the save payload's internal version field is `5`. This mismatch is cosmetic only (it's just a storage bucket name) and was left alone on purpose: renaming the key would orphan anyone's existing saved data (the app would look reset because it'd be reading from a different, empty bucket). If you want to clean this up, do it as an explicit versioned migration (read from the old key once, copy into a new key, then stop reading the old one) rather than a plain rename.
- **Reset button is intentionally partial** — it's a *daily* reset, not a full wipe. It clears the day's checkbox states and the wins/losses lists, but deliberately preserves projects, academic slider values, the journal, and custom categories, since those represent longer-running state you don't want to lose every morning.

## Ideas for what's next

- Genericized/anonymized seed data as an alternate branch or a build flag, for safely hosting publicly without exposing personal specifics (see the flag section above).
- Optional simple sync (e.g., a Gist-based or tiny self-hosted backend) if phone + laptop use becomes common.
- Drag project cards between status columns, mirroring the build board.
- Optional light theme.
- Weekly or monthly rollup view once enough streak history accumulates.
- Local reminders (web push on iOS 16.4+ needs a push server, so this is a bigger step).
