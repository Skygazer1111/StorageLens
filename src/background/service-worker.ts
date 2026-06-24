import { isExtensionMessage, type ExtensionMessage, type PongMessage } from '../shared/messaging/types'

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: PongMessage) => void) => {
    if (!isExtensionMessage(message)) return

    if (message.type === 'PING') {
      const response: PongMessage = {
        type: 'PONG',
        payload: {
          timestamp: Date.now(),
          echo: message.payload.timestamp,
          source: 'background',
        },
      }
      sendResponse(response)
      return true
    }
  },
)

export type { ExtensionMessage }
