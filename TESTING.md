# StorageLens — Pre-Publish Test Flow

Run through this checklist before every release. It covers all features across both entry points (side panel and DevTools panel).

## Step 0 — Automated checks (must all pass)

```bash
npm run test    # 15 unit tests
npm run lint    # 0 errors
npm run build   # TypeScript + production build
```

## Step 1 — Load the extension and start the QA page

1. `npm run build`, then load/reload the `dist/` folder at `chrome://extensions` (Developer mode → Load unpacked).
2. `npm run qa` — this serves the storage playground at **http://localhost:4173**.
3. Open http://localhost:4173 in Chrome and click **Seed all storage**.

The playground seeds:
- **localStorage**: 8 keys (string, number, bool, JSON object, JSON array, JWT, long text, counter)
- **sessionStorage**: 3 keys
- **Cookies**: 3 cookies (plain, JSON, session-only)
- **IndexedDB**: `qa-app-db` (users + settings stores, mixed types incl. blob/binary) and `qa-big-db` (250 records for pagination)

## Step 2 — Popup (toolbar icon)

| Check | Pass? |
|---|---|
| Clicking the toolbar icon opens the popup (not a full tab) | ☐ |
| Extension enabled toggle works; badge shows OFF when disabled | ☐ |
| "Open side panel" button opens the side panel on the QA tab | ☐ |
| Privacy and Terms tabs show full documents inside the popup | ☐ |
| Copyright line visible in the footer | ☐ |

## Step 3 — Side panel core

With the QA page active and the side panel open:

| Check | Pass? |
|---|---|
| Header shows StorageLens + SIDE PANEL badge + on/off toggle beside the heading | ☐ |
| Header shows the tab title and origin `http://localhost:4173` | ☐ |
| Footer shows Privacy · Terms links and copyright (no toggle) | ☐ |
| Privacy/Terms open in a modal inside the panel | ☐ |
| Toggling the extension OFF shows the disabled overlay; toggling back ON restores the UI | ☐ |
| Switching to another tab updates the panel to that tab's storage | ☐ |
| On a `chrome://` page, a "restricted" message is shown instead of an error | ☐ |

## Step 4 — Local Storage tab

| Check | Pass? |
|---|---|
| All 8 seeded keys are listed with sizes | ☐ |
| `qa_json` opens with a JSON tree view | ☐ |
| `qa_jwt` shows the decoded JWT payload (sub, name, role, exp) | ☐ |
| Search filters keys (try "json") | ☐ |
| Add key → appears on the page (verify with DevTools console `localStorage.getItem(...)`) | ☐ |
| Edit a value and save → updates | ☐ |
| Delete a key → removed | ☐ |
| Clear all (type CLEAR) → empties the tab | ☐ |
| Re-seed from the QA page, then Refresh → keys return | ☐ |

## Step 5 — Session Storage tab

| Check | Pass? |
|---|---|
| 3 seeded keys listed | ☐ |
| Add / edit / delete work | ☐ |

## Step 6 — Cookies tab

| Check | Pass? |
|---|---|
| 3 seeded cookies listed with domain/path | ☐ |
| Session-only cookie (`qa_cookie_session`) shows no expiry | ☐ |
| Add cookie via UI → appears | ☐ |
| Edit cookie value → persists | ☐ |
| Delete cookie → removed | ☐ |
| Filters (httpOnly/secure/session) behave sensibly | ☐ |

## Step 7 — IndexedDB tab

| Check | Pass? |
|---|---|
| Both databases listed: `qa-app-db`, `qa-big-db` | ☐ |
| `qa-app-db` → `users` (3 records) and `settings` (6 records) stores with counts | ☐ |
| `settings` records show typed values: string, number, boolean, JSON, arraybuffer, blob | ☐ |
| `qa-big-db` → `events` shows 250 total; first page loads 100; "load more" pages through the rest | ☐ |
| Delete a record → count decreases | ☐ |
| Refresh after clicking "IndexedDB: add record" on the QA page shows the new user | ☐ |

## Step 8 — Live tracking

Enable live tracking in settings, then on the QA page click **Start auto-mutate**:

| Check | Pass? |
|---|---|
| Live activity feed shows localStorage / sessionStorage / cookie changes every ~2s | ☐ |
| Tab badges show change counts | ☐ |
| Clicking a feed item jumps to that entry | ☐ |
| Pause/resume works | ☐ |
| Stop auto-mutate → feed goes quiet | ☐ |

## Step 9 — Snapshots

| Check | Pass? |
|---|---|
| Capture snapshot with a label | ☐ |
| Mutate storage (QA page buttons), capture second snapshot, compare → diff shows added/changed keys | ☐ |
| Compare with live works | ☐ |
| Export downloads a JSON file; import restores it | ☐ |
| Delete snapshot works | ☐ |

## Step 10 — DevTools panel parity

Open DevTools (F12) → StorageLens tab on the QA page:

| Check | Pass? |
|---|---|
| All four storage tabs read the same seeded data | ☐ |
| Edit/delete work | ☐ |
| No SIDE PANEL badge, no footer toggle issues | ☐ |

## Step 11 — Real-world sites (CSP regression)

The side panel must work on sites with strict CSP (this previously broke with `unsafe-eval` errors):

| Site | Check | Pass? |
|---|---|---|
| https://github.com | LS/SS/cookies/IDB load without "Expected JSON string" or CSP errors | ☐ |
| https://www.google.com | Same | ☐ |
| Any site you use daily | Same | ☐ |

## Step 12 — Options page

| Check | Pass? |
|---|---|
| Settings, Privacy Policy, Terms tabs render | ☐ |
| Theme switch (dark/light) applies everywhere (popup, panel, options) | ☐ |
| Poll interval change takes effect | ☐ |
| Copyright footer visible | ☐ |

## Step 13 — Package

```bash
npm run package   # produces storagelens.zip from dist/
```

| Check | Pass? |
|---|---|
| `storagelens.zip` created | ☐ |
| Loading the unzipped contents as an unpacked extension works | ☐ |

---

**If every box is checked, the build is ready to upload to the Chrome Web Store.**

Cleanup after testing: click **Clear all storage** on the QA page and stop the QA server (Ctrl+C).
