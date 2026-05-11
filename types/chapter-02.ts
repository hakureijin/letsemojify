import type { Source } from './source'

export interface PipelineStep {
  id: string
  labelKey: string
  descKey: string
}

export interface Criterion {
  id: string
  tone: 'mint' | 'cultural' | 'reject'
  titleKey: string
  descKey: string
}

export interface CaseCard {
  id: string
  emoji: string
  year: number
  unicodeVersion: string
  status: 'accepted' | 'rejected'
  proposerKey: string
  storyKey: string
  source: Source
}

export interface OriginPin {
  id: string
  emoji: string
  country: string
  lat: number
  lng: number
  year: number
  labelKey: string
}

export interface Chapter02Data {
  sources: Source[]
  pipeline: PipelineStep[]
  criteria: Criterion[]
  cases: CaseCard[]
  origins: OriginPin[]
}
