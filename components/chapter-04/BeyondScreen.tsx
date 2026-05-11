'use client'
import { useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Section } from '@/components/ui/Section'
import { CategoryChips } from './CategoryChips'
import { CaseCard } from './CaseCard'
import { applyFilter } from '@/lib/filter'
import type { Chapter04Data, Chapter04Category } from '@/types/chapter-04'

export function BeyondScreen({ data }: { data: Chapter04Data }) {
  const t = useTranslations('ch04')
  const [filter, setFilter] = useState<Chapter04Category | null>(null)
  const visible = applyFilter(data.cases, filter)

  return (
    <Section id="ch04" accent="var(--accent-04)">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--accent-04)' }}>CHAPTER 04</div>
            <h2 className="text-3xl md:text-5xl font-black mt-2">{t('title')}</h2>
            <p className="text-sm md:text-base text-[color:var(--muted)] max-w-xl mt-2">{t('intro')}</p>
          </div>
          <CategoryChips selected={filter} onSelect={setFilter} />
        </div>
        <LayoutGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <AnimatePresence>
              {visible.map(c => <CaseCard key={c.id} caseItem={c} />)}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </Section>
  )
}
