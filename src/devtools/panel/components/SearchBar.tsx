import { useRef } from 'react'
import { useSearchShortcut } from '../hooks/useSearchShortcut'

interface SearchBarProps {
  query: string
  onChange: (query: string) => void
  matchCount: number
  totalCount: number
  isDark: boolean
}

export function SearchBar({ query, onChange, matchCount, totalCount, isDark }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useSearchShortcut(inputRef)

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search keys and values…  (press /)"
          className={`w-full rounded-md border px-3 py-1.5 text-sm outline-none transition-colors focus:border-accent ${
            isDark
              ? 'border-surface-border bg-surface-raised text-gray-100 placeholder:text-gray-500'
              : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
          }`}
        />
      </div>
      <span
        className={`shrink-0 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
      >
        {query.trim() ? `${matchCount} / ${totalCount}` : `${totalCount} entries`}
      </span>
    </div>
  )
}
