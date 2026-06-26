import { useCallback, useEffect, useState } from 'react'
import { getSettings, setSettings, subscribeToSettings } from '../settings/storage'
import type { StorageLensSettings } from '../settings/types'

export function useExtensionSettings() {
  const [settings, setSettingsState] = useState<StorageLensSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void getSettings().then((loaded) => {
      if (active) {
        setSettingsState(loaded)
        setIsLoading(false)
      }
    })

    const unsubscribe = subscribeToSettings((next) => {
      setSettingsState(next)
      setIsLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const updateSettings = useCallback(async (partial: Partial<StorageLensSettings>) => {
    const next = await setSettings(partial)
    setSettingsState(next)
    return next
  }, [])

  return { settings, isLoading, updateSettings }
}
