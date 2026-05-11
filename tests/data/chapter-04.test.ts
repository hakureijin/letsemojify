import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-04.json'
import type { Chapter04Data } from '@/types/chapter-04'
import { CATEGORIES } from '@/types/chapter-04'

const typed: Chapter04Data = data as Chapter04Data

describe('chapter-04 data', () => {
  it('every case category is one of the 5 allowed', () => {
    typed.cases.forEach(c => expect(CATEGORIES).toContain(c.category))
  })

  it('every case has a valid source url and accessed date', () => {
    typed.cases.forEach(c => {
      expect(c.source.url).toMatch(/^https?:\/\//)
      expect(c.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('every case has a unique id', () => {
    const ids = typed.cases.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
