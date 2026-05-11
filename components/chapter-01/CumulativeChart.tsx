'use client'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { scaleLinear } from 'd3-scale'
import { line, area, curveMonotoneX } from 'd3-shape'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { Chapter01Data, TimelineNode } from '@/types/chapter-01'

const W = 860
const H = 300
const PAD = { l: 64, r: 24, t: 28, b: 44 }
const HIT_RADIUS = 22 // 44px touch target diameter

interface ChartPoint extends TimelineNode {
  runningTotal: number
  previousTotal: number
  growthPct: number
  flagship: boolean
  cx: number
  cy: number
}

interface Props {
  data: Chapter01Data
}

export function CumulativeChart({ data }: Props) {
  const t = useTranslations('ch01.chart')
  const narrativeT = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const decadeSet = useMemo(() => new Set(data.decadeIndex), [data.decadeIndex])

  const {
    points,
    pathLine,
    pathArea,
    yTicks,
    xScale,
    yScale,
    finalTotal,
    firstYear,
    lastYear,
  } = useMemo(() => {
    const contributing = data.timeline.filter(
      (n): n is TimelineNode & { newEmojiCount: number } => n.newEmojiCount !== null
    )
    let running = 0
    const enriched = contributing.map(n => {
      const previousTotal = running
      running += n.newEmojiCount
      const growthPct = previousTotal === 0 ? 0 : (n.newEmojiCount / previousTotal) * 100
      return { node: n, runningTotal: running, previousTotal, growthPct }
    })
    const xs = enriched.map(d => d.node.year)
    const ys = enriched.map(d => d.runningTotal)
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    const xScale = scaleLinear()
      .domain([xMin, xMax === xMin ? xMin + 1 : xMax])
      .range([PAD.l, W - PAD.r])
    const yScale = scaleLinear()
      .domain([0, Math.max(...ys, 1) * 1.06])
      .nice()
      .range([H - PAD.b, PAD.t])
    const seriesPts = enriched.map(d => ({ year: d.node.year, total: d.runningTotal }))
    const l = line<{ year: number; total: number }>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.total))
      .curve(curveMonotoneX)
    const a = area<{ year: number; total: number }>()
      .x(d => xScale(d.year))
      .y0(yScale(0))
      .y1(d => yScale(d.total))
      .curve(curveMonotoneX)
    const points: ChartPoint[] = enriched.map(d => ({
      ...d.node,
      runningTotal: d.runningTotal,
      previousTotal: d.previousTotal,
      growthPct: d.growthPct,
      flagship: decadeSet.has(d.node.year),
      cx: xScale(d.node.year),
      cy: yScale(d.runningTotal),
    }))
    return {
      points,
      pathLine: l(seriesPts) || '',
      pathArea: a(seriesPts) || '',
      yTicks: yScale.ticks(4),
      xScale,
      yScale,
      finalTotal: enriched[enriched.length - 1]?.runningTotal ?? 0,
      firstYear: xMin,
      lastYear: xMax,
    }
  }, [data.timeline, decadeSet])

  const visibleId = pinnedId ?? activeId
  const activePoint = points.find(p => p.id === visibleId) ?? null

  const closeAll = useCallback(() => {
    setActiveId(null)
    setPinnedId(null)
  }, [])

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

  const tooltipPlacement = useMemo(() => {
    if (!activePoint) return { left: 0, top: 0, flipX: false, flipY: false }
    return {
      left: (activePoint.cx / W) * 100,
      top: (activePoint.cy / H) * 100,
      flipX: activePoint.cx > W * 0.6,
      flipY: activePoint.cy < H * 0.35,
    }
  }, [activePoint])

  // X-axis labels at decade markers + first + last (deduplicated)
  const xLabels = useMemo(() => {
    const set = new Set<number>(data.decadeIndex)
    set.add(firstYear)
    set.add(lastYear)
    return Array.from(set).sort((a, b) => a - b)
  }, [data.decadeIndex, firstYear, lastYear])

  return (
    <div className="relative" ref={containerRef}>
      {/* Title row + headline total */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[color:var(--muted)]">
            {t('eyebrow')}
          </div>
          <div className="text-base md:text-lg font-extrabold mt-1 text-[color:var(--ink)]">
            {t('title')}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl md:text-4xl font-black tabular text-[color:var(--accent-01)] leading-none">
            {finalTotal.toLocaleString(locale)}
          </div>
          <div className="text-[11px] text-[color:var(--muted)] font-bold uppercase tracking-wider">
            {t('totalBy', { year: lastYear })}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-[color:var(--muted)] mb-2 hidden md:block">
        {t('hint')}
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
          <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.18)" />
          </filter>
        </defs>

        {/* Y-axis title (rotated) */}
        <text
          x={16}
          y={(PAD.t + (H - PAD.b)) / 2}
          fontSize="10"
          fill="var(--muted)"
          textAnchor="middle"
          fontWeight="800"
          letterSpacing="0.1em"
          transform={`rotate(-90 16 ${(PAD.t + (H - PAD.b)) / 2})`}
        >
          {t('yAxis')}
        </text>

        {/* Y-axis gridlines + labels */}
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
              x={PAD.l - 10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="11"
              fill="var(--muted)"
              className="tabular"
            >
              {tick.toLocaleString(locale)}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={pathArea} fill="url(#gradGrowth)" opacity={0.16} />
        <path
          d={pathLine}
          fill="none"
          stroke="url(#gradGrowth)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels (decade markers + first/last) */}
        {xLabels.map(year => (
          <g key={year}>
            <line
              x1={xScale(year)}
              x2={xScale(year)}
              y1={H - PAD.b}
              y2={H - PAD.b + 5}
              stroke="var(--muted)"
              opacity={0.4}
            />
            <text
              x={xScale(year)}
              y={H - PAD.b + 20}
              fontSize="11"
              fill="var(--muted)"
              textAnchor="middle"
              className="tabular"
              fontWeight="700"
            >
              {year}
            </text>
          </g>
        ))}

        {/* Interactive emoji medallions */}
        {points.map(p => {
          const isActive = p.id === visibleId
          const baseR = p.flagship ? 18 : 13
          const r = isActive ? baseR + 4 : baseR
          const fontSize = p.flagship ? (isActive ? 18 : 14) : isActive ? 14 : 11
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
              className="cursor-pointer focus:outline-none"
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
              {/* Invisible hit area */}
              <circle cx={p.cx} cy={p.cy} r={HIT_RADIUS} fill="transparent" />
              {/* Medallion background */}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={r}
                fill="white"
                stroke="var(--accent-01)"
                strokeWidth={isActive ? 3 : p.flagship ? 2.5 : 2}
                filter={isActive ? 'url(#markerShadow)' : undefined}
                style={{ transition: 'r 160ms ease, stroke-width 160ms ease' }}
              />
              {/* Highlight emoji */}
              <text
                x={p.cx}
                y={p.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                pointerEvents="none"
                style={{ transition: 'font-size 160ms ease' }}
              >
                {p.highlightEmojis[0] ?? '·'}
              </text>
              {/* Year label below the flagship markers */}
              {p.flagship && !isActive && (
                <text
                  x={p.cx}
                  y={p.cy + baseR + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fill="var(--accent-01)"
                  className="tabular"
                  pointerEvents="none"
                >
                  {p.year}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* HTML tooltip overlay */}
      {activePoint && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className={`pointer-events-auto absolute z-10 w-72 rounded-xl bg-white shadow-lg ring-1 ring-[color:var(--line)] p-3.5 ${pinnedId ? 'shadow-xl' : ''}`}
            style={{
              left: `${tooltipPlacement.left}%`,
              top: `${tooltipPlacement.top}%`,
              transform: `translate(${tooltipPlacement.flipX ? 'calc(-100% - 18px)' : '18px'}, ${tooltipPlacement.flipY ? '18px' : 'calc(-100% - 18px)'})`,
            }}
            role={pinnedId ? 'dialog' : 'tooltip'}
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{activePoint.highlightEmojis[0]}</span>
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-[color:var(--accent-01)] uppercase">
                    {activePoint.year} · {activePoint.versionLabel}
                  </div>
                  {activePoint.flagship && (
                    <div className="text-[9px] font-bold text-[color:var(--muted)] uppercase tracking-wider mt-0.5">
                      {t('milestone')}
                    </div>
                  )}
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
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">{t('added')}</div>
                <div className="text-base font-black tabular text-[color:var(--accent-01)] leading-tight">+{(activePoint.newEmojiCount ?? 0).toLocaleString(locale)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">{t('total')}</div>
                <div className="text-base font-black tabular leading-tight">{activePoint.runningTotal.toLocaleString(locale)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">{t('growth')}</div>
                <div className="text-base font-black tabular text-[color:var(--accent-04)] leading-tight">
                  {activePoint.previousTotal === 0
                    ? '—'
                    : `+${Math.round(activePoint.growthPct)}%`}
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] leading-relaxed text-[color:var(--muted)]">
              {narrativeT(activePoint.narrativeKey as never)}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {activePoint.highlightEmojis.slice(0, 5).map((e, i) => (
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
