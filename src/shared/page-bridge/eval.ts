export function evalInInspectedPage<T>(
  expression: string,
  options?: chrome.devtools.inspectedWindow.EvalOptions,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!chrome.devtools?.inspectedWindow?.eval) {
      reject(new Error('DevTools inspected window API is unavailable'))
      return
    }

    chrome.devtools.inspectedWindow.eval(expression, options ?? {}, (result, exceptionInfo) => {
      if (exceptionInfo) {
        const message =
          typeof exceptionInfo === 'object' &&
          exceptionInfo !== null &&
          'value' in exceptionInfo &&
          typeof exceptionInfo.value === 'string'
            ? exceptionInfo.value
            : 'Failed to evaluate expression in inspected page'
        reject(new Error(message))
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
