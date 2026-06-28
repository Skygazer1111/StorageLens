import {
  idbRecordId,
  IDB_PAGE_SIZE,
  type IdbDatabaseInfo,
  type IdbErrorResult,
  type IdbListDatabasesResult,
  type IdbListStoresResult,
  type IdbObjectStoreInfo,
  type IdbReadRecordsResult,
  type IdbRecord,
} from '../../injected/idb-bridge'
import { runIdbOperation } from '../../injected/idb-ops'
import { invokeInInspectedPage } from '../page-bridge/eval'

export async function listIndexedDatabases(): Promise<IdbDatabaseInfo[]> {
  const response = await invokeInInspectedPage(
    runIdbOperation,
    { kind: 'listDatabases' },
    { awaitPromise: true },
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  return (response as IdbListDatabasesResult).databases
}

export async function listObjectStores(databaseName: string): Promise<IdbObjectStoreInfo[]> {
  const response = await invokeInInspectedPage(
    runIdbOperation,
    { kind: 'listStores', databaseName },
    { awaitPromise: true },
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  return (response as IdbListStoresResult).stores
}

export async function readObjectStoreRecords(
  databaseName: string,
  storeName: string,
  offset = 0,
  limit = IDB_PAGE_SIZE,
): Promise<{ total: number; records: IdbRecord[]; hasMore: boolean }> {
  const response = await invokeInInspectedPage(
    runIdbOperation,
    { kind: 'readRecords', databaseName, storeName, offset, limit },
    { awaitPromise: true },
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  const result = response as IdbReadRecordsResult
  const records = result.records.map((record) => ({
    id: idbRecordId(databaseName, storeName, record.key.display),
    database: databaseName,
    store: storeName,
    key: record.key,
    value: record.value,
  }))

  return {
    total: result.total,
    records,
    hasMore: result.hasMore,
  }
}

export async function deleteIndexedDbRecord(
  databaseName: string,
  storeName: string,
  key: unknown,
): Promise<void> {
  const response = await invokeInInspectedPage(
    runIdbOperation,
    { kind: 'deleteRecord', databaseName, storeName, key },
    { awaitPromise: true },
  )

  if (!response.ok) {
    throw new Error((response as IdbErrorResult).error)
  }
}

export { IDB_PAGE_SIZE }
