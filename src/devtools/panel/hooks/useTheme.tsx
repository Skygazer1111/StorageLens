import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSettings, setSettings, subscribeToSettings } from '../../../shared/settings/storage'
import type { ThemeMode } from '../../../shared/settings/types'

export type { ThemeMode }

interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    void getSettings().then((settings) => setTheme(settings.theme))

    return subscribeToSettings((settings) => {
      setTheme(settings.theme)
    })
  }, [])

  const toggleTheme = () => {
    void setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
