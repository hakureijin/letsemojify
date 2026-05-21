'use client'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

const CHAPTERS = ['ch01', 'ch02'] as const

export function TopNav() {
  const t = useTranslations('nav')
  const locale = useLocale() as 'zh' | 'en'
  const router = useRouter()
  const pathname = usePathname()

  const otherLocale: 'zh' | 'en' = locale === 'zh' ? 'en' : 'zh'
  const switchLabel = locale === 'zh' ? 'EN' : '中'

  return (
    <nav className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-2 shadow-md border border-[color:var(--line)]">
      {CHAPTERS.map(ch => (
        <a
          key={ch}
          href={`#${ch}`}
          className="text-xs font-bold text-[color:var(--muted)] hover:text-[color:var(--ink)] px-2 py-1 rounded-full hover:bg-[color:var(--line)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ink)]/30"
        >
          {t(ch)}
        </a>
      ))}
      <button
        onClick={() => router.replace(pathname, { locale: otherLocale })}
        className="ml-1 text-xs font-bold bg-[color:var(--ink)] text-white px-3 py-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ink)]/40"
        aria-label={t('switchLangAria')}
      >
        {switchLabel}
      </button>
    </nav>
  )
}
