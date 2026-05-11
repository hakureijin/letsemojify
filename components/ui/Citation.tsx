import type { Source } from '@/types/source'

export function Citation({ source, locale }: { source: Source; locale: 'zh' | 'en' }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[color:var(--muted)] underline-offset-2 hover:underline italic"
      title={source.title[locale]}
    >
      → {source.publisher}
    </a>
  )
}
