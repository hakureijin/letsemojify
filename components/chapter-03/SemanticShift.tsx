'use client'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { SemanticShiftEntry } from '@/types/chapter-03'

export function SemanticShift({ entries }: { entries: SemanticShiftEntry[] }) {
  const t = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="text-[10px] font-extrabold text-[color:var(--muted)] uppercase tracking-wide">{t('ch03.semantic.heading')}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        {entries.map(e => (
          <div key={e.emoji} className="text-center">
            <div className="text-5xl">{e.emoji}</div>
            <div className="text-[10px] font-extrabold mt-3 text-[color:var(--muted)]">{t('ch03.semantic.older')}</div>
            <div className="text-xs font-bold">{t(e.olderMeaningKey as never)}</div>
            <div className="text-[10px] font-extrabold mt-2 text-[color:var(--muted)]">{t('ch03.semantic.genZ')}</div>
            <div className="text-xs font-bold text-[color:var(--signal-reject)]">{t(e.genZMeaningKey as never)}</div>
            <div className="mt-2"><Citation source={e.source} locale={locale} /></div>
          </div>
        ))}
      </div>
      <p className="text-[10px] italic text-[color:var(--muted)] mt-3">{t('ch03.semantic.disclosure')}</p>
    </div>
  )
}
