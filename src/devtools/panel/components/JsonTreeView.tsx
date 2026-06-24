import { useCallback, useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import JsonView from '@uiw/react-json-view'
import { valueMatchesQuery, splitByQuery } from '../../../shared/search/storage-search'
import { copyToClipboard } from '../../../shared/utils/clipboard'
import type { ThemeMode } from '../hooks/useTheme'

interface JsonTreeViewProps {
  data: unknown
  storageKey: string
  searchQuery: string
  theme: ThemeMode
}

interface ContextMenuState {
  x: number
  y: number
  path: string
  value: string
}

const darkStyles = {
  '--w-rjv-font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  '--w-rjv-background-color': '#1e1e2e',
  '--w-rjv-curlybraces-color': '#7c9cff',
  '--w-rjv-colon-color': '#94a3b8',
  '--w-rjv-brackets-color': '#7c9cff',
  '--w-rjv-ellipsis-color': '#94a3b8',
  '--w-rjv-key-string': '#e2e8f0',
  '--w-rjv-type-string-color': '#86efac',
  '--w-rjv-type-int-color': '#fcd34d',
  '--w-rjv-type-float-color': '#fcd34d',
  '--w-rjv-type-bigint-color': '#fcd34d',
  '--w-rjv-type-boolean-color': '#f472b6',
  '--w-rjv-type-date-color': '#67e8f9',
  '--w-rjv-type-null-color': '#94a3b8',
  '--w-rjv-type-undefined-color': '#94a3b8',
} as CSSProperties

const lightStyles = {
  '--w-rjv-font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  '--w-rjv-background-color': '#ffffff',
  '--w-rjv-curlybraces-color': '#4f46e5',
  '--w-rjv-colon-color': '#64748b',
  '--w-rjv-brackets-color': '#4f46e5',
  '--w-rjv-ellipsis-color': '#64748b',
  '--w-rjv-key-string': '#0f172a',
  '--w-rjv-type-string-color': '#15803d',
  '--w-rjv-type-int-color': '#b45309',
  '--w-rjv-type-float-color': '#b45309',
  '--w-rjv-type-bigint-color': '#b45309',
  '--w-rjv-type-boolean-color': '#be185d',
  '--w-rjv-type-date-color': '#0e7490',
  '--w-rjv-type-null-color': '#64748b',
  '--w-rjv-type-undefined-color': '#64748b',
} as CSSProperties

function toJsonViewValue(data: unknown): object {
  if (data !== null && typeof data === 'object') {
    return data
  }
  return { '(root)': data }
}

function buildJsonPath(storageKey: string, keys?: (string | number)[]): string {
  if (!keys || keys.length === 0) return storageKey
  return [storageKey, ...keys].join('.')
}

function HighlightedValue({ value, query }: { value: string; query: string }) {
  const parts = splitByQuery(value, query)
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-accent/40 px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  )
}

export function JsonTreeView({ data, storageKey, searchQuery, theme }: JsonTreeViewProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const isDark = theme === 'dark'
  const expandAll = searchQuery.trim().length > 0
  const viewValue = useMemo(() => toJsonViewValue(data), [data])

  const shouldExpandNode = useCallback(
    (isExpanded: boolean, props: { value?: object; keys: (number | string)[] }) => {
      if (expandAll) return true
      if (isExpanded) return true
      if (!searchQuery.trim()) return props.keys.length < 2

      const serialized = JSON.stringify(props.value ?? '')
      return valueMatchesQuery(serialized, searchQuery)
    },
    [expandAll, searchQuery],
  )

  const handleContextMenu = useCallback(
    (event: MouseEvent, path: string, value: string) => {
      event.preventDefault()
      setContextMenu({ x: event.clientX, y: event.clientY, path, value })
    },
    [],
  )

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const copyFromMenu = useCallback(async (text: string) => {
    await copyToClipboard(text)
    setContextMenu(null)
  }, [])

  return (
    <div className="relative" onClick={closeContextMenu} onScroll={closeContextMenu}>
      <JsonView
        value={viewValue}
        keyName={storageKey}
        style={isDark ? darkStyles : lightStyles}
        collapsed={expandAll ? false : 2}
        displayDataTypes={false}
        displayObjectSize
        shortenTextAfterLength={80}
        enableClipboard={false}
        shouldExpandNodeInitially={shouldExpandNode}
      >
        <JsonView.String
          render={(props, { type, value, keys }) => {
            if (type === 'type') {
              return <span {...props}>{props.children}</span>
            }

            const path = buildJsonPath(storageKey, keys)
            const stringValue = String(value ?? '')

            return (
              <span
                {...props}
                onContextMenu={(event) => handleContextMenu(event, path, stringValue)}
              >
                {searchQuery.trim() ? (
                  <HighlightedValue value={stringValue} query={searchQuery} />
                ) : (
                  props.children
                )}
              </span>
            )
          }}
        />
        <JsonView.ValueQuote
          render={(props, { value, keys }) => (
            <span
              {...props}
              onContextMenu={(event) =>
                handleContextMenu(event, buildJsonPath(storageKey, keys), String(value ?? ''))
              }
            >
              {props.children}
            </span>
          )}
        />
      </JsonView>

      {contextMenu && (
        <div
          className={`fixed z-50 min-w-[180px] rounded-md border py-1 shadow-lg ${
            isDark
              ? 'border-surface-border bg-surface-raised text-gray-200'
              : 'border-slate-200 bg-white text-slate-800'
          }`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-xs hover:bg-accent/20"
            onClick={() => void copyFromMenu(contextMenu.value)}
          >
            Copy value
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-xs hover:bg-accent/20"
            onClick={() => void copyFromMenu(contextMenu.path)}
          >
            Copy JSON path
          </button>
        </div>
      )}
    </div>
  )
}
