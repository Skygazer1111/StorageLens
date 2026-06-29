import { useEffect, useId } from 'react'
import { LegalDocument } from '../../../shared/legal/LegalDocument'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../../shared/legal/content'

export type LegalView = 'privacy' | 'terms'

interface LegalModalProps {
  open: boolean
  view: LegalView | null
  isDark: boolean
  onClose: () => void
}

const TITLES: Record<LegalView, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
}

export function LegalModal({ open, view, isDark, onClose }: LegalModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !view) return null

  const content = view === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[min(80vh,560px)] w-full max-w-lg flex-col rounded-t-xl border shadow-xl sm:rounded-xl ${
          isDark ? 'border-surface-border bg-surface-raised' : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            isDark ? 'border-surface-border' : 'border-slate-200'
          }`}
        >
          <h2
            id={titleId}
            className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {TITLES[view]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              isDark
                ? 'text-gray-400 hover:bg-surface-border hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          <LegalDocument content={content} isDark={isDark} />
        </div>
      </div>
    </div>
  )
}
