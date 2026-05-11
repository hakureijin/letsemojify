'use client'
import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { FutureCase } from '@/types/chapter-04'

const GRADIENTS: Record<FutureCase['category'], string> = {
  ai: 'from-fuchsia-100 to-violet-300',
  ar3d: 'from-orange-100 to-orange-300',
  brand: 'from-pink-100 to-rose-300',
  interface: 'from-sky-100 to-sky-300',
  art: 'from-emerald-100 to-emerald-300',
}

export function CaseCard({ caseItem }: { caseItem: FutureCase }) {
  const t = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  return (
    <motion.article layout className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className={`h-24 bg-gradient-to-br ${GRADIENTS[caseItem.category]} grid place-items-center text-4xl`}>
        {caseItem.emoji}
      </div>
      <div className="p-3">
        <div className="text-[10px] font-extrabold text-[color:var(--accent-04)]">{caseItem.year} · {caseItem.origin}</div>
        <div className="text-sm font-extrabold mt-1">{t(caseItem.titleKey as never)}</div>
        <p className="text-xs text-[color:var(--muted)] mt-1 leading-snug">{t(caseItem.storyKey as never)}</p>
        <div className="mt-2"><Citation source={caseItem.source} locale={locale} /></div>
      </div>
    </motion.article>
  )
}
