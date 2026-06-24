export type MessageType = 'PING' | 'PONG'

export interface PingMessage {
  type: 'PING'
  payload: {
    timestamp: number
    source: 'panel' | 'background'
  }
}

export interface PongMessage {
  type: 'PONG'
  payload: {
    timestamp: number
    echo: number
    source: 'background'
  }
}

export type ExtensionMessage = PingMessage | PongMessage

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!value || typeof value !== 'object') return false
  const msg = value as { type?: string }
  return msg.type === 'PING' || msg.type === 'PONG'
}

export function createPing(source: PingMessage['payload']['source'] = 'panel'): PingMessage {
  return {
    type: 'PING',
    payload: { timestamp: Date.now(), source },
  }
}
