# StorageLens

A Chrome DevTools extension that turns messy browser storage into a searchable, editable developer workspace. Inspect **LocalStorage**, **SessionStorage**, **cookies**, and **IndexedDB** from one panel—without copying raw strings from the Application tab.

---

## Overview

StorageLens runs as a custom DevTools panel on whatever page you are debugging. It reads storage in the **inspected page’s context**, structures values as JSON trees, and adds workflows developers actually need: fuzzy search, in-place editing, JWT decoding, IndexedDB browsing, and snapshot comparison.

All data stays in your browser. Nothing is sent to a remote server.

---

## Features

### Storage inspection

| Storage type | Read | Edit | Delete | Notes |
|--------------|------|------|--------|-------|
| Local Storage | ✅ | ✅ | ✅ | Full CRUD via page bridge |
| Session Storage | ✅ | ✅ | ✅ | Full CRUD via page bridge |
| Cookies | ✅ | ✅ | ✅ | Via `chrome.cookies` in background worker |
| IndexedDB | ✅ | Delete | — | Browse DBs, stores, records; paginated reads |

### Developer experience

- **JSON tree viewer** — Collapsible trees for nested JSON (`@uiw/react-json-view`)
- **Fuzzy search** — Search keys, values, and nested paths (`Fuse.js`); press `/` to focus
- **Virtualized tables** — Smooth scrolling for large key lists (`@tanstack/react-virtual`)
- **Monaco editor** — Syntax-highlighted editing for storage values (lazy-loaded)
- **JWT decoder** — Decode header/payload, human-readable `exp`/`iat`, copy claims (`jwt-decode`)
- **Snapshots & compare** — Capture storage state, diff against another snapshot or live data, import/export JSON
- **Dark / light theme** — Persisted in `chrome.storage.local`
- **Copy actions** — Copy key, value, or JSON path from the detail pane

### Build progress

Phases **0–7** are complete. See [Roadmap.md](./Roadmap.md) for the full plan and upcoming work (live change tracking, polish, release).

