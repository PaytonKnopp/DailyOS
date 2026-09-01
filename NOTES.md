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

- All checklists (mission, non-negotiables, mind & momentum, relationships): toggle, add, edit, delete, drag-to-reorder.
- Academic focus: add/remove/rename sliders, ±5% buttons, drag-to-reorder.
- Build board (Willing/Building/Shipped): add/edit/delete cards, move via arrows, drag-to-reorder within and across columns.
- Project portfolio: add/edit/delete, progress slider, status dropdown, start date, expandable notes, drag-to-reorder.
- Wins/losses: point-form add/edit/delete lists, net score.
- Journal: default + custom categories (add/remove categories), add/edit/delete entries, Ctrl/Cmd+Enter to log.
- Optimize note + checklist, and a separate free-form Suggestions list.
- Consistency engine: current streak, best-ever streak, today's per-sector breakdown. Streak threshold is 80% daily readiness, defined as `GOAL` near the top of the script.
- Glance view (read-only daily summary) and Print (light-themed one-pager via the browser's native print/PDF).
- Backup (JSON) / Import (JSON) / CSV export.
- Daily rollover: on first load of a new calendar day, checkboxes and wins/losses reset automatically; projects, academic progress, journal, and custom lists persist.
- Data migration: a versioned save format (`v: 5` in the stored JSON) with a one-time migration that clears an earlier bug's seeded fake history so streak counts start honestly at 0 for anyone upgrading from an older save.

## Known limitations / half-finished

- **No cross-device or cross-browser sync** — see README's storage section. This is a deliberate simplicity tradeoff, not a bug, but worth solving if this becomes a daily driver across a phone + laptop.
- **No undo and no delete confirmation** — deleting a list item, project, or journal entry is immediate and irreversible in-app (a JSON backup is the only safety net).
- **Kanban/project status changes aren't drag-driven** — you can drag project *cards* to reorder them, but changing a project's status is still a dropdown, not a drag between status columns (unlike the build board, which does support drag-between-columns). Could unify these into one pattern later.
- **Print sheet is a fixed summary layout** — it doesn't include the project portfolio or optimize/suggestions sections. Would need explicit additions if you want those on the printed page.
- **Input sanitization is minimal** — `attr()` only escapes double quotes for attribute values; adequate for a single-user local tool with no server, but not hardened against anything adversarial. Not a concern unless this ever accepts input from anyone but you.
- **Single-file architecture** — everything (HTML/CSS/JS) lives in one `index.html` on purpose, to keep it a true zero-build, double-click-to-run artifact. If the codebase grows a lot in Visual Studio, consider splitting into `styles.css` / `app.js` / `index.html` — trivial to do, just a `<link>`/`<script src>` and three files instead of one. No functional change either way since there's still no build step.
- **No automated tests.** Manual testing only so far.

## Decisions made that aren't obvious from the code

- **Vanilla JS, no framework, no bundler** — chosen specifically so the whole thing stays a single portable file with zero `npm install`, zero build tooling, and zero external dependencies (see README's "API keys / external services" section — this was a hard requirement after an earlier CDN-dependent version failed to load offline).
- **`localStorage` over IndexedDB** — simplicity over scale; the data volume here (checklists, a few hundred journal entries, project list) is well within `localStorage`'s size limits.
- **Streak threshold hardcoded at 80%** (`var GOAL=80` near the top) rather than user-configurable — deliberate, to keep the standard meaningful and consistent day to day. Easy to change to a variable/setting later if wanted.
- **The `localStorage` key is literally the string `"dailyos:v4"`** even though the save payload's internal version field is `5`. This mismatch is cosmetic only (it's just a storage bucket name) and was left alone on purpose: renaming the key would orphan anyone's existing saved data (the app would look reset because it'd be reading from a different, empty bucket). If you want to clean this up, do it as an explicit versioned migration (read from the old key once, copy into a new key, then stop reading the old one) rather than a plain rename.
- **Reset button is intentionally partial** — it's a *daily* reset, not a full wipe. It clears the day's checkbox states and the wins/losses lists, but deliberately preserves projects, academic slider values, the journal, and custom categories, since those represent longer-running state you don't want to lose every morning.

## Ideas for what's next

- Genericized/anonymized seed data as an alternate branch or a build flag, for safely sharing the code publicly without exposing personal specifics (see the flag section above).
- Optional simple sync (e.g., a Gist-based or tiny self-hosted backend) if cross-device access becomes worth the added complexity.
- Drag project cards between status columns (Idea/Active/On Hold/Shipped), mirroring the build board's pattern.
- Undo (a few seconds' grace period) or a lightweight confirm step before destructive deletes.
- Extend the printable summary to include projects and optimize/suggestions.
- Optional light theme / theme toggle.
- Weekly or monthly rollup view once enough streak history accumulates.
- If the file grows much further, split into `index.html` + `styles.css` + `app.js` for easier diffs in Git — purely organizational, no behavior change.
