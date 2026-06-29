import { useState } from 'react'
import { ExtensionPowerSwitch } from '../../../shared/components/ExtensionPowerSwitch'
import { COPYRIGHT_NOTICE } from '../../../shared/legal/content'
import { usePageBridge } from '../../../shared/page-bridge/PageBridgeProvider'
import { LegalModal, type LegalView } from './LegalModal'

interface PanelFooterProps {
  isDark: boolean
  extensionEnabled: boolean
  onExtensionEnabledChange: (enabled: boolean) => void
}

export function PanelFooter({
  isDark,
  extensionEnabled,
  onExtensionEnabledChange,
}: PanelFooterProps) {
  const { mode } = usePageBridge()
  const [legalView, setLegalView] = useState<LegalView | null>(null)

  if (mode !== 'sidepanel') return null

  const muted = isDark ? 'text-gray-500' : 'text-slate-400'
  const link = isDark
    ? 'text-gray-400 hover:text-accent'
    : 'text-slate-500 hover:text-accent'

  return (
    <>
      <footer
        className={`shrink-0 border-t px-4 py-2 ${
          isDark ? 'border-surface-border bg-surface/80' : 'border-slate-200 bg-slate-50/90'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ExtensionPowerSwitch
              enabled={extensionEnabled}
              isDark={isDark}
              onChange={onExtensionEnabledChange}
            />
            <span className={`truncate text-[11px] ${muted}`}>
              {extensionEnabled ? 'Extension on' : 'Extension off'}
            </span>
          </div>
          <div className={`flex shrink-0 items-center gap-2 text-[11px] ${muted}`}>
            <button type="button" onClick={() => setLegalView('privacy')} className={link}>
              Privacy
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setLegalView('terms')} className={link}>
              Terms
            </button>
          </div>
        </div>
        <p className={`mt-1.5 text-center text-[10px] ${muted}`}>{COPYRIGHT_NOTICE}</p>
      </footer>

      <LegalModal
        open={legalView !== null}
        view={legalView}
        isDark={isDark}
        onClose={() => setLegalView(null)}
      />
    </>
  )
}
