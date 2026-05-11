import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-01.json'
import type { Chapter01Data } from '@/types/chapter-01'

const typed: Chapter01Data = data as Chapter01Data

describe('chapter-01 data', () => {
  it('every timeline node has a verifiable source url and accessed date', () => {
    for (const node of typed.timeline) {
      expect(node.source.url).toMatch(/^https?:\/\//)
      expect(node.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('decadeIndex contains numeric years', () => {
    for (const y of typed.decadeIndex) {
      expect(typeof y).toBe('number')
    }
  })

  it('cumulative entries are sorted by year ascending', () => {
    for (let i = 1; i < typed.cumulative.length; i++) {
      expect(typed.cumulative[i].year).toBeGreaterThanOrEqual(typed.cumulative[i - 1].year)
    }
  })

  it('every source has unique id across sources[] and inline', () => {
    const all = new Set<string>()
    typed.sources.forEach(s => all.add(s.id))
    typed.timeline.forEach(n => all.add(n.source.id))
    expect(all.size).toBeGreaterThan(0)
  })
})
