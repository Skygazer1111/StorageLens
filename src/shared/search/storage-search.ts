import Fuse from 'fuse.js'
import type { StorageEntry } from '../storage-adapters/types'

export interface SearchIndexItem {
  key: string
  value: string
  pathsText: string
  entry: StorageEntry
}

const MAX_PATHS = 500
const MAX_DEPTH = 12

function flattenForSearch(
  value: unknown,
  path: string,
  paths: string[],
  depth: number,
): void {
  if (paths.length >= MAX_PATHS || depth > MAX_DEPTH) return

  if (value === null || typeof value !== 'object') {
    paths.push(`${path}: ${String(value)}`)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenForSearch(item, `${path}[${index}]`, paths, depth + 1)
    })
    return
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    const childPath = path ? `${path}.${childKey}` : childKey
    if (childValue !== null && typeof childValue === 'object') {
      flattenForSearch(childValue, childPath, paths, depth + 1)
    } else {
      paths.push(`${childPath}: ${String(childValue)}`)
    }
  }
}

function buildPathsText(entry: StorageEntry): string {
  if (entry.valueType !== 'json') return ''

  try {
    const parsed = entry.parsed ?? JSON.parse(entry.value)
    const paths: string[] = []
    flattenForSearch(parsed, entry.key, paths, 0)
    return paths.join('\n')
  } catch {
    return ''
  }
}

export function buildSearchIndex(entries: StorageEntry[]): SearchIndexItem[] {
  return entries.map((entry) => ({
    key: entry.key,
    value: entry.value,
    pathsText: buildPathsText(entry),
    entry,
  }))
}

export function filterEntries(entries: StorageEntry[], query: string): StorageEntry[] {
  const trimmed = query.trim()
  if (!trimmed) return entries

  const index = buildSearchIndex(entries)
  const fuse = new Fuse(index, {
    keys: [
      { name: 'key', weight: 0.4 },
      { name: 'value', weight: 0.35 },
      { name: 'pathsText', weight: 0.25 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
  })

  return fuse.search(trimmed).map((result) => result.item.entry)
}

export function splitByQuery(text: string, query: string): { text: string; match: boolean }[] {
  const trimmed = query.trim()
  if (!trimmed) return [{ text, match: false }]

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const parts: { text: string; match: boolean }[] = []
  let start = 0

  while (start < text.length) {
    const index = lowerText.indexOf(lowerQuery, start)
    if (index === -1) {
      parts.push({ text: text.slice(start), match: false })
      break
    }

    if (index > start) {
      parts.push({ text: text.slice(start, index), match: false })
    }

    parts.push({ text: text.slice(index, index + trimmed.length), match: true })
    start = index + trimmed.length
  }

  return parts.length > 0 ? parts : [{ text, match: false }]
}

export function valueMatchesQuery(value: string, query: string): boolean {
  const trimmed = query.trim()
  if (!trimmed) return false
  return value.toLowerCase().includes(trimmed.toLowerCase())
}
