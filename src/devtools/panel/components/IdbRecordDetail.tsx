import type { IdbRecord } from '../../../injected/idb-bridge'
import { idbValuePreview, idbValueToTreeData } from '../../../shared/storage-adapters/idb-value'
import type { ThemeMode } from '../hooks/useTheme'
import { JsonTreeView } from './JsonTreeView'

interface IdbRecordDetailProps {
  record: IdbRecord | null
  searchQuery: string
  theme: ThemeMode
  isMutating?: boolean
  isDark: boolean
  onDelete: (record: IdbRecord) => void
  onClose: () => void
}

export function IdbRecordDetail({
  record,
  searchQuery,
  theme,
  isMutating = false,
  isDark,
  onDelete,
  onClose,
}: IdbRecordDetailProps) {
  if (!record) {
    return (
      <aside
        className={`flex w-96 shrink-0 items-center justify-center border-l p-4 text-sm ${
          isDark ? 'border-surface-border text-gray-500' : 'border-slate-200 text-slate-500'
        }`}
      >
        Select a record to inspect its value.
      </aside>
    )
  }

  const treeData = idbValueToTreeData(record.value)

  return (
    <aside
      className={`flex w-96 shrink-0 flex-col border-l ${
        isDark ? 'border-surface-border' : 'border-slate-200'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-4 py-2 ${
          isDark ? 'border-surface-border' : 'border-slate-200'
        }`}
      >
        <h2 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Record</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onDelete(record)}
            className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Close
          </button>
        </div>
      </div>

      <div
        className={`space-y-3 border-b px-4 py-3 text-xs ${
          isDark ? 'border-surface-border text-gray-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <div>
          <p className="mb-1 uppercase tracking-wide">Database</p>
          <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{record.database}</p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-wide">Store</p>
          <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{record.store}</p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-wide">Key</p>
          <p className={`break-all font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
            {record.key.display}
          </p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-wide">Type</p>
          <p className={isDark ? 'text-gray-200' : 'text-slate-800'}>{record.value.type}</p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-wide">Preview</p>
          <p className={`break-all font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
            {idbValuePreview(record.value)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <JsonTreeView
          data={treeData}
          storageKey={`${record.store}.${record.key.display}`}
          searchQuery={searchQuery}
          theme={theme}
        />
      </div>
    </aside>
  )
}
