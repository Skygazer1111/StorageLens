import { useEffect, useId, useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmText?: string
  isDark: boolean
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmText,
  isDark,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!open) {
      setTyped('')
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const canConfirm = !confirmText || typed === confirmText

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-md rounded-lg border p-5 shadow-xl ${
          isDark ? 'border-surface-border bg-surface-raised' : 'border-slate-200 bg-white'
        }`}
      >
        <h2
          id={titleId}
          className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          {title}
        </h2>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          {description}
        </p>

        {confirmText && (
          <div className="mt-4">
            <label
              className={`mb-1 block text-xs uppercase tracking-wide ${
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}
            >
              Type <span className="font-mono">{confirmText}</span> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent ${
                isDark
                  ? 'border-surface-border bg-surface text-gray-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              isDark
                ? 'border-surface-border text-gray-300 hover:text-white'
                : 'border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={`rounded-md px-3 py-1.5 text-sm text-white disabled:opacity-50 ${
              destructive ? 'bg-red-600 hover:bg-red-500' : 'bg-accent hover:bg-accent-muted'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
