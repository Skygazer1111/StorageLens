import { useState } from 'react'
import { copyToClipboard } from '../../../shared/utils/clipboard'

interface CopyActionsProps {
  keyName: string
  value: string
  jsonPath?: string
  isDark: boolean
}

export function CopyActions({ keyName, value, jsonPath, isDark }: CopyActionsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (label: string, text: string) => {
    try {
      await copyToClipboard(text)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied('error')
      window.setTimeout(() => setCopied(null), 1500)
    }
  }

  const buttonClass = `rounded border px-2 py-1 text-xs transition-colors ${
    isDark
      ? 'border-surface-border text-gray-300 hover:border-accent hover:text-white'
      : 'border-slate-300 text-slate-600 hover:border-accent hover:text-slate-900'
  }`

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonClass} onClick={() => void handleCopy('key', keyName)}>
        {copied === 'key' ? 'Copied!' : 'Copy key'}
      </button>
      <button type="button" className={buttonClass} onClick={() => void handleCopy('value', value)}>
        {copied === 'value' ? 'Copied!' : 'Copy value'}
      </button>
      {jsonPath && (
        <button
          type="button"
          className={buttonClass}
          onClick={() => void handleCopy('path', jsonPath)}
        >
          {copied === 'path' ? 'Copied!' : 'Copy JSON path'}
        </button>
      )}
      {copied === 'error' && <span className="text-xs text-red-400">Copy failed</span>}
    </div>
  )
}
