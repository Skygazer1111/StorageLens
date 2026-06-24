export function validateJson(value: string): { valid: true } | { valid: false; error: string } {
  try {
    JSON.parse(value)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    }
  }
}

export function formatJson(value: string): { formatted: string } | { error: string } {
  const validation = validateJson(value)
  if (!validation.valid) {
    return { error: validation.error }
  }

  try {
    return { formatted: JSON.stringify(JSON.parse(value), null, 2) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to format JSON' }
  }
}

export function looksLikeJsonValue(value: string): boolean {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}