| Phase | Feature |
|-------|---------|
| 0 | Project foundation, DevTools panel, messaging |
| 1 | LocalStorage & SessionStorage reader |
| 2 | JSON tree viewer & search |
| 3 | Edit, add & delete values |
| 4 | Cookies |
| 5 | IndexedDB |
| 6 | JWT decoder |
| 7 | Snapshots & compare |

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
| Lint / format | ESLint 10, Prettier |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  DevTools Panel (React)                                      │
│  ├── Storage tabs (LS / SS / Cookies / IndexedDB)           │
│  ├── JSON tree + search + editor                            │
│  ├── JWT panel / snapshot diff                              │
│  └── Live updates (planned)                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ chrome.runtime.sendMessage
┌──────────────────────────▼──────────────────────────────────┐
│  Background Service Worker (MV3)                             │
│  ├── Cookie API (`getAll`, `set`, `remove`)                  │
│  └── Message routing (PING/PONG, cookie ops)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Page context (`chrome.devtools.inspectedWindow.eval`)       │
│  ├── localStorage / sessionStorage read & write                │
│  └── IndexedDB enumerate, read, delete                       │
└─────────────────────────────────────────────────────────────┘
```

**Important:** Content scripts cannot access a page’s `localStorage` or `sessionStorage` (isolated world). StorageLens runs scripts in the **page’s JavaScript context** via `inspectedWindow.eval` with `awaitPromise` for async IndexedDB operations.

Snapshots are stored in `chrome.storage.local` from the panel (up to 20 per origin workflow).

---

## Project structure

```
StorageLens/
├── manifest.json              # MV3 extension manifest
├── package.json
├── vite.config.ts             # Vite + CRXJS + React
├── tailwind.config.js
├── tsconfig.json
├── Roadmap.md                 # Phase-by-phase build guide
├── scripts/
│   └── generate-icons.mjs     # Generates extension icons
├── public/
│   └── icons/                 # 16, 48, 128 PNG icons
└── src/
    ├── background/
    │   ├── service-worker.ts    # MV3 service worker
    │   └── cookie-handlers.ts   # chrome.cookies wrappers
    ├── devtools/
    │   ├── devtools.html
    │   ├── devtools.ts          # Registers DevTools panel
    │   └── panel/
    │       ├── App.tsx          # Main panel shell
    │       ├── main.tsx
    │       ├── components/      # UI components (tables, modals, trees)
    │       └── hooks/           # Storage, cookies, IDB, snapshots, theme
    ├── injected/
    │   ├── page-bridge.ts       # LS/SS read/write eval scripts
    │   └── idb-bridge.ts        # IndexedDB eval scripts
    ├── shared/
    │   ├── messaging/           # Panel ↔ background message types
    │   ├── page-bridge/         # inspectedWindow.eval helpers
    │   ├── storage-adapters/    # LS, SS, cookies, IDB adapters
    │   ├── search/              # Fuse.js search indexing
    │   ├── snapshots/           # Snapshot model & diff logic
    │   ├── jwt/                 # JWT decode utilities
    │   └── utils/               # Clipboard, JSON validation
    └── styles/
        └── globals.css
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [Google Chrome](https://www.google.com/chrome/) (or Chromium-based browser with DevTools extension support)
- npm (comes with Node.js)

---

## Installation

```bash
git clone <your-repo-url>
cd StorageLens
npm install
```

Generate extension icons (if `public/icons/` is missing):

```bash
node scripts/generate-icons.mjs
```

---

## Development

Start the dev server with hot module replacement:

```bash
npm run dev
```

CRXJS writes the extension to `dist/` and rebuilds on file changes.

### Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the **`dist`** folder (not the project root)

> The root `manifest.json` points at TypeScript sources. Chrome needs the built output in `dist/`.

### Open the panel

1. Navigate to any normal website (e.g. `https://example.com`)
   - Avoid `chrome://` pages; storage access is limited there
2. Open DevTools (`F12`)
3. Select the **StorageLens** tab

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check and production build → `dist/` |
| `npm run lint` | Run ESLint |
| `npm run format` | Format `src/**/*.{ts,tsx,css}` with Prettier |
| `npm run preview` | Vite preview (limited use for extensions) |

After code changes during dev: reload the extension on `chrome://extensions`, then refresh DevTools if the panel looks stale.

---

## Usage

### Local & session storage

1. Open the **Local Storage** or **Session Storage** tab
2. Browse keys in the table; click a row for the detail pane
3. Use **Refresh** or focus the panel to reload from the page
4. Press **`/`** to search keys and values
5. **Add key** / **Edit** / **Delete** / **Clear all** for CRUD operations

### Cookies

1. Open the **Cookies** tab
2. Filter by session, persistent, secure, or HttpOnly
3. Sort by name, domain, expiry, or size
4. **Add cookie** or edit/delete from the detail pane

### IndexedDB

1. Open the **IndexedDB** tab
2. Select a database → object store in the left tree
3. Browse records in the center list; **Load more** for large stores
4. Select a record to inspect its value as a JSON tree
5. **Delete** individual records (with confirmation)

### JWT values

When a value looks like a JWT (`xxx.yyy.zzz`), the detail pane shows a **JWT** badge and decode panel:

- Header and payload as JSON trees
- Human-readable `exp` and `iat` timestamps
- **Copy header JSON** / **Copy payload JSON**
- Banner: *Signature not verified* (decode only, no verify)

### Snapshots

1. Click **Snapshots** in the toolbar
2. **Snapshot now** (optional label) to capture LS, SS, and cookies for the current origin
3. Compare **Snapshot A** vs **Snapshot B** or **Live**
4. **Export** / **Import** JSON files for sharing or offline review
5. Up to **20** snapshots retained locally

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `devtools_page` | Registers the custom DevTools panel (see `manifest.json`) |
| `cookies` | Read and write cookies for the inspected origin |
| `storage` | Extension settings, theme, snapshots |
| `activeTab` | Resolve inspected tab context |
| `<all_urls>` (host) | Access storage on any origin the developer inspects |

**Privacy:** StorageLens only reads and writes storage for pages you actively inspect in DevTools. Snapshot and settings data stay in `chrome.storage.local` on your machine.

---

## Known limitations

- **IndexedDB writes** — Read and delete are supported; `put` for new/edited records is planned
- **Live change tracking** — Not yet implemented (Phase 8)
- **IndexedDB in snapshots** — Snapshots capture LS, SS, and cookies only (not full IDB dumps)
- **Monaco bundle** — Editor assets are large; the editor is lazy-loaded on first open
- **Same-tab LS/SS events** — The native `storage` event does not fire for same-tab writes; live sync will use additional strategies in Phase 8

---

## Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| 8 | Planned | Live change tracking |
| 9 | Planned | Polish, accessibility, Web Store release |
| 10 | Post-v1 | Firefox port, side panel, extension storage viewer |

Details: [Roadmap.md](./Roadmap.md)

---

## Contributing

This project is under active development. Useful contributions:

1. Read `Roadmap.md` for scope and conventions
2. Match existing patterns (TypeScript strict mode, Tailwind, MV3)
3. Run `npm run lint` and `npm run build` before opening a PR
4. Test manually: load unpacked from `dist/`, exercise DevTools on a real site

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| “Could not load manifest” | Load **`dist/`**, not the project root |
| StorageLens tab missing | Reload extension; close and reopen DevTools |
| Empty storage | Use a normal `https://` page, not `chrome://` |
| Panel blank after build | Hard refresh DevTools; check panel console (right-click panel → Inspect) |
| Monaco slow first open | Expected; editor loads on demand |

---

## License

No license file is included yet. Add one before public distribution if you plan to open-source or publish to the Chrome Web Store.
