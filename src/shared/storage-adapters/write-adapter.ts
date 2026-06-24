import {
  buildClearStorageScript,
  buildRemoveItemScript,
  buildSetItemScript,
  type StorageWriteResponse,
} from '../../injected/page-bridge'
import { evalJsonInInspectedPage } from '../page-bridge/eval'
import type { StorageKind } from './types'

function storageNameForKind(kind: StorageKind): 'localStorage' | 'sessionStorage' {
  return kind === 'local' ? 'localStorage' : 'sessionStorage'
}

async function runWrite(script: string): Promise<void> {
  const response = await evalJsonInInspectedPage<StorageWriteResponse>(script)
  if (!response.ok) {
    throw new Error(response.error)
  }
}

export async function setStorageItem(
  kind: StorageKind,
  key: string,
  value: string,
): Promise<void> {
  const script = buildSetItemScript(storageNameForKind(kind), key, value)
  await runWrite(script)
}

export async function removeStorageItem(kind: StorageKind, key: string): Promise<void> {
  const script = buildRemoveItemScript(storageNameForKind(kind), key)
  await runWrite(script)
}

export async function clearStorage(kind: StorageKind): Promise<void> {
  const script = buildClearStorageScript(storageNameForKind(kind))
  await runWrite(script)
}
