import { handleCookieMessage } from './cookie-handlers'
import { isPanelMessage, type PongMessage } from '../shared/messaging/types'

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
