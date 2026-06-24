import { useMemo, useState } from 'react'
import '../../styles/globals.css'
import { filterEntries } from '../../shared/search/storage-search'
import { EntryDetail } from './components/EntryDetail'
import { PanelHeader } from './components/PanelHeader'
import { SearchBar } from './components/SearchBar'
import { StorageTable } from './components/StorageTable'
import { StorageTabs } from './components/StorageTabs'
import { useInspectedStorage } from './hooks/useInspectedStorage'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import type { StorageEntry, StorageKind } from '../../shared/storage-adapters/types'

function AppContent() {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<StorageKind>('local')
  const [selectedEntry, setSelectedEntry] = useState<StorageEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { entries, location, state, error, refresh } = useInspectedStorage(activeTab)

  const filteredEntries = useMemo(
    () => filterEntries(entries, searchQuery),
    [entries, searchQuery],
  )

  const storageLabel =
    activeTab === 'local' ? 'Local Storage for inspected page' : 'Session Storage for inspected page'

  const handleTabChange = (tab: StorageKind) => {
    setActiveTab(tab)
    setSelectedEntry(null)
    setSearchQuery('')
  }

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
        className={`flex items-center justify-between border-b px-4 py-2 ${
          isDark ? 'border-surface-border' : 'border-slate-200'
        }`}
      >
        <StorageTabs activeTab={activeTab} onChange={handleTabChange} isDark={isDark} />
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={state === 'loading'}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
            isDark
              ? 'border-surface-border bg-surface-raised text-gray-200 hover:border-accent hover:text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-accent hover:text-slate-900'
          }`}
        >
          {state === 'loading' ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {state === 'error' && (
        <div className="mx-4 mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? 'Unable to read storage. The page may use an opaque origin or block evaluation.'}
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
          onClose={() => setSelectedEntry(null)}
        />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
