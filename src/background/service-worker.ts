import { handleCookieMessage } from './cookie-handlers'
import { isPanelMessage, type PongMessage } from '../shared/messaging/types'

const livePorts = new Set<chrome.runtime.Port>()

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'storagelens-live') return
  livePorts.add(port)
  port.onDisconnect.addListener(() => {
    livePorts.delete(port)
  })
})

chrome.cookies.onChanged.addListener((changeInfo) => {
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
