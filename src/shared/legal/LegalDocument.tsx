interface LegalDocumentProps {
  content: string
  isDark: boolean
}

export function LegalDocument({ content, isDark }: LegalDocumentProps) {
  const lines = content.split('\n')

  return (
    <article
      className={`prose-sm max-w-none space-y-3 text-sm leading-relaxed ${
        isDark ? 'text-gray-300' : 'text-slate-700'
      }`}
    >
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {line.slice(2)}
            </h1>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className={`mt-4 text-base font-semibold ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith('| ')) {
          return (
            <p key={index} className="font-mono text-xs">
              {line}
            </p>
          )
        }
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-4 list-disc">
              {line.slice(2)}
            </li>
          )
        }
        if (!line.trim()) return <div key={index} className="h-2" />
        return <p key={index}>{line}</p>
      })}
    </article>
  )
}
