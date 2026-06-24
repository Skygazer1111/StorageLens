export type MessageType =
  | 'PING'
  | 'PONG'
  | 'COOKIES_GET_ALL'
  | 'COOKIES_GET_ALL_RESULT'
  | 'COOKIES_SET'
  | 'COOKIES_SET_RESULT'
  | 'COOKIES_REMOVE'
  | 'COOKIES_REMOVE_RESULT'

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

export type CookieSameSite = 'no_restriction' | 'lax' | 'strict' | 'unspecified'

export interface CookieData {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: CookieSameSite
  session: boolean
  hostOnly: boolean
  expirationDate?: number
}

export interface CookiesGetAllMessage {
  type: 'COOKIES_GET_ALL'
  payload: { url: string }
}

export interface CookiesGetAllResultMessage {
  type: 'COOKIES_GET_ALL_RESULT'
  payload: { ok: true; cookies: CookieData[] } | { ok: false; error: string }
}

export interface CookiesSetMessage {
  type: 'COOKIES_SET'
  payload: {
    url: string
    cookie: CookieData
  }
}

export interface CookiesSetResultMessage {
  type: 'COOKIES_SET_RESULT'
  payload: { ok: true; cookie: CookieData } | { ok: false; error: string }
}

export interface CookiesRemoveMessage {
  type: 'COOKIES_REMOVE'
  payload: {
    url: string
    name: string
    storeId?: string
  }
}

export interface CookiesRemoveResultMessage {
  type: 'COOKIES_REMOVE_RESULT'
  payload: { ok: true } | { ok: false; error: string }
}

export type PanelMessage = PingMessage | CookiesGetAllMessage | CookiesSetMessage | CookiesRemoveMessage

export type BackgroundMessage = PongMessage | CookiesGetAllResultMessage | CookiesSetResultMessage | CookiesRemoveResultMessage

export type ExtensionMessage = PanelMessage | BackgroundMessage

const PANEL_MESSAGE_TYPES = new Set(['PING', 'COOKIES_GET_ALL', 'COOKIES_SET', 'COOKIES_REMOVE'])

export function isPanelMessage(value: unknown): value is PanelMessage {
  if (!value || typeof value !== 'object') return false
  const type = (value as { type?: string }).type
  return typeof type === 'string' && PANEL_MESSAGE_TYPES.has(type)
}

export function createPing(source: PingMessage['payload']['source'] = 'panel'): PingMessage {
  return {
    type: 'PING',
    payload: { timestamp: Date.now(), source },
  }
}

export function sendPanelMessage<T extends BackgroundMessage>(message: PanelMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>
}
