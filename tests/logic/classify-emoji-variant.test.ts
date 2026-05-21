import { describe, it, expect } from 'vitest'
import { classifyEmojiVariant } from '../../scripts/build-emoji-categories.mjs'

describe('classifyEmojiVariant', () => {
  const cases: Array<{
    codepoints: string
    expected: ReturnType<typeof classifyEmojiVariant>
    note: string
  }> = [
    { codepoints: '1F44B',                              expected: 'base',              note: 'waving hand (single codepoint)' },
    { codepoints: '1F600',                              expected: 'base',              note: 'grinning face' },
    { codepoints: '1F44B 1F3FB',                        expected: 'skin-tone',         note: 'waving hand + light skin tone' },
    { codepoints: '1F44B 1F3FF',                        expected: 'skin-tone',         note: 'waving hand + dark skin tone' },
    { codepoints: '1FAF1 1F3FB 200D 1FAF2 1F3FC',        expected: 'multi-skin-tone',   note: 'rightward + leftward hand, two different tones' },
    { codepoints: '1F468 200D 1F469 200D 1F466',         expected: 'zwj-family',        note: 'man + woman + boy family' },
    { codepoints: '1F469 200D 1F9D1 200D 1F467',         expected: 'zwj-family',        note: 'woman + person + girl family' },
    { codepoints: '1F468 200D 1F4BB',                    expected: 'zwj-role',          note: 'man + laptop = technologist' },
    { codepoints: '1F469 1F3FD 200D 1F680',              expected: 'zwj-role',          note: 'woman + medium skin + rocket = astronaut' },
    { codepoints: '1F468 200D 1F9B0',                    expected: 'hair-style',        note: 'man + red hair' },
    { codepoints: '1F469 1F3FB 200D 1F9B3',              expected: 'hair-style',        note: 'woman + light skin + white hair (hair beats skin)' },
    { codepoints: '1F6B6 200D 27A1 FE0F',                expected: 'direction-flipped', note: 'person walking facing right' },
    { codepoints: '1F642 200D 2194 FE0F',                expected: 'direction-flipped', note: 'head shaking horizontally' },
    { codepoints: '1F3F3 FE0F 200D 1F308',               expected: 'zwj-other',         note: 'rainbow flag (ZWJ but no person)' },
    { codepoints: '1F441 FE0F 200D 1F5E8 FE0F',          expected: 'zwj-other',         note: 'eye in speech bubble' },
  ]

  for (const { codepoints, expected, note } of cases) {
    it(`${expected.padEnd(18)} ← ${codepoints} (${note})`, () => {
      expect(classifyEmojiVariant(codepoints)).toBe(expected)
    })
  }

  it('strips FE0F variation selectors before counting', () => {
    expect(classifyEmojiVariant('2764 FE0F')).toBe('base')
    expect(classifyEmojiVariant('1F441 FE0F')).toBe('base')
  })
})
