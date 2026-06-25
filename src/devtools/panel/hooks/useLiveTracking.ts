import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readLocalStorage, readSessionStorage } from '../../../shared/storage-adapters/local-storage-adapter'
import { readCookies } from '../../../shared/storage-adapters/cookie-adapter'
import type { StorageEntry } from '../../../shared/storage-adapters/types'

type LiveStorageKind = 'local' | 'session' | 'cookies'
type LiveChangeType = 'added' | 'updated' | 'removed'

export interface LiveChangeEvent {
  id: string
  timestamp: number
  storage: LiveStorageKind
  changeType: LiveChangeType
  key: string
  entryId: string | null
  oldValue: string | null
  newValue: string | null
}

interface UseLiveTrackingOptions {
  cookieUrl?: string | null
  enabled: boolean
}

interface LiveSnapshotState {
  local: StorageEntry[]
  session: StorageEntry[]
  cookies: StorageEntry[]
}

const POLL_INTERVAL_MS = 1500
const MAX_EVENTS = 150

function toMap(entries: StorageEntry[]): Map<string, StorageEntry> {
  return new Map(entries.map((entry) => [entry.id, entry]))
}

function diffEntries(
  storage: LiveStorageKind,
  before: StorageEntry[],
  after: StorageEntry[],
  at: number,
): LiveChangeEvent[] {
  const beforeMap = toMap(before)
  const afterMap = toMap(after)
  const events: LiveChangeEvent[] = []

  for (const entry of after) {
    const prev = beforeMap.get(entry.id)
    if (!prev) {
      events.push({
        id: `${at}-${storage}-added-${entry.id}`,
        timestamp: at,
        storage,
        changeType: 'added',
        key: entry.key,
        entryId: entry.id,
        oldValue: null,
        newValue: entry.value,
      })
      continue
    }
    if (prev.value !== entry.value) {
      events.push({
        id: `${at}-${storage}-updated-${entry.id}`,
        timestamp: at,
        storage,
        changeType: 'updated',
        key: entry.key,
        entryId: entry.id,
        oldValue: prev.value,
        newValue: entry.value,
      })
    }
  }

  for (const entry of before) {
    if (!afterMap.has(entry.id)) {
      events.push({
        id: `${at}-${storage}-removed-${entry.id}`,
        timestamp: at,
        storage,
        changeType: 'removed',
        key: entry.key,
        entryId: null,
        oldValue: entry.value,
        newValue: null,
      })
    }
  }

  return events
}

export function useLiveTracking({ cookieUrl, enabled }: UseLiveTrackingOptions) {
  const [isPaused, setIsPaused] = useState(false)
  const [events, setEvents] = useState<LiveChangeEvent[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFocusRef = useRef(document.hasFocus())
  const snapshotRef = useRef<LiveSnapshotState | null>(null)

  const pushEvents = useCallback((nextEvents: LiveChangeEvent[]) => {
    if (nextEvents.length === 0) return
    const sorted = [...nextEvents].sort((a, b) => b.timestamp - a.timestamp)
    setEvents((current) => [...sorted, ...current].slice(0, MAX_EVENTS))
    if (!hasFocusRef.current) {
      setUnseenCount((current) => current + sorted.length)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (!enabled || isPaused) return

    setIsSyncing(true)
    try {
      const [local, session, cookies] = await Promise.all([
        readLocalStorage(),
        readSessionStorage(),
        cookieUrl ? readCookies(cookieUrl) : Promise.resolve([] as StorageEntry[]),
      ])

      const previous = snapshotRef.current
      const nextSnapshot: LiveSnapshotState = { local, session, cookies }
      snapshotRef.current = nextSnapshot
      setError(null)

      if (!previous) return
      const at = Date.now()
      pushEvents([
        ...diffEntries('local', previous.local, local, at),
        ...diffEntries('session', previous.session, session, at),
        ...diffEntries('cookies', previous.cookies, cookies, at),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Live tracking failed')
    } finally {
      setIsSyncing(false)
    }
  }, [cookieUrl, enabled, isPaused, pushEvents])

  useEffect(() => {
    if (!enabled) {
      snapshotRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || isPaused) return
    const timer = window.setInterval(() => {
      void syncNow()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [enabled, isPaused, syncNow])

  useEffect(() => {
    const onFocus = () => {
      hasFocusRef.current = true
      setUnseenCount(0)
    }
    const onBlur = () => {
      hasFocusRef.current = false
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !cookieUrl) return
    const port = chrome.runtime.connect({ name: 'storagelens-live' })
    const handleMessage = (message: unknown) => {
      if (
        message &&
        typeof message === 'object' &&
        (message as { type?: string }).type === 'COOKIE_CHANGED'
      ) {
        void syncNow()
      }
    }
    port.onMessage.addListener(handleMessage)
    return () => {
      port.onMessage.removeListener(handleMessage)
      port.disconnect()
    }
  }, [cookieUrl, enabled, syncNow])

  const summary = useMemo(() => {
    return {
      local: events.filter((event) => event.storage === 'local').length,
      session: events.filter((event) => event.storage === 'session').length,
      cookies: events.filter((event) => event.storage === 'cookies').length,
    }
  }, [events])

  return {
    events,
    unseenCount,
    isPaused,
    isSyncing,
    error,
    summary,
    setPaused: setIsPaused,
    clearEvents: () => setEvents([]),
    syncNow,
  }
}
