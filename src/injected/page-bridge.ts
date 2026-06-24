export interface RawStorageItem {
  key: string
  value: string
  byteSize: number
}

export interface StorageReadResult {
  ok: true
  items: RawStorageItem[]
}

export interface StorageReadError {
  ok: false
  error: string
}

export type StorageReadResponse = StorageReadResult | StorageReadError

export interface PageLocation {
  href: string
  origin: string
}

const readStorageItems = (storageName: 'localStorage' | 'sessionStorage') => `
(function() {
  try {
    const storage = window[${JSON.stringify(storageName)}];
    const items = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      const value = storage.getItem(key) ?? '';
      const byteSize = new TextEncoder().encode(key + value).length;
      items.push({ key, value, byteSize });
    }
    items.sort((a, b) => a.key.localeCompare(b.key));
    return JSON.stringify({ ok: true, items });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String(error) });
  }
})()
`

export const READ_LOCAL_STORAGE_SCRIPT = readStorageItems('localStorage')
export const READ_SESSION_STORAGE_SCRIPT = readStorageItems('sessionStorage')

export const READ_PAGE_LOCATION_SCRIPT = `
(function() {
  try {
    return JSON.stringify({
      ok: true,
      href: location.href,
      origin: location.origin
    });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String(error) });
  }
})()
`
