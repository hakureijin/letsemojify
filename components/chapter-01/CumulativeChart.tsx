'use client'
import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { line, area, curveMonotoneX } from 'd3-shape'
import type { Chapter01Data } from '@/types/chapter-01'

const W = 800
const H = 220
const PAD = { l: 36, r: 12, t: 16, b: 28 }

type Point = { year: number; total: number }

export function CumulativeChart({ data }: { data: Chapter01Data['cumulative'] }) {
  const { pathLine, pathArea, xTicks, yTicks, xScale, yScale } = useMemo(() => {
    const xs = data.map(d => d.year)
    const ys = data.map(d => d.total)
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    const xScale = scaleLinear().domain([xMin, xMax === xMin ? xMin + 1 : xMax]).range([PAD.l, W - PAD.r])
    const yScale = scaleLinear().domain([0, Math.max(...ys) * 1.05]).nice().range([H - PAD.b, PAD.t])
    const l = line<Point>().x(d => xScale(d.year)).y(d => yScale(d.total)).curve(curveMonotoneX)
    const a = area<Point>().x(d => xScale(d.year)).y0(yScale(0)).y1(d => yScale(d.total)).curve(curveMonotoneX)
    return {
      pathLine: l(data) || '',
      pathArea: a(data) || '',
      xTicks: xScale.ticks(6),
      yTicks: yScale.ticks(4),
      xScale,
      yScale,
    }
  }, [data])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cumulative emoji count over time">
      <defs>
        <linearGradient id="gradGrowth" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--accent-01)" />
          <stop offset="100%" stopColor="var(--accent-04)" />
        </linearGradient>
      </defs>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={yScale(t)} y2={yScale(t)} stroke="var(--line)" strokeDasharray="2 4" />
          <text x={PAD.l - 6} y={yScale(t)} textAnchor="end" dominantBaseline="central" fontSize="10" fill="var(--muted)">{t}</text>
        </g>
      ))}
      <path d={pathArea} fill="url(#gradGrowth)" opacity={0.18} />
      <path d={pathLine} fill="none" stroke="url(#gradGrowth)" strokeWidth={2.2} />
      {xTicks.map(t => (
        <text key={t} x={xScale(t)} y={H - 8} fontSize="10" fill="var(--muted)" textAnchor="middle">{t}</text>
      ))}
    </svg>
  )
}
