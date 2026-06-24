export function evalInInspectedPage<T>(expression: string): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!chrome.devtools?.inspectedWindow?.eval) {
      reject(new Error('DevTools inspected window API is unavailable'))
      return
    }

    chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
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
