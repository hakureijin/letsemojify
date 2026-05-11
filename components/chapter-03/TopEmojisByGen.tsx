'use client'
import { useTranslations } from 'next-intl'
import type { GenerationEmojis } from '@/types/chapter-03'

export function TopEmojisByGen({ data }: { data: GenerationEmojis[] }) {
  const t = useTranslations()
  return (
    <div className="bg-white rounded-2xl p-5 shadow grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map(g => (
        <div key={g.id} className="text-center">
          <div className="text-[11px] font-extrabold text-[color:var(--accent-03)]">{t(g.labelKey as never)}</div>
          <div className="text-2xl tracking-widest mt-2">{g.emojis.join('')}</div>
          <div className="text-[10px] text-[color:var(--muted)] mt-2">{t(g.descKey as never)}</div>
        </div>
      ))}
    </div>
  )
}
