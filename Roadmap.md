# StorageLens — Build Roadmap

A phase-by-phase guide to building StorageLens: a Chrome extension that turns browser storage into a searchable, editable, developer-friendly workspace.

---

## Build Progress

| Phase | Name | Status |
|-------|------|--------|
| 0 | Project Foundation | ✅ Completed |
| 1 | LocalStorage & SessionStorage Reader | ✅ Completed |
| 2 | JSON Tree Viewer & Search | ✅ Completed |
| 3 | Edit, Add & Delete Values | ✅ Completed |
| 4 | Cookies | ✅ Completed |
| 5 | IndexedDB | ✅ Completed |
| 6 | JWT Decoder | ✅ Completed |
| 7 | Snapshots & Compare | ⬜ Not started |
| 8 | Live Change Tracking | ⬜ Not started |
| 9 | Polish, Quality & Release | ⬜ Not started |
| 10 | Future Enhancements | ⬜ Post-v1 |

---

## Product Vision

StorageLens replaces the friction of copying raw strings from DevTools with a dedicated UI for **LocalStorage**, **SessionStorage**, **cookies**, and **IndexedDB**. Developers can browse structured JSON trees, edit values in place, decode JWTs, diff snapshots, and watch live updates—all without leaving the page context they are debugging.

---

## Tech Stack

### Core

| Layer | Choice | Why |
|-------|--------|-----|
| **Extension platform** | Chrome Manifest V3 | Required for new Chrome Web Store listings; service worker background, modern security model |
| **Language** | TypeScript 5.x | Type safety across extension APIs, storage adapters, and UI |
| **UI framework** | React 18+ | Component model fits complex trees, editors, and diff views |
| **Bundler** | Vite 5+ | Fast dev server, HMR, small production bundles |
| **Extension tooling** | [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) | First-class MV3 support with Vite (manifest, HMR in extension context) |
| **Styling** | Tailwind CSS 3.x | Rapid, consistent UI; easy dark/light themes |
| **State** | Zustand | Lightweight global state for active tab, storage data, snapshots |
| **Routing (in-panel)** | React Router (memory router) | Navigate between storage types, diff view, settings without full page reloads |

### Data & Developer Experience

