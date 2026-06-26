import { describe, expect, it } from 'vitest'
import { isRestrictedTabUrl } from './runtime'

describe('isRestrictedTabUrl', () => {
  it('blocks browser-internal URLs', () => {
    expect(isRestrictedTabUrl('chrome://extensions')).toBe(true)
    expect(isRestrictedTabUrl('chrome-extension://abc/options.html')).toBe(true)
    expect(isRestrictedTabUrl('about:blank')).toBe(true)
  })

  it('allows normal web origins', () => {
    expect(isRestrictedTabUrl('https://example.com')).toBe(false)
    expect(isRestrictedTabUrl('http://localhost:5173')).toBe(false)
  })
})
