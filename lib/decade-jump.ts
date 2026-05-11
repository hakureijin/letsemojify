export function computeJumpRatio(targetYear: number, decadeIndex: number[]): number {
  const idx = decadeIndex.indexOf(targetYear)
  if (idx === -1) throw new Error(`year ${targetYear} not in decadeIndex`)
  if (decadeIndex.length === 1) return 0
  return idx / (decadeIndex.length - 1)
}
