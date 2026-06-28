import { useCallback, useEffect, useMemo, useState } from 'react'
import { readPageLocation } from '../../../../shared/page-bridge/page-location'
import { readCookies } from '../../../../shared/storage-adapters/cookie-adapter'
import { readLocalStorage, readSessionStorage } from '../../../../shared/storage-adapters/local-storage-adapter'
import { entryToCookieData } from '../../../../shared/storage-adapters/cookie-utils'
import { diffSnapshots } from '../../../../shared/snapshots/diff'
import type { StorageSnapshot } from '../../../../shared/snapshots/types'

const SNAPSHOTS_KEY = 'storagelens-snapshots'
const MAX_SNAPSHOTS = 20

function entriesToRecord(entries: Array<{ key: string; value: string }>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of entries) {
    map[entry.key] = entry.value
  }
  return map
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function normalizeImportedSnapshot(value: unknown): StorageSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const snapshot = value as StorageSnapshot
  if (
    typeof snapshot.id !== 'string' ||
    typeof snapshot.label !== 'string' ||
    typeof snapshot.createdAt !== 'string' ||
    typeof snapshot.origin !== 'string' ||
    !snapshot.localStorage ||
    !snapshot.sessionStorage ||
    !Array.isArray(snapshot.cookies)
  ) {
    return null
  }
  return snapshot
}

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<StorageSnapshot[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSnapshots = useCallback(() => {
    chrome.storage.local.get([SNAPSHOTS_KEY], (result) => {
      const raw = result[SNAPSHOTS_KEY]
      if (!Array.isArray(raw)) {
        setSnapshots([])
        return
      }
      setSnapshots(
        raw
          .map(normalizeImportedSnapshot)
          .filter((snapshot): snapshot is StorageSnapshot => Boolean(snapshot))
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      )
    })
  }, [])

  const saveSnapshots = useCallback((next: StorageSnapshot[]) => {
    chrome.storage.local.set({ [SNAPSHOTS_KEY]: next })
    setSnapshots(next)
  }, [])

  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  const captureSnapshot = useCallback(
    async (label?: string) => {
      setIsBusy(true)
      setError(null)
      try {
        const location = await readPageLocation()
        const [localEntries, sessionEntries, cookieEntries] = await Promise.all([
          readLocalStorage(),
          readSessionStorage(),
          readCookies(location.href),
        ])

        const snapshot: StorageSnapshot = {
          id: crypto.randomUUID(),
          label: label?.trim() || `Snapshot ${new Date().toLocaleString()}`,
          createdAt: new Date().toISOString(),
          origin: location.origin,
          localStorage: entriesToRecord(localEntries),
          sessionStorage: entriesToRecord(sessionEntries),
          cookies: cookieEntries.map((entry) => {
            const cookie = entryToCookieData(entry)
            return { ...cookie, id: entry.id }
          }),
        }

        const next = [snapshot, ...snapshots].slice(0, MAX_SNAPSHOTS)
        saveSnapshots(next)
        return snapshot
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to capture snapshot'
        setError(message)
        throw err
      } finally {
        setIsBusy(false)
      }
    },
    [saveSnapshots, snapshots],
  )

  const captureLiveSnapshot = useCallback(async () => {
    const location = await readPageLocation()
    const [localEntries, sessionEntries, cookieEntries] = await Promise.all([
      readLocalStorage(),
      readSessionStorage(),
      readCookies(location.href),
    ])

    const snapshot: StorageSnapshot = {
      id: `live-${Date.now()}`,
      label: 'Live',
      createdAt: new Date().toISOString(),
      origin: location.origin,
      localStorage: entriesToRecord(localEntries),
      sessionStorage: entriesToRecord(sessionEntries),
      cookies: cookieEntries.map((entry) => {
        const cookie = entryToCookieData(entry)
        return { ...cookie, id: entry.id }
      }),
    }

    return snapshot
  }, [])

  const deleteSnapshot = useCallback(
    (snapshotId: string) => {
      const next = snapshots.filter((snapshot) => snapshot.id !== snapshotId)
      saveSnapshots(next)
    },
    [saveSnapshots, snapshots],
  )

  const exportSnapshot = useCallback(
    (snapshotId: string) => {
      const snapshot = snapshots.find((item) => item.id === snapshotId)
      if (!snapshot) return
      const safeLabel = snapshot.label.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40)
      downloadJson(`${safeLabel || 'snapshot'}.json`, snapshot)
    },
    [snapshots],
  )

  const importSnapshots = useCallback(
    async (file: File) => {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const importedRaw = Array.isArray(parsed) ? parsed : [parsed]
      const imported = importedRaw
        .map(normalizeImportedSnapshot)
        .filter((snapshot): snapshot is StorageSnapshot => Boolean(snapshot))

      if (!imported.length) {
        throw new Error('No valid snapshots found in imported file')
      }

      const deduped = [...snapshots]
      for (const item of imported) {
        if (!deduped.some((existing) => existing.id === item.id)) {
          deduped.unshift(item)
        }
      }

      const next = deduped
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, MAX_SNAPSHOTS)

      saveSnapshots(next)
      return imported.length
    },
    [saveSnapshots, snapshots],
  )

  const compareSnapshots = useCallback((left: StorageSnapshot, right: StorageSnapshot) => {
    return diffSnapshots(left, right)
  }, [])

  const totalApproxBytes = useMemo(() => {
    try {
      return new TextEncoder().encode(JSON.stringify(snapshots)).length
    } catch {
      return 0
    }
  }, [snapshots])

  return {
    snapshots,
    isBusy,
    error,
    totalApproxBytes,
    captureSnapshot,
    deleteSnapshot,
    exportSnapshot,
    importSnapshots,
    compareSnapshots,
    captureLiveSnapshot,
  }
}
