import { useEffect, useMemo, useState } from 'react'
import { parseStorageValue } from '../../../shared/storage-adapters/parse-value'
import { splitByQuery } from '../../../shared/search/storage-search'
import type { StorageEntry } from '../../../shared/storage-adapters/types'
import type { ThemeMode } from '../hooks/useTheme'
import { JsonTreeView } from './JsonTreeView'

interface ValueViewerProps {
  entry: StorageEntry
  searchQuery: string
  theme: ThemeMode
}

function StringBlock({
  value,
  searchQuery,
  isDark,
}: {
  value: string
  searchQuery: string
  isDark: boolean
}) {
  const parts = splitByQuery(value, searchQuery)

  return (
    <pre
      className={`flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all ${
        isDark ? 'text-gray-200' : 'text-slate-800'
      }`}
    >
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-accent/40 px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </pre>
  )
}

export function ValueViewer({ entry, searchQuery, theme }: ValueViewerProps) {
  const isDark = theme === 'dark'
  const [parsed, setParsed] = useState<unknown | undefined>(entry.parsed)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  useEffect(() => {
    setParsed(entry.parsed)
    setParseError(null)
    setIsParsing(false)
  }, [entry])

  useEffect(() => {
    if (entry.valueType !== 'json' || parsed !== undefined) return

    setIsParsing(true)
    const timer = window.setTimeout(() => {
      try {
        setParsed(parseStorageValue(entry.value))
        setParseError(null)
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Invalid JSON')
      } finally {
        setIsParsing(false)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [entry, parsed])

  const jwtBadge = useMemo(() => {
    if (entry.valueType !== 'jwt-candidate') return null
    return (
      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
        JWT
      </span>
    )
  }, [entry.valueType])

  if (entry.valueType === 'json') {
    if (isParsing) {
      return (
        <div className={`p-4 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Parsing JSON…
        </div>
      )
    }

    if (parseError) {
      return <StringBlock value={entry.value} searchQuery={searchQuery} isDark={isDark} />
    }

    if (parsed !== undefined) {
      return (
        <div className="flex-1 overflow-auto p-3">
          <JsonTreeView
            data={parsed}
            storageKey={entry.key}
            searchQuery={searchQuery}
            theme={theme}
          />
        </div>
      )
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {jwtBadge && <div className="border-b border-surface-border px-4 py-2">{jwtBadge}</div>}
      <StringBlock value={entry.value} searchQuery={searchQuery} isDark={isDark} />
    </div>
  )
}
