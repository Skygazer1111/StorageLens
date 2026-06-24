import type { IdbDatabaseInfo, IdbObjectStoreInfo } from '../../../injected/idb-bridge'

interface IdbTreeProps {
  databases: IdbDatabaseInfo[]
  storesByDatabase: Record<string, IdbObjectStoreInfo[]>
  loadingStoresFor: string | null
  selectedDatabase: string | null
  selectedStore: string | null
  isDark: boolean
  onSelectDatabase: (databaseName: string) => void
  onSelectStore: (databaseName: string, storeName: string) => void
}

export function IdbTree({
  databases,
  storesByDatabase,
  loadingStoresFor,
  selectedDatabase,
  selectedStore,
  isDark,
  onSelectDatabase,
  onSelectStore,
}: IdbTreeProps) {
  if (databases.length === 0) {
    return (
      <div className={`p-4 text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
        No IndexedDB databases found for this origin.
      </div>
    )
  }

  return (
    <div className="overflow-auto p-2">
      {databases.map((database) => {
        const stores = storesByDatabase[database.name] ?? []
        const isDatabaseSelected = selectedDatabase === database.name

        return (
          <div key={database.name} className="mb-2">
            <button
              type="button"
              onClick={() => onSelectDatabase(database.name)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                isDatabaseSelected
                  ? 'bg-accent/20 text-accent'
                  : isDark
                    ? 'text-gray-200 hover:bg-surface-raised'
                    : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="truncate font-mono">{database.name}</span>
              <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                v{database.version}
              </span>
            </button>

            {(isDatabaseSelected || stores.length > 0) && (
              <div className="ml-3 mt-1 border-l border-surface-border/60 pl-2">
                {loadingStoresFor === database.name && (
                  <p className={`px-2 py-1 text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                    Loading stores…
                  </p>
                )}
                {stores.map((store) => {
                  const selected = selectedDatabase === database.name && selectedStore === store.name
                  return (
                    <button
                      key={store.name}
                      type="button"
                      onClick={() => onSelectStore(database.name, store.name)}
                      className={`mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs ${
                        selected
                          ? 'bg-accent/15 text-accent'
                          : isDark
                            ? 'text-gray-300 hover:bg-surface-raised'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate font-mono">{store.name}</span>
                      <span className={`ml-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                        {store.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
