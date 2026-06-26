interface ToggleProps {
  checked: boolean
  disabled?: boolean
  label: string
  description?: string
  isDark?: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({
  checked,
  disabled = false,
  label,
  description,
  isDark = true,
  onChange,
}: ToggleProps) {
  return (
    <label
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        isDark
          ? 'border-surface-border bg-surface-raised/50 hover:border-surface-border/80'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
          {label}
        </span>
        {description && (
          <span className={`mt-0.5 block text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {description}
          </span>
        )}
      </span>
      <span
        role="presentation"
        className={`pointer-events-none relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-accent' : isDark ? 'bg-surface-border' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </label>
  )
}
