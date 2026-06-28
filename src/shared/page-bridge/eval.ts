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

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (!tab?.id) {
    throw new Error('No active tab found')
  }
  if (isRestrictedTabUrl(tab.url)) {
    throw new Error('Storage cannot be read on this page (browser or extension URL)')
  }
  return tab.id
}

async function invokeInActiveTab<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult | Promise<TResult>,
  args: TArgs,
): Promise<TResult> {
  const tabId = await resolveTabId()

  let results: chrome.scripting.InjectionResult[] | undefined
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId },
      // Isolated world is not subject to the page CSP that blocks unsafe-eval.
      world: 'ISOLATED',
      injectImmediately: true,
      func: fn,
      args,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not run script in page context: ${message}`)
  }

  const result = results?.[0]
  if (!result) {
    throw new Error('Script injection returned no frame result')
  }

  if (result.result === undefined) {
    throw new Error('Page script returned undefined')
  }

  let value: unknown = result.result
  if (value && typeof value === 'object' && 'then' in value && typeof value.then === 'function') {
    value = await (value as Promise<unknown>)
  }

  return value as TResult
}

export async function invokeInInspectedPage<TArg, TResult>(
  fn: (arg: TArg) => TResult | Promise<TResult>,
  arg: TArg,
  options?: { awaitPromise?: boolean },
): Promise<TResult> {
  const { mode } = getPageBridgeState()

  if (mode === 'sidepanel' || !chrome.devtools?.inspectedWindow?.eval) {
    return invokeInActiveTab(fn, [arg])
  }

  const expression = `(${fn.toString()})(${JSON.stringify(arg)})`

  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      expression,
      { awaitPromise: options?.awaitPromise ?? false } as chrome.devtools.inspectedWindow.EvalOptions,
      (result, exceptionInfo) => {
        if (exceptionInfo) {
          reject(new Error(parseEvalError(exceptionInfo)))
          return
        }
        resolve(result as TResult)
      },
    )
  })
}

/** @deprecated Use invokeInInspectedPage with page-ops instead. */
export function evalInInspectedPage<T>(
  expression: string,
  options?: chrome.devtools.inspectedWindow.EvalOptions,
): Promise<T> {
  const { mode } = getPageBridgeState()

  if (mode === 'sidepanel' || !chrome.devtools?.inspectedWindow?.eval) {
    throw new Error('String eval is not supported in side panel mode. Use invokeInInspectedPage.')
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

function parseEvalJsonResult<T>(raw: unknown): T {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as T
  }
  if (raw && typeof raw === 'object') {
    return raw as T
  }
  if (raw === undefined || raw === null) {
    throw new Error(
      'Page script returned no result. The site may block extension scripts, or the tab is not injectable.',
    )
  }
  throw new Error(`Unexpected page script result type: ${typeof raw}`)
}

/** @deprecated Use invokeInInspectedPage with page-ops instead. */
export async function evalJsonInInspectedPage<T>(expression: string): Promise<T> {
  const raw = await evalInInspectedPage<unknown>(expression)
  return parseEvalJsonResult<T>(raw)
}

/** @deprecated Use invokeInInspectedPage with idb-ops instead. */
export async function evalJsonInInspectedPageAsync<T>(expression: string): Promise<T> {
  const raw = await evalInInspectedPage<unknown>(expression, {
    awaitPromise: true,
  } as chrome.devtools.inspectedWindow.EvalOptions)
  return parseEvalJsonResult<T>(raw)
}
