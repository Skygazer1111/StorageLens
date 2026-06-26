export type PageBridgeMode = 'devtools' | 'sidepanel'

export interface PageBridgeState {
  mode: PageBridgeMode
  tabId: number | null
}

let state: PageBridgeState = {
  mode: 'sidepanel',
  tabId: null,
}

export function getPageBridgeState(): PageBridgeState {
  return state
}

export function setPageBridgeMode(mode: PageBridgeMode): void {
  state = { ...state, mode }
}

export function setPageBridgeTabId(tabId: number | null): void {
  state = { ...state, tabId }
}

export function isRestrictedTabUrl(url?: string): boolean {
  if (!url) return true
  const blocked = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'devtools:', 'view-source:']
  return blocked.some((prefix) => url.startsWith(prefix))
}
