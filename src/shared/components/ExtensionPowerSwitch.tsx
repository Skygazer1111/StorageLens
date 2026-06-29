interface ExtensionPowerSwitchProps {
  enabled: boolean
  disabled?: boolean
  isDark: boolean
  onChange: (enabled: boolean) => void
}

export function ExtensionPowerSwitch({
  enabled,
  disabled = false,
  isDark,
  onChange,
}: ExtensionPowerSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Turn extension off' : 'Turn extension on'}
      title={enabled ? 'Extension enabled' : 'Extension disabled'}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? 'bg-accent' : isDark ? 'bg-surface-border' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
