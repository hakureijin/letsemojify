'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { HERO_EMOJIS } from '@/lib/hero-emoji-timeline'
import { computeLayout, type LayoutProfile } from '@/lib/hero-emoji-layout'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'

type Props = {
  labelEnlarge: string  // i18n template containing __CHAR__ placeholder
  labelShrink: string   // i18n template containing __CHAR__ placeholder
}

function pickProfile(vw: number, vh: number): LayoutProfile {
  if (vh < 480) return 'short'
  if (vw < 768) return 'mobile'
  return 'desktop'
}

export function EmojiField({ labelEnlarge }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | null>(null)
  const emojiRefs = useRef<(HTMLButtonElement | null)[]>([])
  const quickToRefs = useRef<Array<{ x: (v: number) => void; y: (v: number) => void } | null>>([])
  const [size, setSize] = useState<{ vw: number; vh: number } | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({ vw: rect.width, vh: rect.height })
    }
    measure()
    const ro = new ResizeObserver(() => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(measure, 150)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const positioned = useMemo(() => {
    if (!size) return []
    const profile = pickProfile(size.vw, size.vh)
    return computeLayout(HERO_EMOJIS, size.vw, size.vh, profile)
  }, [size])

  useGSAP(
    () => {
      if (reducedMotion || !size) return
      const container = containerRef.current
      if (!container) return

      quickToRefs.current = emojiRefs.current.map(el => {
        if (!el) return null
        return {
          x: gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' }),
        }
      })

      let rafId: number | null = null
      let mouseX = 0
      let mouseY = 0
      const RADIUS = 100
      const STRENGTH = 28

      const handleMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        mouseX = e.clientX - rect.left
        mouseY = e.clientY - rect.top
        if (rafId !== null) return
        rafId = requestAnimationFrame(() => {
          rafId = null
          for (let i = 0; i < positioned.length; i++) {
            const p = positioned[i]
            const qt = quickToRefs.current[i]
            if (!qt) continue
            const dx = p.x - mouseX
            const dy = p.y - mouseY
            const d = Math.hypot(dx, dy)
            if (d < RADIUS && d > 0) {
              const f = Math.pow(1 - d / RADIUS, 2) * STRENGTH
              qt.x((dx / d) * f)
              qt.y((dy / d) * f)
            } else {
              qt.x(0)
              qt.y(0)
            }
          }
        })
      }

      const handleLeave = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        const targets = emojiRefs.current.filter(Boolean) as HTMLButtonElement[]
        gsap.to(targets, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)',
        })
      }

      container.addEventListener('mousemove', handleMove)
      container.addEventListener('mouseleave', handleLeave)

      return () => {
        container.removeEventListener('mousemove', handleMove)
        container.removeEventListener('mouseleave', handleLeave)
        if (rafId !== null) cancelAnimationFrame(rafId)
      }
    },
    { scope: containerRef, dependencies: [positioned, reducedMotion, size] },
  )

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden hero-vignette"
      role="presentation"
    >
      {positioned.map((p, i) => (
        <button
          key={`${p.char}-${i}`}
          ref={el => { emojiRefs.current[i] = el }}
          type="button"
          aria-label={labelEnlarge.replace('__CHAR__', p.char)}
          className="hero-emoji-btn"
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            opacity: p.opacity,
            fontSize: `${p.size}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span aria-hidden="true">{p.char}</span>
        </button>
      ))}
    </div>
  )
}
