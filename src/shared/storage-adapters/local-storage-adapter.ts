import {
  READ_LOCAL_STORAGE_SCRIPT,
  READ_SESSION_STORAGE_SCRIPT,
  type StorageReadResponse,
} from '../../injected/page-bridge'
import { evalJsonInInspectedPage } from '../page-bridge/eval'
import { normalizeStorageResponse } from './parse-value'
import type { StorageEntry } from './types'

async function readStorage(script: string): Promise<StorageEntry[]> {
  const response = await evalJsonInInspectedPage<StorageReadResponse>(script)
  return normalizeStorageResponse(response)
}

export function readLocalStorage(): Promise<StorageEntry[]> {
  return readStorage(READ_LOCAL_STORAGE_SCRIPT)
}

export function readSessionStorage(): Promise<StorageEntry[]> {
  return readStorage(READ_SESSION_STORAGE_SCRIPT)
}
