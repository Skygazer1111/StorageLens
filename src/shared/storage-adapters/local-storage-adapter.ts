import { runPageStorageOperation } from '../../injected/page-ops'
import type { StorageReadResponse } from '../../injected/page-bridge'
import { invokeInInspectedPage } from '../page-bridge/eval'
import { normalizeStorageResponse } from './parse-value'
import type { StorageEntry } from './types'

async function readStorage(storageName: 'localStorage' | 'sessionStorage'): Promise<StorageEntry[]> {
  const response = await invokeInInspectedPage(runPageStorageOperation, {
    kind: 'read',
    storage: storageName,
  })
  return normalizeStorageResponse(response as StorageReadResponse)
}

export function readLocalStorage(): Promise<StorageEntry[]> {
  return readStorage('localStorage')
}

export function readSessionStorage(): Promise<StorageEntry[]> {
  return readStorage('sessionStorage')
}
