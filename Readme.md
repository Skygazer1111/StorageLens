# StorageLens

A Chrome Manifest V3 extension that turns messy browser storage into a searchable, editable developer workspace. Inspect **LocalStorage**, **SessionStorage**, **cookies**, and **IndexedDB** from a **side panel** or a **DevTools panel**—without copying raw strings from the Application tab.

---

## Overview

StorageLens gives you two ways to debug storage on the active page:

1. **Side panel** — click the toolbar icon → **Open side panel** for quick access without opening DevTools
2. **DevTools panel** — `F12` → **StorageLens** tab for a full workspace while inspecting

It reads storage in the **page context** (CSP-safe via `chrome.scripting.executeScript` in the isolated world for the side panel, and `inspectedWindow.eval` in DevTools), structures values as JSON trees, and adds workflows developers need: fuzzy search, in-place editing, JWT decoding, IndexedDB browsing, live change tracking, and snapshot comparison.

All data stays in your browser. Nothing is sent to a remote server.

---

## Features

### Storage inspection

| Storage type | Read | Edit | Delete | Notes |
|--------------|------|------|--------|-------|
| Local Storage | ✅ | ✅ | ✅ | Full CRUD via page bridge |
| Session Storage | ✅ | ✅ | ✅ | Full CRUD via page bridge |
| Cookies | ✅ | ✅ | ✅ | Via `chrome.cookies` in the background worker |
| IndexedDB | ✅ | — | ✅ | Browse DBs, stores, records; paginated reads; delete records |

### Entry points

- **Toolbar popup** — enable/disable extension, open side panel, Privacy & Terms, copyright
- **Side panel** — full storage UI on the active tab; header on/off toggle; footer Privacy · Terms + copyright
- **DevTools panel** — same storage workspace inside DevTools
- **Options page** — full settings (live tracking, poll interval, theme) + legal documents

### Developer experience

- **JSON tree viewer** — Collapsible trees for nested JSON (`@uiw/react-json-view`)
- **Fuzzy search** — Search keys, values, and nested paths (`Fuse.js`); press `/` to focus
- **Virtualized tables** — Smooth scrolling for large key lists (`@tanstack/react-virtual`)
- **Monaco editor** — Syntax-highlighted editing for storage values (lazy-loaded)
- **JWT decoder** — Decode header/payload, human-readable `exp`/`iat`, copy claims (`jwt-decode`)
- **Live change tracking** — Poll LS/SS/cookies (and optional IndexedDB), activity feed, pause/resume, tab badges
- **Snapshots & compare** — Capture storage state, diff against another snapshot or live data, import/export JSON
- **Master enable/disable** — Pause the extension from the popup or side panel header
- **Dark / light theme** — Persisted in `chrome.storage.local`
- **Copy actions** — Copy key, value, or JSON path from the detail pane

### Build progress

Phases **0–9** are largely complete for v1 (foundation through settings, side panel, and packaging). See [Roadmap.md](./Roadmap.md) and [TESTING.md](./TESTING.md) before publishing.

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Project foundation, DevTools panel, messaging | ✅ |
| 1 | LocalStorage & SessionStorage reader | ✅ |
| 2 | JSON tree viewer & search | ✅ |
| 3 | Edit, add & delete values | ✅ |
| 4 | Cookies | ✅ |
| 5 | IndexedDB | ✅ |
| 6 | JWT decoder | ✅ |
| 7 | Snapshots & compare | ✅ |
| 8 | Live change tracking | ✅ |
| 9 | Settings, popup, side panel, options, packaging | ✅ |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Platform | Chrome Manifest V3 |
| Language | TypeScript 6 |
| UI | React 19 |
| Bundler | Vite 8 + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) |
| Styling | Tailwind CSS 3 |
| JSON trees | `@uiw/react-json-view` |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Search | Fuse.js |
| Virtualization | `@tanstack/react-virtual` |
| JWT | `jwt-decode` |
| Dates | `date-fns` |
| Tests | Vitest |
| Lint / format | ESLint 10, Prettier |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Popup / Options / Side Panel / DevTools Panel (React)       │
│  ├── Storage tabs (LS / SS / Cookies / IndexedDB)           │
│  ├── JSON tree + search + editor + live feed                 │
│  ├── JWT panel / snapshot diff                               │
│  └── Settings (enable, theme, live tracking, poll interval)  │
└──────────────────────────┬──────────────────────────────────┘
                           │ chrome.runtime / chrome.scripting
