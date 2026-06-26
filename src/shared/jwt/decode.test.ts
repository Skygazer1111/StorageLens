import { describe, expect, it } from 'vitest'
import { formatJwtTime, tryDecodeJwt } from './decode'

// header: {"alg":"HS256","typ":"JWT"} payload: {"sub":"123","name":"Test","exp":4102444800}
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVGVzdCIsImV4cCI6NDEwMjQ0NDgwMH0.invalid'

describe('tryDecodeJwt', () => {
  it('decodes valid JWT structure without verifying signature', () => {
    const result = tryDecodeJwt(SAMPLE_JWT)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.header.alg).toBe('HS256')
    expect(result.data.payload.sub).toBe('123')
    expect(result.data.payload.name).toBe('Test')
  })

  it('returns an error for malformed tokens', () => {
    const result = tryDecodeJwt('not-a-jwt')
    expect(result.ok).toBe(false)
  })
})

describe('formatJwtTime', () => {
  it('formats unix timestamps', () => {
    const formatted = formatJwtTime(4102444800)
    expect(formatted).not.toBeNull()
    expect(formatted?.absolute).toContain('2100')
  })

  it('ignores invalid values', () => {
    expect(formatJwtTime('bad')).toBeNull()
  })
})
