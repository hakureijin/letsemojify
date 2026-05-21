import { setRequestLocale, getTranslations } from 'next-intl/server'
import { TopNav } from '@/components/TopNav'
import { Hero } from '@/components/Hero'
import { EvolutionPath } from '@/components/chapter-01/EvolutionPath'
import { CumulativeChart } from '@/components/chapter-01/CumulativeChart'
import { CategoryTreemap } from '@/components/chapter-01/CategoryTreemap'
import { VariantSankey } from '@/components/chapter-01/VariantSankey'
import { Section } from '@/components/ui/Section'
import { WhoGetsIn } from '@/components/chapter-02/WhoGetsIn'
import { Footer } from '@/components/Footer'

import ch01 from '@/data/chapter-01.json'
import ch01Cat from '@/data/chapter-01-categories.json'
import ch01Var from '@/data/chapter-01-variants.json'
import ch02 from '@/data/chapter-02.json'

import type {
  Chapter01Data,
  Chapter01CategoryData,
  Chapter01VariantData,
} from '@/types/chapter-01'
import type { Chapter02Data } from '@/types/chapter-02'

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
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <CumulativeChart data={ch01 as Chapter01Data} />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-2 pb-8 border-t border-[color:var(--line)]/40">
          <div className="pt-8">
            <CategoryTreemap data={ch01Cat as Chapter01CategoryData} />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-2 pb-16 border-t border-[color:var(--line)]/40">
          <div className="pt-8">
            <VariantSankey data={ch01Var as Chapter01VariantData} />
          </div>
        </div>
      </Section>
      <WhoGetsIn data={ch02 as Chapter02Data} />
      <Footer />
    </>
  )
}
