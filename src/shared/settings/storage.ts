import { DEFAULT_SETTINGS, type StorageLensSettings } from './types'

const SETTINGS_KEY = 'storagelens-settings'

function mergeSettings(partial: Partial<StorageLensSettings>): StorageLensSettings {
  return { ...DEFAULT_SETTINGS, ...partial }
}

export { mergeSettings }

export async function getSettings(): Promise<StorageLensSettings> {
  const result = await chrome.storage.local.get([SETTINGS_KEY, 'storagelens-theme'])
  const stored = result[SETTINGS_KEY] as Partial<StorageLensSettings> | undefined
  const legacyTheme = result['storagelens-theme']
  const merged = mergeSettings(stored ?? {})

  if (!stored?.theme && (legacyTheme === 'light' || legacyTheme === 'dark')) {
    merged.theme = legacyTheme
  }

  return merged
}

export async function setSettings(
  partial: Partial<StorageLensSettings>,
): Promise<StorageLensSettings> {
  const current = await getSettings()
  const next = { ...current, ...partial }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}

export function subscribeToSettings(
  onChange: (settings: StorageLensSettings) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'local' || !changes[SETTINGS_KEY]) return
    const next = changes[SETTINGS_KEY].newValue as Partial<StorageLensSettings> | undefined
    onChange(mergeSettings(next ?? {}))
  }

  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
