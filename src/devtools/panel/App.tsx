import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import '../../styles/globals.css'
import { createStorageEntry } from '../../shared/storage-adapters/entry-utils'
import { filterEntries } from '../../shared/search/storage-search'
import type { StorageEntry, StorageKind } from '../../shared/storage-adapters/types'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EntryDetail } from './components/EntryDetail'
import { PanelHeader } from './components/PanelHeader'
import { SearchBar } from './components/SearchBar'
import { StorageTable } from './components/StorageTable'
import { StorageTabs } from './components/StorageTabs'
import type { ValueEditorMode } from './components/ValueEditorModal'
import { useInspectedStorage } from './hooks/useInspectedStorage'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { ToastProvider, useToast } from './hooks/useToast'

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

function AppContent() {
  const { isDark } = useTheme()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<StorageKind>('local')
  const [selectedEntry, setSelectedEntry] = useState<StorageEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

  const {
    entries,
    location,
    state,
    error,
    isMutating,
    refresh,
    saveItem,
    deleteItem,
    clearAll,
  } = useInspectedStorage(activeTab)

  const filteredEntries = useMemo(
    () => filterEntries(entries, searchQuery),
    [entries, searchQuery],
  )

  const existingKeys = useMemo(() => entries.map((entry) => entry.key), [entries])

  const storageLabel =
    activeTab === 'local' ? 'Local Storage for inspected page' : 'Session Storage for inspected page'

  const storageTypeLabel = activeTab === 'local' ? 'local storage' : 'session storage'

  useEffect(() => {
    if (!selectedEntry) return
    const updated = entries.find((entry) => entry.key === selectedEntry.key)
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
    setDeleteKey(null)
    setClearOpen(false)
  }

  const openAddEditor = () => {
    setEditorState({
      mode: 'add',
      key: '',
      value: '{\n  \n}',
      keyDisabled: false,
    })
  }

  const openEditEditor = (entry: StorageEntry) => {
    setEditorState({
      mode: 'edit',
      key: entry.key,
      value: entry.value,
      keyDisabled: true,
    })
  }

  const handleSave = async (key: string, value: string) => {
    try {
      await saveItem(key, value)
      showToast(`Saved "${key}"`, 'success')
      setSelectedEntry(createStorageEntry(key, value))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save value', 'error')
      throw err
    }
  }

  const handleDelete = async () => {
    if (!deleteKey) return

    try {
      await deleteItem(deleteKey)
      showToast(`Deleted "${deleteKey}"`, 'success')
      if (selectedEntry?.key === deleteKey) {
        setSelectedEntry(null)
      }
      setDeleteKey(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete entry', 'error')
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAll()
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
      className={`flex min-h-screen flex-col ${isDark ? 'bg-surface text-gray-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <PanelHeader
        location={location}
        entryCount={entries.length}
        matchCount={filteredEntries.length}
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

      <div
        className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${
          isDark ? 'border-surface-border' : 'border-slate-200'
        }`}
      >
        <StorageTabs activeTab={activeTab} onChange={handleTabChange} isDark={isDark} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddEditor}
            disabled={isMutating || state === 'loading'}
            className={toolbarButtonClass}
          >
            Add key
          </button>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            disabled={isMutating || entries.length === 0}
            className={`${toolbarButtonClass} hover:border-red-400 hover:text-red-300`}
          >
            Clear all
          </button>
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
        <StorageTable
          entries={filteredEntries}
          selectedKey={selectedEntry?.key ?? null}
          searchQuery={searchQuery}
          isDark={isDark}
          onSelect={setSelectedEntry}
        />
        <EntryDetail
          entry={selectedEntry}
          searchQuery={searchQuery}
          theme={isDark ? 'dark' : 'light'}
          isMutating={isMutating}
          onClose={() => setSelectedEntry(null)}
          onEdit={openEditEditor}
          onDelete={(entry) => setDeleteKey(entry.key)}
        />
      </div>

      {editorState && (
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

      <ConfirmDialog
        open={deleteKey !== null}
        title="Delete entry"
        description={`Delete "${deleteKey}" from ${storageTypeLabel}? This cannot be undone.`}
        confirmLabel="Delete"
        isDark={isDark}
        destructive
        onCancel={() => setDeleteKey(null)}
        onConfirm={() => void handleDelete()}
      />

      <ConfirmDialog
        open={clearOpen}
        title="Clear all storage"
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
