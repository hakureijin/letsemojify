'use client'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { DayInLifeSpike } from '@/types/chapter-03'
import type { Source } from '@/types/source'

interface Cell {
  hour: number
  intensity: number
  spike: DayInLifeSpike | null
}

export function DayInLife({ spikes }: { spikes: DayInLifeSpike[] }) {
  const t = useTranslations('ch03.dayInLife')
  const labelT = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeHour, setActiveHour] = useState<number | null>(null)
  const [pinnedHour, setPinnedHour] = useState<number | null>(null)

  const cells: Cell[] = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => {
        const spike = spikes.find(s => s.hour === h) ?? null
        return { hour: h, intensity: spike?.intensity ?? 0.12, spike }
      }),
    [spikes]
  )

  const visibleHour = pinnedHour ?? activeHour
  const activeCell = visibleHour !== null ? cells[visibleHour] : null

  const closeAll = useCallback(() => {
    setActiveHour(null)
    setPinnedHour(null)
  }, [])

  useEffect(() => {
    if (pinnedHour === null) return
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) closeAll()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinnedHour, closeAll])

  // Deduplicated list of sources actually used by labeled spikes
  const uniqueSources: Source[] = useMemo(() => {
    const map = new Map<string, Source>()
    spikes.forEach(s => map.set(s.source.id, s.source))
    return Array.from(map.values())
  }, [spikes])

  return (
    <div className="bg-white rounded-2xl p-5 shadow" ref={containerRef}>
      {/* Heading + sub-caption */}
      <div>
        <div className="text-[10px] font-extrabold text-[color:var(--muted)] uppercase tracking-[0.15em]">
          {t('heading')}
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed max-w-2xl">
          {t('caption')}
        </p>
      </div>

      {/* Labeled spike callouts above the row */}
      <div className="relative mt-6 h-8">
        {spikes.map(s => {
          const left = ((s.hour + 0.5) / 24) * 100
          return (
            <div
              key={s.hour}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${left}%`, bottom: 0 }}
            >
              <div className="text-[10px] font-extrabold text-[color:var(--ink)] whitespace-nowrap tabular">
                {labelT(s.labelKey as never)}
              </div>
              <div className="text-[9px] text-[color:var(--muted)] tabular">
                {String(s.hour).padStart(2, '0')}:00
              </div>
              <div className="w-px h-2 bg-[color:var(--accent-03)]" />
            </div>
          )
        })}
      </div>

      {/* 24-hour heat strip — each cell focusable */}
      <div className="flex gap-[2px]">
        {cells.map(c => {
          const isActive = c.hour === visibleHour
          const isLabeled = c.spike !== null
          return (
            <button
              key={c.hour}
              type="button"
              aria-label={
                isLabeled
                  ? t('cellAriaLabeled', {
                      hour: String(c.hour).padStart(2, '0'),
                      label: labelT(c.spike!.labelKey as never),
                      intensity: Math.round(c.intensity * 100),
                    })
                  : t('cellAria', {
                      hour: String(c.hour).padStart(2, '0'),
                      intensity: Math.round(c.intensity * 100),
                    })
              }
              aria-expanded={isActive}
              className={`flex-1 h-12 rounded-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-03)]/60 ${
                isActive ? 'ring-2 ring-[color:var(--accent-03)] scale-y-110' : ''
              }`}
              style={{ backgroundColor: `rgba(255, 200, 87, ${0.12 + 0.88 * c.intensity})` }}
              onMouseEnter={() => setActiveHour(c.hour)}
              onMouseLeave={() => setActiveHour(null)}
              onFocus={() => setActiveHour(c.hour)}
              onBlur={() => setActiveHour(null)}
              onClick={(e) => {
                if (!isLabeled) return
                e.stopPropagation()
                setPinnedHour(prev => (prev === c.hour ? null : c.hour))
              }}
              onKeyDown={(e) => {
                if (!isLabeled) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setPinnedHour(prev => (prev === c.hour ? null : c.hour))
                }
              }}
            />
          )
        })}
      </div>

      {/* Hour-axis ticks every 4 hours */}
      <div className="mt-2 grid grid-cols-6 text-[10px] text-[color:var(--muted)] font-bold tabular">
        <span>00:00</span>
        <span className="text-center">04:00</span>
        <span className="text-center">08:00</span>
        <span className="text-center">12:00</span>
        <span className="text-center">16:00</span>
        <span className="text-right">24:00</span>
      </div>

      {/* Color scale legend + citations */}
      <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-[color:var(--line)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--muted)]">
            {t('legendLow')}
          </span>
          <div
            className="h-2 w-32 rounded-full"
            style={{
              background:
                'linear-gradient(to right, rgba(255,200,87,0.12), rgba(255,200,87,1))',
            }}
            aria-hidden="true"
          />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--muted)]">
            {t('legendHigh')}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px]">
          <span className="font-extrabold uppercase tracking-wider text-[color:var(--muted)]">
            {t('sources')}
          </span>
          {uniqueSources.map(s => (
            <Citation key={s.id} source={s} locale={locale} />
          ))}
        </div>
      </div>

      {/* Detail card — shown when a labeled spike is hovered/focused/pinned */}
      {activeCell?.spike && (
        <div
          className="mt-4 bg-[color:var(--bg)] rounded-xl p-3 border border-[color:var(--line)] grid grid-cols-[auto_1fr_auto] items-center gap-3"
          role={pinnedHour !== null ? 'dialog' : 'status'}
          aria-live="polite"
        >
          <div className="flex flex-col items-center px-2">
            <div className="text-base font-black tabular text-[color:var(--accent-03)]">
              {String(activeCell.hour).padStart(2, '0')}:00
            </div>
            <div className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--muted)] mt-0.5">
              {t('intensity')} {Math.round(activeCell.intensity * 100)}%
            </div>
          </div>
          <div className="text-xs">
            <div className="font-bold text-[color:var(--ink)]">
              {labelT(activeCell.spike.labelKey as never)}
            </div>
            <div className="mt-1">
              <Citation source={activeCell.spike.source} locale={locale} />
            </div>
          </div>
          {pinnedHour !== null && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeAll() }}
              className="text-[color:var(--muted)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-03)]/50 rounded w-6 h-6 grid place-items-center text-sm"
              aria-label={t('close')}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
