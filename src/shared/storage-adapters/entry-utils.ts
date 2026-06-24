import { normalizeStorageItem } from './parse-value'
import type { StorageEntry } from './types'

export function createStorageEntry(key: string, value: string): StorageEntry {
  const byteSize = new TextEncoder().encode(key + value).length
  return normalizeStorageItem({ key, value, byteSize })
}

export function sortStorageEntries(entries: StorageEntry[]): StorageEntry[] {
  return [...entries].sort((a, b) => a.key.localeCompare(b.key))
}

export function upsertStorageEntry(entries: StorageEntry[], entry: StorageEntry): StorageEntry[] {
  const next = entries.filter((item) => item.key !== entry.key)
  next.push(entry)
  return sortStorageEntries(next)
}

export function removeStorageEntry(entries: StorageEntry[], key: string): StorageEntry[] {
  return entries.filter((item) => item.key !== key)
}
