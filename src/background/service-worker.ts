import { handleCookieMessage } from './cookie-handlers'
import { isPanelMessage, type PongMessage } from '../shared/messaging/types'
import { DEFAULT_SETTINGS } from '../shared/settings/types'

const SETTINGS_KEY = 'storagelens-settings'
const livePorts = new Set<chrome.runtime.Port>()

async function isExtensionEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get([SETTINGS_KEY])
  const settings = result[SETTINGS_KEY] as { enabled?: boolean } | undefined
  return settings?.enabled ?? DEFAULT_SETTINGS.enabled
}

async function syncActionBadge(): Promise<void> {
  const enabled = await isExtensionEnabled()
  await chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' })
  await chrome.action.setBadgeBackgroundColor({ color: '#64748b' })
}

void syncActionBadge()

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[SETTINGS_KEY]) {
    void syncActionBadge()
  }
})

chrome.runtime.onInstalled.addListener(() => {
  void syncActionBadge()
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'storagelens-live') return
  livePorts.add(port)
  port.onDisconnect.addListener(() => {
    livePorts.delete(port)
  })
})

chrome.cookies.onChanged.addListener((changeInfo) => {
  void isExtensionEnabled().then((enabled) => {
    if (!enabled) return

    for (const port of livePorts) {
      try {
        port.postMessage({
          type: 'COOKIE_CHANGED',
          payload: {
            removed: changeInfo.removed,
            cause: changeInfo.cause,
            cookie: {
              name: changeInfo.cookie.name,
              domain: changeInfo.cookie.domain,
              path: changeInfo.cookie.path,
            },
          },
        })
      } catch {
        livePorts.delete(port)
      }
    }
  })
})

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return

  const typed = message as { type?: string }

  if (typed.type === 'PING') {
    const response: PongMessage = {
      type: 'PONG',
      payload: {
        timestamp: Date.now(),
        echo: (message as { payload: { timestamp: number } }).payload.timestamp,
        source: 'background',
      },
    }
    sendResponse(response)
    return true
  }

  if (isPanelMessage(message)) {
    return handleCookieMessage(message, sendResponse)
  }
})
