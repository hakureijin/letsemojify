import { describe, it, expect } from 'vitest'
import { computeJumpRatio } from '@/lib/decade-jump'

describe('computeJumpRatio', () => {
  it('returns 0 for the first node', () => {
    expect(computeJumpRatio(1999, [1999, 2010, 2024])).toBe(0)
  })
  it('returns 1 for the last node', () => {
    expect(computeJumpRatio(2024, [1999, 2010, 2024])).toBeCloseTo(1, 5)
  })
  it('returns the proportional offset for an in-between year', () => {
    expect(computeJumpRatio(2010, [1999, 2010, 2024])).toBeCloseTo(0.5, 5)
  })
  it('throws when year not in the list', () => {
    expect(() => computeJumpRatio(2017, [1999, 2010, 2024])).toThrow(/not in decadeIndex/)
  })
})
