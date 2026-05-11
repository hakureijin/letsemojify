'use client'
import { useLocale, useTranslations } from 'next-intl'
import type { Source } from '@/types/source'
import data01 from '@/data/chapter-01.json'
import data02 from '@/data/chapter-02.json'
import data03 from '@/data/chapter-03.json'
import data04 from '@/data/chapter-04.json'

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
  for (const s of data02.sources as Source[]) push(s, '02')
  for (const c of data02.cases as WithSource[]) push(c.source, '02')
  for (const s of data03.sources as Source[]) push(s, '03')
  for (const h of data03.hero as WithSource[]) push(h.source, '03')
  for (const b of data03.screenTime as WithSource[]) push(b.source, '03')
  for (const g of data03.topByGen as WithSource[]) push(g.source, '03')
  for (const e of data03.semanticShift as WithSource[]) push(e.source, '03')
  for (const d of data03.dayInLife as WithSource[]) push(d.source, '03')
  for (const s of data04.sources as Source[]) push(s, '04')
  for (const c of data04.cases as WithSource[]) push(c.source, '04')
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
              <a className="underline text-blue-700" target="_blank" rel="noopener noreferrer" href={source.url}>{source.url}</a>
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
