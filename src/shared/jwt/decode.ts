import { jwtDecode } from 'jwt-decode'
import { formatDistanceToNow } from 'date-fns'

export interface JwtDecoded {
  header: Record<string, unknown>
  payload: Record<string, unknown>
}

export function tryDecodeJwt(token: string): { ok: true; data: JwtDecoded } | { ok: false; error: string } {
  try {
    const header = jwtDecode<Record<string, unknown>>(token, { header: true })
    const payload = jwtDecode<Record<string, unknown>>(token)
    return { ok: true, data: { header, payload } }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid JWT',
    }
  }
}

export function formatJwtTime(value: unknown): { relative: string; absolute: string } | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const date = new Date(value * 1000)
  return {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    absolute: date.toLocaleString(),
  }
}
