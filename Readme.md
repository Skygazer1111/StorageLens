# StorageLens

A Chrome Manifest V3 extension that turns messy browser storage into a searchable, editable developer workspace. Inspect **LocalStorage**, **SessionStorage**, **cookies**, and **IndexedDB** from a **side panel** or a **DevTools panel**—without copying raw strings from the Application tab.

---

## Overview

StorageLens gives you two ways to debug storage on the active page:

1. **Side panel** — click the toolbar icon → **Open side panel** for quick access without opening DevTools
2. **DevTools panel** — `F12` → **StorageLens** tab for a full workspace while inspecting

It reads storage in the **page context**, structures values as JSON trees, and adds workflows developers need: fuzzy search, in-place editing, JWT decoding, IndexedDB browsing, live change tracking, and snapshot comparison. All data stays in your browser. Nothing is sent to a remote server.

---

## Features

- **Storage Inspection** - Full CRUD for Local/Session Storage and Cookies. Browse and delete IndexedDB records.
- **Developer Experience** - JSON tree viewer, fuzzy search, syntax-highlighted editor, JWT decoder, and live change tracking.
- **Snapshots & Compare** - Capture storage state and diff against another snapshot or live data.
- **Privacy First** - Works entirely locally.

---

## Tech Stack

- **Platform**: Chrome Manifest V3
- **Core**: React 19, TypeScript 6, Vite 8
- **UI**: Tailwind CSS 3, `@uiw/react-json-view`, Monaco Editor, `fuse.js`

---

## Installation & Development

### Setup

```bash
git clone <your-repo-url>
cd StorageLens
npm install
npm run dev
```

### Load in Chrome

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the **`dist`** folder.

*Note: After making changes, reload the extension in Chrome and reopen the side panel/DevTools.*

---

## Usage

1. **Local & Session Storage:** Browse keys, search (press `/`), edit/delete values, or clear all.
2. **Cookies:** Filter, sort, add, edit, or delete cookies for the current origin.
3. **IndexedDB:** Browse databases, object stores, and records. Inspect JSON trees and delete entries.
4. **JWT Decoding:** Click any valid JWT value to see its decoded header, payload, and human-readable timestamps.
5. **Snapshots:** Capture the state of storage and compare diffs against live data.

---

## Permissions

- `cookies` - Read and write cookies for the inspected origin.
- `storage` - Settings, theme, snapshots.
- `activeTab`, `tabs`, `sidePanel`, `scripting` - UI integration and page context ops.
- `<all_urls>` - Access storage on origins you choose to debug.

**Privacy:** StorageLens only reads and writes storage for pages you open the panel on. Settings and snapshots stay in `chrome.storage.local` on your machine.
