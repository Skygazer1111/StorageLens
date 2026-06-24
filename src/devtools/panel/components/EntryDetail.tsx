import type { StorageEntry } from '../../../shared/storage-adapters/types'
import { formatCookieExpiry } from '../../../shared/storage-adapters/cookie-utils'
import { formatByteSize } from '../../../shared/storage-adapters/parse-value'
import type { ThemeMode } from '../hooks/useTheme'
import { CopyActions } from './CopyActions'
import { ValueViewer } from './ValueViewer'

interface EntryDetailProps {
  entry: StorageEntry | null
  searchQuery: string
  theme: ThemeMode
  isMutating?: boolean
  onClose: () => void
  onEdit: (entry: StorageEntry) => void
  onDelete: (entry: StorageEntry) => void
}

export function EntryDetail({
  entry,
  searchQuery,
  theme,
  isMutating = false,
  onClose,
  onEdit,
  onDelete,
}: EntryDetailProps) {
  const isDark = theme === 'dark'
  const isCookie = Boolean(entry?.cookie)

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

  const actionClass = `rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
    isDark
      ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
      : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
  }`

  const expiry = entry.cookie ? formatCookieExpiry(entry.cookie) : null

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
        <h2 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {isCookie ? 'Cookie' : 'Value'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onEdit(entry)}
            className={actionClass}
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onDelete(entry)}
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
          <p className="mb-1 uppercase tracking-wide">{isCookie ? 'Name' : 'Key'}</p>
          <p className={`break-all font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
            {entry.key}
          </p>
        </div>

        {entry.cookie && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 uppercase tracking-wide">Domain</p>
                <p className={`break-all font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                  {entry.cookie.domain}
                </p>
              </div>
              <div>
                <p className="mb-1 uppercase tracking-wide">Path</p>
                <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                  {entry.cookie.path}
                </p>
              </div>
            </div>
            <div>
              <p className="mb-1 uppercase tracking-wide">Expires</p>
              <p className={isDark ? 'text-gray-200' : 'text-slate-800'}>{expiry?.relative}</p>
              <p className="mt-0.5 text-[11px]">{expiry?.absolute}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.cookie.secure && (
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Secure</span>
              )}
              {entry.cookie.httpOnly && (
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-300">HttpOnly</span>
              )}
              {entry.cookie.session && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">Session</span>
              )}
              <span className="rounded bg-gray-500/20 px-2 py-0.5 text-gray-300">
                SameSite: {entry.cookie.sameSite}
              </span>
            </div>
          </>
        )}

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
