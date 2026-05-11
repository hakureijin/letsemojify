'use client'
import { computeJumpRatio } from '@/lib/decade-jump'

interface Props {
  years: number[]
  outerRef: React.RefObject<HTMLDivElement | null>
}

export function DecadeIndex({ years, outerRef }: Props) {
  const onJump = (y: number) => {
    const ratio = computeJumpRatio(y, years)
    const el = outerRef.current
    if (!el) return
    const top = el.offsetTop
    const innerScrollable = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + innerScrollable * ratio, behavior: 'smooth' })
  }
  return (
    <div className="flex gap-2 px-6 pt-4">
      {years.map(y => (
        <button
          key={y}
          onClick={() => onJump(y)}
          className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-[color:var(--line)] hover:bg-[color:var(--accent-01)] hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-01)]/50"
        >
          {y}
        </button>
      ))}
    </div>
  )
}
