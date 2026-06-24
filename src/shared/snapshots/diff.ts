import type { SnapshotDiff, SnapshotDiffSection, StorageSnapshot } from './types'

function diffRecordMaps(left: Record<string, string>, right: Record<string, string>): SnapshotDiffSection {
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []

  const leftKeys = new Set(Object.keys(left))
  const rightKeys = new Set(Object.keys(right))

  for (const key of rightKeys) {
    if (!leftKeys.has(key)) {
      added.push(key)
      continue
    }
    if (left[key] !== right[key]) {
      changed.push(key)
    }
  }

  for (const key of leftKeys) {
    if (!rightKeys.has(key)) {
      removed.push(key)
    }
  }

  return {
    added: added.sort((a, b) => a.localeCompare(b)),
    removed: removed.sort((a, b) => a.localeCompare(b)),
    changed: changed.sort((a, b) => a.localeCompare(b)),
  }
}

function cookieMap(snapshot: StorageSnapshot): Record<string, string> {
  const map: Record<string, string> = {}
  for (const cookie of snapshot.cookies) {
    map[cookie.id] = cookie.value
  }
  return map
}

export function diffSnapshots(left: StorageSnapshot, right: StorageSnapshot): SnapshotDiff {
  return {
    localStorage: diffRecordMaps(left.localStorage, right.localStorage),
    sessionStorage: diffRecordMaps(left.sessionStorage, right.sessionStorage),
    cookies: diffRecordMaps(cookieMap(left), cookieMap(right)),
  }
}
