import type { LiveChangeEvent } from '../hooks/useLiveTracking'

interface LiveActivityFeedProps {
  events: LiveChangeEvent[]
  unseenCount: number
  isPaused: boolean
  isSyncing: boolean
  liveIdbEnabled: boolean
  isDark: boolean
  onPauseToggle: () => void
  onLiveIdbToggle: () => void
  onEventClick: (event: LiveChangeEvent) => void
}

function previewValue(value: string | null): string {
  if (value === null) return 'null'
  return value.length > 60 ? `${value.slice(0, 60)}...` : value
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

export function LiveActivityFeed({
  events,
  unseenCount,
  isPaused,
  isSyncing,
  liveIdbEnabled,
  isDark,
  onPauseToggle,
  onLiveIdbToggle,
  onEventClick,
}: LiveActivityFeedProps) {
  return (
    <section className={`border-t ${isDark ? 'border-surface-border' : 'border-slate-200'}`}>
      <div
        className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${
          isDark ? 'border-surface-border' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
            Live Activity
          </h2>
          {unseenCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
              {unseenCount}
            </span>
          )}
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {isSyncing ? 'Syncing...' : 'Watching'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLiveIdbToggle}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              liveIdbEnabled
                ? 'border-accent text-accent'
                : isDark
                  ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
                  : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
            }`}
          >
            Live IDB {liveIdbEnabled ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={onPauseToggle}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isDark
                ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
                : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto px-4 py-2">
        {events.length === 0 ? (
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            No changes captured yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={`w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                    isDark
                      ? 'border-surface-border bg-surface-raised/60 hover:border-accent'
                      : 'border-slate-200 bg-white hover:border-accent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium capitalize">
                      {event.storage} {event.changeType}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <div className={`mt-1 truncate ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    {event.key}: {previewValue(event.oldValue)} {'->'} {previewValue(event.newValue)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
