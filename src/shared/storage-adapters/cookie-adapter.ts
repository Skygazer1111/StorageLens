import {
  sendPanelMessage,
  type CookieData,
  type CookiesGetAllResultMessage,
  type CookiesRemoveResultMessage,
  type CookiesSetResultMessage,
} from '../messaging/types'
import {
  buildCookieUrl,
  mapCookieToEntry,
} from './cookie-utils'
import type { StorageEntry } from './types'

export async function readCookies(pageUrl: string): Promise<StorageEntry[]> {
  const response = await sendPanelMessage<CookiesGetAllResultMessage>({
    type: 'COOKIES_GET_ALL',
    payload: { url: pageUrl },
  })

  if (!response.payload.ok) {
    throw new Error(response.payload.error)
  }

  return response.payload.cookies.map(mapCookieToEntry).sort((a, b) => a.key.localeCompare(b.key))
}

export async function setCookie(pageUrl: string, cookie: CookieData): Promise<StorageEntry> {
  const response = await sendPanelMessage<CookiesSetResultMessage>({
    type: 'COOKIES_SET',
    payload: { url: buildCookieUrl(pageUrl, cookie), cookie },
  })

  if (!response.payload.ok) {
    throw new Error(response.payload.error)
  }

  return mapCookieToEntry(response.payload.cookie)
}

export async function removeCookie(pageUrl: string, name: string): Promise<void> {
  const response = await sendPanelMessage<CookiesRemoveResultMessage>({
    type: 'COOKIES_REMOVE',
    payload: { url: pageUrl, name },
  })

  if (!response.payload.ok) {
    throw new Error(response.payload.error)
  }
}

export async function removeCookieEntry(pageUrl: string, entry: StorageEntry): Promise<void> {
  if (!entry.cookie) {
    throw new Error('Entry is not a cookie')
  }

  const response = await sendPanelMessage<CookiesRemoveResultMessage>({
    type: 'COOKIES_REMOVE',
    payload: {
      url: buildCookieUrl(pageUrl, entry.cookie),
      name: entry.key,
    },
  })

  if (!response.payload.ok) {
    throw new Error(response.payload.error)
  }
}

export async function clearCookies(pageUrl: string, entries: StorageEntry[]): Promise<void> {
  const cookieEntries = entries.filter((entry) => entry.cookie)
  for (const entry of cookieEntries) {
    await removeCookieEntry(pageUrl, entry)
  }
}
