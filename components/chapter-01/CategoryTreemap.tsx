'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import type {
  CategoryFrame,
  CategoryGroupKey,
  Chapter01CategoryData,
} from '@/types/chapter-01'

const W = 880
const H = 460
const ANIM_MS = 600
const PLAY_STEP_MS = 1600
const TICK_LABEL_YEARS = new Set([2010, 2015, 2020, 2025])

interface Props {
  data: Chapter01CategoryData
}

interface TileNode {
  key: CategoryGroupKey
  count: number
  x: number
  y: number
  w: number
  h: number
}

export interface FrameLookup {
  frame: CategoryFrame
  index: number
}

/** Pure helper: pick the frame whose year is closest to (but not exceeding) the
 *  requested year. Used both by the slider and by the test suite. */
export function frameAt(frames: CategoryFrame[], year: number): FrameLookup {
  let idx = 0
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].year <= year) idx = i
  }
  return { frame: frames[idx], index: idx }
}

export function CategoryTreemap({ data }: Props) {
  const t = useTranslations('ch01.categoryTreemap')
  const locale = useLocale() as 'zh' | 'en'
  const reduced = usePrefersReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const frames = data.frames
  const [frameIdx, setFrameIdx] = useState(frames.length - 1)
  const [playing, setPlaying] = useState(false)
  const [activeId, setActiveId] = useState<CategoryGroupKey | null>(null)
  const [pinnedId, setPinnedId] = useState<CategoryGroupKey | null>(null)

  const frame = frames[frameIdx]

  // Treemap layout for current frame
  const tiles: TileNode[] = useMemo(() => {
    const root = hierarchy<{ key?: CategoryGroupKey; value?: number; children?: { key: CategoryGroupKey; value: number }[] }>(
      {
        children: data.groupOrder.map(key => ({ key, value: frame.counts[key] })),
      },
    )
      .sum(d => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    const layout = treemap<typeof root.data>()
      .size([W, H])
      .tile(treemapSquarify.ratio(1.3))
      .paddingInner(3)
      .round(true)

    layout(root)
    return (root.leaves() as Array<typeof root & { x0: number; y0: number; x1: number; y1: number; data: { key: CategoryGroupKey; value: number } }>)
      .map(leaf => ({
        key: leaf.data.key,
        count: leaf.value ?? 0,
        x: leaf.x0,
        y: leaf.y0,
        w: leaf.x1 - leaf.x0,
        h: leaf.y1 - leaf.y0,
      }))
  }, [frame, data.groupOrder])

  // Auto-play stepping
  useEffect(() => {
    if (!playing || reduced) return
    const id = window.setInterval(() => {
      setFrameIdx(prev => {
        const next = prev + 1
        if (next >= frames.length) {
          setPlaying(false)
          return prev
        }
        return next
      })
    }, PLAY_STEP_MS)
    return () => window.clearInterval(id)
  }, [playing, reduced, frames.length])

  const closeAll = useCallback(() => {
    setActiveId(null)
    setPinnedId(null)
  }, [])

  // Outside-click + Escape unpins
  useEffect(() => {
    if (!pinnedId) return
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
  }, [pinnedId, closeAll])

  const onTileActivate = (key: CategoryGroupKey) => {
    setPinnedId(prev => (prev === key ? null : key))
  }

  const visibleId = pinnedId ?? activeId
  const activeTile = tiles.find(t => t.key === visibleId) ?? null

  // Slider position 0..frames.length-1
  const onSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value)
    setFrameIdx(next)
    closeAll()
  }

  const onSliderKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault()
      setPlaying(p => !p)
    }
    // Home/End already handled by native range input
  }

  const tickFrames = useMemo(
    () => frames
      .map((f, i) => ({ ...f, idx: i }))
      .filter(f => TICK_LABEL_YEARS.has(f.year)),
    [frames],
  )

  const ariaValueText = t('sliderAriaText', {
    year: frame.year,
    version: frame.versionLabel,
    total: frame.total,
  })

  return (
    <div className="relative" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[color:var(--muted)]">
            {t('eyebrow')}
          </div>
          <div className="text-base md:text-lg font-extrabold mt-1 text-[color:var(--ink)]">
            {t('title')}
          </div>
          <div className="text-[11px] text-[color:var(--muted)] mt-1 max-w-xl">
            {t('subtitle')}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl md:text-4xl font-black tabular text-[color:var(--accent-01)] leading-none">
            {frame.total.toLocaleString(locale)}
          </div>
          <div className="text-[11px] text-[color:var(--muted)] font-bold uppercase tracking-wider">
            {t('totalBy', { version: frame.versionLabel })}
          </div>
        </div>
      </div>

      {/* Slider row */}
      <div className="flex items-center gap-3 mb-2">
        {!reduced && (
          <button
            type="button"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? t('pauseAria') : t('playAria')}
            className="shrink-0 w-9 h-9 grid place-items-center rounded-full bg-[color:var(--accent-01)] text-white text-[12px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-01)]/50"
          >
            {playing ? '❚❚' : '▶'}
          </button>
        )}
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            step={1}
            value={frameIdx}
            onChange={onSliderChange}
            onKeyDown={onSliderKey}
            aria-label={t('sliderLabel')}
            aria-valuemin={frames[0].year}
            aria-valuemax={frames[frames.length - 1].year}
            aria-valuenow={frame.year}
            aria-valuetext={ariaValueText}
            className="w-full accent-[color:var(--accent-01)]"
          />
          <div className="relative h-4 mt-0.5">
            {tickFrames.map(tf => (
              <span
                key={tf.versionId}
                className="absolute -translate-x-1/2 text-[10px] tabular font-bold text-[color:var(--muted)]"
                style={{ left: `${(tf.idx / (frames.length - 1)) * 100}%` }}
              >
                {tf.year}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Treemap */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        role="img"
        aria-label={t('ariaLabel', { year: frame.year, version: frame.versionLabel, total: frame.total })}
      >
        {tiles.map(tile => {
          const isActive = tile.key === visibleId
          const percent = (tile.count / frame.total) * 100
          const groupLabel = t(`groups.${tile.key}` as never)
          const sampleEmoji = frame.samples[tile.key]?.[0] ?? ''
          const showText = tile.w >= 90 && tile.h >= 56
          const tooSmall = tile.w < 60 || tile.h < 40

          return (
            <motion.g
              key={tile.key}
              role="button"
              tabIndex={0}
              aria-label={t('tileAria', {
                group: groupLabel,
                count: tile.count,
                percent: percent.toFixed(1),
                version: frame.versionLabel,
              })}
              aria-expanded={isActive}
              className="cursor-pointer focus:outline-none"
              onMouseEnter={() => setActiveId(tile.key)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(tile.key)}
              onBlur={() => setActiveId(null)}
              onClick={(e) => {
                e.stopPropagation()
                onTileActivate(tile.key)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onTileActivate(tile.key)
                }
              }}
            >
              <motion.rect
                animate={{ x: tile.x, y: tile.y, width: tile.w, height: tile.h }}
                transition={{ duration: reduced ? 0 : ANIM_MS / 1000, ease: 'easeInOut' }}
                fill={`var(--cat-${tile.key})`}
                opacity={isActive ? 1 : 0.86}
                stroke={isActive ? 'var(--ink)' : 'transparent'}
                strokeWidth={isActive ? 2 : 0}
                rx={10}
              />
              {!tooSmall && (
                <motion.text
                  animate={{
                    x: tile.x + (showText ? 14 : tile.w / 2),
                    y: tile.y + (showText ? 30 : tile.h / 2 + 6),
                  }}
                  transition={{ duration: reduced ? 0 : ANIM_MS / 1000, ease: 'easeInOut' }}
                  textAnchor={showText ? 'start' : 'middle'}
                  fontSize={showText ? Math.min(28, tile.h * 0.35) : Math.min(22, tile.w * 0.35)}
                  pointerEvents="none"
                  style={{ fontVariantEmoji: 'emoji' }}
                >
                  {sampleEmoji}
                </motion.text>
              )}
              {showText && (
                <>
                  <motion.text
                    animate={{ x: tile.x + 14, y: tile.y + tile.h - 30 }}
                    transition={{ duration: reduced ? 0 : ANIM_MS / 1000, ease: 'easeInOut' }}
                    fontSize="11"
                    fontWeight="800"
                    letterSpacing="0.05em"
                    fill="#1a1a1a"
                    pointerEvents="none"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {groupLabel}
                  </motion.text>
                  <motion.text
                    animate={{ x: tile.x + 14, y: tile.y + tile.h - 12 }}
                    transition={{ duration: reduced ? 0 : ANIM_MS / 1000, ease: 'easeInOut' }}
                    fontSize="14"
                    fontWeight="900"
                    className="tabular"
                    fill="#1a1a1a"
                    pointerEvents="none"
                  >
                    {tile.count.toLocaleString(locale)}
                    <tspan className="font-bold" fill="#3a3a3a" dx="6" fontSize="11">
                      {percent.toFixed(1)}%
                    </tspan>
                  </motion.text>
                </>
              )}
            </motion.g>
          )
        })}
      </svg>

      {/* Tooltip overlay */}
      {activeTile && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="pointer-events-auto absolute z-10 w-64 rounded-xl bg-white shadow-lg ring-1 ring-[color:var(--line)] p-3.5"
            style={{
              left: `${((activeTile.x + activeTile.w / 2) / W) * 100}%`,
              top: `${((activeTile.y + activeTile.h / 2) / H) * 100}%`,
              transform: `translate(${activeTile.x + activeTile.w / 2 > W * 0.6 ? 'calc(-100% - 12px)' : '12px'}, ${activeTile.y + activeTile.h / 2 < H * 0.4 ? '12px' : 'calc(-100% - 12px)'})`,
            }}
            role={pinnedId ? 'dialog' : 'tooltip'}
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div
                  className="text-[10px] font-extrabold tracking-wider uppercase"
                  style={{ color: `var(--cat-${activeTile.key})` }}
                >
                  {frame.versionLabel} · {frame.year}
                </div>
                <div className="text-sm font-extrabold mt-0.5 text-[color:var(--ink)]">
                  {t(`groups.${activeTile.key}` as never)}
                </div>
              </div>
              {pinnedId && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeAll() }}
                  className="text-[color:var(--muted)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-01)]/50 rounded -mt-1 -mr-1 w-6 h-6 grid place-items-center text-sm"
                  aria-label={t('close')}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">
                  {t('tooltipCount')}
                </div>
                <div className="text-base font-black tabular text-[color:var(--ink)] leading-tight">
                  {activeTile.count.toLocaleString(locale)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">
                  {t('tooltipPercent')}
                </div>
                <div
                  className="text-base font-black tabular leading-tight"
                  style={{ color: `var(--cat-${activeTile.key})` }}
                >
                  {((activeTile.count / frame.total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5 text-lg leading-none">
              {frame.samples[activeTile.key]?.slice(0, 6).map((e, i) => (
                <span key={i}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] text-[color:var(--muted)]">
        <span>{t('caption')}</span>
        <Citation source={data.source} locale={locale} />
      </div>

      {/* Screen-reader summary of the current frame */}
      <details className="sr-only">
        <summary>{t('a11ySummary', { version: frame.versionLabel })}</summary>
        <ul>
          {data.groupOrder.map(k => (
            <li key={k}>
              {t(`groups.${k}` as never)}: {frame.counts[k].toLocaleString(locale)} ({((frame.counts[k] / frame.total) * 100).toFixed(1)}%)
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
