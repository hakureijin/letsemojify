'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { GenerationBar } from '@/types/chapter-03'

export function ScreenTimeBars({ bars }: { bars: GenerationBar[] }) {
  const t = useTranslations()
  const max = Math.max(...bars.map(b => b.minutes), 1)
  return (
    <div className="bg-white rounded-2xl p-5 shadow space-y-3">
      {bars.map(b => (
        <div key={b.id} className="grid grid-cols-[120px_1fr_60px] items-center gap-3">
          <div className="text-xs font-extrabold">{t(b.labelKey as never)}</div>
          <div className="h-3 bg-yellow-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(b.minutes / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[color:var(--accent-03)] to-amber-500 rounded-full"
            />
          </div>
          <div className="text-right text-xs font-black text-[color:var(--accent-03)]">{b.display}</div>
        </div>
      ))}
    </div>
  )
}
