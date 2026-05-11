'use client'
import { useEffect, useState } from 'react'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { useTranslations } from 'next-intl'
import type { OriginPin } from '@/types/chapter-02'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'

const W = 800
const H = 380

export function OriginMap({ pins }: { pins: OriginPin[] }) {
  const t = useTranslations()
  const [features, setFeatures] = useState<FeatureCollection<Geometry> | null>(null)

  useEffect(() => {
    fetch('/world-atlas/countries-110m.json')
      .then(r => r.json())
      .then((topo: Topology) => {
        const fc = feature(topo, topo.objects.countries as GeometryCollection) as unknown as FeatureCollection<Geometry>
        setFeatures(fc)
      })
  }, [])

  if (!features) return <div className="h-[380px] grid place-items-center text-[color:var(--muted)] text-sm">map loading…</div>

  const projection = geoEqualEarth().scale(140).translate([W / 2, H / 2])
  const path = geoPath(projection)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-white rounded-2xl shadow-sm mt-6" role="img" aria-label="Origins of culturally-representative emojis">
      <g>
        {features.features.map((f, i) => (
          <path key={i} d={path(f) || ''} fill="#f4ebd9" stroke="#e7dcc4" strokeWidth={0.4} />
        ))}
      </g>
      <g>
        {pins.map(p => {
          const xy = projection([p.lng, p.lat])
          if (!xy) return null
          return (
            <g key={p.id} transform={`translate(${xy[0]}, ${xy[1]})`}>
              <circle r={14} fill="white" stroke="var(--accent-02)" strokeWidth={2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14">{p.emoji}</text>
              <title>{t(p.labelKey as never)}</title>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
