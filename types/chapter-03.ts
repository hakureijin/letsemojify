import type { Source } from './source'

export interface HeroStat {
  id: string
  value: string
  labelKey: string
  source: Source
}

export type GenerationId = 'gen-z' | 'millennial' | 'gen-x' | 'boomer'

export interface GenerationBar {
  id: GenerationId
  labelKey: string
  minutes: number
  display: string
  source: Source
}

export interface GenerationEmojis {
  id: GenerationId
  labelKey: string
  emojis: string[]
  descKey: string
  source: Source
}

export interface SemanticShiftEntry {
  emoji: string
  olderMeaningKey: string
  genZMeaningKey: string
  source: Source
}

export interface DayInLifeSpike {
  hour: number
  intensity: number
  labelKey: string
  source: Source
}

export interface Chapter03Data {
  sources: Source[]
  hero: HeroStat[]
  screenTime: GenerationBar[]
  topByGen: GenerationEmojis[]
  semanticShift: SemanticShiftEntry[]
  dayInLife: DayInLifeSpike[]
}
