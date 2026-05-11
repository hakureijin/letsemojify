'use client'
import { useTranslations } from 'next-intl'
import type { Chapter04Category } from '@/types/chapter-04'
import { CATEGORIES } from '@/types/chapter-04'

interface Props {
  selected: Chapter04Category | null
  onSelect: (c: Chapter04Category | null) => void
}

export function CategoryChips({ selected, onSelect }: Props) {
  const t = useTranslations('ch04.categories')
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={selected === null} onClick={() => onSelect(null)}>{t('all')}</Chip>
      {CATEGORIES.map(c => (
        <Chip key={c} active={selected === c} onClick={() => onSelect(c)}>{t(c as never)}</Chip>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-bold px-3 py-1.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-04)]/50 ${
        active ? 'bg-[color:var(--accent-04)] text-white' : 'bg-white/60 text-[color:var(--muted)] hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}
