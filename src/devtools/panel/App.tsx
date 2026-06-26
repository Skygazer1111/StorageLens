import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { IdbRecord } from '../../injected/idb-bridge'
import '../../styles/globals.css'
import { createStorageEntry } from '../../shared/storage-adapters/entry-utils'
import {
  filterCookieEntries,
  sortCookieEntries,
} from '../../shared/storage-adapters/cookie-utils'
import { filterEntries } from '../../shared/search/storage-search'
import type {
  CookieFilterState,
  CookieSortField,
  CookieSortState,
  StorageEntry,
  StorageKind,
} from '../../shared/storage-adapters/types'
import { DEFAULT_COOKIE_FILTERS, DEFAULT_COOKIE_SORT } from '../../shared/storage-adapters/types'
import { ConfirmDialog } from './components/ConfirmDialog'
import { CookieEditorModal, type CookieEditorMode } from './components/CookieEditorModal'
import { CookieFilters } from './components/CookieFilters'
import { LiveActivityFeed } from './components/LiveActivityFeed'
import { CookieTable } from './components/CookieTable'
import { IndexedDbExplorer } from './components/IndexedDbExplorer'
import { EntryDetail } from './components/EntryDetail'
import { PanelHeader } from './components/PanelHeader'
import { SearchBar } from './components/SearchBar'
import { SnapshotModal } from './components/SnapshotModal'
import { StorageTable } from './components/StorageTable'
import { StorageTabs } from './components/StorageTabs'
import type { ValueEditorMode } from './components/ValueEditorModal'
import { useIndexedDb } from './hooks/useIndexedDb'
import { useCookieStorage } from './hooks/useCookieStorage'
import { useInspectedStorage } from './hooks/useInspectedStorage'
import { useLiveTracking, type LiveChangeEvent } from './hooks/useLiveTracking'
import { useSnapshots } from './hooks/snapshots/useSnapshots'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { ToastProvider, useToast } from './hooks/useToast'
import { useExtensionSettings } from '../../shared/hooks/useExtensionSettings'

const ValueEditorModal = lazy(() =>
  import('./components/ValueEditorModal').then((module) => ({
    default: module.ValueEditorModal,
  })),
)

interface EditorState {
  mode: ValueEditorMode
  key: string
  value: string
  keyDisabled: boolean
}

interface CookieEditorState {
  mode: CookieEditorMode
  entry?: StorageEntry | null
}