| Concern | Choice | Why |
|---------|--------|-----|
| **JSON tree viewer** | [react-json-view](https://github.com/mac-s-g/react-json-view) or custom tree | Collapsible nodes, copy, theme support; swap for custom if bundle size matters |
| **Code / value editor** | Monaco Editor (`@monaco-editor/react`) | Syntax highlighting for JSON; familiar DevTools-like editing |
| **JWT decode** | `jwt-decode` (decode only) + custom header/payload UI | No verify step needed for debugging; keep bundle small |
| **Diff / compare** | `diff` or `react-diff-viewer-continued` | Snapshot comparison with inline highlights |
| **Search** | Fuse.js | Fuzzy search across keys, values, and nested paths |
| **Date formatting** | `date-fns` | Cookie expiry, snapshot timestamps |
| **Icons** | Lucide React | Consistent, tree-shakeable icons |
| **Testing** | Vitest + React Testing Library | Same Vite ecosystem; unit + component tests |
| **E2E** | Playwright (optional, Phase 9) | Load unpacked extension and smoke-test panel flows |
| **Lint / format** | ESLint + Prettier | Enforce consistency from day one |

### Chrome APIs Used

| API | Purpose |
|-----|---------|
| `chrome.devtools` | DevTools panel as primary UI surface |
| `chrome.devtools.inspectedWindow.eval` | Read/write page `localStorage`, `sessionStorage`, IndexedDB from page context |
| `chrome.cookies` | Read/write cookies for the inspected origin (with `cookies` permission) |
| `chrome.tabs` | Resolve active tab URL/origin when using Side Panel variant |
| `chrome.storage.local` | Persist user settings, snapshots, theme preference |
| `chrome.runtime` | Message passing between background, devtools, and injected scripts |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  DevTools Panel (React app)                                  │
│  ├── Storage type tabs (LS / SS / Cookies / IndexedDB)      │
│  ├── JSON tree + search + editor                            │
│  ├── JWT panel / snapshot diff                              │
│  └── Live updates subscription                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ chrome.runtime.sendMessage
┌──────────────────────────▼──────────────────────────────────┐
│  Background Service Worker (MV3)                             │
│  ├── Route messages                                          │
│  ├── Cookie API wrapper                                      │
│  └── Snapshot persistence (chrome.storage.local)             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Page context (injected script via eval or content script)   │
│  ├── localStorage / sessionStorage read/write                │
│  ├── IndexedDB enumerate + read                              │
│  └── storage event / MutationObserver hooks for live sync    │
└─────────────────────────────────────────────────────────────┘
```

**Important:** Content scripts run in an isolated world and **cannot** see the page’s `localStorage`. All page storage access must run in the **page’s JavaScript context** via `inspectedWindow.eval` or an injected `<script>` tag.

---

## Repository Structure (Target)

```
StorageLens/
├── manifest.json
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── devtools/
│   │   ├── devtools.html
│   │   ├── devtools.ts          # creates panel
│   │   └── panel/
│   │       ├── index.html
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       └── components/
│   ├── injected/
│   │   └── page-bridge.ts       # runs in page context
│   ├── shared/
│   │   ├── types/
│   │   ├── messaging/
│   │   ├── storage-adapters/    # LS, SS, cookies, IDB
│   │   ├── jwt/
│   │   └── snapshots/
│   └── styles/
│       └── globals.css
├── public/
│   └── icons/
└── Roadmap.md
```

---

## Phase 0 — Project Foundation ✅

**Status:** Completed

**Goal:** Runnable empty extension with DevTools panel and dev workflow.

### Steps

1. **Initialize repo**
   - `npm create vite@latest . -- --template react-ts`
   - Add `@crxjs/vite-plugin`, configure `vite.config.ts` for MV3
   - Add Tailwind, ESLint, Prettier

2. **Create `manifest.json`**
   - `manifest_version: 3`
   - Permissions: `devtools`, `cookies`, `storage`, `activeTab`
   - `host_permissions`: `<all_urls>` (or narrow later for store review)
   - Background: `service_worker`
   - Icons: 16, 48, 128

3. **Wire DevTools panel**
   - `src/devtools/devtools.ts` → `chrome.devtools.panels.create('StorageLens', ...)`
   - Panel loads React shell with placeholder “Hello StorageLens”

4. **Message protocol skeleton**
   - Define typed messages in `src/shared/messaging/types.ts`
   - Background worker echoes messages for smoke test

5. **Verify**
   - `npm run build` → Load unpacked in `chrome://extensions`
   - Open DevTools on any site → StorageLens tab appears

**Exit criteria:** Extension loads, panel renders, HMR works during development.

---

## Phase 1 — LocalStorage & SessionStorage Reader (MVP) ✅

**Status:** Completed

**Goal:** List all keys and values for the **inspected page’s** origin.

### Steps

1. **Page bridge script**
   - Implement `readLocalStorage()` / `readSessionStorage()` as functions serialized into `inspectedWindow.eval`
   - Return `{ key, value, byteSize }[]` as JSON

2. **Storage adapters**
   - `LocalStorageAdapter` and `SessionStorageAdapter` in `shared/storage-adapters/`
   - Normalize raw strings: attempt `JSON.parse`; flag as `type: 'json' | 'string' | 'jwt-candidate'`

3. **Panel UI — list view**
   - Tab bar: Local Storage | Session Storage
   - Table: Key | Type | Size | Preview (truncated)
   - Click row → detail pane with raw value

4. **Refresh**
   - Toolbar button + auto-refresh on panel focus
   - Loading and error states (eval failed, opaque origin)

5. **Origin indicator**
   - Show current inspected page URL/origin in panel header

**Exit criteria:** On `https://example.com`, all LS/SS entries visible and refreshable.

---

## Phase 2 — JSON Tree Viewer & Search ✅

**Status:** Completed

**Goal:** Turn messy values into navigable trees with fast search.

### Steps

1. **Integrate JSON tree component**
   - Wrap `react-json-view` (or custom recursive tree)
   - Theme matches panel (dark default, light toggle)

2. **Smart value rendering**
   - JSON → tree
   - Plain string → monospace block
   - Detect JWT shape (`xxx.yyy.zzz`) → badge “JWT” (decode in Phase 6)

3. **Search**
   - Fuse.js index over `key`, `path`, and `value`
   - Highlight matches in tree; filter table rows
   - Keyboard shortcut: `/` focuses search

4. **Copy actions**
   - Copy key, copy value, copy as JSON path
   - Context menu on tree nodes

5. **Performance**
   - Virtualize long key lists (e.g. `@tanstack/react-virtual`)
   - Lazy-parse large JSON values on expand

**Exit criteria:** 500+ keys searchable; nested JSON expandable without UI freeze.

---

## Phase 3 — Edit, Add & Delete Values ✅

**Status:** Completed

**Goal:** In-panel CRUD for LocalStorage and SessionStorage.

### Steps

1. **Write path via page bridge**
   - `setItem(key, value)`, `removeItem(key)`, `clear()`
   - Validate JSON in editor before save

2. **Monaco editor modal / side drawer**
   - Edit raw value with JSON lint hints
   - “Format JSON” button

3. **Add key flow**
   - New key dialog with duplicate-key guard

4. **Delete confirmation**
   - Single key delete + “Clear all” with typed confirmation

5. **Optimistic UI + rollback**
   - Update local state, re-fetch on failure, toast errors

**Exit criteria:** Edits persist in page storage and survive panel refresh.

---

## Phase 4 — Cookies ✅

**Status:** Completed

**Goal:** Full cookie inspection and editing for the inspected origin.

### Steps

1. **Cookie adapter (background)**
   - Use `chrome.cookies.getAll({ url })` with URL from inspected window
   - Map to unified `StorageEntry` shape: name, value, domain, path, expires, httpOnly, secure, sameSite

2. **Cookies tab UI**
   - Sortable table; expiry shown as relative + absolute
   - Filter: session vs persistent, secure, httpOnly

3. **Edit / delete**
   - `chrome.cookies.set` / `chrome.cookies.remove`
   - Form for domain, path, expiration

4. **JSON / JWT detection**
   - Same value rendering pipeline as LS/SS

**Exit criteria:** Cookie list matches Application → Cookies in Chrome DevTools for same origin.

---

## Phase 5 — IndexedDB ✅

**Status:** Completed

**Goal:** Browse databases, object stores, and records.

### Steps

1. **Page bridge — IDB enumeration**
   - `indexedDB.databases()` (where supported)
   - Open DB → list object stores → `getAll` / cursor for records (with limits)

2. **IDB adapter**
   - Hierarchical model: Database → Store → Key → Value
   - Chunk large stores (pagination: 100 records per page)

3. **Tree navigation UI**
   - Left: DB/store tree; right: record JSON tree
   - Support Blob/File metadata display (name, size, type) without loading huge binaries

4. **Read-only first, then write**
   - Phase 5a: read only
   - Phase 5b: `put` / `delete` with explicit warnings

5. **Error handling**
   - Blocked upgrades, version mismatch, quota errors

**Exit criteria:** Can browse typical app IDB (e.g. Firebase, Redux persist) without hanging the panel.

---

## Phase 6 — JWT Decoder ✅

**Status:** Completed

**Goal:** One-click decode and inspect JWTs in storage values.

### Steps

1. **Detection**
   - Regex + heuristic on string values and cookie values

2. **JWT panel**
   - Decode header and payload with `jwt-decode`
   - JSON tree for each; show `exp` / `iat` as human-readable dates
   - Warning banner: “Signature not verified”

3. **Entry points**
   - “Decode JWT” button on badge click
   - Auto-suggest when pasted value looks like JWT

4. **Copy decoded claims**
   - Export header/payload as JSON

**Exit criteria:** Standard Auth0/Firebase-style JWTs decode correctly; malformed tokens show clear errors.

---

## Phase 7 — Snapshots & Compare

**Goal:** Capture storage state at a point in time and diff against another snapshot.

### Steps

1. **Snapshot model**
   ```ts
   interface Snapshot {
     id: string;
     label: string;
     createdAt: string;
     origin: string;
     localStorage: Record<string, string>;
     sessionStorage: Record<string, string>;
     cookies: CookieSnapshot[];
     // IndexedDB: optional summary or selected stores only (size-aware)
   }
   ```

2. **Capture flow**
   - “Snapshot now” → serialize all adapters → save to `chrome.storage.local`
   - Name/label snapshot; list in sidebar

3. **Compare view**
   - Pick Snapshot A vs Snapshot B (or vs Live)
   - Diff by storage type: added / removed / changed keys
   - Inline diff for values (JSON-aware diff preferred)

4. **Export / import**
   - Download snapshot as `.json` file
   - Import for offline comparison or sharing with teammates

5. **Storage quotas**
   - Cap retained snapshots (e.g. 20); show total size; delete old snapshots

**Exit criteria:** Two snapshots of same app show accurate diff after login/logout flow.

---

## Phase 8 — Live Change Tracking

**Goal:** See storage mutations as they happen without manual refresh.

### Steps

1. **localStorage / sessionStorage events**
   - Injected script: `window.addEventListener('storage', ...)` for cross-tab
   - Polling or proxy `setItem`/`removeItem` for same-tab writes (optional monkey-patch behind setting)

2. **Cookie change listener**
   - `chrome.cookies.onChanged` filtered by origin

3. **IndexedDB**
   - Best-effort: periodic diff or patched `IDBObjectStore` methods (advanced; gate behind “Live IDB” toggle)

4. **Live feed UI**
   - Activity stream: timestamp, type, key, old → new preview
   - Pause / resume live updates
   - Click event → jump to entry in main tree

5. **Badge counts**
   - Unseen changes counter since last panel focus

**Exit criteria:** Login flow that writes tokens to LS/SS/cookies updates panel within 1–2 seconds.

---

## Phase 9 — Polish, Quality & Release

**Goal:** Production-ready extension for Chrome Web Store.

### Steps

1. **UX polish**
   - Keyboard shortcuts cheat sheet (`?`)
   - Empty states, onboarding tooltip tour
   - Responsive layout for narrow DevTools dock

2. **Settings**
   - Theme, poll interval, max IDB records, snapshot retention
   - Persist in `chrome.storage.sync` (optional) or `local`

3. **Accessibility**
   - Focus management, ARIA on tree, sufficient contrast

4. **Testing**
   - Unit tests: adapters, JWT helper, snapshot diff
   - Manual test matrix: top sites, iframe origins, extensions pages

5. **Security review**
   - Minimize `host_permissions`; document why `<all_urls>` is needed
   - No `eval` of user-provided strings; only inject trusted bridge functions
   - Content Security Policy in extension pages

6. **Build & publish**
   - Production build, zip for Web Store
   - Store listing: screenshots, privacy policy (no data leaves device)
   - Versioning: semver in `manifest.json`

**Exit criteria:** Published or publish-ready build with README and privacy policy.

---

## Phase 10 — Future Enhancements (Post-v1)

| Feature | Notes |
|---------|--------|
| **Firefox port** | `browser.*` polyfill; adjust cookie APIs |
| **Side Panel mode** | Alternative to DevTools for quicker access |
| **Cache Storage / Web SQL** | If still relevant for target users |
| **Extension storage viewer** | `chrome.storage.local/sync` for debugging the extension itself |
| **Team snapshot sync** | Optional cloud backend (changes privacy story) |
| **Import from DevTools export** | Paste HAR or Application tab export |

---

## Recommended Build Order (Timeline Sketch)

| Phase | Focus | Rough effort |
|-------|--------|--------------|
| 0 | Scaffold | 1–2 days |
| 1 | LS/SS read | 2–3 days |
| 2 | JSON tree + search | 3–4 days |
| 3 | LS/SS edit | 2–3 days |
| 4 | Cookies | 2–3 days |
| 5 | IndexedDB | 5–7 days |
| 6 | JWT | 1–2 days |
| 7 | Snapshots | 3–5 days |
| 8 | Live tracking | 3–4 days |
| 9 | Polish & ship | 5–7 days |

**Total (solo):** ~4–6 weeks for a solid v1.

---

## Key Commands (Once Scaffolded)

```bash
npm install
npm run dev          # Vite + CRXJS dev with HMR
npm run build        # Production bundle for load unpacked / store
npm run test         # Vitest
npm run lint         # ESLint
```

Load unpacked: `chrome://extensions` → Developer mode → Load unpacked → `dist/`

---

## Permissions Justification (for Web Store)

| Permission | Reason |
|------------|--------|
| `devtools` | DevTools panel entry point |
| `cookies` | Read/write cookies for inspected origin |
| `storage` | Extension settings and snapshots |
| `activeTab` | Resolve inspected tab context |
| `<all_urls>` | Access storage on any origin the developer inspects |

**Privacy stance:** All data stays local in the browser; no analytics or remote servers in v1.

---

## Success Metrics for v1

- [ ] Read/write LS, SS, cookies for inspected origin
- [ ] IndexedDB browse for common apps
- [ ] Sub-second search on 1k keys
- [ ] JWT decode on detected tokens
- [ ] Snapshot diff with export
- [ ] Live updates for LS/SS/cookies
- [ ] Dark theme, keyboard-friendly workflow

---

*Last updated: June 2025 — adjust phases as you learn from real-world debugging sessions.*
