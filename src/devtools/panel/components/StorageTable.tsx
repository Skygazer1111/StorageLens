import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  formatByteSize,
  truncatePreview,
} from '../../../shared/storage-adapters/parse-value'
import type { StorageEntry } from '../../../shared/storage-adapters/types'
import { HighlightText } from './HighlightText'

interface StorageTableProps {
  entries: StorageEntry[]
  selectedKey: string | null
  searchQuery: string
  isDark: boolean
  onSelect: (entry: StorageEntry) => void
}

const ROW_HEIGHT = 40

function ValueTypeBadge({
  valueType,
  isDark,
}: {
  valueType: StorageEntry['valueType']
  isDark: boolean
}) {
  const styles: Record<StorageEntry['valueType'], string> = {
    json: 'bg-emerald-500/20 text-emerald-300',
    string: isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-slate-200 text-slate-600',
    'jwt-candidate': 'bg-amber-500/20 text-amber-300',
  }

  const labels: Record<StorageEntry['valueType'], string> = {
    json: 'JSON',
    string: 'String',
    'jwt-candidate': 'JWT',
  }

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[valueType]}`}>
      {labels[valueType]}
    </span>
  )
}

export function StorageTable({
  entries,
  selectedKey,
  searchQuery,
  isDark,
  onSelect,
}: StorageTableProps) {
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
        {searchQuery.trim() ? 'No entries match your search.' : 'No entries found for this storage type.'}
      </div>
    )
  }

  const headerClass = `sticky top-0 z-10 grid grid-cols-[minmax(140px,1.2fr)_80px_72px_minmax(160px,1.5fr)] text-xs uppercase tracking-wide ${
    isDark ? 'bg-surface-raised text-gray-400' : 'bg-slate-100 text-slate-500'
  }`
  const rowClass = (selected: boolean) =>
    `grid cursor-pointer grid-cols-[minmax(140px,1.2fr)_80px_72px_minmax(160px,1.5fr)] border-t transition-colors ${
      isDark ? 'border-surface-border/50 hover:bg-surface-raised/80' : 'border-slate-200 hover:bg-slate-50'
    } ${selected ? (isDark ? 'bg-surface-raised' : 'bg-slate-100') : ''}`

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div className={headerClass}>
        <div className="px-4 py-2 font-medium">Key</div>
        <div className="px-4 py-2 font-medium">Type</div>
        <div className="px-4 py-2 font-medium">Size</div>
        <div className="px-4 py-2 font-medium">Preview</div>
      </div>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = entries[virtualRow.index]
          const selected = selectedKey === entry.key

          return (
            <div
              key={entry.key}
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
                <HighlightText
                  text={entry.key}
                  query={searchQuery}
                  className={isDark ? 'text-gray-200' : 'text-slate-800'}
                />
              </div>
              <div className="px-4 py-2">
                <ValueTypeBadge valueType={entry.valueType} isDark={isDark} />
              </div>
              <div
                className={`whitespace-nowrap px-4 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
              >
                {formatByteSize(entry.byteSize)}
              </div>
              <div className={`truncate px-4 py-2 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <HighlightText text={truncatePreview(entry.value)} query={searchQuery} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
