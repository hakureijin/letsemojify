'use client'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { scaleLinear } from 'd3-scale'
import { line, area, curveCatmullRom } from 'd3-shape'
import { Citation } from '@/components/ui/Citation'
import type { DayInLifeCurve, DayInLifeCurveId } from '@/types/chapter-03'

const W = 820
const H = 280
const PAD = { l: 36, r: 16, t: 36, b: 44 }

const CURVE_STYLE: Record<DayInLifeCurveId, { stroke: string; fill: string }> = {
  'gen-z': { stroke: 'var(--accent-03)', fill: 'rgba(255, 200, 87, 0.18)' },
  'all-adults': { stroke: 'var(--accent-04)', fill: 'rgba(138, 127, 255, 0.14)' },
}

interface Props {
  data: { methodologyKey: string; curves: DayInLifeCurve[] }
}

export function DayInLife({ data }: Props) {
  const t = useTranslations('ch03.dayInLife')
  const labelT = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeHour, setActiveHour] = useState<number | null>(null)
  const [pinnedHour, setPinnedHour] = useState<number | null>(null)

  const xScale = useMemo(() => scaleLinear().domain([0, 23]).range([PAD.l, W - PAD.r]), [])
  const yScale = useMemo(() => scaleLinear().domain([0, 1]).range([H - PAD.b, PAD.t]), [])

  const yTicks = useMemo(() => [0, 0.25, 0.5, 0.75, 1], [])

  const curves = useMemo(
    () =>
      data.curves.map(curve => {
        const pts = curve.hours.map((v, h) => ({ h, v }))
        const l = line<{ h: number; v: number }>()
          .x(d => xScale(d.h))
          .y(d => yScale(d.v))
          .curve(curveCatmullRom.alpha(0.5))
        const a = area<{ h: number; v: number }>()
          .x(d => xScale(d.h))
          .y0(yScale(0))
          .y1(d => yScale(d.v))
          .curve(curveCatmullRom.alpha(0.5))
        return { curve, pathLine: l(pts) || '', pathArea: a(pts) || '' }
      }),
    [data.curves, xScale, yScale]
  )

  const visibleHour = pinnedHour ?? activeHour

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

  // Spikes from any curve, used for inline labels
  const allSpikes = useMemo(
    () =>
      data.curves.flatMap(curve =>
        curve.spikes.map(s => ({ ...s, curveId: curve.id, intensity: curve.hours[s.hour] }))
      ),
    [data.curves]
  )

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow" ref={containerRef}>
      {/* Heading + sub-caption */}
      <div>
        <div className="text-[10px] font-extrabold text-[color:var(--muted)] uppercase tracking-[0.15em]">
          {t('heading')}
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-1.5 leading-relaxed max-w-2xl">
          {t('caption')}
        </p>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-3">
        {data.curves.map(curve => {
          const style = CURVE_STYLE[curve.id]
          return (
            <div key={curve.id} className="flex items-start gap-2 max-w-xs">
              <span
                className="inline-block w-3 h-3 rounded-sm shrink-0 mt-0.5"
                style={{ backgroundColor: style.stroke }}
                aria-hidden="true"
              />
              <div>
                <div className="text-xs font-extrabold text-[color:var(--ink)]">
                  {labelT(curve.labelKey as never)}
                </div>
                <div className="text-[11px] text-[color:var(--muted)] leading-snug mt-0.5">
                  {labelT(curve.descKey as never)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="relative mt-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          role="img"
          aria-label={t('ariaLabel')}
        >
          {/* y-axis grid + labels */}
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
                x={PAD.l - 6}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="central"
                fontSize="10"
                fill="var(--muted)"
                className="tabular"
              >
                {Math.round(tick * 100)}%
              </text>
            </g>
          ))}

          {/* areas (drawn behind lines) */}
          {curves.map(({ curve, pathArea }) => (
            <path key={`${curve.id}-area`} d={pathArea} fill={CURVE_STYLE[curve.id].fill} />
          ))}

          {/* active-hour vertical guide */}
          {visibleHour !== null && (
            <line
              x1={xScale(visibleHour)}
              x2={xScale(visibleHour)}
              y1={PAD.t - 6}
              y2={H - PAD.b}
              stroke="var(--ink)"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
              pointerEvents="none"
            />
          )}

          {/* lines */}
          {curves.map(({ curve, pathLine }) => (
            <path
              key={`${curve.id}-line`}
              d={pathLine}
              fill="none"
              stroke={CURVE_STYLE[curve.id].stroke}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* hover-target columns (transparent, one per hour, full chart height) */}
          {Array.from({ length: 24 }, (_, h) => {
            const cellW = (W - PAD.l - PAD.r) / 23
            const x = xScale(h) - cellW / 2
            const isActive = h === visibleHour
            return (
              <g
                key={h}
                role="button"
                tabIndex={0}
                aria-label={t('cellAria', {
                  hour: String(h).padStart(2, '0'),
                  genZ: Math.round((data.curves.find(c => c.id === 'gen-z')?.hours[h] ?? 0) * 100),
                  adults: Math.round((data.curves.find(c => c.id === 'all-adults')?.hours[h] ?? 0) * 100),
                })}
                aria-expanded={isActive}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={() => setActiveHour(h)}
                onMouseLeave={() => setActiveHour(null)}
                onFocus={() => setActiveHour(h)}
                onBlur={() => setActiveHour(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setPinnedHour(prev => (prev === h ? null : h))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setPinnedHour(prev => (prev === h ? null : h))
                  }
                }}
              >
                <rect x={x} y={PAD.t - 6} width={cellW} height={H - PAD.b - PAD.t + 6} fill="transparent" />
              </g>
            )
          })}

          {/* spike dots on each curve */}
          {curves.flatMap(({ curve }) =>
            curve.spikes.map(s => {
              const cx = xScale(s.hour)
              const cy = yScale(curve.hours[s.hour])
              const isActive = s.hour === visibleHour
              return (
                <circle
                  key={`${curve.id}-spike-${s.hour}`}
                  cx={cx}
                  cy={cy}
                  r={isActive ? 6 : 4}
                  fill="white"
                  stroke={CURVE_STYLE[curve.id].stroke}
                  strokeWidth={isActive ? 3 : 2}
                  style={{ transition: 'r 160ms ease, stroke-width 160ms ease' }}
                  pointerEvents="none"
                />
              )
            })
          )}

          {/* x-axis ticks */}
          {[0, 4, 8, 12, 16, 20, 23].map(h => (
            <g key={h}>
              <line x1={xScale(h)} x2={xScale(h)} y1={H - PAD.b} y2={H - PAD.b + 4} stroke="var(--muted)" strokeWidth={1} opacity={0.5} />
              <text
                x={xScale(h)}
                y={H - PAD.b + 18}
                fontSize="10"
                fill="var(--muted)"
                textAnchor="middle"
                className="tabular"
              >
                {String(h === 23 ? 24 : h).padStart(2, '0')}:00
              </text>
            </g>
          ))}
        </svg>

        {/* Inline spike labels above the chart, positioned by hour */}
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: PAD.t }}>
          {allSpikes.map((s, i) => {
            const leftPct = (xScale(s.hour) / W) * 100
            const flipX = leftPct > 75
            return (
              <div
                key={`${s.curveId}-${s.hour}-${i}`}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{
                  left: `${leftPct}%`,
                  top: 0,
                  transform: flipX ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                <div
                  className="text-[9px] font-extrabold whitespace-nowrap tabular px-1.5 py-0.5 rounded"
                  style={{ color: CURVE_STYLE[s.curveId].stroke, backgroundColor: 'white' }}
                >
                  {labelT(s.labelKey as never)} · {String(s.hour).padStart(2, '0')}:00
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Methodology disclosure */}
      <p className="mt-4 text-[10px] italic text-[color:var(--muted)] leading-relaxed">
        {t('methodology')}
      </p>

      {/* Hover/focus detail card */}
      {visibleHour !== null && (
        <div
          className="mt-4 bg-[color:var(--bg)] rounded-xl p-4 border border-[color:var(--line)]"
          role={pinnedHour !== null ? 'dialog' : 'status'}
          aria-live="polite"
        >
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div className="text-base font-black tabular text-[color:var(--ink)]">
              {String(visibleHour).padStart(2, '0')}:00
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.curves.map(curve => {
              const intensity = curve.hours[visibleHour]
              const spike = curve.spikes.find(s => s.hour === visibleHour)
              const style = CURVE_STYLE[curve.id]
              return (
                <div key={curve.id} className="flex items-start gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0 mt-1" style={{ backgroundColor: style.stroke }} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: style.stroke }}>
                      {labelT(curve.labelKey as never)}
                    </div>
                    <div className="text-base font-black tabular mt-0.5" style={{ color: style.stroke }}>
                      {Math.round(intensity * 100)}%
                    </div>
                    {spike && (
                      <div className="text-[11px] font-bold text-[color:var(--ink)] mt-1">
                        {labelT(spike.labelKey as never)}
                      </div>
                    )}
                    <div className="mt-1.5">
                      <Citation source={curve.source} locale={locale} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
