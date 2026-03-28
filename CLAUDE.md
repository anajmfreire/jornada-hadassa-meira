# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Minha Gestação - A Jornada de Hadassa Meira" — a pregnancy tracking PWA built with vanilla JavaScript (no frameworks, no build system, no npm). All content is in Brazilian Portuguese (pt-BR).

## Architecture

Single Page Application with tab-based navigation (5 tabs: Home, My Baby, Diary, Exams, Config) and 16+ dynamic sections rendered by switching visibility. No router — navigation is handled via `showSection()` in app.js.

**Module layout (all files loaded directly via `<script>` tags in index.html):**
- `app.js` (~4100 lines) — Core engine: data management, rendering, week calculations, medical analysis, charts, theming
- `features.js` (~2300 lines) — Feature modules: exams, appointments, notes, shopping lists, birth plan
- `extras.js` (~950 lines) — Hydration tracker, tools, FAQ, glossary
- `content.js` (~380 lines) — Static weekly pregnancy content (weeks 4–42)
- `firebase-sync.js` (~350 lines) — Firebase Auth (Google OAuth) + Realtime Database sync
- `sw.js` — Service Worker with network-first strategy
- `styles.css` — Full styling with CSS custom properties for light/dark theming

**Data flow:** User Input → Event Handler → Update `appData` → `saveData()` → localStorage + IndexedDB backup + Firebase sync → re-render DOM

**Storage layers:** localStorage (primary) → IndexedDB (photo storage + backup) → Firebase Realtime Database (cloud sync)

## Tech Stack

- Vanilla JS (ES6+), no bundler or transpiler
- Firebase v10.12.0 (Auth + Realtime Database) via CDN
- Chart.js 4.4.1 for data visualization
- jsPDF 2.5.1 for PDF report generation
- Google Gemini API for AI chat and OCR features
- Netlify for hosting (static files, publish dir: `.`)

## Development

No build step. Open `index.html` in a browser or serve with any static server:
```bash
npx serve .
# or
python -m http.server 8000
```

**Running tests:** Open `tests.html` in a browser. Custom assertion-based test suite (no test runner).

## Deployment

Hosted on Netlify. Push to `master` branch triggers deploy. `netlify.toml` configures security headers to block `.env` and `.gitignore` access.

**PWA cache:** Service Worker cache is named `minha-gestacao-v4` in `sw.js`. When modifying cached assets, increment the cache version AND update the CSS query string (`styles.css?v=YYYYMMDD`) for cache busting.

## Critical Rules

- **Firebase sync safety:** NEVER sync empty/default local data to Firebase. If localStorage is empty, always pull from cloud first. Use `update()` over `set()` to avoid overwriting existing cloud data. Test any firebase-sync.js changes against the scenario: "empty localStorage + data exists in cloud."
- **DUM and DPP dates:** Never overwrite automatically — these are user-controlled.
- **Access gate:** App uses a code-based access system with hardcoded valid codes. Access state is stored in localStorage.
- **Gemini API key:** Stored in localStorage after initial load from `.env` (via Cloudflare Worker proxy in production).

## Key Functions

- `calcCurrentGestationalAge()` — Calculates current gestational week from DUM or first ultrasound data
- `saveData()` / `loadData()` — Persist/restore `appData` to localStorage with Firebase sync trigger
- `renderAll()` / `renderAfterChange()` — Full vs selective DOM re-rendering
- `syncToCloud()` / `syncFromCloud()` — Firebase bidirectional sync with timestamp-based conflict detection
- `escapeHtml()` — XSS protection for user-generated content (always use for rendering user input)
