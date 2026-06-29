import { useState } from 'react'
import { useExtensionSettings } from '../shared/hooks/useExtensionSettings'
import { Toggle } from '../shared/components/Toggle'
import { ExtensionLogo } from '../shared/components/ExtensionLogo'
import { LegalDocument } from '../shared/legal/LegalDocument'
import { COPYRIGHT_NOTICE, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../shared/legal/content'

type PopupView = 'main' | 'privacy' | 'terms'

function openOptions() {
  void chrome.runtime.openOptionsPage()
}

async function openSidePanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  await chrome.sidePanel.open({ tabId: tab.id })
  window.close()
}

export function PopupApp() {
  const { settings, isLoading, updateSettings } = useExtensionSettings()
  const [view, setView] = useState<PopupView>('main')
  const isDark = settings?.theme !== 'light'

  if (isLoading || !settings) {
    return (
      <div
        className={`flex h-[320px] w-[360px] items-center justify-center ${isDark ? 'bg-surface text-gray-400' : 'bg-slate-50 text-slate-500'}`}
      >
        <p className="text-sm">Loading…</p>
      </div>
    )
  }

  const shell = isDark ? 'bg-surface text-gray-100' : 'bg-slate-50 text-slate-900'
  const border = isDark ? 'border-surface-border' : 'border-slate-200'
  const navIdle = isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
  const navActive = 'border-accent text-accent'

  return (
    <div className={`flex w-[360px] flex-col ${shell}`}>
      <header className={`border-b px-4 py-3 ${border} ${isDark ? 'bg-surface-raised/40' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <ExtensionLogo size={36} />
          <div>
            <h1 className="text-sm font-semibold tracking-tight">StorageLens</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Browser storage debugger
            </p>
          </div>
        </div>
      </header>

      <nav className={`flex gap-1 border-b px-2 ${border}`}>
        {(
          [
            ['main', 'Settings'],
            ['privacy', 'Privacy'],
            ['terms', 'Terms'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex-1 border-b-2 py-2.5 text-xs font-medium transition-colors ${
              view === id ? navActive : `border-transparent ${navIdle}`
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="max-h-[340px] flex-1 overflow-y-auto px-4 py-4">
        {view === 'main' && (
          <div className="space-y-4">
            <Toggle
              checked={settings.enabled}
              label="Extension enabled"
              description="Turn StorageLens on or off. When off, the side panel and live tracking pause."
              isDark={isDark}
              onChange={(enabled) => void updateSettings({ enabled })}
            />

            <button
              type="button"
              disabled={!settings.enabled}
              onClick={() => void openSidePanel()}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isDark
                  ? 'border-accent/50 bg-accent/10 text-accent hover:bg-accent/20'
                  : 'border-accent/40 bg-accent/5 text-accent hover:bg-accent/10'
              }`}
            >
              Open side panel
            </button>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Inspect localStorage, sessionStorage, cookies, and IndexedDB on the active tab. DevTools
              panel: <kbd className="rounded bg-black/20 px-1">F12</kbd> → StorageLens.
            </p>

            <button
              type="button"
              onClick={openOptions}
              className={`text-xs font-medium hover:underline ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
            >
              More settings (live tracking, theme) →
            </button>
          </div>
        )}

        {view === 'privacy' && <LegalDocument content={PRIVACY_POLICY} isDark={isDark} />}
        {view === 'terms' && <LegalDocument content={TERMS_OF_SERVICE} isDark={isDark} />}
      </main>

      <footer
        className={`border-t px-4 py-2.5 text-center text-[11px] ${border} ${
          isDark ? 'text-gray-500' : 'text-slate-400'
        }`}
      >
        {COPYRIGHT_NOTICE}
      </footer>
    </div>
  )
}
