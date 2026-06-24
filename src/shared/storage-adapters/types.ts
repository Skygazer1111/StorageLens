import type { CookieData } from '../messaging/types'

export type StorageValueType = 'json' | 'string' | 'jwt-candidate'

export type StorageKind = 'local' | 'session' | 'cookies'

export type CookieSameSite = CookieData['sameSite']

export interface CookieMeta {
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: CookieSameSite
  session: boolean
  hostOnly: boolean
  expirationDate?: number
}

export interface StorageEntry {
  id: string
  key: string
  value: string
  byteSize: number
  valueType: StorageValueType
  parsed?: unknown
  cookie?: CookieMeta
}

export type CookieFilterState = {
  sessionOnly: boolean
  persistentOnly: boolean
  secureOnly: boolean
  httpOnlyOnly: boolean
}

export const DEFAULT_COOKIE_FILTERS: CookieFilterState = {
  sessionOnly: false,
  persistentOnly: false,
  secureOnly: false,
  httpOnlyOnly: false,
}

export type CookieSortField = 'name' | 'domain' | 'path' | 'expires' | 'size'
export type SortDirection = 'asc' | 'desc'

export interface CookieSortState {
  field: CookieSortField
  direction: SortDirection
}

export const DEFAULT_COOKIE_SORT: CookieSortState = {
  field: 'name',
  direction: 'asc',
}
