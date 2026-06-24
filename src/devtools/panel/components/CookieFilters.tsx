import type { CookieFilterState } from '../../../shared/storage-adapters/types'

interface CookieFiltersProps {
  filters: CookieFilterState
  isDark: boolean
  onChange: (filters: CookieFilterState) => void
}

const filterOptions: { key: keyof CookieFilterState; label: string }[] = [
  { key: 'sessionOnly', label: 'Session' },
  { key: 'persistentOnly', label: 'Persistent' },
  { key: 'secureOnly', label: 'Secure' },
  { key: 'httpOnlyOnly', label: 'HttpOnly' },
]

export function CookieFilters({ filters, isDark, onChange }: CookieFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {filterOptions.map((option) => (
        <label
          key={option.key}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
            isDark
              ? 'border-surface-border text-gray-300'
              : 'border-slate-300 text-slate-600'
          }`}
        >
          <input
            type="checkbox"
            checked={filters[option.key]}
            onChange={(event) =>
              onChange({
                ...filters,
                [option.key]: event.target.checked,
              })
            }
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
