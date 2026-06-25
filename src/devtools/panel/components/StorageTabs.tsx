import type { StorageKind } from '../../../shared/storage-adapters/types'

interface StorageTabsProps {
  activeTab: StorageKind
  isDark: boolean
  badges?: Partial<Record<StorageKind, number>>
  onChange: (tab: StorageKind) => void
}

const tabs: { id: StorageKind; label: string }[] = [
  { id: 'local', label: 'Local Storage' },
  { id: 'session', label: 'Session Storage' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'indexeddb', label: 'IndexedDB' },
]

export function StorageTabs({ activeTab, isDark, badges, onChange }: StorageTabsProps) {
  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-accent text-accent'
              : isDark
                ? 'border-transparent text-gray-400 hover:text-gray-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>{tab.label}</span>
          {(badges?.[tab.id] ?? 0) > 0 && (
            <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {badges?.[tab.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
