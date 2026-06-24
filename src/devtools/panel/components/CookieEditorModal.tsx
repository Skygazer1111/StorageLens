import { useEffect, useId, useMemo, useState } from 'react'
import type { CookieData, CookieSameSite } from '../../../shared/messaging/types'
import { looksLikeJsonValue } from '../../../shared/utils/json-validation'
import type { StorageEntry } from '../../../shared/storage-adapters/types'

export type CookieEditorMode = 'add' | 'edit'

interface CookieEditorModalProps {
  open: boolean
  mode: CookieEditorMode
  pageUrl: string
  initialEntry?: StorageEntry | null
  existingEntries: StorageEntry[]
  isSaving?: boolean
  isDark: boolean
  onSave: (cookie: CookieData) => Promise<void>
  onClose: () => void
}

function defaultDomain(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname
  } catch {
    return ''
  }
}

function toDateTimeLocal(expirationDate?: number): string {
  if (!expirationDate) return ''
  const date = new Date(expirationDate * 1000)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string): number | undefined {
  if (!value) return undefined
  return Math.floor(new Date(value).getTime() / 1000)
}

export function CookieEditorModal({
  open,
  mode,
  pageUrl,
  initialEntry,
  existingEntries,
  isSaving = false,
  isDark,
  onSave,
  onClose,
}: CookieEditorModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [domain, setDomain] = useState('')
  const [path, setPath] = useState('/')
  const [session, setSession] = useState(true)
  const [expiration, setExpiration] = useState('')
  const [secure, setSecure] = useState(false)
  const [httpOnly, setHttpOnly] = useState(false)
  const [sameSite, setSameSite] = useState<CookieSameSite>('lax')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const cookie = initialEntry?.cookie
    setName(initialEntry?.key ?? '')
    setValue(initialEntry?.value ?? '')
    setDomain(cookie?.domain ?? defaultDomain(pageUrl))
    setPath(cookie?.path ?? '/')
    setSession(cookie?.session ?? true)
    setExpiration(toDateTimeLocal(cookie?.expirationDate))
    setSecure(cookie?.secure ?? pageUrl.startsWith('https'))
    setHttpOnly(cookie?.httpOnly ?? false)
    setSameSite(cookie?.sameSite ?? 'lax')
    setError(null)
  }, [open, initialEntry, pageUrl])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const duplicate = useMemo(() => {
    const trimmedName = name.trim()
    if (!trimmedName) return false
    if (mode === 'edit' && initialEntry) {
      return existingEntries.some(
        (entry) =>
          entry.id !== initialEntry.id &&
          entry.key === trimmedName &&
          entry.cookie?.domain === domain &&
          entry.cookie?.path === path,
      )
    }
    return existingEntries.some(
      (entry) => entry.key === trimmedName && entry.cookie?.domain === domain && entry.cookie?.path === path,
    )
  }, [domain, existingEntries, initialEntry, mode, name, path])

  if (!open) return null

  const inputClass = `w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent ${
    isDark
      ? 'border-surface-border bg-surface text-gray-100'
      : 'border-slate-300 bg-white text-slate-900'
  }`

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Cookie name is required')
      return
    }
    if (duplicate) {
      setError('A cookie with this name, domain, and path already exists')
      return
    }
    if (!session && !expiration) {
      setError('Persistent cookies need an expiration date')
      return
    }

    const cookie: CookieData = {
      name: trimmedName,
      value,
      domain,
      path: path || '/',
      secure,
      httpOnly,
      sameSite,
      session,
      hostOnly: !domain.startsWith('.'),
      expirationDate: session ? undefined : fromDateTimeLocal(expiration),
    }

    try {
      await onSave(cookie)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cookie')
    }
  }

  const jsonLike = looksLikeJsonValue(value)

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-xl rounded-lg border p-5 shadow-xl ${
          isDark ? 'border-surface-border bg-surface-raised' : 'border-slate-200 bg-white'
        }`}
      >
        <h2 id={titleId} className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {mode === 'add' ? 'Add cookie' : 'Edit cookie'}
        </h2>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Name</label>
            <input className={inputClass} value={name} disabled={mode === 'edit'} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Value</label>
            <textarea className={`${inputClass} min-h-[88px] font-mono`} value={value} onChange={(e) => setValue(e.target.value)} />
            {jsonLike && <p className="mt-1 text-xs text-emerald-400">Value looks like JSON</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Domain</label>
              <input className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Path</label>
              <input className={inputClass} value={path} onChange={(e) => setPath(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={session} onChange={(e) => setSession(e.target.checked)} />
              Session cookie
            </label>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Expires</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={expiration}
                disabled={session}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
              Secure
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={httpOnly} onChange={(e) => setHttpOnly(e.target.checked)} />
              HttpOnly
            </label>
            <label className="flex items-center gap-2">
              SameSite
              <select
                className={inputClass}
                value={sameSite}
                onChange={(e) => setSameSite(e.target.value as CookieSameSite)}
              >
                <option value="no_restriction">None</option>
                <option value="lax">Lax</option>
                <option value="strict">Strict</option>
                <option value="unspecified">Unspecified</option>
              </select>
            </label>
          </div>
        </div>

        {duplicate && <p className="mt-2 text-xs text-red-400">Duplicate cookie for this domain and path.</p>}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
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
            disabled={isSaving || duplicate}
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
