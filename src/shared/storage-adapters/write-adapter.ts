import { runPageStorageOperation } from '../../injected/page-ops'
import type { StorageWriteResponse } from '../../injected/page-bridge'
import { invokeInInspectedPage } from '../page-bridge/eval'
import type { StorageKind } from './types'

function storageNameForKind(kind: StorageKind): 'localStorage' | 'sessionStorage' {
  return kind === 'local' ? 'localStorage' : 'sessionStorage'
}

async function runWrite(response: StorageWriteResponse): Promise<void> {
  if (!response.ok) {
    throw new Error(response.error)
  }
}

export async function setStorageItem(
  kind: StorageKind,
  key: string,
  value: string,
): Promise<void> {
  const response = await invokeInInspectedPage(runPageStorageOperation, {
    kind: 'set',
    storage: storageNameForKind(kind),
    key,
    value,
  })
  await runWrite(response as StorageWriteResponse)
}

export async function removeStorageItem(kind: StorageKind, key: string): Promise<void> {
  const response = await invokeInInspectedPage(runPageStorageOperation, {
    kind: 'remove',
    storage: storageNameForKind(kind),
    key,
  })
  await runWrite(response as StorageWriteResponse)
}

export async function clearStorage(kind: StorageKind): Promise<void> {
  const response = await invokeInInspectedPage(runPageStorageOperation, {
    kind: 'clear',
    storage: storageNameForKind(kind),
  })
  await runWrite(response as StorageWriteResponse)
}
