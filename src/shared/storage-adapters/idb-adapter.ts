import {
  buildDeleteRecordScript,
  buildListStoresScript,
  buildReadRecordsScript,
  idbRecordId,
  IDB_PAGE_SIZE,
  LIST_INDEXED_DB_SCRIPT,
  type IdbDatabaseInfo,
  type IdbErrorResult,
  type IdbListDatabasesResult,
  type IdbListStoresResult,
  type IdbObjectStoreInfo,
  type IdbReadRecordsResult,
  type IdbRecord,
} from '../../injected/idb-bridge'
import { evalJsonInInspectedPageAsync } from '../page-bridge/eval'

type IdbWriteResult = { ok: true } | IdbErrorResult

export async function listIndexedDatabases(): Promise<IdbDatabaseInfo[]> {
  const response = await evalJsonInInspectedPageAsync<IdbListDatabasesResult | IdbErrorResult>(
    LIST_INDEXED_DB_SCRIPT,
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  return response.databases
}

export async function listObjectStores(databaseName: string): Promise<IdbObjectStoreInfo[]> {
  const response = await evalJsonInInspectedPageAsync<IdbListStoresResult | IdbErrorResult>(
    buildListStoresScript(databaseName),
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  return response.stores
}

export async function readObjectStoreRecords(
  databaseName: string,
  storeName: string,
  offset = 0,
  limit = IDB_PAGE_SIZE,
): Promise<{ total: number; records: IdbRecord[]; hasMore: boolean }> {
  const response = await evalJsonInInspectedPageAsync<IdbReadRecordsResult | IdbErrorResult>(
    buildReadRecordsScript(databaseName, storeName, offset, limit),
  )

  if (!response.ok) {
    throw new Error(response.error)
  }

  const records = response.records.map((record) => ({
    id: idbRecordId(databaseName, storeName, record.key.display),
    database: databaseName,
    store: storeName,
    key: record.key,
    value: record.value,
  }))

  return {
    total: response.total,
    records,
    hasMore: response.hasMore,
  }
}

export async function deleteIndexedDbRecord(
  databaseName: string,
  storeName: string,
  key: unknown,
): Promise<void> {
  const response = await evalJsonInInspectedPageAsync<IdbWriteResult>(
    buildDeleteRecordScript(databaseName, storeName, key),
  )

  if (!response.ok) {
    throw new Error(response.error)
  }
}

export { IDB_PAGE_SIZE }
