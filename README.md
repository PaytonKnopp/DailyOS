# Daily OS

A dark-mode personal dashboard for daily priorities, habits, projects, and journaling, built to live on your phone's home screen as an app. Think of it as a "life control panel" rather than a plain to-do list: apex priorities, non-negotiable daily habits, a project portfolio with progress tracking, a streak engine with a readiness history, win/loss logging, and a quick-capture journal.

## What it does

The app has five tabs along the bottom:

- **Today** — your readiness ring, current streak and what's left to lock in today, plus the four daily checklists: Primary Mission, Non-Negotiables, Mind & Momentum (with a built-in silent-reflection timer) and Relationships & Leisure. Tap a row to check it off.
- **Build** — Academic Focus sliders, the Willing → Building → Shipped build board, and the Project Portfolio (filter by status, tap a project for status, start date and notes).
- **Journal** — Quick Capture with your own categories, entries grouped by day, and Wins / Losses with a net score.
- **Stats** — current and best streak, 7-day average, goal days in the last 30, a 17-week readiness heatmap (tap a day for its score), and today's breakdown by sector.
- **More** — Optimize Your Life, Suggestions & Tweaks, Back up / Restore / CSV export, a read-only daily summary, print/PDF, and "start the day over".

Every item has a **⋯** button to edit it (label, a short detail line and an emoji), move it, or delete it; deleting shows an **Undo** for a few seconds. Drag the **⠿** handle to reorder lists; it works with a finger or a mouse, including moving build-board cards between columns.

The day resets automatically at local midnight (even if the app stays open), clearing the checklists and wins/losses while keeping projects, academic progress, the journal and your custom lists. A day counts toward the streak once readiness reaches 80%, and an unfinished today never breaks a streak until the day is over.

## Put it on your phone's home screen

Home-screen apps have to be served over **HTTPS**; opening the file directly won't install. The simplest free host is GitHub Pages:

1. On GitHub, open this repo → **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick your branch and `/ (root)`, and save.
3. After a minute, open the URL GitHub shows (like `https://<you>.github.io/DailyOS/`) on your phone.
4. **iPhone (Safari):** tap **Share → Add to Home Screen**. **Android (Chrome):** tap **Install app** in the banner or the ⋮ menu.

GitHub Pages sites are public, even from a private repo (Pages on private repos needs GitHub Pro). Anyone with the URL can see the default seed content in the source (see NOTES.md); your own entries stay on your device. Any other static HTTPS host (Netlify, Cloudflare Pages, Vercel) works the same way — just upload the folder.

Once installed, it opens full-screen with its own icon, works fully offline, and picks up new versions on the launch after you publish them.

**Your data does not move between Safari and the installed app on iPhone.** They keep separate storage. Install first and use the installed app, or use **More → Back up** in one and **Restore from backup** in the other.

## Running it on a computer

Double-click `index.html` to open it in a browser. Everything works except installing and offline caching, which need the HTTPS hosting above. To test the full app locally, serve the folder (for example `npx http-server .`) and open `http://localhost:8080`.

## API keys / external services

**None.** This app makes no network requests to anyone else: no CDN scripts, fonts, or third-party libraries, and no external API. Everything — layout, icons (inline SVG/emoji), interactivity — is self-contained in `index.html`; the only other files are its own manifest, service worker and icons, loaded from the same site.

## Data storage — read this before relying on it

All data (checklists, projects, journal entries, streak history, everything) is saved to your **browser's `localStorage`**, scoped to this one file/origin, in this one browser, on this one device.

This means:
- Data does **not** sync across browsers, devices, or people.
- Opening `index.html` in a different browser (or a different computer, or even the same browser in "private/incognito" mode) starts with a blank slate.
- Clearing your browser's site data/cache for this file will erase your saved data.
- There is no cloud backup. **Use More → Back up regularly.** On a phone it opens the share sheet so you can save the JSON file to Files, iCloud Drive or Google Drive; More → Restore from backup loads it back in. The More tab shows a dot when your last backup is over a week old.
- The app asks the browser to keep its storage persistent. An installed home-screen app on iPhone isn't subject to Safari's 7-day cleanup of unused site data.

## Browser support

Any modern evergreen browser with JavaScript enabled: Safari on iOS 16.4+, Chrome/Edge on Android and desktop, Firefox. No polyfills are included, so very old browsers are not supported.

## Project structure

```
DailyOS/
├── index.html             — the entire application (HTML + CSS + JS, self-contained)
├── manifest.webmanifest   — home-screen app name, colors and icons
├── sw.js                  — service worker: offline cache and background updates
├── icons/                 — app icon (icon.svg is the source; PNGs are rendered from it)
├── README.md              — this file
└── NOTES.md               — status, design decisions, ideas for next steps
```

There are no build steps, no `package.json`, and no dependency installation. When you change `index.html` or the icons, bump `VERSION` in `sw.js` so installed copies refresh their cache.
