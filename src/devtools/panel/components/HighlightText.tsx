import { splitByQuery } from '../../../shared/search/storage-search'

interface HighlightTextProps {
  text: string
  query: string
  className?: string
}

export function HighlightText({ text, query, className }: HighlightTextProps) {
  const parts = splitByQuery(text, query)

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            key={index}
            className="rounded bg-accent/40 px-0.5 text-inherit"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  )
}
