import { runPageStorageOperation } from '../../injected/page-ops'
import type { PageLocation } from '../../injected/page-bridge'
import { invokeInInspectedPage } from './eval'

export async function readPageLocation(): Promise<PageLocation> {
  const response = await invokeInInspectedPage(runPageStorageOperation, { kind: 'location' })

  if (!response.ok || !('href' in response)) {
    throw new Error('error' in response ? response.error : 'Failed to read page location')
  }

  return { href: response.href, origin: response.origin }
}
