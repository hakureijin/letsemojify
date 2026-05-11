'use client'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useInView } from 'framer-motion'
import type { HeroStat } from '@/types/chapter-03'

export function HeroStats({ stats }: { stats: HeroStat[] }) {
  const t = useTranslations()
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <div ref={ref} className="bg-white rounded-2xl p-4 md:p-6 shadow grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map(s => (
        <div key={s.id} className="text-center">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--muted)]">{t(s.labelKey as never)}</div>
          <div className="text-3xl md:text-4xl font-black tabular text-[color:var(--accent-03)] mt-1">{visible ? s.value : '—'}</div>
        </div>
      ))}
    </div>
  )
}
