'use client'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { scaleLinear } from 'd3-scale'
import { line, area, curveMonotoneX } from 'd3-shape'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { Chapter01Data, TimelineNode } from '@/types/chapter-01'

const W = 820
const H = 260
const PAD = { l: 44, r: 20, t: 24, b: 36 }
const HIT_RADIUS = 22 // 44px touch target diameter

interface ChartPoint extends TimelineNode {
  runningTotal: number
  cx: number
  cy: number
}

export function CumulativeChart({ timeline }: { timeline: Chapter01Data['timeline'] }) {
  const t = useTranslations('ch01.chart')
  const narrativeT = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const { points, pathLine, pathArea, xTicks, yTicks, xScale, yScale } = useMemo(() => {
    const contributing = timeline.filter(n => n.newEmojiCount !== null) as (TimelineNode & { newEmojiCount: number })[]
    let running = 0
    const cumulative = contributing.map(n => {
      running += n.newEmojiCount
      return { node: n, runningTotal: running }
    })
    const xs = cumulative.map(d => d.node.year)
    const ys = cumulative.map(d => d.runningTotal)
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    const xScale = scaleLinear().domain([xMin, xMax === xMin ? xMin + 1 : xMax]).range([PAD.l, W - PAD.r])
    const yScale = scaleLinear().domain([0, Math.max(...ys, 1) * 1.06]).nice().range([H - PAD.b, PAD.t])
    const seriesPts = cumulative.map(d => ({ year: d.node.year, total: d.runningTotal }))
    const l = line<{ year: number; total: number }>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.total))
      .curve(curveMonotoneX)
    const a = area<{ year: number; total: number }>()
      .x(d => xScale(d.year))
      .y0(yScale(0))
      .y1(d => yScale(d.total))
      .curve(curveMonotoneX)
    const points: ChartPoint[] = cumulative.map(d => ({
      ...d.node,
      runningTotal: d.runningTotal,
      cx: xScale(d.node.year),
      cy: yScale(d.runningTotal),
    }))
    return {
      points,
      pathLine: l(seriesPts) || '',
      pathArea: a(seriesPts) || '',
      xTicks: xScale.ticks(6),
      yTicks: yScale.ticks(4),
      xScale,
      yScale,
    }
  }, [timeline])

  const visibleId = pinnedId ?? activeId
  const activePoint = points.find(p => p.id === visibleId) ?? null

  const closeAll = useCallback(() => {
    setActiveId(null)
    setPinnedId(null)
  }, [])

  // Outside-click and Escape both close the pinned tooltip
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

  const onMarkerActivate = (id: string) => {
    setPinnedId(prev => (prev === id ? null : id))
  }

  // Flip tooltip horizontally if near right edge; vertically if near top
  const tooltipPlacement = useMemo(() => {
    if (!activePoint) return { left: 0, top: 0, flipX: false, flipY: false }
    const flipX = activePoint.cx > W * 0.6
    const flipY = activePoint.cy < H * 0.35
    return {
      left: (activePoint.cx / W) * 100,
      top: (activePoint.cy / H) * 100,
      flipX,
      flipY,
    }
  }, [activePoint])

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--muted)]">{t('eyebrow')}</div>
          <div className="text-sm font-bold mt-0.5">{t('title')}</div>
        </div>
        <div className="text-[11px] text-[color:var(--muted)] hidden md:block">{t('hint')}</div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        role="img"
        aria-label={t('ariaLabel', { count: points.length })}
      >
        <defs>
          <linearGradient id="gradGrowth" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--accent-01)" />
            <stop offset="100%" stopColor="var(--accent-04)" />
          </linearGradient>
        </defs>

        {/* y-axis gridlines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="var(--line)"
              strokeDasharray="2 4"
            />
            <text
              x={PAD.l - 8}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="10"
              fill="var(--muted)"
              className="tabular"
            >
              {tick.toLocaleString(locale)}
            </text>
          </g>
        ))}

        {/* area + line */}
        <path d={pathArea} fill="url(#gradGrowth)" opacity={0.18} />
        <path d={pathLine} fill="none" stroke="url(#gradGrowth)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

        {/* x-axis labels */}
        {xTicks.map(tick => (
          <text
            key={tick}
            x={xScale(tick)}
            y={H - 10}
            fontSize="10"
            fill="var(--muted)"
            textAnchor="middle"
            className="tabular"
          >
            {tick}
          </text>
        ))}

        {/* interactive markers */}
        {points.map(p => {
          const isActive = p.id === visibleId
          return (
            <g
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={t('markerAria', {
                year: p.year,
                version: p.versionLabel,
                added: p.newEmojiCount ?? 0,
                total: p.runningTotal,
              })}
              aria-expanded={isActive}
              className="cursor-pointer focus:outline-none [&>circle.dot]:focus-visible:ring focus-visible:[&>circle.dot]:stroke-[3]"
              onMouseEnter={() => setActiveId(p.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(p.id)}
              onBlur={() => setActiveId(null)}
              onClick={(e) => {
                e.stopPropagation()
                onMarkerActivate(p.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onMarkerActivate(p.id)
                }
              }}
            >
              {/* invisible hit area (44px touch target) */}
              <circle cx={p.cx} cy={p.cy} r={HIT_RADIUS} fill="transparent" />
              {/* visible dot */}
              <circle
                className="dot"
                cx={p.cx}
                cy={p.cy}
                r={isActive ? 7 : 4.5}
                fill="white"
                stroke="var(--accent-01)"
                strokeWidth={isActive ? 3 : 2}
                style={{ transition: 'r 160ms ease, stroke-width 160ms ease' }}
              />
            </g>
          )
        })}
      </svg>

      {/* HTML tooltip overlay — positioned by viewBox percent so it stays anchored as the SVG scales */}
      {activePoint && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div
            className={`pointer-events-auto absolute z-10 w-64 rounded-xl bg-white shadow-lg ring-1 ring-[color:var(--line)] p-3 ${pinnedId ? '' : 'shadow-md'}`}
            style={{
              left: `${tooltipPlacement.left}%`,
              top: `${tooltipPlacement.top}%`,
              transform: `translate(${tooltipPlacement.flipX ? 'calc(-100% - 16px)' : '16px'}, ${tooltipPlacement.flipY ? '16px' : 'calc(-100% - 16px)'})`,
            }}
            role={pinnedId ? 'dialog' : 'tooltip'}
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[10px] font-extrabold tracking-wider text-[color:var(--accent-01)]">
                {activePoint.year} · {activePoint.versionLabel}
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
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">{t('added')}</div>
                <div className="text-base font-black tabular text-[color:var(--accent-01)]">+{(activePoint.newEmojiCount ?? 0).toLocaleString(locale)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">{t('total')}</div>
                <div className="text-base font-black tabular">{activePoint.runningTotal.toLocaleString(locale)}</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] leading-snug text-[color:var(--muted)]">
              {narrativeT(activePoint.narrativeKey as never)}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1">
                {activePoint.highlightEmojis.slice(0, 4).map((e, i) => (
                  <span key={i} className="text-sm">{e}</span>
                ))}
              </div>
              <Citation source={activePoint.source} locale={locale} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
