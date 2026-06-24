import type { IdbRecord } from '../../../injected/idb-bridge'
import type { ThemeMode } from '../hooks/useTheme'
import type { useIndexedDb } from '../hooks/useIndexedDb'
import { IdbRecordDetail } from './IdbRecordDetail'
import { IdbRecordList } from './IdbRecordList'
import { IdbTree } from './IdbTree'

type IndexedDbState = ReturnType<typeof useIndexedDb>

interface IndexedDbExplorerProps {
  idb: IndexedDbState
  searchQuery: string
  theme: ThemeMode
  isDark: boolean
  onDeleteRequest: (record: IdbRecord) => void
}

export function IndexedDbExplorer({
  idb,
  searchQuery,
  theme,
  isDark,
  onDeleteRequest,
}: IndexedDbExplorerProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className={`w-56 shrink-0 overflow-auto border-r ${
          isDark ? 'border-surface-border bg-surface' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div
          className={`border-b px-3 py-2 text-xs font-medium uppercase tracking-wide ${
            isDark ? 'border-surface-border text-gray-400' : 'border-slate-200 text-slate-500'
          }`}
        >
          Databases
        </div>
        <IdbTree
          databases={idb.databases}
          storesByDatabase={idb.storesByDatabase}
          loadingStoresFor={idb.loadingStoresFor}
          selectedDatabase={idb.selectedDatabase}
          selectedStore={idb.selectedStore}
          isDark={isDark}
          onSelectDatabase={(databaseName) => void idb.selectDatabase(databaseName)}
          onSelectStore={(databaseName, storeName) => void idb.selectStore(databaseName, storeName)}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1">
        <IdbRecordList
          records={idb.records}
          selectedId={idb.selectedRecord?.id ?? null}
          searchQuery={searchQuery}
          totalRecords={idb.totalRecords}
          hasMore={idb.hasMoreRecords}
          isLoading={idb.recordsState === 'loading'}
          isDark={isDark}
          onSelect={idb.setSelectedRecord}
          onLoadMore={() => void idb.loadMoreRecords()}
        />
        <IdbRecordDetail
          record={idb.selectedRecord}
          searchQuery={searchQuery}
          theme={theme}
          isMutating={idb.isMutating}
          isDark={isDark}
          onDelete={onDeleteRequest}
          onClose={() => idb.setSelectedRecord(null)}
        />
      </div>
    </div>
  )
}
