import { describe, it, expect } from 'vitest'
import {
  computeVersionDiff,
  type EnrichedNode,
} from '@/components/chapter-01/CumulativeChart'
import chapter01 from '@/data/chapter-01.json'
import type { TimelineNode } from '@/types/chapter-01'

function buildContributing(): EnrichedNode[] {
  const contributing = (chapter01.timeline as TimelineNode[]).filter(
    (n): n is TimelineNode & { newEmojiCount: number } => n.newEmojiCount !== null,
  )
  let running = 0
  return contributing.map((n) => {
    const previousTotal = running
    running += n.newEmojiCount
    return {
      node: n,
      runningTotal: running,
      previousTotal,
      growthPct: previousTotal === 0 ? 0 : (n.newEmojiCount / previousTotal) * 100,
    }
  })
}

describe('computeVersionDiff', () => {
  const series = buildContributing()

  it('returns null when fromId === toId', () => {
    expect(computeVersionDiff(series, 'emoji-6-0', 'emoji-6-0')).toBeNull()
  })

  it('returns null when fromId is unknown', () => {
    expect(computeVersionDiff(series, 'no-such-id', 'emoji-6-0')).toBeNull()
  })

  it('returns null when toId is unknown', () => {
    expect(computeVersionDiff(series, 'emoji-6-0', 'no-such-id')).toBeNull()
  })

  it('default case (6.0 → 17.0) produces expected stats', () => {
    const r = computeVersionDiff(series, 'emoji-6-0', 'emoji-17-0')
    expect(r).not.toBeNull()
    expect(r!.fromNode.node.id).toBe('emoji-6-0')
    expect(r!.toNode.node.id).toBe('emoji-17-0')
    expect(r!.yearSpan).toBe(15)
    expect(r!.versionCount).toBe(12)
    expect(r!.addedTotal).toBe(1612)
    expect(r!.isDraft).toBe(false)
    expect(r!.sampleEmojis.length).toBeGreaterThan(0)
  })

  it('reversed selection auto-swaps (early → late always)', () => {
    const forward = computeVersionDiff(series, 'emoji-6-0', 'emoji-17-0')
    const reversed = computeVersionDiff(series, 'emoji-17-0', 'emoji-6-0')
    expect(reversed).not.toBeNull()
    expect(reversed!.fromNode.node.id).toBe('emoji-6-0')
    expect(reversed!.toNode.node.id).toBe('emoji-17-0')
    expect(reversed!.addedTotal).toBe(forward!.addedTotal)
    expect(reversed!.versionCount).toBe(forward!.versionCount)
  })

  it('same year, different versions (12.0 → 12.1)', () => {
    const r = computeVersionDiff(series, 'emoji-12-0', 'emoji-12-1')
    expect(r).not.toBeNull()
    expect(r!.yearSpan).toBe(0)
    expect(r!.versionCount).toBe(1)
  })

  it('draft destination (17.0 → 18.0) sets isDraft = true', () => {
    const r = computeVersionDiff(series, 'emoji-17-0', 'emoji-18-0')
    expect(r).not.toBeNull()
    expect(r!.isDraft).toBe(true)
  })

  it('sampleEmojis is chronological concat of (from, to] highlightEmojis', () => {
    const r = computeVersionDiff(series, 'emoji-15-0', 'emoji-15-1')
    expect(r).not.toBeNull()
    expect(r!.sampleEmojis).toEqual(['🙂‍↕️', '🍋‍🟩', '🍄‍🟫'])
  })

  it('adjacent versions (17.0 → 18.0) has versionCount 1 and 18.0 stats', () => {
    const r = computeVersionDiff(series, 'emoji-17-0', 'emoji-18-0')
    expect(r).not.toBeNull()
    expect(r!.versionCount).toBe(1)
    expect(r!.addedTotal).toBe(19)
  })
})
