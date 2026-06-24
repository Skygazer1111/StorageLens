import { useMemo, useRef, useState } from 'react'
import type { SnapshotDiff, StorageSnapshot } from '../../../shared/snapshots/types'

interface SnapshotModalProps {
  open: boolean
  isDark: boolean
  snapshots: StorageSnapshot[]
  totalApproxBytes: number
  isBusy: boolean
  onClose: () => void
  onCapture: (label?: string) => Promise<void>
  onDelete: (snapshotId: string) => void
  onExport: (snapshotId: string) => void
  onImport: (file: File) => Promise<void>
  onCompare: (left: StorageSnapshot, right: StorageSnapshot) => SnapshotDiff
  onCompareWithLive: (snapshot: StorageSnapshot) => Promise<SnapshotDiff>
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SectionDiff({
  title,
  diff,
}: {
  title: string
  diff: { added: string[]; removed: string[]; changed: string[] }
}) {
  return (
    <div className="rounded border border-surface-border/60 p-2 text-xs">
      <p className="mb-1 font-medium">{title}</p>
      <p>
        +{diff.added.length} / -{diff.removed.length} / ~{diff.changed.length}
      </p>
      {[...diff.added.slice(0, 3), ...diff.removed.slice(0, 3), ...diff.changed.slice(0, 3)].length >
        0 && (
        <ul className="mt-1 list-inside list-disc opacity-80">
          {diff.added.slice(0, 3).map((key) => (
            <li key={`a:${key}`}>+ {key}</li>
          ))}
          {diff.removed.slice(0, 3).map((key) => (
            <li key={`r:${key}`}>- {key}</li>
          ))}
          {diff.changed.slice(0, 3).map((key) => (
            <li key={`c:${key}`}>~ {key}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SnapshotModal({
  open,
  isDark,
  snapshots,
  totalApproxBytes,
  isBusy,
  onClose,
  onCapture,
  onDelete,
  onExport,
  onImport,
  onCompare,
  onCompareWithLive,
}: SnapshotModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('')
  const [leftId, setLeftId] = useState<string>('')
  const [rightMode, setRightMode] = useState<string>('live')
  const [diff, setDiff] = useState<SnapshotDiff | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)

  const snapshotMap = useMemo(() => new Map(snapshots.map((snapshot) => [snapshot.id, snapshot])), [snapshots])

  if (!open) return null

  const inputClass = `w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-accent ${
    isDark
      ? 'border-surface-border bg-surface text-gray-100'
      : 'border-slate-300 bg-white text-slate-900'
  }`

  const runCompare = async () => {
    setCompareError(null)
    setDiff(null)
    const left = snapshotMap.get(leftId)
    if (!left) {
      setCompareError('Choose snapshot A first.')
      return
    }

    try {
      if (rightMode === 'live') {
        const liveDiff = await onCompareWithLive(left)
        setDiff(liveDiff)
        return
      }
      const right = snapshotMap.get(rightMode)
      if (!right) {
        setCompareError('Choose snapshot B.')
        return
      }
      setDiff(onCompare(left, right))
    } catch (error) {
      setCompareError(error instanceof Error ? error.message : 'Failed to compare snapshots')
    }
  }

  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/50 p-4">
      <div
        className={`flex h-[min(90vh,820px)] w-full max-w-5xl flex-col rounded-lg border ${
          isDark ? 'border-surface-border bg-surface-raised text-gray-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">Snapshots & Compare</h2>
            <p className="text-xs opacity-70">
              {snapshots.length} snapshots · approx {formatBytes(totalApproxBytes)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm opacity-80 hover:opacity-100">
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] gap-0">
          <section className="min-h-0 border-r border-surface-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                className={inputClass}
                placeholder="Optional snapshot label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              <button
                type="button"
                onClick={() => void onCapture(label)}
                disabled={isBusy}
                className="rounded-md bg-accent px-3 py-2 text-sm text-white hover:bg-accent-muted disabled:opacity-50"
              >
                Snapshot now
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-surface-border px-3 py-2 text-sm"
              >
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void onImport(file)
                  event.target.value = ''
                }}
              />
            </div>

            <div className="h-[calc(100%-52px)] overflow-auto rounded border border-surface-border/60">
              {snapshots.length === 0 ? (
                <p className="p-4 text-sm opacity-70">No snapshots yet.</p>
              ) : (
                snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="border-b border-surface-border/50 px-3 py-2 text-sm last:border-b-0"
                  >
                    <p className="font-medium">{snapshot.label}</p>
                    <p className="text-xs opacity-70">{new Date(snapshot.createdAt).toLocaleString()}</p>
                    <p className="truncate text-xs opacity-70">{snapshot.origin}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <button type="button" onClick={() => onExport(snapshot.id)} className="opacity-80 hover:opacity-100">
                        Export
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(snapshot.id)}
                        className="text-red-300 opacity-90 hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="min-h-0 p-4">
            <h3 className="mb-2 text-sm font-medium">Compare</h3>
            <div className="grid grid-cols-1 gap-2">
              <select className={inputClass} value={leftId} onChange={(event) => setLeftId(event.target.value)}>
                <option value="">Snapshot A</option>
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.label}
                  </option>
                ))}
              </select>

              <select className={inputClass} value={rightMode} onChange={(event) => setRightMode(event.target.value)}>
                <option value="live">Compare against Live</option>
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    Compare against: {snapshot.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void runCompare()}
                className="rounded-md bg-accent px-3 py-2 text-sm text-white hover:bg-accent-muted"
              >
                Run compare
              </button>
            </div>

            {compareError && <p className="mt-3 text-sm text-red-400">{compareError}</p>}

            {diff && (
              <div className="mt-3 grid gap-2">
                <SectionDiff title="Local Storage" diff={diff.localStorage} />
                <SectionDiff title="Session Storage" diff={diff.sessionStorage} />
                <SectionDiff title="Cookies" diff={diff.cookies} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