function AppContent() {
  const { isDark } = useTheme()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<StorageKind>('local')
  const [selectedEntry, setSelectedEntry] = useState<StorageEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [cookieEditorState, setCookieEditorState] = useState<CookieEditorState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorageEntry | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [idbDeleteTarget, setIdbDeleteTarget] = useState<IdbRecord | null>(null)
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [cookieFilters, setCookieFilters] = useState<CookieFilterState>(DEFAULT_COOKIE_FILTERS)
  const [cookieSort, setCookieSort] = useState<CookieSortState>(DEFAULT_COOKIE_SORT)
  const { settings: extensionSettings, updateSettings } = useExtensionSettings()
  const snapshots = useSnapshots()

  const isCookies = activeTab === 'cookies'
  const isIndexedDb = activeTab === 'indexeddb'
  const webStorage = useInspectedStorage(activeTab)
  const cookieStorage = useCookieStorage(isCookies)
  const idbStorage = useIndexedDb(isIndexedDb)

  const entries = isCookies ? cookieStorage.entries : webStorage.entries
  const location = isIndexedDb ? idbStorage.location : isCookies ? cookieStorage.location : webStorage.location
  const state = isIndexedDb ? idbStorage.state : isCookies ? cookieStorage.state : webStorage.state
  const error = isIndexedDb ? idbStorage.error : isCookies ? cookieStorage.error : webStorage.error
  const isMutating = isIndexedDb
    ? idbStorage.isMutating
    : isCookies
      ? cookieStorage.isMutating
      : webStorage.isMutating
  const refresh = isIndexedDb ? idbStorage.refresh : isCookies ? cookieStorage.refresh : webStorage.refresh
  const liveTracking = useLiveTracking({
    enabled: Boolean(extensionSettings?.enabled && extensionSettings.liveTrackingEnabled),
    cookieUrl: cookieStorage.location?.href ?? webStorage.location?.href ?? null,
    pollIntervalMs: extensionSettings?.pollIntervalMs,
    idbSelection: {
      enabled: Boolean(extensionSettings?.liveIdbEnabled),
      databaseName: idbStorage.selectedDatabase,
      storeName: idbStorage.selectedStore,
    },
  })

  const filteredEntries = useMemo(() => {
    const searched = filterEntries(entries, searchQuery)
    if (!isCookies) return searched

    const filtered = filterCookieEntries(searched, cookieFilters)
    return sortCookieEntries(filtered, cookieSort)
  }, [cookieFilters, cookieSort, entries, isCookies, searchQuery])

  const existingKeys = useMemo(() => entries.map((entry) => entry.key), [entries])

  const storageLabel = isIndexedDb
    ? 'IndexedDB for inspected page'
    : isCookies
      ? 'Cookies for inspected page'
      : activeTab === 'local'
        ? 'Local Storage for inspected page'
        : 'Session Storage for inspected page'

  const storageTypeLabel = isIndexedDb
    ? 'IndexedDB'
    : isCookies
      ? 'cookies'
      : activeTab === 'local'
        ? 'local storage'
        : 'session storage'

  const headerEntryCount = isIndexedDb
    ? idbStorage.selectedStore
      ? idbStorage.totalRecords
      : idbStorage.databases.length
    : entries.length

  const headerMatchCount = isIndexedDb
    ? idbStorage.selectedStore
      ? idbStorage.records.length
      : idbStorage.databases.length
    : filteredEntries.length

  useEffect(() => {
    if (!selectedEntry) return
    const updated = entries.find((entry) => entry.id === selectedEntry.id)
    if (updated) {
      setSelectedEntry(updated)
    } else {
      setSelectedEntry(null)
    }
  }, [entries, selectedEntry])

  const handleTabChange = (tab: StorageKind) => {
    setActiveTab(tab)
    setSelectedEntry(null)
    setSearchQuery('')
    setEditorState(null)
    setCookieEditorState(null)
    setDeleteTarget(null)
    setClearOpen(false)
    setIdbDeleteTarget(null)
    setSnapshotOpen(false)
    setCookieFilters(DEFAULT_COOKIE_FILTERS)
    setCookieSort(DEFAULT_COOKIE_SORT)
  }

  const handleCookieSort = (field: CookieSortField) => {
    setCookieSort((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleLiveEventClick = (event: LiveChangeEvent) => {
    setSearchQuery(event.key)
    if (event.storage === 'indexeddb' && event.databaseName && event.storeName) {
      void idbStorage.selectStore(event.databaseName, event.storeName)
      setSelectedEntry(null)
      setActiveTab('indexeddb')
      return
    }

    if (event.storage === activeTab && event.entryId) {
      const matched = entries.find((entry) => entry.id === event.entryId || entry.key === event.key) ?? null
      setSelectedEntry(matched)
    } else {
      setSelectedEntry(null)
    }
    setActiveTab(event.storage)
  }

  const openAddEditor = () => {
    if (isCookies) {
      setCookieEditorState({ mode: 'add' })
      return
    }

    setEditorState({
      mode: 'add',
      key: '',
      value: '{\n  \n}',
      keyDisabled: false,
    })
  }

  const openEditEditor = (entry: StorageEntry) => {
    if (isCookies) {
      setCookieEditorState({ mode: 'edit', entry })
      return
    }

    setEditorState({
      mode: 'edit',
      key: entry.key,
      value: entry.value,
      keyDisabled: true,
    })
  }

  const handleSave = async (key: string, value: string) => {
    try {
      await webStorage.saveItem(key, value)
      showToast(`Saved "${key}"`, 'success')
      setSelectedEntry(createStorageEntry(key, value))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save value', 'error')
      throw err
    }
  }

  const handleCookieSave = async (cookie: Parameters<typeof cookieStorage.saveCookie>[0]) => {
    try {
      await cookieStorage.saveCookie(cookie)
      showToast(`Saved cookie "${cookie.name}"`, 'success')
      const saved = entries.find(
        (entry) =>
          entry.key === cookie.name &&
          entry.cookie?.domain === cookie.domain &&
          entry.cookie?.path === cookie.path,
      )
      if (saved) setSelectedEntry(saved)
      void refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save cookie', 'error')
      throw err
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (isCookies) {
        await cookieStorage.deleteCookie(deleteTarget)
      } else {
        await webStorage.deleteItem(deleteTarget.id)
      }

      showToast(`Deleted "${deleteTarget.key}"`, 'success')
      if (selectedEntry?.id === deleteTarget.id) {
        setSelectedEntry(null)
      }
      setDeleteTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete entry', 'error')
    }
  }

  const handleIdbDelete = async () => {
    if (!idbDeleteTarget) return

    try {
      await idbStorage.deleteRecord(idbDeleteTarget)
      showToast(`Deleted record "${idbDeleteTarget.key.display}"`, 'success')
      setIdbDeleteTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete IndexedDB record', 'error')
    }
  }

  const handleClearAll = async () => {
    try {
      if (isCookies) {
        await cookieStorage.clearAll()
      } else {
        await webStorage.clearAll()
      }

      showToast(`Cleared all ${storageTypeLabel}`, 'success')
      setSelectedEntry(null)
      setClearOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to clear storage', 'error')
    }
  }

  const toolbarButtonClass = `rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
    isDark
      ? 'border-surface-border bg-surface-raised text-gray-200 hover:border-accent hover:text-white'
      : 'border-slate-300 bg-white text-slate-700 hover:border-accent hover:text-slate-900'
  }`

  return (
    <div
      className={`relative flex min-h-screen flex-col ${isDark ? 'bg-surface text-gray-100' : 'bg-slate-50 text-slate-900'}`}
    >
      {extensionSettings && !extensionSettings.enabled && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div
            className={`max-w-md rounded-xl border p-6 text-center shadow-xl ${
              isDark ? 'border-surface-border bg-surface-raised' : 'border-slate-200 bg-white'
            }`}
          >
            <h2 className="text-lg font-semibold">StorageLens is turned off</h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Enable the extension from the toolbar popup or extension settings to continue inspecting storage.
            </p>
            <button
              type="button"
              onClick={() => void chrome.runtime.openOptionsPage()}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Open settings
            </button>
          </div>
        </div>
      )}

      <PanelHeader
        location={location}
        entryCount={headerEntryCount}
        matchCount={headerMatchCount}
        searchQuery={searchQuery}
        storageLabel={storageLabel}
      />

      <SearchBar
        query={searchQuery}
        onChange={setSearchQuery}
        matchCount={filteredEntries.length}
        totalCount={entries.length}
        isDark={isDark}
      />

      {isCookies && (
        <CookieFilters filters={cookieFilters} isDark={isDark} onChange={setCookieFilters} />
      )}

      <div
        className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${
          isDark ? 'border-surface-border' : 'border-slate-200'
        }`}
      >
        <StorageTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          isDark={isDark}
          badges={{
            local: liveTracking.summary.local,
            session: liveTracking.summary.session,
            cookies: liveTracking.summary.cookies,
            indexeddb: liveTracking.summary.indexeddb,
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSnapshotOpen(true)}
            className={toolbarButtonClass}
          >
            Snapshots
          </button>
          {!isIndexedDb && (
            <>
              <button
                type="button"
                onClick={openAddEditor}
                disabled={isMutating || state === 'loading'}
                className={toolbarButtonClass}
              >
                {isCookies ? 'Add cookie' : 'Add key'}
              </button>
              <button
                type="button"
                onClick={() => setClearOpen(true)}
                disabled={isMutating || entries.length === 0}
                className={`${toolbarButtonClass} hover:border-red-400 hover:text-red-300`}
              >
                Clear all
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={state === 'loading' || isMutating}
            className={toolbarButtonClass}
          >
            {state === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {isIndexedDb ? (
          <IndexedDbExplorer
            idb={idbStorage}
            searchQuery={searchQuery}
            theme={isDark ? 'dark' : 'light'}
            isDark={isDark}
            onDeleteRequest={setIdbDeleteTarget}
          />
        ) : isCookies ? (
          <CookieTable
            entries={filteredEntries}
            selectedId={selectedEntry?.id ?? null}
            searchQuery={searchQuery}
            sort={cookieSort}
            isDark={isDark}
            onSelect={setSelectedEntry}
            onSort={handleCookieSort}
          />
        ) : (
          <StorageTable
            entries={filteredEntries}
            selectedId={selectedEntry?.id ?? null}
            searchQuery={searchQuery}
            isDark={isDark}
            onSelect={setSelectedEntry}
          />
        )}
        {!isIndexedDb && (
          <EntryDetail
            entry={selectedEntry}
            searchQuery={searchQuery}
            theme={isDark ? 'dark' : 'light'}
            isMutating={isMutating}
            onClose={() => setSelectedEntry(null)}
            onEdit={openEditEditor}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <LiveActivityFeed
        events={liveTracking.events}
        unseenCount={liveTracking.unseenCount}
        isPaused={liveTracking.isPaused}
        isSyncing={liveTracking.isSyncing}
        liveIdbEnabled={Boolean(extensionSettings?.liveIdbEnabled)}
        isDark={isDark}
        onPauseToggle={() => liveTracking.setPaused(!liveTracking.isPaused)}
        onLiveIdbToggle={() => void updateSettings({ liveIdbEnabled: !extensionSettings?.liveIdbEnabled })}
        onEventClick={handleLiveEventClick}
      />

      {editorState && !isCookies && !isIndexedDb && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 text-sm text-white">
              Loading editor…
            </div>
          }
        >
          <ValueEditorModal
            open
            mode={editorState.mode}
            storageKey={storageTypeLabel}
            initialKey={editorState.key}
            initialValue={editorState.value}
            keyDisabled={editorState.keyDisabled}
            existingKeys={existingKeys}
            isSaving={isMutating}
            isDark={isDark}
            onSave={handleSave}
            onClose={() => setEditorState(null)}
          />
        </Suspense>
      )}

      {cookieEditorState && isCookies && (
        <CookieEditorModal
          open
          mode={cookieEditorState.mode}
          pageUrl={location?.href ?? 'https://localhost/'}
          initialEntry={cookieEditorState.entry}
          existingEntries={entries}
          isSaving={isMutating}
          isDark={isDark}
          onSave={handleCookieSave}
          onClose={() => setCookieEditorState(null)}
        />
      )}

      <SnapshotModal
        open={snapshotOpen}
        isDark={isDark}
        snapshots={snapshots.snapshots}
        totalApproxBytes={snapshots.totalApproxBytes}
        isBusy={snapshots.isBusy}
        onClose={() => setSnapshotOpen(false)}
        onCapture={async (label) => {
          await snapshots.captureSnapshot(label)
          showToast('Snapshot captured', 'success')
        }}
        onDelete={(id) => {
          snapshots.deleteSnapshot(id)
          showToast('Snapshot deleted', 'info')
        }}
        onExport={(id) => {
          snapshots.exportSnapshot(id)
          showToast('Snapshot exported', 'success')
        }}
        onImport={async (file) => {
          const imported = await snapshots.importSnapshots(file)
          showToast(`Imported ${imported} snapshot${imported === 1 ? '' : 's'}`, 'success')
        }}
        onCompare={snapshots.compareSnapshots}
        onCompareWithLive={async (snapshot) => {
          const live = await snapshots.captureLiveSnapshot()
          return snapshots.compareSnapshots(snapshot, live)
        }}
      />

      <ConfirmDialog
        open={idbDeleteTarget !== null}
        title="Delete IndexedDB record"
        description={`Delete "${idbDeleteTarget?.key.display}" from ${idbDeleteTarget?.database} → ${idbDeleteTarget?.store}? This permanently modifies page storage and cannot be undone.`}
        confirmLabel="Delete record"
        isDark={isDark}
        destructive
        onCancel={() => setIdbDeleteTarget(null)}
        onConfirm={() => void handleIdbDelete()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={isCookies ? 'Delete cookie' : 'Delete entry'}
        description={`Delete "${deleteTarget?.key}" from ${storageTypeLabel}? This cannot be undone.`}
        confirmLabel="Delete"
        isDark={isDark}
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      <ConfirmDialog
        open={clearOpen}
        title={isCookies ? 'Clear all cookies' : 'Clear all storage'}
        description={`Remove every entry from ${storageTypeLabel} on this origin. This cannot be undone.`}
        confirmLabel="Clear all"
        confirmText="CLEAR"
        isDark={isDark}
        destructive
        onCancel={() => setClearOpen(false)}
        onConfirm={() => void handleClearAll()}
      />
    </div>
  )
}

function AppWithProviders() {
  const { isDark } = useTheme()

  return (
    <ToastProvider isDark={isDark}>
      <AppContent />
    </ToastProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithProviders />
    </ThemeProvider>
  )
}
