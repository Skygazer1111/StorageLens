import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { formatCookieExpiry } from '../../../shared/storage-adapters/cookie-utils'
import { formatByteSize, truncatePreview } from '../../../shared/storage-adapters/parse-value'
import type { CookieSortField, CookieSortState, StorageEntry } from '../../../shared/storage-adapters/types'
import { HighlightText } from './HighlightText'

interface CookieTableProps {
  entries: StorageEntry[]
  selectedId: string | null
  searchQuery: string
  sort: CookieSortState
  isDark: boolean
  onSelect: (entry: StorageEntry) => void
  onSort: (field: CookieSortField) => void
}

const ROW_HEIGHT = 44

function SortButton({
  label,
  field,
  sort,
  isDark,
  onSort,
}: {
  label: string
  field: CookieSortField
  sort: CookieSortState
  isDark: boolean
  onSort: (field: CookieSortField) => void
}) {
  const active = sort.field === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wide ${
        active ? 'text-accent' : isDark ? 'text-gray-400' : 'text-slate-500'
      }`}
    >
      {label}
      {active ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  )
}

export function CookieTable({
  entries,
  selectedId,
  searchQuery,
  sort,
  isDark,
  onSelect,
  onSort,
}: CookieTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })

  if (entries.length === 0) {
    return (
      <div
        className={`flex flex-1 items-center justify-center p-8 text-sm ${
          isDark ? 'text-gray-500' : 'text-slate-500'
        }`}
      >
        {searchQuery.trim() ? 'No cookies match your search or filters.' : 'No cookies found for this origin.'}
      </div>
    )
  }

  const headerClass = `sticky top-0 z-10 grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_72px_minmax(140px,1.2fr)_minmax(100px,0.8fr)] ${
    isDark ? 'bg-surface-raised' : 'bg-slate-100'
  }`
  const rowClass = (selected: boolean) =>
    `grid cursor-pointer grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_72px_minmax(140px,1.2fr)_minmax(100px,0.8fr)] border-t transition-colors ${
      isDark ? 'border-surface-border/50 hover:bg-surface-raised/80' : 'border-slate-200 hover:bg-slate-50'
    } ${selected ? (isDark ? 'bg-surface-raised' : 'bg-slate-100') : ''}`

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div className={headerClass}>
        <SortButton label="Name" field="name" sort={sort} isDark={isDark} onSort={onSort} />
        <SortButton label="Domain" field="domain" sort={sort} isDark={isDark} onSort={onSort} />
        <SortButton label="Size" field="size" sort={sort} isDark={isDark} onSort={onSort} />
        <SortButton label="Expires" field="expires" sort={sort} isDark={isDark} onSort={onSort} />
        <div className={`px-4 py-2 text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Preview
        </div>
      </div>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = entries[virtualRow.index]
          const cookie = entry.cookie
          if (!cookie) return null

          const selected = selectedId === entry.id
          const expiry = formatCookieExpiry(cookie)

          return (
            <div
              key={entry.id}
              role="row"
              tabIndex={0}
              onClick={() => onSelect(entry)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(entry)
                }
              }}
              className={rowClass(selected)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="truncate px-4 py-2 font-mono text-xs">
                <HighlightText text={entry.key} query={searchQuery} className={isDark ? 'text-gray-200' : 'text-slate-800'} />
              </div>
              <div className={`truncate px-4 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <HighlightText text={cookie.domain} query={searchQuery} />
              </div>
              <div className={`px-4 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {formatByteSize(entry.byteSize)}
              </div>
              <div className={`truncate px-4 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`} title={expiry.absolute}>
                {expiry.relative}
              </div>
              <div className={`truncate px-4 py-2 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <HighlightText text={truncatePreview(entry.value, 40)} query={searchQuery} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
