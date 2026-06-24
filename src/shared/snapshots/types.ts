import type { CookieData } from '../messaging/types'

export interface SnapshotCookie extends CookieData {
  id: string
}

export interface StorageSnapshot {
  id: string
  label: string
  createdAt: string
  origin: string
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
  cookies: SnapshotCookie[]
}

export interface SnapshotDiffSection {
  added: string[]
  removed: string[]
  changed: string[]
}

export interface SnapshotDiff {
  localStorage: SnapshotDiffSection
  sessionStorage: SnapshotDiffSection
  cookies: SnapshotDiffSection
}
