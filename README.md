# Daily OS

A single-page, dark-mode personal dashboard for daily priorities, habits, projects, and journaling. Built as a "life control panel" rather than a plain to-do list: apex priorities, non-negotiable daily habits, a project portfolio with progress tracking, a habit-consistency/streak engine, win/loss logging, and a quick-capture journal with custom categories.

## What it does

- **Apex Priorities** — an editable primary-mission checklist, a list of academic/skill sliders you can add to, and a 3-column (Willing → Building → Shipped) build board.
- **Project Portfolio** — add/edit/remove projects, each with a status, a progress slider, a start date, and an expandable notes panel.
- **Consistency Engine** — tracks a daily "readiness %" from your checklists, a current streak and a best-ever streak (a day counts once readiness reaches 80%), plus a per-sector breakdown of today.
- **Daily Systems** — three editable checklists (non-negotiables, a numbered mind/momentum routine with a built-in silent-reflection timer, and relationships/leisure).
- **Reflection & Capture** — point-form wins/losses logs, and a quick-capture journal with default categories (Idea / Productivity / Creativity) plus the ability to add and remove your own categories.
- **Optimize & Suggestions** — a free-text north-star note, a checklist of optimization targets, and a running list of suggestions/tweaks.
- **Drag-to-reorder** on every list (grip handle appears on hover), including dragging build-board cards between columns.
- **Glance view** — a compact, read-only daily summary.
- **Print** — a clean, light-themed one-page summary sheet (use your browser's Print → Save as PDF).
- **Backup / Restore** — exports all data as a timestamped JSON file; Import loads a JSON backup back in.
- **CSV export** — journal entries, wins, losses, projects, and readiness history as a spreadsheet-friendly CSV.
- **Daily Reset** — clears the day's checkboxes and wins/losses; keeps projects, academic progress, journal entries, and custom lists intact. Also happens automatically the first time you open the app on a new calendar day.

## How to run it

This is a **static, zero-build, zero-dependency** single HTML file. There is nothing to install and no server required.

- Double-click `index.html` to open it in your default browser, **or**
- Right-click `index.html` → Open with → (your browser of choice).

That's the entire setup. It works fully offline, including on first load.

## API keys / external services

**None.** This app makes no network requests, loads no CDN scripts, fonts, or third-party libraries, and calls no external API. Everything — layout, icons (inline SVG/emoji), interactivity — is self-contained in `index.html`. You can verify this yourself: there are no `http://` or `https://` references anywhere in the file.

## Data storage — read this before relying on it

All data (checklists, projects, journal entries, streak history, everything) is saved to your **browser's `localStorage`**, scoped to this one file/origin, in this one browser, on this one device.

This means:
- Data does **not** sync across browsers, devices, or people.
- Opening `index.html` in a different browser (or a different computer, or even the same browser in "private/incognito" mode) starts with a blank slate.
- Clearing your browser's site data/cache for this file will erase your saved data.
- There is no cloud backup. **Use the in-app Backup button regularly** (exports a JSON file) if you want a durable, portable copy of your data. Import restores from that JSON file.

## Browser support

Any modern evergreen browser (Chrome, Edge, Firefox, Safari) with JavaScript enabled. No polyfills are included, so very old browsers are not supported.

## Project structure

```
daily-os/
├── index.html   — the entire application (HTML + CSS + JS, self-contained)
├── README.md    — this file
└── NOTES.md     — working/unfinished status, design decisions, ideas for next steps
```

There are no build steps, no `package.json`, and no dependency installation — open the file, that's it.
