import { useCallback, useEffect, useState } from 'react'
import { READ_PAGE_LOCATION_SCRIPT, type PageLocation } from '../../../injected/page-bridge'
import { evalJsonInInspectedPage } from '../../../shared/page-bridge/eval'
import {
  readLocalStorage,
  readSessionStorage,
} from '../../../shared/storage-adapters/local-storage-adapter'
import {
  createStorageEntry,
  removeStorageEntry,
  upsertStorageEntry,
} from '../../../shared/storage-adapters/entry-utils'
import {
  clearStorage,
  removeStorageItem,
  setStorageItem,
} from '../../../shared/storage-adapters/write-adapter'
import type { StorageEntry, StorageKind } from '../../../shared/storage-adapters/types'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

interface PageLocationResponse {
  ok: true
  href: string
  origin: string
}

interface PageLocationError {
  ok: false
  error: string
}

async function readPageLocation(): Promise<PageLocation> {
  const response = await evalJsonInInspectedPage<PageLocationResponse | PageLocationError>(
    READ_PAGE_LOCATION_SCRIPT,
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  return { href: response.href, origin: response.origin }
}

async function readStorageForKind(kind: StorageKind): Promise<StorageEntry[]> {
  return kind === 'local' ? readLocalStorage() : readSessionStorage()
}

export function useInspectedStorage(activeTab: StorageKind) {
  const [entries, setEntries] = useState<StorageEntry[]>([])
  const [location, setLocation] = useState<PageLocation | null>(null)
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const refresh = useCallback(async () => {
    setState('loading')
    setError(null)

    try {
      const [pageLocation, storageEntries] = await Promise.all([
        readPageLocation(),
        readStorageForKind(activeTab),
      ])

      setLocation(pageLocation)
      setEntries(storageEntries)
      setState('success')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Failed to read storage')
      setEntries([])
    }
  }, [activeTab])

  const runMutation = useCallback(
    async (applyOptimistic: (current: StorageEntry[]) => StorageEntry[], action: () => Promise<void>) => {
      let snapshot: StorageEntry[] = []

      setIsMutating(true)
      setError(null)
      setEntries((current) => {
        snapshot = current
        return applyOptimistic(current)
      })

      try {
        await action()
        setState('success')
      } catch (err) {
        setEntries(snapshot)
        const message = err instanceof Error ? err.message : 'Storage operation failed'
        setError(message)
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [],
  )

  const saveItem = useCallback(
    async (key: string, value: string) => {
      const trimmedKey = key.trim()
      if (!trimmedKey) {
        throw new Error('Key cannot be empty')
      }

      await runMutation(
        (current) => upsertStorageEntry(current, createStorageEntry(trimmedKey, value)),
        () => setStorageItem(activeTab, trimmedKey, value),
      )
    },
    [activeTab, runMutation],
  )

  const deleteItem = useCallback(
    async (key: string) => {
      await runMutation(
        (current) => removeStorageEntry(current, key),
        () => removeStorageItem(activeTab, key),
      )
    },
    [activeTab, runMutation],
  )

  const clearAll = useCallback(async () => {
    await runMutation(
      () => [],
      () => clearStorage(activeTab),
    )
  }, [activeTab, runMutation])

  const hasKey = useCallback((key: string) => entries.some((entry) => entry.key === key), [entries])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  return {
    entries,
    location,
    state,
    error,
    isMutating,
    refresh,
    saveItem,
    deleteItem,
    clearAll,
    hasKey,
  }
}
