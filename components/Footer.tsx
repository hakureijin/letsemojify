'use client'
import { useLocale, useTranslations } from 'next-intl'
import type { Source } from '@/types/source'
import data01 from '@/data/chapter-01.json'
import data01Cat from '@/data/chapter-01-categories.json'
import data02 from '@/data/chapter-02.json'

interface WithSource { source: Source }

function collect(): Map<string, { source: Source; chapters: string[] }> {
  const all = new Map<string, { source: Source; chapters: string[] }>()
  const push = (s: Source, ch: string) => {
    const cur = all.get(s.id)
    if (cur) {
      if (!cur.chapters.includes(ch)) cur.chapters.push(ch)
    } else {
      all.set(s.id, { source: s, chapters: [ch] })
    }
  }
  for (const s of data01.sources as Source[]) push(s, '01')
  for (const n of data01.timeline as WithSource[]) push(n.source, '01')
  push(data01Cat.source as Source, '01')
  for (const s of data02.sources as Source[]) push(s, '02')
  for (const c of data02.cases as WithSource[]) push(c.source, '02')
  return all
}

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale() as 'zh' | 'en'
  const sources = Array.from(collect().values())
    .sort((a, b) => a.source.publisher.localeCompare(b.source.publisher))

  return (
    <footer className="bg-neutral-50 py-12 px-6 text-sm">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-extrabold">{t('heading')}</h3>
        <ul className="mt-4 space-y-3">
          {sources.map(({ source, chapters }) => (
            <li key={source.id} className="leading-snug">
              <span className="text-xs font-extrabold text-[color:var(--muted)]">§{chapters.join(', §')}</span>
              {' · '}
              <span className="font-bold">{source.publisher}</span>
              {' — '}
              <span>{source.title[locale]}</span>
              {' — '}
              <a className="underline text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded" target="_blank" rel="noopener noreferrer" href={source.url}>{source.url}</a>
              {' '}
              <span className="text-xs text-[color:var(--muted)]">(accessed {source.accessed})</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[color:var(--muted)] mt-8">{t('credits')}</p>
      </div>
    </footer>
  )
}
