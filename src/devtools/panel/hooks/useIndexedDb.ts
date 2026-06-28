import type { IdbDatabaseInfo, IdbObjectStoreInfo, IdbRecord } from '../../../injected/idb-bridge'
import { useCallback, useEffect, useState } from 'react'
import type { PageLocation } from '../../../injected/page-bridge'
import { readPageLocation } from '../../../shared/page-bridge/page-location'
import { usePageBridge } from '../../../shared/page-bridge/PageBridgeProvider'
import {
  deleteIndexedDbRecord,
  IDB_PAGE_SIZE,
  listIndexedDatabases,
  listObjectStores,
  readObjectStoreRecords,
} from '../../../shared/storage-adapters/idb-adapter'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

export function useIndexedDb(enabled: boolean) {
  const { contextKey } = usePageBridge()
  const [location, setLocation] = useState<PageLocation | null>(null)
  const [databases, setDatabases] = useState<IdbDatabaseInfo[]>([])
  const [storesByDatabase, setStoresByDatabase] = useState<Record<string, IdbObjectStoreInfo[]>>({})
  const [loadingStoresFor, setLoadingStoresFor] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [records, setRecords] = useState<IdbRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMoreRecords, setHasMoreRecords] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<IdbRecord | null>(null)
  const [state, setState] = useState<LoadState>('idle')
  const [recordsState, setRecordsState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setState('loading')
    setError(null)
    setSelectedDatabase(null)
    setSelectedStore(null)
    setRecords([])
    setSelectedRecord(null)
    setStoresByDatabase({})

    try {
      const [pageLocation, databaseList] = await Promise.all([
        readPageLocation(),
        listIndexedDatabases(),
      ])
      setLocation(pageLocation)
      setDatabases(databaseList)
      setState('success')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Failed to read IndexedDB')
      setDatabases([])
    }
  }, [enabled])

  const loadStores = useCallback(async (databaseName: string) => {
    if (storesByDatabase[databaseName]) return

    setLoadingStoresFor(databaseName)
    setError(null)

    try {
      const stores = await listObjectStores(databaseName)
      setStoresByDatabase((current) => ({ ...current, [databaseName]: stores }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read object stores')
    } finally {
      setLoadingStoresFor(null)
    }
  }, [storesByDatabase])

  const loadRecords = useCallback(
    async (databaseName: string, storeName: string, append = false) => {
      setRecordsState('loading')
      setError(null)

      try {
        const offset = append ? records.length : 0
        const result = await readObjectStoreRecords(databaseName, storeName, offset, IDB_PAGE_SIZE)
        setTotalRecords(result.total)
        setHasMoreRecords(result.hasMore)
        setRecords((current) => (append ? [...current, ...result.records] : result.records))
        setRecordsState('success')
      } catch (err) {
        setRecordsState('error')
        setError(err instanceof Error ? err.message : 'Failed to read records')
        if (!append) {
          setRecords([])
          setTotalRecords(0)
          setHasMoreRecords(false)
        }
      }
    },
    [records.length],
  )

  const selectDatabase = useCallback(
    async (databaseName: string) => {
      setSelectedDatabase(databaseName)
      setSelectedStore(null)
      setRecords([])
      setSelectedRecord(null)
      setTotalRecords(0)
      setHasMoreRecords(false)
      await loadStores(databaseName)
    },
    [loadStores],
  )

  const selectStore = useCallback(
    async (databaseName: string, storeName: string) => {
      setSelectedDatabase(databaseName)
      setSelectedStore(storeName)
      setSelectedRecord(null)
      await loadRecords(databaseName, storeName, false)
    },
    [loadRecords],
  )

  const loadMoreRecords = useCallback(async () => {
    if (!selectedDatabase || !selectedStore || !hasMoreRecords) return
    await loadRecords(selectedDatabase, selectedStore, true)
  }, [hasMoreRecords, loadRecords, selectedDatabase, selectedStore])

  const deleteRecord = useCallback(
    async (record: IdbRecord) => {
      setIsMutating(true)
      setError(null)

      try {
        await deleteIndexedDbRecord(record.database, record.store, record.key.raw)
        setRecords((current) => current.filter((item) => item.id !== record.id))
        setTotalRecords((current) => Math.max(0, current - 1))
        if (selectedRecord?.id === record.id) {
          setSelectedRecord(null)
        }
        if (selectedDatabase) {
          setStoresByDatabase((current) => {
            const stores = current[selectedDatabase]
            if (!stores) return current
            return {
              ...current,
              [selectedDatabase]: stores.map((store) =>
                store.name === record.store
                  ? { ...store, count: Math.max(0, store.count - 1) }
                  : store,
              ),
            }
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete record'
        setError(message)
        throw err
      } finally {
        setIsMutating(false)
      }
    },
    [selectedDatabase, selectedRecord],
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
    location,
    databases,
    storesByDatabase,
    loadingStoresFor,
    selectedDatabase,
    selectedStore,
    records,
    totalRecords,
    hasMoreRecords,
    selectedRecord,
    state,
    recordsState,
    error,
    isMutating,
    refresh,
    loadStores,
    selectDatabase,
    selectStore,
    setSelectedRecord,
    loadMoreRecords,
    deleteRecord,
  }
}
