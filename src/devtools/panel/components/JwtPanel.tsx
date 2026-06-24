import { useMemo, useState } from 'react'
import { copyToClipboard } from '../../../shared/utils/clipboard'
import { formatJwtTime, tryDecodeJwt } from '../../../shared/jwt/decode'
import type { ThemeMode } from '../hooks/useTheme'
import { JsonTreeView } from './JsonTreeView'

interface JwtPanelProps {
  token: string
  storageKey: string
  searchQuery: string
  theme: ThemeMode
  defaultExpanded?: boolean
}

export function JwtPanel({
  token,
  storageKey,
  searchQuery,
  theme,
  defaultExpanded = false,
}: JwtPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState<string | null>(null)
  const isDark = theme === 'dark'
  const decoded = useMemo(() => tryDecodeJwt(token), [token])

  const handleCopy = async (label: string, value: unknown) => {
    try {
      await copyToClipboard(JSON.stringify(value, null, 2))
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1400)
    } catch {
      setCopied('error')
      window.setTimeout(() => setCopied(null), 1400)
    }
  }

  return (
    <section
      className={`border-b px-4 py-3 ${isDark ? 'border-surface-border' : 'border-slate-200'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
            JWT
          </span>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className={`text-xs ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {expanded ? 'Hide decoded token' : 'Decode JWT'}
          </button>
        </div>
        <span className={`text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          Signature not verified
        </span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {!decoded.ok ? (
            <p className="text-xs text-red-400">Unable to decode token: {decoded.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy('header', decoded.data.header)}
                  className={`rounded border px-2 py-1 text-xs ${
                    isDark
                      ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
                      : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
                  }`}
                >
                  {copied === 'header' ? 'Copied!' : 'Copy header JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy('payload', decoded.data.payload)}
                  className={`rounded border px-2 py-1 text-xs ${
                    isDark
                      ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
                      : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
                  }`}
                >
                  {copied === 'payload' ? 'Copied!' : 'Copy payload JSON'}
                </button>
                {copied === 'error' && <span className="text-xs text-red-400">Copy failed</span>}
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                {(['iat', 'exp'] as const).map((claim) => {
                  const formatted = formatJwtTime(decoded.data.payload[claim])
                  if (!formatted) return null
                  return (
                    <div
                      key={claim}
                      className={`rounded border px-2 py-1 ${
                        isDark ? 'border-surface-border text-gray-300' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="uppercase tracking-wide">{claim}</p>
                      <p>{formatted.relative}</p>
                      <p className="text-[11px] opacity-80">{formatted.absolute}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className={`mb-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Header</p>
                  <div className="max-h-44 overflow-auto rounded border border-surface-border/50 p-2">
                    <JsonTreeView
                      data={decoded.data.header}
                      storageKey={`${storageKey}.jwt.header`}
                      searchQuery={searchQuery}
                      theme={theme}
                    />
                  </div>
                </div>
                <div>
                  <p className={`mb-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Payload</p>
                  <div className="max-h-44 overflow-auto rounded border border-surface-border/50 p-2">
                    <JsonTreeView
                      data={decoded.data.payload}
                      storageKey={`${storageKey}.jwt.payload`}
                      searchQuery={searchQuery}
                      theme={theme}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
