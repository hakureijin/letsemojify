import { describe, it, expect } from 'vitest'
import { HERO_EMOJIS, type HeroEmoji } from '@/lib/hero-emoji-timeline'

describe('HERO_EMOJIS', () => {
  it('has at least 120 entries to fill a dense wallpaper', () => {
    expect(HERO_EMOJIS.length).toBeGreaterThanOrEqual(120)
  })

  it('has at most 200 entries (prevents accidental bloat)', () => {
    expect(HERO_EMOJIS.length).toBeLessThanOrEqual(200)
  })

  it('every entry has a non-empty char and a valid era year', () => {
    HERO_EMOJIS.forEach((e: HeroEmoji, i) => {
      expect(e.char.length, `entry ${i}`).toBeGreaterThan(0)
      expect(e.era, `entry ${i}`).toBeGreaterThanOrEqual(1999)
      expect(e.era, `entry ${i}`).toBeLessThanOrEqual(2026)
    })
  })

  it('is sorted by era ascending (chronological reading order)', () => {
    for (let i = 1; i < HERO_EMOJIS.length; i++) {
      expect(HERO_EMOJIS[i].era).toBeGreaterThanOrEqual(HERO_EMOJIS[i - 1].era)
    }
  })

  it('has no duplicate chars', () => {
    const seen = new Set<string>()
    HERO_EMOJIS.forEach(e => {
      expect(seen.has(e.char), `duplicate: ${e.char}`).toBe(false)
      seen.add(e.char)
    })
  })

  it('spans the full timeline (has entries from <=2000 and >=2024)', () => {
    expect(HERO_EMOJIS.some(e => e.era <= 2000)).toBe(true)
    expect(HERO_EMOJIS.some(e => e.era >= 2024)).toBe(true)
  })
})
