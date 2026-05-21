import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-01-categories.json'
import type { Chapter01CategoryData } from '@/types/chapter-01'

const typed: Chapter01CategoryData = data as Chapter01CategoryData

describe('chapter-01-categories data', () => {
  it('has a canonical 9-group groupOrder', () => {
    expect(typed.groupOrder).toEqual([
      'smileys-emotion',
      'people-body',
      'animals-nature',
      'food-drink',
      'travel-places',
      'activities',
      'objects',
      'symbols',
      'flags',
    ])
  })

  it('has at least one frame and frames are in chronological order', () => {
    expect(typed.frames.length).toBeGreaterThan(0)
    for (let i = 1; i < typed.frames.length; i++) {
      expect(typed.frames[i].year).toBeGreaterThanOrEqual(typed.frames[i - 1].year)
    }
  })

  it('each frame total equals the sum of its per-group counts', () => {
    for (const f of typed.frames) {
      const sum = typed.groupOrder.reduce((acc, g) => acc + f.counts[g], 0)
      expect(sum).toBe(f.total)
    }
  })

  it('each frame has counts and samples for every group', () => {
    for (const f of typed.frames) {
      for (const g of typed.groupOrder) {
        expect(typeof f.counts[g]).toBe('number')
        expect(Array.isArray(f.samples[g])).toBe(true)
      }
    }
  })

  it('counts are monotonically non-decreasing per group across frames (cumulative)', () => {
    for (const g of typed.groupOrder) {
      for (let i = 1; i < typed.frames.length; i++) {
        expect(typed.frames[i].counts[g]).toBeGreaterThanOrEqual(typed.frames[i - 1].counts[g])
      }
    }
  })

  it('source has a verifiable url and accessed date', () => {
    expect(typed.source.url).toMatch(/^https?:\/\//)
    expect(typed.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('starts at Unicode 6.0 (2010) — not the pre-CLDR DoCoMo era', () => {
    expect(typed.frames[0].year).toBe(2010)
    expect(typed.frames[0].versionLabel).toMatch(/Unicode 6\.0|Emoji 6\.0/)
  })
})
