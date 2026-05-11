import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-03.json'
import type { Chapter03Data } from '@/types/chapter-03'

const typed: Chapter03Data = data as Chapter03Data

describe('chapter-03 data', () => {
  it('has at least one hero stat', () => {
    expect(typed.hero.length).toBeGreaterThan(0)
  })

  it('screenTime entries have non-negative minutes', () => {
    typed.screenTime.forEach(b => expect(b.minutes).toBeGreaterThanOrEqual(0))
  })

  it('semanticShift entries reference public source URLs', () => {
    typed.semanticShift.forEach(s => expect(s.source.url).toMatch(/^https?:\/\//))
  })

  it('dayInLife has two curves with 24 hourly intensity values each', () => {
    expect(typed.dayInLife.curves.length).toBe(2)
    typed.dayInLife.curves.forEach(curve => {
      expect(curve.hours.length).toBe(24)
      curve.hours.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      })
      curve.spikes.forEach(s => {
        expect(s.hour).toBeGreaterThanOrEqual(0)
        expect(s.hour).toBeLessThanOrEqual(23)
      })
      expect(curve.source.url).toMatch(/^https?:\/\//)
    })
  })
})
