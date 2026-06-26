import { useExtensionSettings } from '../shared/hooks/useExtensionSettings'
import { Toggle } from '../shared/components/Toggle'
import type { ThemeMode } from '../shared/settings/types'

function openOptions(section?: 'privacy' | 'terms') {
  const path = section ? `src/options/index.html#${section}` : 'src/options/index.html'
  void chrome.tabs.create({ url: chrome.runtime.getURL(path) })
}

export function PopupApp() {
  const { settings, isLoading, updateSettings } = useExtensionSettings()
  const isDark = settings?.theme !== 'light'

  if (isLoading || !settings) {
    return (
      <div
        className={`flex h-[420px] w-[380px] items-center justify-center ${isDark ? 'bg-surface text-gray-400' : 'bg-slate-50 text-slate-500'}`}
      >
        <p className="text-sm">Loading…</p>
      </div>
    )
  }

  const settingsDisabled = !settings.enabled

  return (
    <div
      className={`flex w-[380px] flex-col ${isDark ? 'bg-surface text-gray-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <header
        className={`border-b px-4 py-4 ${isDark ? 'border-surface-border bg-surface-raised/40' : 'border-slate-200 bg-white'}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-lg font-bold text-accent">
            SL
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">StorageLens</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Browser storage debugger
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <section>
          <Toggle
            checked={settings.enabled}
            label="Extension enabled"
            description="Turn StorageLens on or off globally. When off, live tracking pauses."
            isDark={isDark}
            onChange={(enabled) => void updateSettings({ enabled })}
          />
        </section>

        <section className={`space-y-2 ${settingsDisabled ? 'pointer-events-none opacity-40' : ''}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Live tracking
          </h2>
          <Toggle
            checked={settings.liveTrackingEnabled}
            disabled={settingsDisabled}
            label="Watch storage changes"
            description="Detect localStorage, sessionStorage, and cookie updates in the DevTools panel."
            isDark={isDark}
            onChange={(liveTrackingEnabled) => void updateSettings({ liveTrackingEnabled })}
          />
          <Toggle
            checked={settings.liveIdbEnabled}
            disabled={settingsDisabled}
            label="Live IndexedDB"
            description="Best-effort diffing for the selected database and object store."
            isDark={isDark}
            onChange={(liveIdbEnabled) => void updateSettings({ liveIdbEnabled })}
          />
        </section>

        <section className={settingsDisabled ? 'pointer-events-none opacity-40' : ''}>
          <h2 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Appearance
          </h2>
          <div className="flex gap-2">
            {(['dark', 'light'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={settingsDisabled}
                onClick={() => void updateSettings({ theme: mode })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                  settings.theme === mode
                    ? 'border-accent bg-accent/15 text-accent'
                    : isDark
                      ? 'border-surface-border text-gray-300 hover:border-accent'
                      : 'border-slate-200 text-slate-600 hover:border-accent'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section
          className={`rounded-lg border p-3 ${isDark ? 'border-surface-border bg-surface-raised/30' : 'border-slate-200 bg-white'}`}
        >
          <h2 className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Open StorageLens
          </h2>
          <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            Click the StorageLens toolbar icon to open the <strong>side panel</strong> and inspect the active
            tab without DevTools.
          </p>
          <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            DevTools panel is still available: <kbd className="rounded bg-black/20 px-1">F12</kbd> → StorageLens tab.
          </p>
        </section>
      </main>

      <footer
        className={`flex items-center justify-between gap-2 border-t px-4 py-3 text-xs ${
          isDark ? 'border-surface-border text-gray-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <button
          type="button"
          onClick={() => openOptions('privacy')}
          className="hover:text-accent"
        >
          Privacy
        </button>
        <button
          type="button"
          onClick={() => openOptions('terms')}
          className="hover:text-accent"
        >
          Terms
        </button>
        <button
          type="button"
          onClick={() => openOptions()}
          className="font-medium text-accent hover:underline"
        >
          All settings
        </button>
      </footer>
    </div>
  )
}
