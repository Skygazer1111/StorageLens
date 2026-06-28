import type { PageLocation, StorageReadResponse, StorageWriteResponse } from './page-bridge'

export type PageStorageOp =
  | { kind: 'read'; storage: 'localStorage' | 'sessionStorage' }
  | { kind: 'set'; storage: 'localStorage' | 'sessionStorage'; key: string; value: string }
  | { kind: 'remove'; storage: 'localStorage' | 'sessionStorage'; key: string }
  | { kind: 'clear'; storage: 'localStorage' | 'sessionStorage' }
  | { kind: 'location' }

type PageLocationResponse = ({ ok: true } & PageLocation) | { ok: false; error: string }

/**
 * Serialized into the page ISOLATED world via chrome.scripting.executeScript.
 * Must stay self-contained — no imports are available after injection.
 */
export function runPageStorageOperation(
  op: PageStorageOp,
): StorageReadResponse | StorageWriteResponse | PageLocationResponse {
  try {
    if (op.kind === 'location') {
      return { ok: true, href: location.href, origin: location.origin }
    }

    const storage = window[op.storage]

    if (op.kind === 'read') {
      const items = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (!key) continue
        const value = storage.getItem(key) ?? ''
        const byteSize = new TextEncoder().encode(key + value).length
        items.push({ key, value, byteSize })
      }
      items.sort((a, b) => a.key.localeCompare(b.key))
      return { ok: true, items }
    }

    if (op.kind === 'set') {
      storage.setItem(op.key, op.value)
      return { ok: true }
    }

    if (op.kind === 'remove') {
      storage.removeItem(op.key)
      return { ok: true }
    }

    storage.clear()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}
