import { getPageBridgeState, isRestrictedTabUrl } from './runtime'

function parseEvalError(exceptionInfo: unknown): string {
  if (
    typeof exceptionInfo === 'object' &&
    exceptionInfo !== null &&
    'value' in exceptionInfo &&
    typeof (exceptionInfo as { value?: unknown }).value === 'string'
  ) {
    return (exceptionInfo as { value: string }).value
  }
  return 'Failed to evaluate expression in inspected page'
}

async function resolveTabId(): Promise<number> {
  const { tabId } = getPageBridgeState()
  if (tabId) return tabId

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error('No active tab found')
  }
  if (isRestrictedTabUrl(tab.url)) {
    throw new Error('Storage cannot be read on this page (browser or extension URL)')
  }
  return tab.id
}

async function evalInActiveTab<T>(expression: string): Promise<T> {
  const tabId = await resolveTabId()

  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: (script: string) => {
      // Trusted bridge scripts only — runs in the page MAIN world, not extension context.
      const run = new Function(`return ${script}`)
      return run()
    },
    args: [expression],
  })

  if (!result) {
    throw new Error('Script injection returned no result')
  }

  return result.result as T
}

export function evalInInspectedPage<T>(
  expression: string,
  options?: chrome.devtools.inspectedWindow.EvalOptions,
): Promise<T> {
  const { mode } = getPageBridgeState()

  if (mode === 'sidepanel' || !chrome.devtools?.inspectedWindow?.eval) {
    return evalInActiveTab<T>(expression)
  }

  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(expression, options ?? {}, (result, exceptionInfo) => {
      if (exceptionInfo) {
        reject(new Error(parseEvalError(exceptionInfo)))
        return
      }
      resolve(result as T)
    })
  })
}

export async function evalJsonInInspectedPage<T>(expression: string): Promise<T> {
  const raw = await evalInInspectedPage<string>(expression)

  if (typeof raw !== 'string') {
    throw new Error('Expected JSON string from inspected page')
  }

  return JSON.parse(raw) as T
}

export async function evalJsonInInspectedPageAsync<T>(expression: string): Promise<T> {
  const raw = await evalInInspectedPage<string>(expression, {
    awaitPromise: true,
  } as chrome.devtools.inspectedWindow.EvalOptions)

  if (typeof raw !== 'string') {
    throw new Error('Expected JSON string from inspected page')
  }

  return JSON.parse(raw) as T
}
