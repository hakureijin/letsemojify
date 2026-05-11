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

  it('dayInLife hours are within 0–23 and intensity within 0–1', () => {
    typed.dayInLife.forEach(d => {
      expect(d.hour).toBeGreaterThanOrEqual(0)
      expect(d.hour).toBeLessThanOrEqual(23)
      expect(d.intensity).toBeGreaterThanOrEqual(0)
      expect(d.intensity).toBeLessThanOrEqual(1)
    })
  })
})
