import Editor from '@monaco-editor/react'
import { useEffect, useId, useMemo, useState } from 'react'
import '../monaco-setup'
import { formatJson, looksLikeJsonValue, validateJson } from '../../../shared/utils/json-validation'

export type ValueEditorMode = 'add' | 'edit'

interface ValueEditorModalProps {
  open: boolean
  mode: ValueEditorMode
  storageKey: string
  initialKey?: string
  initialValue: string
  isDark: boolean
  keyDisabled?: boolean
  existingKeys?: string[]
  isSaving?: boolean
  onSave: (key: string, value: string) => Promise<void>
  onClose: () => void
}

export function ValueEditorModal({
  open,
  mode,
  storageKey,
  initialKey = '',
  initialValue,
  isDark,
  keyDisabled = false,
  existingKeys = [],
  isSaving = false,
  onSave,
  onClose,
}: ValueEditorModalProps) {
  const titleId = useId()
  const [key, setKey] = useState(initialKey)
  const [value, setValue] = useState(initialValue)
  const [jsonMode, setJsonMode] = useState(looksLikeJsonValue(initialValue))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setKey(initialKey)
    setValue(initialValue)
    setJsonMode(looksLikeJsonValue(initialValue))
    setError(null)
  }, [open, initialKey, initialValue])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const duplicateKey = useMemo(() => {
    const trimmed = key.trim()
    if (!trimmed) return false
    if (mode === 'edit' && trimmed === initialKey) return false
    return existingKeys.includes(trimmed)
  }, [existingKeys, initialKey, key, mode])

  if (!open) return null

  const handleFormatJson = () => {
    const result = formatJson(value)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setValue(result.formatted)
    setJsonMode(true)
    setError(null)
  }

  const handleSave = async () => {
    const trimmedKey = key.trim()
    if (!trimmedKey) {
      setError('Key is required')
      return
    }

    if (duplicateKey) {
      setError('A key with this name already exists')
      return
    }

    if (jsonMode) {
      const validation = validateJson(value)
      if (!validation.valid) {
        setError(validation.error)
        return
      }
    }

    try {
      await onSave(trimmedKey, value)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save value')
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex h-[min(90vh,720px)] w-full max-w-3xl flex-col rounded-lg border shadow-xl ${
          isDark ? 'border-surface-border bg-surface-raised' : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            isDark ? 'border-surface-border' : 'border-slate-200'
          }`}
        >
          <div>
            <h2
              id={titleId}
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {mode === 'add' ? 'Add entry' : 'Edit value'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {storageKey}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Close
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div>
            <label
              className={`mb-1 block text-xs uppercase tracking-wide ${
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}
            >
              Key
            </label>
            <input
              type="text"
              value={key}
              disabled={keyDisabled}
              onChange={(event) => setKey(event.target.value)}
              className={`w-full rounded-md border px-3 py-2 font-mono text-sm outline-none focus:border-accent disabled:opacity-60 ${
                isDark
                  ? 'border-surface-border bg-surface text-gray-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            />
            {duplicateKey && (
              <p className="mt-1 text-xs text-red-400">This key already exists.</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={jsonMode}
                onChange={(event) => setJsonMode(event.target.checked)}
              />
              <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>Validate as JSON</span>
            </label>
            <button
              type="button"
              onClick={handleFormatJson}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                isDark
                  ? 'border-surface-border text-gray-300 hover:text-white'
                  : 'border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              Format JSON
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 pb-3">
          <Editor
            height="100%"
            language={jsonMode ? 'json' : 'plaintext'}
            theme={isDark ? 'vs-dark' : 'light'}
            value={value}
            onChange={(nextValue) => setValue(nextValue ?? '')}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {error && <p className="px-4 pb-2 text-sm text-red-400">{error}</p>}

        <div
          className={`flex justify-end gap-2 border-t px-4 py-3 ${
            isDark ? 'border-surface-border' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              isDark
                ? 'border-surface-border text-gray-300 hover:text-white'
                : 'border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || duplicateKey}
            onClick={() => void handleSave()}
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-muted disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
