import type { Source } from './source'

export interface TimelineNode {
  id: string
  year: number
  versionLabel: string
  kind: 'unicode' | 'milestone'
  newEmojiCount: number | null
  highlightEmojis: string[]
  narrativeKey: string
  source: Source
  draft?: boolean
}

export interface Chapter01Data {
  sources: Source[]
  timeline: TimelineNode[]
  decadeIndex: number[]
  cumulative: { year: number; total: number; sourceId: string }[]
}
