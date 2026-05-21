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

export type MechanismId =
  | 'base'
  | 'skin-tone'
  | 'multi-skin-tone'
  | 'zwj-family'
  | 'zwj-role'
  | 'zwj-other'
  | 'hair-style'
  | 'direction-flipped'

export interface VariantMechanism {
  id: MechanismId
  count: number
  share: number
  examples: string[]
}

export interface VariantFlow {
  mechanism: MechanismId
  group: CategoryGroupKey
  count: number
  examples: string[]
}

export interface Chapter01VariantData {
  groupOrder: CategoryGroupKey[]
  mechanismOrder: MechanismId[]
  snapshot: {
    year: number
    versionId: string
    versionLabel: string
    total: number
  }
  mechanisms: VariantMechanism[]
  flows: VariantFlow[]
  source: Source
}
