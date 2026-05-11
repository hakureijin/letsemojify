'use client'
import { useTranslations } from 'next-intl'
import { Section } from '@/components/ui/Section'
import { HeroStats } from './HeroStats'
import { ScreenTimeBars } from './ScreenTimeBars'
import { TopEmojisByGen } from './TopEmojisByGen'
import { SemanticShift } from './SemanticShift'
import { DayInLife } from './DayInLife'
import type { Chapter03Data } from '@/types/chapter-03'

export function AlwaysOn({ data }: { data: Chapter03Data }) {
  const t = useTranslations('ch03')
  return (
    <Section id="ch03" accent="var(--accent-03)">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--accent-03)' }}>CHAPTER 03</div>
          <h2 className="text-3xl md:text-5xl font-black mt-2">{t('title')}</h2>
          <p className="text-sm md:text-base text-[color:var(--muted)] max-w-xl mt-2">{t('intro')}</p>
        </div>
        <HeroStats stats={data.hero} />
        <ScreenTimeBars bars={data.screenTime} />
        <TopEmojisByGen data={data.topByGen} />
        <SemanticShift entries={data.semanticShift} />
        <DayInLife spikes={data.dayInLife} />
      </div>
    </Section>
  )
}
