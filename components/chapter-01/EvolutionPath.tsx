'use client'
import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { useLocale } from 'next-intl'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { TimelineCard } from './TimelineCard'
import { DecadeIndex } from './DecadeIndex'
import type { Chapter01Data, TimelineNode } from '@/types/chapter-01'

interface Props { data: Chapter01Data }

export function EvolutionPath({ data }: Props) {
  const locale = useLocale() as 'zh' | 'en'
  const reduced = usePrefersReducedMotion()
  const outerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ['start start', 'end end'] })

  const cardCount = data.timeline.length
  const trackWidth = cardCount * 192 + Math.max(0, cardCount - 1) * 14
  const maxTranslate = Math.max(0, trackWidth - 800)
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxTranslate])

  if (reduced) {
    return (
      <div className="bg-gradient-to-r from-[color:var(--accent-01)]/10 via-pink-50 to-violet-100 py-16">
        <div className="px-6">
          <DecadeIndex years={data.decadeIndex} outerRef={outerRef} />
          <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory">
            {data.timeline.map((n) => (
              <div key={n.id} className="snap-start">
                <TimelineCard node={n} active locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const sectionHeight = Math.max(120, cardCount * 35)

  return (
    <div ref={outerRef} style={{ height: `${sectionHeight}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-gradient-to-r from-[color:var(--accent-01)]/15 via-pink-50 to-violet-100">
        <DecadeIndex years={data.decadeIndex} outerRef={outerRef} />
        <div className="h-full flex items-center">
          <motion.div style={{ x }} className="flex gap-3.5 pl-[40vw] pr-[40vw]">
            {data.timeline.map((n, i) => (
              <FocusAwareCard key={n.id} node={n} locale={locale} index={i} count={cardCount} progress={scrollYProgress} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function FocusAwareCard({
  node, locale, index, count, progress,
}: {
  node: TimelineNode
  locale: 'zh' | 'en'
  index: number
  count: number
  progress: MotionValue<number>
}) {
  const [active, setActive] = useState(index === 0)
  useMotionValueEvent(progress, 'change', (latest) => {
    const focal = Math.round(latest * (count - 1))
    setActive(focal === index)
  })
  return <TimelineCard node={node} active={active} locale={locale} />
}
