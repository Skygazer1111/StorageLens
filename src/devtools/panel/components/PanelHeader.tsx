import type { PageLocation } from '../../../injected/page-bridge'
import { ExtensionLogo } from '../../../shared/components/ExtensionLogo'
import { ExtensionPowerSwitch } from '../../../shared/components/ExtensionPowerSwitch'
import { usePageBridge } from '../../../shared/page-bridge/PageBridgeProvider'
import { useTheme } from '../hooks/useTheme'

interface PanelHeaderProps {
  location: PageLocation | null
  entryCount: number
  matchCount: number
  searchQuery: string
  storageLabel: string
  extensionEnabled?: boolean
  onExtensionEnabledChange?: (enabled: boolean) => void
}

export function PanelHeader({
  location,
  entryCount,
  matchCount,
  searchQuery,
  storageLabel,
  extensionEnabled,
  onExtensionEnabledChange,
}: PanelHeaderProps) {
  const { theme, toggleTheme, isDark } = useTheme()
  const { mode, tabTitle } = usePageBridge()

  return (
    <header
      className={`border-b px-4 py-3 ${isDark ? 'border-surface-border' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex items-start gap-3">
          <ExtensionLogo size={36} className="mt-0.5" />
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              StorageLens
            </h1>
            {mode === 'sidepanel' && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                Side panel
              </span>
            )}
            {mode === 'sidepanel' && extensionEnabled !== undefined && onExtensionEnabledChange && (
              <ExtensionPowerSwitch
                enabled={extensionEnabled}
                isDark={isDark}
                onChange={onExtensionEnabledChange}
              />
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{storageLabel}</p>
          {mode === 'sidepanel' && tabTitle && (
            <p className={`mt-1 truncate text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`} title={tabTitle}>
              Tab: {tabTitle}
            </p>
          )}
        </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className={`text-right text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <p>
              {searchQuery.trim()
                ? `${matchCount} of ${entryCount} matches`
                : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void chrome.runtime.openOptionsPage()}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isDark
                ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
                : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
            }`}
            title="Extension settings"
          >
            Settings
          </button>
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
