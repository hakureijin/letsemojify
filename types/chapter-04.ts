import type { Source } from './source'

export type Chapter04Category = 'ai' | 'ar3d' | 'brand' | 'interface' | 'art'

export interface FutureCase {
  id: string
  emoji: string
  year: number
  origin: string
  category: Chapter04Category
  titleKey: string
  storyKey: string
  source: Source
}

export interface Chapter04Data {
  sources: Source[]
  cases: FutureCase[]
}

export const CATEGORIES: Chapter04Category[] = ['ai', 'ar3d', 'brand', 'interface', 'art']
