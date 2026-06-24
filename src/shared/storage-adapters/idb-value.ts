import type { IdbSerializedValue } from '../../injected/idb-bridge'

export function idbValueToTreeData(serialized: IdbSerializedValue): unknown {
  switch (serialized.type) {
    case 'null':
      return null
    case 'string':
    case 'number':
    case 'boolean':
    case 'json':
      return serialized.value
    case 'blob':
    case 'file':
    case 'arraybuffer':
    case 'typedarray':
      return {
        __storagelensType: serialized.type,
        ...(serialized.value as Record<string, unknown>),
      }
    default:
      return { __storagelensType: 'unknown', preview: String(serialized.value) }
  }
}

export function idbValuePreview(serialized: IdbSerializedValue): string {
  switch (serialized.type) {
    case 'null':
      return 'null'
    case 'string':
      return String(serialized.value)
    case 'number':
    case 'boolean':
      return String(serialized.value)
    case 'blob': {
      const blob = serialized.value as { name?: string; size?: number; mime?: string }
      return `Blob(${blob.size ?? 0} bytes${blob.mime ? `, ${blob.mime}` : ''})`
    }
    case 'file': {
      const file = serialized.value as { name?: string; size?: number }
      return `File(${file.name || 'unnamed'}, ${file.size ?? 0} bytes)`
    }
    case 'arraybuffer': {
      const buffer = serialized.value as { byteLength?: number }
      return `ArrayBuffer(${buffer.byteLength ?? 0} bytes)`
    }
    case 'typedarray': {
      const view = serialized.value as { constructor?: string; byteLength?: number }
      return `${view.constructor ?? 'TypedArray'}(${view.byteLength ?? 0} bytes)`
    }
    case 'json':
      try {
        return JSON.stringify(serialized.value).slice(0, 80)
      } catch {
        return '[Object]'
      }
    default:
      return String(serialized.value)
  }
}
