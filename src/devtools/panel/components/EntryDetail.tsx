import type { StorageEntry } from '../../../shared/storage-adapters/types'
import { formatByteSize } from '../../../shared/storage-adapters/parse-value'
import type { ThemeMode } from '../hooks/useTheme'
import { CopyActions } from './CopyActions'
import { ValueViewer } from './ValueViewer'

interface EntryDetailProps {
  entry: StorageEntry | null
  searchQuery: string
  theme: ThemeMode
  onClose: () => void
}

export function EntryDetail({ entry, searchQuery, theme, onClose }: EntryDetailProps) {
  const isDark = theme === 'dark'

  if (!entry) {
    return (
      <aside
        className={`flex w-96 shrink-0 items-center justify-center border-l p-4 text-sm ${
          isDark ? 'border-surface-border text-gray-500' : 'border-slate-200 text-slate-500'
        }`}
      >
        Select a row to view the full value.
      </aside>
    )
  }

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
        <h2 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Value</h2>
        <button
          type="button"
          onClick={onClose}
          className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Close
        </button>
      </div>

      <div
        className={`space-y-3 border-b px-4 py-3 text-xs ${
          isDark ? 'border-surface-border text-gray-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <div>
          <p className="mb-1 uppercase tracking-wide">Key</p>
          <p className={`break-all font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
            {entry.key}
          </p>
        </div>
        <div className="flex gap-4">
          <div>
            <p className="mb-1 uppercase tracking-wide">Type</p>
            <p className={isDark ? 'text-gray-200' : 'text-slate-800'}>{entry.valueType}</p>
          </div>
          <div>
            <p className="mb-1 uppercase tracking-wide">Size</p>
            <p className={isDark ? 'text-gray-200' : 'text-slate-800'}>
              {formatByteSize(entry.byteSize)}
            </p>
          </div>
        </div>
        <CopyActions keyName={entry.key} value={entry.value} jsonPath={entry.key} isDark={isDark} />
      </div>

      <ValueViewer entry={entry} searchQuery={searchQuery} theme={theme} />
    </aside>
  )
}
