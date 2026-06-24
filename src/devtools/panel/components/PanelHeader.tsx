import type { PageLocation } from '../../../injected/page-bridge'
import { useTheme } from '../hooks/useTheme'

interface PanelHeaderProps {
  location: PageLocation | null
  entryCount: number
  matchCount: number
  searchQuery: string
  storageLabel: string
}

export function PanelHeader({
  location,
  entryCount,
  matchCount,
  searchQuery,
  storageLabel,
}: PanelHeaderProps) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <header
      className={`border-b px-4 py-3 ${isDark ? 'border-surface-border' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            StorageLens
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{storageLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-right text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <p>
              {searchQuery.trim()
                ? `${matchCount} of ${entryCount} matches`
                : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isDark
                ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
                : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
            }`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
      {location && (
        <p className="mt-2 truncate font-mono text-xs text-accent" title={location.href}>
          {location.origin}
        </p>
      )}
    </header>
  )
}
