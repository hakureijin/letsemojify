import type { FutureCase, Chapter04Category } from '@/types/chapter-04'

export function applyFilter(cases: FutureCase[], filter: Chapter04Category | null): FutureCase[] {
  if (filter === null) return cases
  return cases.filter(c => c.category === filter)
}
