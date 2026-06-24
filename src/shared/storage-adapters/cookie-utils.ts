import { formatDistanceToNow } from 'date-fns'
import type { CookieData } from '../messaging/types'
import { normalizeStorageItem } from './parse-value'
import type { CookieMeta, CookieSortField, CookieSortState, SortDirection, StorageEntry } from './types'

export function cookieEntryId(cookie: Pick<CookieData, 'name' | 'domain' | 'path'>): string {
  return `${cookie.name}::${cookie.domain}::${cookie.path}`
}

export function mapCookieToEntry(cookie: CookieData): StorageEntry {
  const byteSize = new TextEncoder().encode(cookie.name + cookie.value).length
  const normalized = normalizeStorageItem({
    key: cookie.name,
    value: cookie.value,
    byteSize,
  })

  return {
    ...normalized,
    id: cookieEntryId(cookie),
    cookie: {
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      session: cookie.session,
      hostOnly: cookie.hostOnly,
      expirationDate: cookie.expirationDate,
    },
  }
}

export function entryToCookieData(entry: StorageEntry): CookieData {
  if (!entry.cookie) {
    throw new Error('Entry is not a cookie')
  }

  return {
    name: entry.key,
    value: entry.value,
    domain: entry.cookie.domain,
    path: entry.cookie.path,
    secure: entry.cookie.secure,
    httpOnly: entry.cookie.httpOnly,
    sameSite: entry.cookie.sameSite,
    session: entry.cookie.session,
    hostOnly: entry.cookie.hostOnly,
    expirationDate: entry.cookie.expirationDate,
  }
}

export function buildCookieUrl(pageUrl: string, cookie: Pick<CookieMeta, 'domain' | 'path' | 'secure'>): string {
  try {
    const page = new URL(pageUrl)
    const protocol = cookie.secure ? 'https:' : page.protocol
    const host = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain
    return `${protocol}//${host}${cookie.path || '/'}`
  } catch {
    return pageUrl
  }
}

export function formatCookieExpiry(cookie: CookieMeta): { relative: string; absolute: string } {
  if (cookie.session || !cookie.expirationDate) {
    return { relative: 'Session', absolute: 'Expires when browser closes' }
  }

  const date = new Date(cookie.expirationDate * 1000)
  const relative = formatDistanceToNow(date, { addSuffix: true })
  return {
    relative,
    absolute: date.toLocaleString(),
  }
}

function compareStrings(a: string, b: string, direction: SortDirection): number {
  const result = a.localeCompare(b)
  return direction === 'asc' ? result : -result
}

function compareNumbers(a: number, b: number, direction: SortDirection): number {
  const result = a - b
  return direction === 'asc' ? result : -result
}

export function sortCookieEntries(entries: StorageEntry[], sort: CookieSortState): StorageEntry[] {
  const sorted = [...entries]

  sorted.sort((left, right) => {
    const leftCookie = left.cookie
    const rightCookie = right.cookie
    if (!leftCookie || !rightCookie) return 0

    switch (sort.field as CookieSortField) {
      case 'domain':
        return compareStrings(leftCookie.domain, rightCookie.domain, sort.direction)
      case 'path':
        return compareStrings(leftCookie.path, rightCookie.path, sort.direction)
      case 'expires': {
        const leftExpires = leftCookie.session ? Number.MAX_SAFE_INTEGER : (leftCookie.expirationDate ?? 0)
        const rightExpires = rightCookie.session ? Number.MAX_SAFE_INTEGER : (rightCookie.expirationDate ?? 0)
        return compareNumbers(leftExpires, rightExpires, sort.direction)
      }
      case 'size':
        return compareNumbers(left.byteSize, right.byteSize, sort.direction)
      case 'name':
      default:
        return compareStrings(left.key, right.key, sort.direction)
    }
  })

  return sorted
}

export function filterCookieEntries(entries: StorageEntry[], filters: {
  sessionOnly: boolean
  persistentOnly: boolean
  secureOnly: boolean
  httpOnlyOnly: boolean
}): StorageEntry[] {
  return entries.filter((entry) => {
    const cookie = entry.cookie
    if (!cookie) return false
    if (filters.sessionOnly && !cookie.session) return false
    if (filters.persistentOnly && cookie.session) return false
    if (filters.secureOnly && !cookie.secure) return false
    if (filters.httpOnlyOnly && !cookie.httpOnly) return false
    return true
  })
}
