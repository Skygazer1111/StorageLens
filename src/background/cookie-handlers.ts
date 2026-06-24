import type {
  CookieData,
  CookiesGetAllMessage,
  CookiesRemoveMessage,
  CookiesSetMessage,
  PanelMessage,
} from '../shared/messaging/types'

function toCookieData(cookie: chrome.cookies.Cookie): CookieData {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    session: cookie.session,
    hostOnly: cookie.hostOnly,
    expirationDate: cookie.expirationDate,
  }
}

function cookieMatchesPage(cookie: chrome.cookies.Cookie, pageUrl: string): boolean {
  try {
    const page = new URL(pageUrl)
    const host = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain
    const pageHost = page.hostname
    const domainMatches =
      cookie.hostOnly
        ? host === pageHost
        : pageHost === host || pageHost.endsWith(`.${host}`)
  return domainMatches
  } catch {
    return true
  }
}

export function handleCookieMessage(
  message: PanelMessage,
  sendResponse: (response: unknown) => void,
): boolean {
  if (message.type === 'COOKIES_GET_ALL') {
    void handleGetAll(message, sendResponse)
    return true
  }

  if (message.type === 'COOKIES_SET') {
    void handleSet(message, sendResponse)
    return true
  }

  if (message.type === 'COOKIES_REMOVE') {
    void handleRemove(message, sendResponse)
    return true
  }

  return false
}

async function handleGetAll(
  message: CookiesGetAllMessage,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const cookies = await chrome.cookies.getAll({ url: message.payload.url })
    const filtered = cookies
      .filter((cookie) => cookieMatchesPage(cookie, message.payload.url))
      .map(toCookieData)
      .sort((a, b) => a.name.localeCompare(b.name))

    sendResponse({
      type: 'COOKIES_GET_ALL_RESULT',
      payload: { ok: true, cookies: filtered },
    })
  } catch (error) {
    sendResponse({
      type: 'COOKIES_GET_ALL_RESULT',
      payload: {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to read cookies',
      },
    })
  }
}

async function handleSet(
  message: CookiesSetMessage,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const { url, cookie } = message.payload
    const details: chrome.cookies.SetDetails = {
      url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || undefined,
      path: cookie.path || '/',
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
    }

    if (!cookie.session && cookie.expirationDate) {
      details.expirationDate = cookie.expirationDate
    }

    const saved = await chrome.cookies.set(details)
    if (!saved) {
      throw new Error('Cookie could not be saved')
    }

    sendResponse({
      type: 'COOKIES_SET_RESULT',
      payload: { ok: true, cookie: toCookieData(saved) },
    })
  } catch (error) {
    sendResponse({
      type: 'COOKIES_SET_RESULT',
      payload: {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to save cookie',
      },
    })
  }
}

async function handleRemove(
  message: CookiesRemoveMessage,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const removed = await chrome.cookies.remove({
      url: message.payload.url,
      name: message.payload.name,
      storeId: message.payload.storeId,
    })

    if (!removed) {
      throw new Error('Cookie could not be removed')
    }

    sendResponse({
      type: 'COOKIES_REMOVE_RESULT',
      payload: { ok: true },
    })
  } catch (error) {
    sendResponse({
      type: 'COOKIES_REMOVE_RESULT',
      payload: {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to remove cookie',
      },
    })
  }
}
