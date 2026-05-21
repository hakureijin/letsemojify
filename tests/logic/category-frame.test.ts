import { describe, it, expect } from 'vitest'
import { frameAt } from '@/components/chapter-01/CategoryTreemap'
import type { CategoryFrame } from '@/types/chapter-01'

const stub = (year: number, label: string): CategoryFrame => ({
  year,
  versionId: `v-${year}-${label}`,
  versionLabel: label,
  counts: {
    'smileys-emotion': 1, 'people-body': 0, 'animals-nature': 0,
    'food-drink': 0, 'travel-places': 0, 'activities': 0,
    'objects': 0, 'symbols': 0, 'flags': 0,
  },
  samples: {
    'smileys-emotion': [], 'people-body': [], 'animals-nature': [],
    'food-drink': [], 'travel-places': [], 'activities': [],
    'objects': [], 'symbols': [], 'flags': [],
  },
  total: 1,
})

const frames: CategoryFrame[] = [
  stub(2010, 'Unicode 6.0'),
  stub(2014, 'Unicode 7.0'),
  stub(2020, 'Emoji 13.0'),
]

describe('frameAt', () => {
  it('returns the exact frame when year matches', () => {
    const r = frameAt(frames, 2014)
    expect(r.index).toBe(1)
    expect(r.frame.versionLabel).toBe('Unicode 7.0')
  })

  it('returns the latest frame <= year when year falls between frames', () => {
    const r = frameAt(frames, 2017)
    expect(r.index).toBe(1)
    expect(r.frame.versionLabel).toBe('Unicode 7.0')
  })

  it('returns the first frame when year is below the earliest', () => {
    const r = frameAt(frames, 1999)
    expect(r.index).toBe(0)
  })

  it('returns the last frame when year is at or above the latest', () => {
    const r = frameAt(frames, 2099)
    expect(r.index).toBe(2)
  })
})
