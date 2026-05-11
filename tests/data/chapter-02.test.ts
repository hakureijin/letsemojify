import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-02.json'
import type { Chapter02Data } from '@/types/chapter-02'

const typed: Chapter02Data = data as Chapter02Data

describe('chapter-02 data', () => {
  it('pipeline has 5 steps', () => {
    expect(typed.pipeline.length).toBe(5)
  })

  it('every case has a verifiable source URL', () => {
    for (const c of typed.cases) {
      expect(c.source.url).toMatch(/^https?:\/\//)
      expect(['accepted', 'rejected']).toContain(c.status)
    }
  })

  it('every origin pin has a 2-letter ISO country code and reasonable coords', () => {
    for (const o of typed.origins) {
      expect(o.country).toMatch(/^[A-Z]{2}$/)
      expect(o.lat).toBeGreaterThan(-90)
      expect(o.lat).toBeLessThan(90)
      expect(o.lng).toBeGreaterThanOrEqual(-180)
      expect(o.lng).toBeLessThanOrEqual(180)
    }
  })
})
