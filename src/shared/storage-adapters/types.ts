export type StorageValueType = 'json' | 'string' | 'jwt-candidate'

export interface StorageEntry {
  key: string
  value: string
  byteSize: number
  valueType: StorageValueType
  parsed?: unknown
}

export type StorageKind = 'local' | 'session'
