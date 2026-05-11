'use client'
import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <header className="relative h-[88vh] grid place-items-center bg-gradient-to-br from-pink-100 via-rose-50 to-violet-100 overflow-hidden">
      <div className="text-center px-6">
        <div className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{t('eyebrow')}</div>
        <h1 className="mt-3 text-5xl md:text-7xl font-black leading-[0.95]">{t('title')}</h1>
        <p className="mt-3 text-sm md:text-lg font-bold text-neutral-700">{t('subtitle')}</p>
        <div className="mt-6 text-3xl md:text-5xl tracking-widest">📟 😀 ❤️ 🥺 🫶 🤖</div>
        <div className="mt-8 text-xs text-[color:var(--muted)]">↓ {t('scrollCue')}</div>
      </div>
    </header>
  )
}