┌──────────────────────────▼──────────────────────────────────┐
│  Background Service Worker (MV3)                             │
│  ├── Cookie API (`getAll`, `set`, `remove`)                  │
│  ├── cookie onChanged → live ports                           │
│  ├── Side panel enablement per tab                           │
│  └── Message routing (PING/PONG, cookie ops)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Page context                                                │
│  ├── Side panel: executeScript (ISOLATED world, CSP-safe)    │
│  ├── DevTools: inspectedWindow.eval                          │
│  ├── localStorage / sessionStorage read & write              │
│  └── IndexedDB enumerate, read, delete                       │
└─────────────────────────────────────────────────────────────┘
```

**Important:** Content scripts cannot access a page’s `localStorage` or `sessionStorage` (isolated world vs page world). StorageLens injects trusted operation functions into the page via `chrome.scripting.executeScript` (side panel) or `devtools.inspectedWindow.eval` (DevTools). The side panel path avoids `eval()` strings so strict CSP sites (no `unsafe-eval`) still work.

Snapshots and settings are stored in `chrome.storage.local` (up to 20 snapshots).

---

## Project structure

```
StorageLens/
├── manifest.json                 # MV3: side panel, popup, options, permissions
├── package.json
├── TESTING.md                    # Pre-publish manual QA checklist
├── Clearidea.txt                 # Product / idea overview
├── Roadmap.md
├── qa/
│   └── test-page.html            # Local playground (seed LS/SS/cookies/IDB)
├── scripts/
│   ├── generate-icons.mjs
│   └── serve-qa.mjs              # npm run qa → http://localhost:4173
├── public/icons/
└── src/
    ├── background/
    │   ├── service-worker.ts
    │   └── cookie-handlers.ts
    ├── popup/                    # Toolbar popup (toggle, legal, open panel)
    ├── options/                  # Full settings + Privacy + Terms
    ├── sidepanel/                # Side panel entry (reuses DevTools App)
    ├── devtools/
    │   ├── panel/App.tsx         # Shared main UI
    │   └── panel/components/
    ├── injected/
    │   ├── page-bridge.ts        # LS/SS script helpers (DevTools path)
    │   ├── page-ops.ts           # CSP-safe LS/SS/location ops
    │   ├── idb-bridge.ts
    │   └── idb-ops.ts            # CSP-safe IndexedDB ops
    ├── shared/
    │   ├── page-bridge/          # Dual-mode invoke (sidepanel | devtools)
    │   ├── storage-adapters/
    │   ├── settings/
    │   ├── legal/
    │   ├── snapshots/
    │   ├── jwt/
    │   └── messaging/
    └── styles/
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [Google Chrome](https://www.google.com/chrome/) (or Chromium-based browser with extension support)
- npm (comes with Node.js)

---

## Installation

```bash
git clone <your-repo-url>
cd StorageLens
npm install
```

Icons are generated automatically as part of `npm run build` (`npm run icons`).

---

## Development

```bash
npm run dev
```

CRXJS writes the extension to `dist/` and rebuilds on file changes.

### Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the **`dist`** folder (not the project root)

> Chrome needs the built output in `dist/`. After changes, reload the extension, then close and reopen the side panel (or DevTools) if the UI looks stale.

### Open StorageLens

**Side panel (fast path)**

1. Open a normal website (`http://` / `https://`)
2. Click the StorageLens toolbar icon
3. In the popup, click **Open side panel**

**DevTools**

1. Open DevTools (`F12`)
2. Select the **StorageLens** tab

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR → `dist/` |
| `npm run build` | Icons + type-check + production build |
| `npm run test` | Vitest unit tests |
| `npm run qa` | Serve QA playground at http://localhost:4173 |
| `npm run package` | Build + create `storagelens.zip` for Web Store upload |
| `npm run lint` | ESLint |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css}` |

---

## Usage

### Local & session storage

1. Open the **Local Storage** or **Session Storage** tab
2. Browse keys; click a row for the detail pane
3. Press **`/`** to search
4. **Add key** / **Edit** / **Delete** / **Clear all** for CRUD

### Cookies

1. Open the **Cookies** tab
2. Filter by session, persistent, secure, or HttpOnly
3. Sort by name, domain, expiry, or size
4. **Add cookie** or edit/delete from the detail pane

### IndexedDB

1. Open the **IndexedDB** tab
2. Select a database → object store
3. Browse records; **Load more** for large stores
4. Inspect values as JSON trees; **Delete** records with confirmation

### Live tracking

1. Ensure the extension is **enabled** and live tracking is on (Options → Settings)
2. Keep the panel open while mutating storage on the page (or use `npm run qa` auto-mutate)
3. Watch the **Live activity** feed and tab badges; pause/resume as needed

### JWT values

When a value looks like a JWT (`xxx.yyy.zzz`), the detail pane shows a decode panel:

- Header and payload as JSON trees
- Human-readable `exp` and `iat`
- Copy header / payload JSON
- Banner: *Signature not verified* (decode only)

### Snapshots

1. Click **Snapshots**
2. Capture LS, SS, and cookies for the current origin
3. Compare snapshots or compare with live
4. Export / import JSON; up to **20** snapshots retained locally

### Settings & legal

- **Popup** — master on/off, Privacy, Terms, copyright, open side panel
- **Side panel header** — on/off toggle beside the title
- **Side panel footer** — Privacy · Terms · copyright
- **Options page** — live tracking toggles, poll interval, theme, full legal docs

---

## Testing before publish

Automated:

```bash
npm run test
npm run build
```

Manual feature checklist (IndexedDB, live tracking, CSP sites, packaging):

See **[TESTING.md](./TESTING.md)**. Quick start:

```bash
npm run build
# Load dist/ in chrome://extensions
npm run qa
# Open http://localhost:4173 → Seed all storage → verify each StorageLens tab
```

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `cookies` | Read and write cookies for the inspected origin |
| `storage` | Settings, theme, snapshots |
| `activeTab` | Resolve current tab context |
| `sidePanel` | Side panel UI |
| `scripting` | Inject page ops for side panel storage access |
| `tabs` | Track active tab for side panel |
| `<all_urls>` (host) | Access storage on origins you choose to debug |

**Privacy:** StorageLens only reads and writes storage for pages you open the panel on. Settings and snapshots stay in `chrome.storage.local` on your machine. See Privacy Policy in Options / popup.

---

## Known limitations

- **IndexedDB writes** — Read and delete are supported; creating/editing records via `put` is not yet in v1
- **IndexedDB in snapshots** — Snapshots capture LS, SS, and cookies only (not full IDB dumps)
- **Monaco bundle** — Editor assets are large; the editor is lazy-loaded on first open
- **Restricted URLs** — `chrome://`, extension pages, etc. cannot be inspected (shown clearly in the side panel)

---

## Publishing (Chrome Web Store)

1. Complete [TESTING.md](./TESTING.md)
2. `npm run package` → produces `storagelens.zip`
3. Create a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole)
4. Upload the zip; provide privacy policy URL (host Options Privacy page or a public copy), screenshots, and store listing text
5. Submit for review

---

## Contributing

1. Read `Roadmap.md` and `Clearidea.txt` for scope
2. Match existing patterns (TypeScript strict, Tailwind, MV3)
3. Run `npm run test`, `npm run lint`, and `npm run build` before a PR
4. Test manually with `npm run qa` and both side panel + DevTools

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| “Could not load manifest” | Load **`dist/`**, not the project root |
| Side panel UI looks stale | Close the side panel, reload the extension, reopen |
| StorageLens tab missing in DevTools | Reload extension; close and reopen DevTools |
| Empty storage / restricted message | Use a normal `http(s)://` page, not `chrome://` |
| CSP / eval errors on some sites | Use a fresh build; side panel uses CSP-safe `executeScript` (not string `eval`) |
| Panel blank after build | Hard refresh; right-click panel → Inspect for console errors |

---

## License

No license file is included yet. Add one before public open-source distribution or Web Store listing if required.
