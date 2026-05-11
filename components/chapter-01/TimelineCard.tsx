'use client'
import type { TimelineNode } from '@/types/chapter-01'
import { useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'

interface Props {
  node: TimelineNode
  active: boolean
  locale: 'zh' | 'en'
}

export function TimelineCard({ node, active, locale }: Props) {
  const t = useTranslations()
  const scale = active ? 'scale-110' : 'scale-100'
  const opacity = active ? 'opacity-100' : 'opacity-60'
  const ring = active ? 'ring-2 ring-[color:var(--accent-01)]' : ''
  return (
    <article
      className={`flex-none w-44 bg-white rounded-2xl shadow-md p-3 transition-all duration-200 ${scale} ${opacity} ${ring}`}
    >
      <div className="text-[10px] font-black tracking-wider text-[color:var(--accent-01)]">
        {node.year} · {node.versionLabel}
      </div>
      <div className="text-sm font-extrabold mt-1">
        {node.newEmojiCount !== null ? `+${node.newEmojiCount}` : '—'}
      </div>
      <p className="text-[11px] text-[color:var(--muted)] mt-2 leading-snug">
        {t(node.narrativeKey as never)}
      </p>
      <div className="text-xl mt-2 tracking-widest">
        {node.highlightEmojis.join(' ')}
      </div>
      <div className="mt-3">
        <Citation source={node.source} locale={locale} />
      </div>
    </article>
  )
}
