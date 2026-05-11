import { describe, it, expect } from 'vitest'
import zh from '@/messages/zh.json'
import en from '@/messages/en.json'

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v as Record<string, unknown>, key))
    else out.push(key)
  }
  return out
}

describe('i18n message parity', () => {
  it('zh and en have the same set of keys', () => {
    const zhKeys = new Set(flatten(zh as Record<string, unknown>))
    const enKeys = new Set(flatten(en as Record<string, unknown>))
    const onlyZh = [...zhKeys].filter(k => !enKeys.has(k))
    const onlyEn = [...enKeys].filter(k => !zhKeys.has(k))
    expect({ onlyZh, onlyEn }).toEqual({ onlyZh: [], onlyEn: [] })
  })
})
