import { useEffect, useState } from 'react'
import { useExtensionSettings } from '../shared/hooks/useExtensionSettings'
import { Toggle } from '../shared/components/Toggle'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../shared/legal/content'
import type { ThemeMode } from '../shared/settings/types'

type Section = 'settings' | 'privacy' | 'terms'

function parseHash(): Section {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'privacy' || hash === 'terms') return hash
  return 'settings'
}

function LegalDocument({ content, isDark }: { content: string; isDark: boolean }) {
  const lines = content.split('\n')

  return (
    <article
      className={`prose-sm max-w-none space-y-3 text-sm leading-relaxed ${
        isDark ? 'text-gray-300' : 'text-slate-700'
      }`}
    >
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {line.slice(2)}
            </h1>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className={`mt-6 text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith('| ')) {
          return (
            <p key={index} className="font-mono text-xs">
              {line}
            </p>
          )
        }
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-4 list-disc">
              {line.slice(2)}
            </li>
          )
        }
        if (!line.trim()) return <div key={index} className="h-2" />
        return <p key={index}>{line}</p>
      })}
    </article>
  )
}

export function OptionsApp() {
  const { settings, isLoading, updateSettings } = useExtensionSettings()
  const [section, setSection] = useState<Section>(parseHash)
  const isDark = settings?.theme !== 'light'

  useEffect(() => {
    const onHashChange = () => setSection(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (next: Section) => {
    setSection(next)
    window.location.hash = next === 'settings' ? '' : next
  }

  if (isLoading || !settings) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-surface text-gray-400' : 'bg-slate-50 text-slate-500'}`}>
        Loading…
      </div>
    )
  }

  const settingsDisabled = !settings.enabled
  const shell = isDark ? 'bg-surface text-gray-100' : 'bg-slate-50 text-slate-900'
  const card = isDark ? 'border-surface-border bg-surface-raised/40' : 'border-slate-200 bg-white'
  const navIdle = isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
  const navActive = 'border-accent text-accent'

  return (
    <div className={`min-h-screen ${shell}`}>
      <header className={`border-b ${isDark ? 'border-surface-border' : 'border-slate-200'}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold">StorageLens</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Extension settings & legal</p>
          </div>
          <div className="flex gap-2">
            {(['dark', 'light'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => void updateSettings({ theme: mode })}
                className={`rounded-md border px-2.5 py-1 text-xs capitalize ${
                  settings.theme === mode
                    ? 'border-accent text-accent'
                    : isDark
                      ? 'border-surface-border text-gray-400'
                      : 'border-slate-200 text-slate-500'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <nav className={`mx-auto flex max-w-3xl gap-6 border-t px-6 ${isDark ? 'border-surface-border' : 'border-slate-200'}`}>
          {(
            [
              ['settings', 'Settings'],
              ['privacy', 'Privacy Policy'],
              ['terms', 'Terms of Service'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                section === id ? navActive : `border-transparent ${navIdle}`
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {section === 'settings' && (
          <div className="space-y-6">
            <section className={`rounded-xl border p-5 ${card}`}>
              <Toggle
                checked={settings.enabled}
                label="Extension enabled"
                description="Master switch for StorageLens. When disabled, live tracking and background helpers pause."
                isDark={isDark}
                onChange={(enabled) => void updateSettings({ enabled })}
              />
            </section>

            <section className={`space-y-3 rounded-xl border p-5 ${card} ${settingsDisabled ? 'opacity-40' : ''}`}>
              <h2 className="text-sm font-semibold">Live tracking</h2>
              <Toggle
                checked={settings.liveTrackingEnabled}
                disabled={settingsDisabled}
                label="Watch storage changes"
                description="Poll localStorage, sessionStorage, and cookies while the DevTools panel is open."
                isDark={isDark}
                onChange={(liveTrackingEnabled) => void updateSettings({ liveTrackingEnabled })}
              />
              <Toggle
                checked={settings.liveIdbEnabled}
                disabled={settingsDisabled}
                label="Live IndexedDB"
                description="Diff the selected object store on an interval (best-effort, first 200 records)."
                isDark={isDark}
                onChange={(liveIdbEnabled) => void updateSettings({ liveIdbEnabled })}
              />
              <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                <span className="mb-1 block font-medium">Poll interval (seconds)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.5}
                  disabled={settingsDisabled}
                  value={settings.pollIntervalMs / 1000}
                  onChange={(event) => {
                    const seconds = Number(event.target.value)
                    if (!Number.isFinite(seconds)) return
                    void updateSettings({ pollIntervalMs: Math.min(30000, Math.max(1000, seconds * 1000)) })
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    isDark
                      ? 'border-surface-border bg-surface text-gray-100'
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </label>
            </section>

            <section className={`rounded-xl border p-5 ${card}`}>
              <h2 className="mb-2 text-sm font-semibold">Using StorageLens</h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Click the StorageLens toolbar icon to open the side panel and inspect storage on the active
                tab. The full workspace is also available in DevTools under the StorageLens tab.
              </p>
            </section>
          </div>
        )}

        {section === 'privacy' && (
          <div className={`rounded-xl border p-6 ${card}`}>
            <LegalDocument content={PRIVACY_POLICY} isDark={isDark} />
          </div>
        )}

        {section === 'terms' && (
          <div className={`rounded-xl border p-6 ${card}`}>
            <LegalDocument content={TERMS_OF_SERVICE} isDark={isDark} />
          </div>
        )}
      </main>
    </div>
  )
}
