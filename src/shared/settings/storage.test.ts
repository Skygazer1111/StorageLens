import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './types'
import { mergeSettings } from './storage'

describe('mergeSettings', () => {
  it('applies defaults for missing fields', () => {
    expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it('overrides individual settings', () => {
    expect(
      mergeSettings({
        enabled: false,
        liveIdbEnabled: true,
        pollIntervalMs: 3000,
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      enabled: false,
      liveIdbEnabled: true,
      pollIntervalMs: 3000,
    })
  })
})
