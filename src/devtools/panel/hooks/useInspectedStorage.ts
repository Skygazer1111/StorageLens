import { useCallback, useEffect, useState } from 'react'
import { READ_PAGE_LOCATION_SCRIPT, type PageLocation } from '../../../injected/page-bridge'
import { evalJsonInInspectedPage } from '../../../shared/page-bridge/eval'
import {
  readLocalStorage,
  readSessionStorage,
} from '../../../shared/storage-adapters/local-storage-adapter'
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

export function useInspectedStorage(activeTab: StorageKind) {
  const [entries, setEntries] = useState<StorageEntry[]>([])
  const [location, setLocation] = useState<PageLocation | null>(null)
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setState('loading')
    setError(null)

    try {
      const [pageLocation, storageEntries] = await Promise.all([
        readPageLocation(),
        activeTab === 'local' ? readLocalStorage() : readSessionStorage(),
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

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  return { entries, location, state, error, refresh }
}
