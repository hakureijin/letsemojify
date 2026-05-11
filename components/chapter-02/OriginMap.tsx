'use client'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { useTranslations } from 'next-intl'
import type { OriginPin } from '@/types/chapter-02'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'

const W = 800
const H = 380
const HIT_RADIUS = 22 // 44px touch target diameter

interface PlacedPin extends OriginPin {
  cx: number
  cy: number
}

export function OriginMap({ pins }: { pins: OriginPin[] }) {
  const t = useTranslations('ch02.map')
  const labelT = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  const [features, setFeatures] = useState<FeatureCollection<Geometry> | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/world-atlas/countries-110m.json')
      .then(r => r.json())
      .then((topo: Topology) => {
        const fc = feature(topo, topo.objects.countries as GeometryCollection) as unknown as FeatureCollection<Geometry>
        setFeatures(fc)
      })
  }, [])

  const projection = useMemo(() => geoEqualEarth().scale(140).translate([W / 2, H / 2]), [])

  const placed: PlacedPin[] = useMemo(() => {
    return pins
      .map(p => {
        const xy = projection([p.lng, p.lat])
        if (!xy) return null
        return { ...p, cx: xy[0], cy: xy[1] }
      })
      .filter((p): p is PlacedPin => p !== null)
  }, [pins, projection])

  const visibleId = pinnedId ?? activeId
  const activePin = placed.find(p => p.id === visibleId) ?? null

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

  const onPinActivate = (id: string) => {
    setPinnedId(prev => (prev === id ? null : id))
  }

  const tooltipPlacement = useMemo(() => {
    if (!activePin) return { left: 0, top: 0, flipX: false, flipY: false }
    return {
      left: (activePin.cx / W) * 100,
      top: (activePin.cy / H) * 100,
      flipX: activePin.cx > W * 0.6,
      flipY: activePin.cy < H * 0.35,
    }
  }, [activePin])

  if (!features) {
    return (
      <div className="h-[380px] grid place-items-center text-[color:var(--muted)] text-sm bg-white rounded-2xl border border-[color:var(--line)] mt-6" aria-busy="true">
        {t('loading')}
      </div>
    )
  }

  const path = geoPath(projection)

  return (
    <div className="relative mt-8" ref={containerRef}>
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[color:var(--muted)]">{t('eyebrow')}</div>
          <div className="text-sm font-bold mt-0.5">{t('title')}</div>
        </div>
        <div className="text-[11px] text-[color:var(--muted)] hidden md:block">{t('hint')}</div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full bg-white rounded-2xl border border-[color:var(--line)] select-none"
        role="img"
        aria-label={t('ariaLabel', { count: placed.length })}
      >
        <g>
          {features.features.map((f, i) => (
            <path key={i} d={path(f) || ''} fill="#f4ebd9" stroke="#e7dcc4" strokeWidth={0.4} />
          ))}
        </g>
        <g>
          {placed.map(p => {
            const isActive = p.id === visibleId
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={t('pinAria', { emoji: p.emoji, country: p.country, year: p.year })}
                aria-expanded={isActive}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={() => setActiveId(p.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(p.id)}
                onBlur={() => setActiveId(null)}
                onClick={(e) => { e.stopPropagation(); onPinActivate(p.id) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPinActivate(p.id)
                  }
                }}
                transform={`translate(${p.cx}, ${p.cy})`}
              >
                {/* invisible 44px hit area */}
                <circle r={HIT_RADIUS} fill="transparent" />
                {/* visible pin */}
                <circle
                  r={isActive ? 17 : 14}
                  fill="white"
                  stroke="var(--accent-02)"
                  strokeWidth={isActive ? 3 : 2}
                  style={{ transition: 'r 160ms ease, stroke-width 160ms ease' }}
                />
                <text textAnchor="middle" dominantBaseline="central" fontSize={isActive ? 16 : 14} style={{ pointerEvents: 'none', transition: 'font-size 160ms ease' }}>
                  {p.emoji}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {activePin && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="pointer-events-auto absolute z-10 w-60 rounded-xl bg-white shadow-lg ring-1 ring-[color:var(--line)] p-3"
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
                <span className="text-2xl">{activePin.emoji}</span>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--accent-02)]">{activePin.country}</div>
                  <div className="text-xs font-bold tabular text-[color:var(--ink)]">{activePin.year}</div>
                </div>
              </div>
              {pinnedId && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeAll() }}
                  className="text-[color:var(--muted)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-02)]/50 rounded -mt-1 -mr-1 w-6 h-6 grid place-items-center text-sm"
                  aria-label={t('close')}
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-[color:var(--muted)] mt-2.5">
              {labelT(activePin.labelKey as never)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
