'use client'
import { useTranslations } from 'next-intl'
import { EmojiField } from '@/components/hero/EmojiField'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <header className="relative h-[88vh] overflow-hidden bg-[var(--bg)]">
      <EmojiField
        labelEnlarge={t('enlarge', { char: '__CHAR__' })}
        labelShrink={t('shrink', { char: '__CHAR__' })}
      />
      <div className="absolute inset-0 grid place-items-center pointer-events-none z-10">
        <div className="text-center px-6 pointer-events-auto">
          <div className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{t('eyebrow')}</div>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black leading-[1.05] text-balance max-w-4xl mx-auto">{t('title')}</h1>
          <p className="mt-3 text-sm md:text-lg font-bold text-neutral-700">{t('subtitle')}</p>
          <div className="mt-8 text-xs text-[color:var(--muted)]">↓ {t('scrollCue')}</div>
        </div>
      </div>
    </header>
  )
}
