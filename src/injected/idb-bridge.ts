export const IDB_PAGE_SIZE = 100

export interface IdbDatabaseInfo {
  name: string
  version: number
}

export interface IdbObjectStoreInfo {
  name: string
  keyPath: string | string[] | null
  autoIncrement: boolean
  count: number
}

export type IdbValueType =
  | 'null'
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'blob'
  | 'file'
  | 'arraybuffer'
  | 'typedarray'
  | 'unknown'

export interface IdbSerializedValue {
  type: IdbValueType
  value: unknown
}

export interface IdbSerializedKey {
  display: string
  raw: unknown
}

export interface IdbRecord {
  id: string
  database: string
  store: string
  key: IdbSerializedKey
  value: IdbSerializedValue
}

export interface IdbListDatabasesResult {
  ok: true
  databases: IdbDatabaseInfo[]
}

export interface IdbListStoresResult {
  ok: true
  stores: IdbObjectStoreInfo[]
}

export interface IdbReadRecordsResult {
  ok: true
  total: number
  records: Array<{ key: IdbSerializedKey; value: IdbSerializedValue }>
  hasMore: boolean
}

export interface IdbErrorResult {
  ok: false
  error: string
}

const IDB_HELPERS = `
function __slSerializeKey(key) {
  if (key === null || key === undefined) return { display: String(key), raw: key };
  if (typeof key === 'string' || typeof key === 'number' || typeof key === 'boolean') {
    return { display: String(key), raw: key };
  }
  try {
    return { display: JSON.stringify(key), raw: key };
  } catch (error) {
    return { display: String(key), raw: key };
  }
}

function __slSerializeValue(value) {
  if (value === null || value === undefined) return { type: 'null', value: null };
  if (typeof value === 'string') return { type: 'string', value };
  if (typeof value === 'number') return { type: 'number', value };
  if (typeof value === 'boolean') return { type: 'boolean', value };
  if (typeof File !== 'undefined' && value instanceof File) {
    return {
      type: 'file',
      value: {
        name: value.name,
        size: value.size,
        mime: value.type,
        lastModified: value.lastModified,
      },
    };
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return {
      type: 'blob',
      value: {
        name: value.name || '',
        size: value.size,
        mime: value.type,
      },
    };
  }
  if (value instanceof ArrayBuffer) {
    return { type: 'arraybuffer', value: { byteLength: value.byteLength } };
  }
  if (ArrayBuffer.isView(value)) {
    return {
      type: 'typedarray',
      value: {
        constructor: value.constructor && value.constructor.name ? value.constructor.name : 'TypedArray',
        byteLength: value.byteLength,
      },
    };
  }
  try {
    return { type: 'json', value: JSON.parse(JSON.stringify(value)) };
  } catch (error) {
    return { type: 'unknown', value: String(value) };
  }
}

function __slOpenDatabase(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error || new Error('Failed to open database'));
    request.onblocked = () => reject(new Error('Database open blocked by another connection'));
    request.onsuccess = () => resolve(request.result);
  });
}
`

export const LIST_INDEXED_DB_SCRIPT = `
${IDB_HELPERS}
(async function() {
  try {
    if (!window.indexedDB) {
      return JSON.stringify({ ok: false, error: 'IndexedDB is not available in this context' });
    }

    if (!indexedDB.databases) {
      return JSON.stringify({
        ok: true,
        databases: [],
        warning: 'Database enumeration is not supported in this browser context',
      });
    }

    const databases = await indexedDB.databases();
    const normalized = databases
      .filter((database) => database && database.name)
      .map((database) => ({
        name: database.name,
        version: database.version || 1,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return JSON.stringify({ ok: true, databases: normalized });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String(error) });
  }
})()
`

export function buildListStoresScript(databaseName: string): string {
  return `
${IDB_HELPERS}
(async function() {
  const dbName = ${JSON.stringify(databaseName)};
  try {
    const db = await __slOpenDatabase(dbName);
    const stores = Array.from(db.objectStoreNames || []);
    const results = [];

    for (const storeName of stores) {
      const count = await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const countRequest = store.count();
        countRequest.onsuccess = () => resolve(countRequest.result || 0);
        countRequest.onerror = () => reject(countRequest.error || new Error('Failed to count records'));
      });

      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      results.push({
        name: storeName,
        keyPath: store.keyPath ?? null,
        autoIncrement: Boolean(store.autoIncrement),
        count,
      });
    }

    db.close();
    results.sort((a, b) => a.name.localeCompare(b.name));
    return JSON.stringify({ ok: true, stores: results });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String(error) });
  }
})()
`
}

export function buildReadRecordsScript(
  databaseName: string,
  storeName: string,
  offset: number,
  limit: number,
): string {
  return `
${IDB_HELPERS}
(async function() {
  const dbName = ${JSON.stringify(databaseName)};
  const objectStoreName = ${JSON.stringify(storeName)};
  const offset = ${offset};
  const limit = ${limit};

  try {
    const db = await __slOpenDatabase(dbName);
    if (!db.objectStoreNames.contains(objectStoreName)) {
      db.close();
      return JSON.stringify({ ok: false, error: 'Object store not found' });
    }

    const total = await new Promise((resolve, reject) => {
      const tx = db.transaction(objectStoreName, 'readonly');
      const store = tx.objectStore(objectStoreName);
      const countRequest = store.count();
      countRequest.onsuccess = () => resolve(countRequest.result || 0);
      countRequest.onerror = () => reject(countRequest.error || new Error('Failed to count records'));
    });

    const records = [];
    let skipped = 0;
    let hasMore = false;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(objectStoreName, 'readonly');
      const store = tx.objectStore(objectStoreName);
      const cursorRequest = store.openCursor();

      cursorRequest.onerror = () => reject(cursorRequest.error || new Error('Failed to read records'));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) {
          resolve(undefined);
          return;
        }

        if (skipped < offset) {
          skipped += 1;
          cursor.continue();
          return;
        }

        if (records.length >= limit) {
          hasMore = true;
          resolve(undefined);
          return;
        }

        records.push({
          key: __slSerializeKey(cursor.key),
          value: __slSerializeValue(cursor.value),
        });
        cursor.continue();
      };
    });

    db.close();
    return JSON.stringify({ ok: true, total, records, hasMore });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String(error) });
  }
})()
`
}

export function buildDeleteRecordScript(
  databaseName: string,
  storeName: string,
  key: unknown,
): string {
  return `
${IDB_HELPERS}
(async function() {
  const dbName = ${JSON.stringify(databaseName)};
  const objectStoreName = ${JSON.stringify(storeName)};
  const key = ${JSON.stringify(key)};

  try {
    const db = await __slOpenDatabase(dbName);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(objectStoreName, 'readwrite');
      const store = tx.objectStore(objectStoreName);
      const request = store.delete(key);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error || new Error('Failed to delete record'));
    });
    db.close();
    return JSON.stringify({ ok: true });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String(error) });
  }
})()
`
}

export function idbRecordId(database: string, store: string, keyDisplay: string): string {
  return `${database}::${store}::${keyDisplay}`
}
