import { useCallback, useEffect, useState } from 'react'
import type { PageLocation } from '../../../injected/page-bridge'
import { readPageLocation } from '../../../shared/page-bridge/page-location'
import { usePageBridge } from '../../../shared/page-bridge/PageBridgeProvider'
import type { CookieData } from '../../../shared/messaging/types'
import {
  clearCookies,
  readCookies,
  removeCookieEntry,
  setCookie,
} from '../../../shared/storage-adapters/cookie-adapter'
import { mapCookieToEntry } from '../../../shared/storage-adapters/cookie-utils'
import { upsertStorageEntry, removeStorageEntry } from '../../../shared/storage-adapters/entry-utils'
import type { StorageEntry } from '../../../shared/storage-adapters/types'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

export function useCookieStorage(enabled: boolean) {
  const { contextKey } = usePageBridge()
  const [entries, setEntries] = useState<StorageEntry[]>([])
  const [location, setLocation] = useState<PageLocation | null>(null)
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setState('loading')
    setError(null)

    try {
      const pageLocation = await readPageLocation()
      const cookies = await readCookies(pageLocation.href)
      setLocation(pageLocation)
      setEntries(cookies)
      setState('success')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Failed to read cookies')
      setEntries([])
    }
  }, [enabled])

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
        const message = err instanceof Error ? err.message : 'Cookie operation failed'
        setError(message)
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [],
  )

  const saveCookie = useCallback(
    async (cookie: CookieData) => {
      if (!location?.href) {
        throw new Error('Page URL is unavailable')
      }

      let savedEntry: StorageEntry | null = null

      await runMutation(
        (current) => upsertStorageEntry(current, mapCookieToEntry(cookie)),
        async () => {
          savedEntry = await setCookie(location.href, cookie)
        },
      )

      if (savedEntry) {
        setEntries((current) => upsertStorageEntry(current, savedEntry!))
      }
    },
    [location, runMutation],
  )

  const deleteCookie = useCallback(
    async (entry: StorageEntry) => {
      if (!location?.href) {
        throw new Error('Page URL is unavailable')
      }

      await runMutation(
        (current) => removeStorageEntry(current, entry.id),
        () => removeCookieEntry(location.href, entry),
      )
    },
    [location, runMutation],
  )

  const clearAll = useCallback(async () => {
    if (!location?.href) {
      throw new Error('Page URL is unavailable')
    }

    const snapshot = entries

    await runMutation(
      () => [],
      () => clearCookies(location.href, snapshot),
    )
  }, [entries, location, runMutation])

  const hasCookieName = useCallback(
    (name: string, domain: string, path: string) =>
      entries.some(
        (entry) => entry.key === name && entry.cookie?.domain === domain && entry.cookie?.path === path,
      ),
    [entries],
  )

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, contextKey, refresh])

  useEffect(() => {
    if (!enabled) return
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [enabled, contextKey, refresh])

  return {
    entries,
    location,
    state,
    error,
    isMutating,
    refresh,
    saveCookie,
    deleteCookie,
    clearAll,
    hasCookieName,
  }
}
