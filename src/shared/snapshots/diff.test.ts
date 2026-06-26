import { describe, expect, it } from 'vitest'
import { diffSnapshots } from './diff'
import type { StorageSnapshot } from './types'

function snapshot(overrides: Partial<StorageSnapshot> = {}): StorageSnapshot {
  return {
    id: 'a',
    label: 'A',
    createdAt: '2026-01-01T00:00:00.000Z',
    origin: 'https://example.com',
    localStorage: {},
    sessionStorage: {},
    cookies: [],
    ...overrides,
  }
}

describe('diffSnapshots', () => {
  it('detects added, removed, and changed keys', () => {
    const left = snapshot({
      localStorage: { token: 'old', keep: 'same' },
      sessionStorage: { a: '1' },
      cookies: [
        {
          id: 'c1',
          name: 'c1',
          value: 'v1',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          session: false,
          hostOnly: false,
        },
      ],
    })
    const right = snapshot({
      localStorage: { token: 'new', keep: 'same', fresh: 'yes' },
      sessionStorage: {},
      cookies: [
        {
          id: 'c1',
          name: 'c1',
          value: 'v2',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          session: false,
          hostOnly: false,
        },
      ],
    })

    const diff = diffSnapshots(left, right)

    expect(diff.localStorage.added).toEqual(['fresh'])
    expect(diff.localStorage.removed).toEqual([])
    expect(diff.localStorage.changed).toEqual(['token'])
    expect(diff.sessionStorage.removed).toEqual(['a'])
    expect(diff.cookies.changed).toEqual(['c1'])
  })
})
