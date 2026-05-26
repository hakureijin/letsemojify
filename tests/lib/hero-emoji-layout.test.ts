import { describe, it, expect } from 'vitest'
import { computeLayout, type HeroEmoji } from '@/lib/hero-emoji-layout'

const stub = (n: number): HeroEmoji[] =>
  Array.from({ length: n }, (_, i) => ({ char: `e${i}`, era: 2000 + i }))

describe('computeLayout', () => {
  it('returns entries within viewport bounds (desktop)', () => {
    const out = computeLayout(stub(150), 1280, 800, 'desktop')
    out.forEach(p => {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1280)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(800)
    })
  })

  it('drops emojis inside the central safe ellipse (desktop)', () => {
    const vw = 1280, vh = 800
    const cx = vw / 2, cy = vh / 2
    const rx = 240, ry = 140
    const out = computeLayout(stub(200), vw, vh, 'desktop')
    out.forEach(p => {
      const dx = (p.x - cx) / rx
      const dy = (p.y - cy) / ry
      expect(dx * dx + dy * dy, `entry at ${p.x},${p.y} should not be in safe ellipse`).toBeGreaterThanOrEqual(1)
    })
  })

  it('opacity is clamped between 0.35 and 0.85', () => {
    const out = computeLayout(stub(150), 1280, 800, 'desktop')
    out.forEach(p => {
      expect(p.opacity).toBeGreaterThanOrEqual(0.35)
      expect(p.opacity).toBeLessThanOrEqual(0.85)
    })
  })

  it('is deterministic — same inputs yield byte-identical output', () => {
    const a = computeLayout(stub(150), 1280, 800, 'desktop')
    const b = computeLayout(stub(150), 1280, 800, 'desktop')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('mobile profile yields fewer cells than desktop', () => {
    const desk = computeLayout(stub(200), 1280, 800, 'desktop')
    const mob = computeLayout(stub(200), 375, 700, 'mobile')
    expect(mob.length).toBeLessThan(desk.length)
  })

  it('short-viewport profile reduces row count', () => {
    const out = computeLayout(stub(200), 800, 400, 'short')
    // 12 cols × 6 rows = 72 cells max; minus safe-zone drops
    expect(out.length).toBeLessThanOrEqual(72)
  })

  it('assigns emojis in source order (chronological reading)', () => {
    const out = computeLayout(stub(150), 1280, 800, 'desktop')
    const eras = out.map(p => p.era)
    const sorted = [...eras].sort((a, b) => a - b)
    expect(eras).toEqual(sorted)
  })

  it('returned chars are unique (no duplicates from wrapping)', () => {
    const out = computeLayout(stub(200), 1280, 800, 'desktop')
    const seen = new Set(out.map(p => p.char))
    expect(seen.size).toBe(out.length)
  })
})
