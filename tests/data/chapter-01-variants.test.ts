import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-01-variants.json'
import type {
  Chapter01VariantData,
  CategoryGroupKey,
  MechanismId,
} from '@/types/chapter-01'

const typed: Chapter01VariantData = data as Chapter01VariantData

const MECHANISM_IDS: MechanismId[] = [
  'base',
  'skin-tone',
  'multi-skin-tone',
  'zwj-family',
  'zwj-role',
  'zwj-other',
  'hair-style',
  'direction-flipped',
]

const GROUP_IDS: CategoryGroupKey[] = [
  'smileys-emotion',
  'people-body',
  'animals-nature',
  'food-drink',
  'travel-places',
  'activities',
  'objects',
  'symbols',
  'flags',
]

describe('chapter-01-variants data', () => {
  it('has canonical mechanismOrder and groupOrder', () => {
    expect(typed.mechanismOrder).toEqual(MECHANISM_IDS)
    expect(typed.groupOrder).toEqual(GROUP_IDS)
  })

  it('has a snapshot with positive total and known version label', () => {
    expect(typed.snapshot.total).toBeGreaterThan(0)
    expect(typed.snapshot.versionLabel).toMatch(/Emoji \d+\.\d+|Unicode \d+\.\d+/)
    expect(typed.snapshot.year).toBeGreaterThanOrEqual(2010)
  })

  it('mechanisms cover every MechanismId exactly once', () => {
    const ids = typed.mechanisms.map(m => m.id).sort()
    expect(ids).toEqual([...MECHANISM_IDS].sort())
  })

  it('sum of mechanism counts equals snapshot total', () => {
    const sum = typed.mechanisms.reduce((acc, m) => acc + m.count, 0)
    expect(sum).toBe(typed.snapshot.total)
  })

  it('sum of flow counts equals snapshot total', () => {
    const sum = typed.flows.reduce((acc, f) => acc + f.count, 0)
    expect(sum).toBe(typed.snapshot.total)
  })

  it('every flow references a valid mechanism and group', () => {
    for (const f of typed.flows) {
      expect(MECHANISM_IDS).toContain(f.mechanism)
      expect(GROUP_IDS).toContain(f.group)
      expect(f.count).toBeGreaterThan(0)
    }
  })

  it('each mechanism share is in [0,1] and matches count/total', () => {
    for (const m of typed.mechanisms) {
      expect(m.share).toBeGreaterThanOrEqual(0)
      expect(m.share).toBeLessThanOrEqual(1)
      expect(m.share).toBeCloseTo(m.count / typed.snapshot.total, 6)
    }
  })

  it('per-mechanism flow totals match the mechanism count', () => {
    for (const m of typed.mechanisms) {
      const flowSum = typed.flows
        .filter(f => f.mechanism === m.id)
        .reduce((acc, f) => acc + f.count, 0)
      expect(flowSum).toBe(m.count)
    }
  })

  it('source has a verifiable url and accessed date', () => {
    expect(typed.source.url).toMatch(/^https?:\/\//)
    expect(typed.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
