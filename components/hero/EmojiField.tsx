'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HERO_EMOJIS } from '@/lib/hero-emoji-timeline'
import { computeLayout, type LayoutProfile } from '@/lib/hero-emoji-layout'

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
  const [size, setSize] = useState<{ vw: number; vh: number } | null>(null)

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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden hero-vignette"
      role="presentation"
    >
      {positioned.map((p, i) => (
        <button
          key={`${p.char}-${i}`}
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
