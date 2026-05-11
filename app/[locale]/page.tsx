import { setRequestLocale, getTranslations } from 'next-intl/server'
import { TopNav } from '@/components/TopNav'
import { Hero } from '@/components/Hero'
import { EvolutionPath } from '@/components/chapter-01/EvolutionPath'
import { CumulativeChart } from '@/components/chapter-01/CumulativeChart'
import { Section } from '@/components/ui/Section'
import { WhoGetsIn } from '@/components/chapter-02/WhoGetsIn'
import { AlwaysOn } from '@/components/chapter-03/AlwaysOn'
import { BeyondScreen } from '@/components/chapter-04/BeyondScreen'
import { Footer } from '@/components/Footer'

import ch01 from '@/data/chapter-01.json'
import ch02 from '@/data/chapter-02.json'
import ch03 from '@/data/chapter-03.json'
import ch04 from '@/data/chapter-04.json'

import type { Chapter01Data } from '@/types/chapter-01'
import type { Chapter02Data } from '@/types/chapter-02'
import type { Chapter03Data } from '@/types/chapter-03'
import type { Chapter04Data } from '@/types/chapter-04'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ch01')
  return (
    <>
      <TopNav />
      <Hero />
      <Section id="ch01" accent="var(--accent-01)" className="!py-0">
        <div className="max-w-6xl mx-auto px-6 pt-12">
          <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--accent-01)' }}>CHAPTER 01</div>
          <h2 className="text-3xl md:text-5xl font-black mt-2">{t('title')}</h2>
          <p className="text-sm md:text-base text-[color:var(--muted)] max-w-xl mt-2">{t('intro')}</p>
        </div>
        <EvolutionPath data={ch01 as Chapter01Data} />
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
          <CumulativeChart timeline={(ch01 as Chapter01Data).timeline} />
        </div>
      </Section>
      <WhoGetsIn data={ch02 as Chapter02Data} />
      <AlwaysOn data={ch03 as Chapter03Data} />
      <BeyondScreen data={ch04 as Chapter04Data} />
      <Footer />
    </>
  )
}
