import type {
  IdbErrorResult,
  IdbListDatabasesResult,
  IdbListStoresResult,
  IdbReadRecordsResult,
  IdbSerializedKey,
  IdbSerializedValue,
} from './idb-bridge'

export type IdbOp =
  | { kind: 'listDatabases' }
  | { kind: 'listStores'; databaseName: string }
  | {
      kind: 'readRecords'
      databaseName: string
      storeName: string
      offset: number
      limit: number
    }
  | { kind: 'deleteRecord'; databaseName: string; storeName: string; key: unknown }

type IdbWriteResult = { ok: true } | IdbErrorResult

export type IdbOpResult =
  | IdbListDatabasesResult
  | IdbListStoresResult
  | IdbReadRecordsResult
  | IdbWriteResult
  | IdbErrorResult

/**
 * Serialized into the page ISOLATED world via chrome.scripting.executeScript.
 * Must stay self-contained — no imports are available after injection.
 */
export async function runIdbOperation(op: IdbOp): Promise<IdbOpResult> {
  function serializeKey(key: unknown): IdbSerializedKey {
    if (key === null || key === undefined) {
      return { display: String(key), raw: key }
    }
    if (typeof key === 'string' || typeof key === 'number' || typeof key === 'boolean') {
      return { display: String(key), raw: key }
    }
    try {
      return { display: JSON.stringify(key), raw: key }
    } catch {
      return { display: String(key), raw: key }
    }
  }

  function serializeValue(value: unknown): IdbSerializedValue {
    if (value === null || value === undefined) {
      return { type: 'null', value: null }
    }
    if (typeof value === 'string') {
      return { type: 'string', value }
    }
    if (typeof value === 'number') {
      return { type: 'number', value }
    }
    if (typeof value === 'boolean') {
      return { type: 'boolean', value }
    }
    if (typeof File !== 'undefined' && value instanceof File) {
      return {
        type: 'file',
        value: {
          name: value.name,
          size: value.size,
          mime: value.type,
          lastModified: value.lastModified,
        },
      }
    }
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      return {
        type: 'blob',
        value: {
          name: 'name' in value && typeof value.name === 'string' ? value.name : '',
          size: value.size,
          mime: value.type,
        },
      }
    }
    if (value instanceof ArrayBuffer) {
      return { type: 'arraybuffer', value: { byteLength: value.byteLength } }
    }
    if (ArrayBuffer.isView(value)) {
      return {
        type: 'typedarray',
        value: {
          constructor:
            value.constructor && 'name' in value.constructor ? value.constructor.name : 'TypedArray',
          byteLength: value.byteLength,
        },
      }
    }
    try {
      return { type: 'json', value: JSON.parse(JSON.stringify(value)) }
    } catch {
      return { type: 'unknown', value: String(value) }
    }
  }

  function openDatabase(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName)
      request.onerror = () => reject(request.error || new Error('Failed to open database'))
      request.onblocked = () => reject(new Error('Database open blocked by another connection'))
      request.onsuccess = () => resolve(request.result)
    })
  }

  try {
    if (!window.indexedDB) {
      return { ok: false, error: 'IndexedDB is not available in this context' }
    }

    if (op.kind === 'listDatabases') {
      if (!indexedDB.databases) {
        return {
          ok: true,
          databases: [],
        }
      }

      const databases = await indexedDB.databases()
      const normalized = databases
        .filter((database) => database && database.name)
        .map((database) => ({
          name: database.name as string,
          version: database.version || 1,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      return { ok: true, databases: normalized }
    }

    if (op.kind === 'listStores') {
      const db = await openDatabase(op.databaseName)
      const stores = Array.from(db.objectStoreNames || [])
      const results = []

      for (const storeName of stores) {
        const count = await new Promise<number>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          const countRequest = store.count()
          countRequest.onsuccess = () => resolve(countRequest.result || 0)
          countRequest.onerror = () => reject(countRequest.error || new Error('Failed to count records'))
        })

        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        results.push({
          name: storeName,
          keyPath: store.keyPath ?? null,
          autoIncrement: Boolean(store.autoIncrement),
          count,
        })
      }

      db.close()
      results.sort((a, b) => a.name.localeCompare(b.name))
      return { ok: true, stores: results }
    }

    if (op.kind === 'readRecords') {
      const db = await openDatabase(op.databaseName)
      if (!db.objectStoreNames.contains(op.storeName)) {
        db.close()
        return { ok: false, error: 'Object store not found' }
      }

      const total = await new Promise<number>((resolve, reject) => {
        const tx = db.transaction(op.storeName, 'readonly')
        const store = tx.objectStore(op.storeName)
        const countRequest = store.count()
        countRequest.onsuccess = () => resolve(countRequest.result || 0)
        countRequest.onerror = () => reject(countRequest.error || new Error('Failed to count records'))
      })

      const records: Array<{ key: IdbSerializedKey; value: IdbSerializedValue }> = []
      let skipped = 0
      let hasMore = false

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(op.storeName, 'readonly')
        const store = tx.objectStore(op.storeName)
        const cursorRequest = store.openCursor()

        cursorRequest.onerror = () => reject(cursorRequest.error || new Error('Failed to read records'))
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result
          if (!cursor) {
            resolve()
            return
          }

          if (skipped < op.offset) {
            skipped += 1
            cursor.continue()
            return
          }

          if (records.length >= op.limit) {
            hasMore = true
            resolve()
            return
          }

          records.push({
            key: serializeKey(cursor.key),
            value: serializeValue(cursor.value),
          })
          cursor.continue()
        }
      })

      db.close()
      return { ok: true, total, records, hasMore }
    }

    const db = await openDatabase(op.databaseName)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(op.storeName, 'readwrite')
      const store = tx.objectStore(op.storeName)
      const request = store.delete(op.key as IDBValidKey)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error || new Error('Failed to delete record'))
    })
    db.close()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}
