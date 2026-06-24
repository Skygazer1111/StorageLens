import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { IdbRecord } from '../../../injected/idb-bridge'
import { idbValuePreview } from '../../../shared/storage-adapters/idb-value'
import { HighlightText } from './HighlightText'

interface IdbRecordListProps {
  records: IdbRecord[]
  selectedId: string | null
  searchQuery: string
  totalRecords: number
  hasMore: boolean
  isLoading: boolean
  isDark: boolean
  onSelect: (record: IdbRecord) => void
  onLoadMore: () => void
}

const ROW_HEIGHT = 40

export function IdbRecordList({
  records,
  selectedId,
  searchQuery,
  totalRecords,
  hasMore,
  isLoading,
  isDark,
  onSelect,
  onLoadMore,
}: IdbRecordListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const filteredRecords = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase()
    if (!trimmed) return records
    return records.filter((record) => {
      const preview = idbValuePreview(record.value).toLowerCase()
      return record.key.display.toLowerCase().includes(trimmed) || preview.includes(trimmed)
    })
  }, [records, searchQuery])

  const virtualizer = useVirtualizer({
    count: filteredRecords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  if (!records.length && !isLoading) {
    return (
      <div className={`flex flex-1 items-center justify-center p-6 text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
        Select an object store to view records.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`border-b px-4 py-2 text-xs ${isDark ? 'border-surface-border text-gray-400' : 'border-slate-200 text-slate-500'}`}
      >
        {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
        {searchQuery.trim() ? ` · ${filteredRecords.length} shown` : ''}
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div
          className={`sticky top-0 z-10 grid grid-cols-[minmax(140px,1fr)_minmax(180px,1.4fr)] text-xs uppercase tracking-wide ${
            isDark ? 'bg-surface-raised text-gray-400' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <div className="px-4 py-2 font-medium">Key</div>
          <div className="px-4 py-2 font-medium">Value preview</div>
        </div>

        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const record = filteredRecords[virtualRow.index]
            const selected = selectedId === record.id

            return (
              <div
                key={record.id}
                role="row"
                tabIndex={0}
                onClick={() => onSelect(record)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(record)
                  }
                }}
                className={`grid cursor-pointer grid-cols-[minmax(140px,1fr)_minmax(180px,1.4fr)] border-t transition-colors ${
                  isDark ? 'border-surface-border/50 hover:bg-surface-raised/80' : 'border-slate-200 hover:bg-slate-50'
                } ${selected ? (isDark ? 'bg-surface-raised' : 'bg-slate-100') : ''}`}
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
                    text={record.key.display}
                    query={searchQuery}
                    className={isDark ? 'text-gray-200' : 'text-slate-800'}
                  />
                </div>
                <div className={`truncate px-4 py-2 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  <HighlightText text={idbValuePreview(record.value)} query={searchQuery} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`border-t px-4 py-2 ${isDark ? 'border-surface-border' : 'border-slate-200'}`}>
        {isLoading ? (
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading records…</p>
        ) : hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            className={`text-xs ${isDark ? 'text-accent hover:text-white' : 'text-accent hover:text-slate-900'}`}
          >
            Load more records
          </button>
        ) : (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>End of loaded records</p>
        )}
      </div>
    </div>
  )
}
