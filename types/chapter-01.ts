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

export type CategoryGroupKey =
  | 'smileys-emotion'
  | 'people-body'
  | 'animals-nature'
  | 'food-drink'
  | 'travel-places'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'flags'

export interface CategoryFrame {
  year: number
  versionId: string
  versionLabel: string
  counts: Record<CategoryGroupKey, number>
  samples: Record<CategoryGroupKey, string[]>
  total: number
}

export interface Chapter01CategoryData {
  groupOrder: CategoryGroupKey[]
  frames: CategoryFrame[]
  source: Source
}
