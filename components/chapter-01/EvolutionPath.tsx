'use client'
import { useLocale } from 'next-intl'
import { TimelineCard } from './TimelineCard'
import type { Chapter01Data } from '@/types/chapter-01'

interface Props { data: Chapter01Data }

export function EvolutionPath({ data }: Props) {
  const locale = useLocale() as 'zh' | 'en'
  return (
    <div className="bg-gradient-to-r from-[color:var(--accent-01)]/10 via-pink-50 to-violet-100 py-16">
      <div className="px-6">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory">
          {data.timeline.map((n) => (
            <div key={n.id} className="snap-start">
              <TimelineCard node={n} active locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
