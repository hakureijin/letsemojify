'use client'
import { useTranslations } from 'next-intl'
import type { Criterion } from '@/types/chapter-02'

const TONE: Record<Criterion['tone'], { border: string; color: string }> = {
  mint: { border: 'border-l-[color:var(--accent-02)]', color: 'var(--accent-02)' },
  cultural: { border: 'border-l-[color:var(--signal-cultural)]', color: 'var(--signal-cultural)' },
  reject: { border: 'border-l-[color:var(--signal-reject)]', color: 'var(--signal-reject)' },
}

export function CriteriaCards({ criteria }: { criteria: Criterion[] }) {
  const t = useTranslations()
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
      {criteria.map(c => (
        <div key={c.id} className={`bg-white rounded-xl p-3 shadow-sm border-l-4 ${TONE[c.tone].border}`}>
          <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: TONE[c.tone].color }}>
            {t(c.titleKey as never)}
          </div>
          <div className="text-xs text-[color:var(--muted)] mt-1 leading-snug">{t(c.descKey as never)}</div>
        </div>
      ))}
    </div>
  )
}
