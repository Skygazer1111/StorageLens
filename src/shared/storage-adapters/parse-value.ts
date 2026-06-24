import type { RawStorageItem, StorageReadResponse } from '../../injected/page-bridge'
import type { StorageEntry, StorageValueType } from './types'
import { LAZY_JSON_PARSE_BYTES } from '../utils/clipboard'

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

export function detectValueType(value: string): StorageValueType {
  if (JWT_PATTERN.test(value.trim())) {
    return 'jwt-candidate'
  }

  if (value.length > LAZY_JSON_PARSE_BYTES && looksLikeJson(value)) {
    return 'json'
  }

  try {
    JSON.parse(value)
    return 'json'
  } catch {
    return 'string'
  }
}

export function parseStorageValue(value: string): unknown {
  return JSON.parse(value)
}

export function normalizeStorageItem(item: RawStorageItem): StorageEntry {
  const valueType = detectValueType(item.value)
  let parsed: unknown | undefined

  if (valueType === 'json' && item.value.length <= LAZY_JSON_PARSE_BYTES) {
    try {
      parsed = JSON.parse(item.value)
    } catch {
      // Parsed lazily in the value viewer when needed.
    }
  }

  return {
    key: item.key,
    value: item.value,
    byteSize: item.byteSize,
    valueType,
    parsed,
    id: item.key,
  }
}

export function normalizeStorageResponse(response: StorageReadResponse): StorageEntry[] {
  if (!response.ok) {
    throw new Error(response.error)
  }

  return response.items.map(normalizeStorageItem)
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function truncatePreview(value: string, maxLength = 80): string {
  const singleLine = value.replace(/\s+/g, ' ').trim()
  if (singleLine.length <= maxLength) return singleLine
  return `${singleLine.slice(0, maxLength)}…`
}
