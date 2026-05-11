import { describe, it, expect } from 'vitest'
import { applyFilter } from '@/lib/filter'
import type { FutureCase, Chapter04Category } from '@/types/chapter-04'

const stubSource = { id: 's', title: { zh: '', en: '' }, publisher: '', url: 'https://example.com', accessed: '2026-05-11' }

const cases: FutureCase[] = [
  { id: 'a', emoji: '🪄', year: 2024, origin: 'Apple', category: 'ai', titleKey: '', storyKey: '', source: stubSource },
  { id: 'b', emoji: '🥽', year: 2024, origin: 'Apple', category: 'ar3d', titleKey: '', storyKey: '', source: stubSource },
]

describe('applyFilter', () => {
  it('returns all cases when filter is null (ALL)', () => {
    expect(applyFilter(cases, null).map(c => c.id)).toEqual(['a', 'b'])
  })

  it('returns only cases in the given category', () => {
    expect(applyFilter(cases, 'ai').map(c => c.id)).toEqual(['a'])
  })

  it('returns empty list when no case matches', () => {
    expect(applyFilter(cases, 'brand' as Chapter04Category)).toEqual([])
  })
})
