import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { isRestrictedTabUrl, setPageBridgeMode, setPageBridgeTabId, type PageBridgeMode } from './runtime'

interface PageBridgeContextValue {
  mode: PageBridgeMode
  tabId: number | null
  tabUrl: string | null
  tabTitle: string | null
  isRestricted: boolean
  contextKey: string
}

const PageBridgeContext = createContext<PageBridgeContextValue | null>(null)

interface PageBridgeProviderProps {
  mode: PageBridgeMode
  children: ReactNode
}

export function PageBridgeProvider({ mode, children }: PageBridgeProviderProps) {
  const [tabId, setTabId] = useState<number | null>(null)
  const [tabUrl, setTabUrl] = useState<string | null>(null)
  const [tabTitle, setTabTitle] = useState<string | null>(null)

  useLayoutEffect(() => {
    setPageBridgeMode(mode)

    if (mode !== 'sidepanel') {
      setPageBridgeTabId(null)
      return
    }

    const syncActiveTab = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      setTabId(tab?.id ?? null)
      setTabUrl(tab?.url ?? null)
      setTabTitle(tab?.title ?? null)
      setPageBridgeTabId(tab?.id ?? null)
    }

    void syncActiveTab()

    const onActivated = () => void syncActiveTab()
    const onUpdated = (_updatedTabId: number, changeInfo: { url?: string; status?: string }) => {
      if (changeInfo.url || changeInfo.status === 'complete') {
        void syncActiveTab()
      }
    }

    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)

    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      setPageBridgeTabId(null)
    }
  }, [mode])

  const isRestricted = isRestrictedTabUrl(tabUrl ?? undefined)
  const contextKey = mode === 'devtools' ? 'devtools' : `tab:${tabId ?? 'none'}:${tabUrl ?? ''}`

  const value = useMemo(
    () => ({
      mode,
      tabId,
      tabUrl,
      tabTitle,
      isRestricted,
      contextKey,
    }),
    [contextKey, isRestricted, mode, tabId, tabTitle, tabUrl],
  )

  return <PageBridgeContext.Provider value={value}>{children}</PageBridgeContext.Provider>
}

export function usePageBridge() {
  const context = useContext(PageBridgeContext)
  if (!context) {
    throw new Error('usePageBridge must be used within PageBridgeProvider')
  }
  return context
}
