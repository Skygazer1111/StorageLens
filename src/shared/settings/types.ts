export type ThemeMode = 'dark' | 'light'

export interface StorageLensSettings {
  /** Master switch — when off, live tracking and background helpers pause. */
  enabled: boolean
  liveTrackingEnabled: boolean
  liveIdbEnabled: boolean
  theme: ThemeMode
  /** Poll interval for live storage diffing (ms). */
  pollIntervalMs: number
}

export const DEFAULT_SETTINGS: StorageLensSettings = {
  enabled: true,
  liveTrackingEnabled: true,
  liveIdbEnabled: false,
  theme: 'dark',
  pollIntervalMs: 1500,
}
