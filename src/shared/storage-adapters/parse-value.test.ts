import { describe, expect, it } from 'vitest'
import {
  detectValueType,
  formatByteSize,
  normalizeStorageItem,
  truncatePreview,
} from './parse-value'

describe('detectValueType', () => {
  it('flags JWT-shaped strings', () => {
    expect(detectValueType('aaa.bbb.ccc')).toBe('jwt-candidate')
  })

  it('parses JSON strings', () => {
    expect(detectValueType('{"a":1}')).toBe('json')
    expect(detectValueType('[1,2]')).toBe('json')
  })

  it('falls back to plain strings', () => {
    expect(detectValueType('hello')).toBe('string')
  })
})

describe('normalizeStorageItem', () => {
  it('builds a storage entry with parsed JSON', () => {
    const entry = normalizeStorageItem({
      key: 'user',
      value: '{"id":1}',
      byteSize: 10,
    })
    expect(entry.id).toBe('user')
    expect(entry.valueType).toBe('json')
    expect(entry.parsed).toEqual({ id: 1 })
  })
})

describe('formatByteSize', () => {
  it('formats human-readable sizes', () => {
    expect(formatByteSize(500)).toBe('500 B')
    expect(formatByteSize(2048)).toBe('2.0 KB')
  })
})

describe('truncatePreview', () => {
  it('truncates long single-line previews', () => {
    expect(truncatePreview('x'.repeat(120), 80).endsWith('…')).toBe(true)
  })
})
