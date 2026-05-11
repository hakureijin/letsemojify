'use client'
import { useTranslations } from 'next-intl'
import type { DayInLifeSpike } from '@/types/chapter-03'

export function DayInLife({ spikes }: { spikes: DayInLifeSpike[] }) {
  const t = useTranslations()
  const cells = Array.from({ length: 24 }, (_, h) => {
    const spike = spikes.find(s => s.hour === h)
    return { hour: h, intensity: spike?.intensity ?? 0.15, labelKey: spike?.labelKey }
  })
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="text-[10px] font-extrabold text-[color:var(--muted)] uppercase tracking-wide">{t('ch03.dayInLife.heading')}</div>
      <div className="mt-3 flex gap-0.5">
        {cells.map(c => (
          <div
            key={c.hour}
            className="flex-1 h-12 rounded-sm"
            style={{ backgroundColor: `rgba(255, 200, 87, ${0.15 + 0.85 * c.intensity})` }}
            title={c.labelKey ? t(c.labelKey as never) : `${c.hour}:00`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[color:var(--muted)] font-bold">
        <span>00</span><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span><span>24</span>
      </div>
    </div>
  )
}
