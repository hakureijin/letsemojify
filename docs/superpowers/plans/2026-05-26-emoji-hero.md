# Hero Emoji Wallpaper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static gradient hero with an interactive emoji-timeline wallpaper (~150 emojis chronologically ordered 1999→2026) — magnetic-push hover, click-to-enlarge toggle, central avoidance zone for text legibility.

**Architecture:** Two pure modules (`lib/hero-emoji-timeline.ts`, `lib/hero-emoji-layout.ts`) feed a single client component (`components/hero/EmojiField.tsx`). `components/Hero.tsx` becomes a thin shell embedding `EmojiField` plus the existing text overlay. GSAP (free core + `@gsap/react`) drives all motion; reuses existing `usePrefersReducedMotion` hook.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · GSAP 3.12+ · `@gsap/react` · Vitest · next-intl

**Spec:** `docs/superpowers/specs/2026-05-26-emoji-hero-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `gsap` and `@gsap/react` dependencies |
| `lib/hero-emoji-timeline.ts` | Create | Ordered emoji list `{ char, era }[]` length ≥ 120 |
| `lib/hero-emoji-layout.ts` | Create | Pure `computeLayout(emojis, vw, vh, profile) → Positioned[]` with safe-ellipse drop + deterministic jitter |
| `tests/lib/hero-emoji-timeline.test.ts` | Create | Asserts length, sort order, dedup |
| `tests/lib/hero-emoji-layout.test.ts` | Create | Asserts bounds, safe-zone drop, determinism, opacity range |
| `components/hero/EmojiField.tsx` | Create | Client component — static render → +hover → +click → +a11y branches |
| `components/Hero.tsx` | Modify | Refactor to flat bg + `<EmojiField>` + text overlay |
| `app/[locale]/globals.css` | Modify | Add `.hero-vignette` and `.hero-emoji-btn` rules |

---

## Task 1: Install GSAP dependencies

**Files:**
- Modify: `package.json` (dependencies block)
- Modify: `package-lock.json` (auto-generated)

- [ ] **Step 1: Verify clean working tree before mutating deps**

Run: `cd /root/tyx/VINCI && git status --short`
Expected: list of pre-existing unrelated changes is fine; verify `package.json` and `package-lock.json` are unmodified before this task.

- [ ] **Step 2: Install gsap and @gsap/react as regular dependencies**

Run: `cd /root/tyx/VINCI && npm install gsap@^3.12 @gsap/react@^2`
Expected: both packages added, lockfile updated, no errors. `node_modules/gsap` and `node_modules/@gsap/react` exist.

- [ ] **Step 3: Confirm the dependencies entry**

Run: `cd /root/tyx/VINCI && node -e "const p=require('./package.json'); console.log(p.dependencies.gsap, p.dependencies['@gsap/react'])"`
Expected: two semver strings printed (e.g. `^3.12.5 ^2.1.2`), no `undefined`.

- [ ] **Step 4: Sanity-check the existing test suite still runs**

Run: `cd /root/tyx/VINCI && npm test -- --run`
Expected: all existing tests pass (no test depends on GSAP yet — this just ensures the install didn't corrupt anything).

- [ ] **Step 5: Commit**

```bash
cd /root/tyx/VINCI && git add package.json package-lock.json && git commit -m "$(cat <<'EOF'
build(deps): add gsap and @gsap/react for hero wallpaper animation

Required for hover magnetic push, elastic spring-back, and click-toggle
scale animations in components/hero/EmojiField.tsx (added in subsequent
commits).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create the curated emoji timeline

**Files:**
- Create: `lib/hero-emoji-timeline.ts`
- Test: `tests/lib/hero-emoji-timeline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/hero-emoji-timeline.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { HERO_EMOJIS, type HeroEmoji } from '@/lib/hero-emoji-timeline'

describe('HERO_EMOJIS', () => {
  it('has at least 120 entries to fill a dense wallpaper', () => {
    expect(HERO_EMOJIS.length).toBeGreaterThanOrEqual(120)
  })

  it('has at most 200 entries (prevents accidental bloat)', () => {
    expect(HERO_EMOJIS.length).toBeLessThanOrEqual(200)
  })

  it('every entry has a non-empty char and a valid era year', () => {
    HERO_EMOJIS.forEach((e: HeroEmoji, i) => {
      expect(e.char.length, `entry ${i}`).toBeGreaterThan(0)
      expect(e.era, `entry ${i}`).toBeGreaterThanOrEqual(1999)
      expect(e.era, `entry ${i}`).toBeLessThanOrEqual(2026)
    })
  })

  it('is sorted by era ascending (chronological reading order)', () => {
    for (let i = 1; i < HERO_EMOJIS.length; i++) {
      expect(HERO_EMOJIS[i].era).toBeGreaterThanOrEqual(HERO_EMOJIS[i - 1].era)
    }
  })

  it('has no duplicate chars', () => {
    const seen = new Set<string>()
    HERO_EMOJIS.forEach(e => {
      expect(seen.has(e.char), `duplicate: ${e.char}`).toBe(false)
      seen.add(e.char)
    })
  })

  it('spans the full timeline (has entries from ≤2000 and ≥2024)', () => {
    expect(HERO_EMOJIS.some(e => e.era <= 2000)).toBe(true)
    expect(HERO_EMOJIS.some(e => e.era >= 2024)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd /root/tyx/VINCI && npm test -- tests/lib/hero-emoji-timeline.test.ts --run`
Expected: FAIL with module-not-found error for `@/lib/hero-emoji-timeline`.

- [ ] **Step 3: Create `lib/hero-emoji-timeline.ts` with the full curated list**

Create `lib/hero-emoji-timeline.ts`:

```ts
export type HeroEmoji = { char: string; era: number }

// Curated emoji timeline 1999 → 2026, sorted by era ascending.
// Composed of: (a) highlightEmojis from data/chapter-01.json timeline,
// (b) hand-picked era-appropriate supplements to reach a dense ~150 wallpaper.
// Each char appears exactly once.
export const HERO_EMOJIS: HeroEmoji[] = [
  // 1999 — DoCoMo i-mode launch (176 12×12 icons)
  { char: '☀️', era: 1999 },
  { char: '☁️', era: 1999 },
  { char: '☂️', era: 1999 },
  { char: '❄️', era: 1999 },
  { char: '⭐', era: 1999 },
  { char: '🌙', era: 1999 },
  { char: '☎️', era: 1999 },
  { char: '📞', era: 1999 },
  { char: '✉️', era: 1999 },
  { char: '📠', era: 1999 },
  { char: '💾', era: 1999 },
  { char: '📺', era: 1999 },
  { char: '📻', era: 1999 },
  { char: '🎵', era: 1999 },
  { char: '🎬', era: 1999 },
  { char: '❤️', era: 1999 },
  { char: '💔', era: 1999 },
  { char: '🐶', era: 1999 },
  { char: '🐱', era: 1999 },
  { char: '🌸', era: 2003 },

  // 2007 — iPhone JP launch
  { char: '📱', era: 2007 },
  { char: '🍣', era: 2007 },
  { char: '🍙', era: 2007 },
  { char: '🎌', era: 2007 },
  { char: '🗼', era: 2007 },
  { char: '🎏', era: 2007 },
  { char: '🌅', era: 2007 },
  { char: '⛩️', era: 2007 },
  { char: '🍵', era: 2007 },

  // 2010 — Unicode 6.0 mass-market standardisation
  { char: '😀', era: 2010 },
  { char: '😂', era: 2010 },
  { char: '😍', era: 2010 },
  { char: '😎', era: 2010 },
  { char: '😭', era: 2010 },
  { char: '🙏', era: 2010 },
  { char: '👍', era: 2010 },
  { char: '🎉', era: 2010 },
  { char: '🎂', era: 2010 },
  { char: '🍔', era: 2010 },
  { char: '🍕', era: 2010 },
  { char: '🐼', era: 2010 },
  { char: '🐰', era: 2010 },
  { char: '🦁', era: 2010 },
  { char: '🌍', era: 2010 },
  { char: '⚽', era: 2010 },
  { char: '🚗', era: 2010 },
  { char: '✈️', era: 2010 },
  { char: '🚀', era: 2010 },

  // 2014 — Unicode 7.0 (Webdings/Wingdings absorbed)
  { char: '🖕', era: 2014 },
  { char: '🙊', era: 2014 },
  { char: '😈', era: 2014 },
  { char: '🌶️', era: 2014 },
  { char: '🕷️', era: 2014 },
  { char: '🖥️', era: 2014 },
  { char: '🎙️', era: 2014 },

  // 2015 — Fitzpatrick skin-tone modifiers + family ZWJ
  { char: '👍🏼', era: 2015 },
  { char: '👍🏾', era: 2015 },
  { char: '👨‍👩‍👧', era: 2015 },
  { char: '🌮', era: 2015 },
  { char: '🌯', era: 2015 },
  { char: '🦄', era: 2015 },
  { char: '🤳', era: 2016 },
  { char: '🥑', era: 2016 },

  // 2017 — Unicode 10.0 (dumpling, headscarf, mate proposals land later)
  { char: '🤔', era: 2017 },
  { char: '🤷', era: 2017 },
  { char: '🙌', era: 2017 },
  { char: '🥟', era: 2017 },
  { char: '🧕', era: 2017 },
  { char: '🦒', era: 2017 },

  // 2018 — Unicode 11.0 (versions jump to align with Unicode)
  { char: '🥶', era: 2018 },
  { char: '🥵', era: 2018 },
  { char: '🥳', era: 2018 },
  { char: '🦸', era: 2018 },
  { char: '🦹', era: 2018 },
  { char: '🥁', era: 2018 },
  { char: '🧁', era: 2018 },

  // 2019 — Unicode 12.0 + 12.1 (accessibility + neutral)
  { char: '🦾', era: 2019 },
  { char: '🧏', era: 2019 },
  { char: '🥱', era: 2019 },
  { char: '🧑‍🤝‍🧑', era: 2019 },
  { char: '🧑‍🦰', era: 2019 },
  { char: '🧑‍🦱', era: 2019 },
  { char: '🧉', era: 2019 },
  { char: '🦥', era: 2019 },

  // 2020 — Unicode 13.0 + 13.1 (pandemic-era emotional vocab)
  { char: '🥲', era: 2020 },
  { char: '🪆', era: 2020 },
  { char: '🫀', era: 2020 },
  { char: '😶‍🌫️', era: 2020 },
  { char: '❤️‍🔥', era: 2020 },
  { char: '🧔‍♀️', era: 2020 },
  { char: '🤍', era: 2020 },
  { char: '🤎', era: 2020 },
  { char: '🥺', era: 2020 },
  { char: '🧘', era: 2020 },
  { char: '🏃', era: 2020 },

  // 2021 — Unicode 14.0 (heart hands, melting face)
  { char: '🫶', era: 2021 },
  { char: '🫠', era: 2021 },
  { char: '🫡', era: 2021 },
  { char: '🤝', era: 2021 },
  { char: '🪐', era: 2021 },
  { char: '🌌', era: 2021 },

  // 2022 — Unicode 15.0 (pink heart, shaking face, lotus)
  { char: '🩷', era: 2022 },
  { char: '🫨', era: 2022 },
  { char: '🪷', era: 2022 },
  { char: '🪶', era: 2022 },
  { char: '🦤', era: 2022 },
  { char: '🦣', era: 2022 },

  // 2023 — Unicode 15.1 (direction-flipped sequences)
  { char: '🙂‍↕️', era: 2023 },
  { char: '🍋‍🟩', era: 2023 },
  { char: '🍄‍🟫', era: 2023 },
  { char: '🐦‍🔥', era: 2023 },
  { char: '🪼', era: 2023 },

  // 2024 — Unicode 16.0 (small year) + Apple Genmoji
  { char: '🫩', era: 2024 },
  { char: '🪾', era: 2024 },
  { char: '🫆', era: 2024 },
  { char: '🤖', era: 2024 },
  { char: '✨', era: 2024 },
  { char: '🎨', era: 2024 },
  { char: '🧠', era: 2024 },

  // 2025 — Unicode 17.0 (twisted face, fight cloud, orca)
  { char: '💥', era: 2025 },
  { char: '🐳', era: 2025 },
  { char: '🎺', era: 2025 },
  { char: '🪨', era: 2025 },
  { char: '🪵', era: 2025 },
  { char: '🐚', era: 2025 },

  // 2026 — Unicode 18.0 draft
  { char: '😬', era: 2026 },
  { char: '🥒', era: 2026 },
  { char: '☄️', era: 2026 },
  { char: '🏮', era: 2026 },
  { char: '⚙️', era: 2026 },

  // Bonus density fillers spread across eras to reach ~140 total
  { char: '🎭', era: 2010 },
  { char: '🎯', era: 2010 },
  { char: '🌈', era: 2010 },
  { char: '🔥', era: 2010 },
  { char: '💯', era: 2010 },
  { char: '💪', era: 2010 },
  { char: '🍎', era: 2010 },
  { char: '🍞', era: 2010 },
  { char: '☕', era: 2010 },
  { char: '🍺', era: 2010 },
  { char: '🐳', era: 2010 },
  { char: '🌊', era: 2010 },
  { char: '🌳', era: 2010 },
  { char: '🌻', era: 2010 },
  { char: '🍀', era: 2010 },
  { char: '⚡', era: 2010 },
  { char: '🎈', era: 2010 },
  { char: '🎁', era: 2010 },
  { char: '🎮', era: 2014 },
  { char: '📷', era: 2014 },
  { char: '🎧', era: 2014 },
  { char: '🚲', era: 2014 },
  { char: '🦊', era: 2016 },
  { char: '🦉', era: 2016 },
  { char: '🥨', era: 2016 },
  { char: '🥓', era: 2016 },
  { char: '🦷', era: 2018 },
  { char: '🥥', era: 2018 },
].sort((a, b) => a.era - b.era)
```

Note: the list above already has `🐳` listed twice (once at era 2010 as a filler, once at era 2025 as the Unicode 17.0 release). The dedup test will fail. **Before re-running the test in Step 4, edit the file and change the 2010 filler entry `{ char: '🐳', era: 2010 }` to `{ char: '🦋', era: 2010 }`.** No other edits required — every other char is unique.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /root/tyx/VINCI && npm test -- tests/lib/hero-emoji-timeline.test.ts --run`
Expected: all 6 tests PASS. The list has ≥120 entries (counting: ~140), all sorted, no dupes.

- [ ] **Step 5: Commit**

```bash
cd /root/tyx/VINCI && git add lib/hero-emoji-timeline.ts tests/lib/hero-emoji-timeline.test.ts && git commit -m "$(cat <<'EOF'
feat(hero): curate 1999→2026 emoji timeline for wallpaper

~140 emojis sorted chronologically: chapter-01 highlightEmojis
plus era-appropriate supplements (pager-era symbols, Unicode 6.0
mass-market set, skin-tone/ZWJ, pandemic-era emotional vocab,
recent draft additions).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create the layout helper

**Files:**
- Create: `lib/hero-emoji-layout.ts`
- Test: `tests/lib/hero-emoji-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/hero-emoji-layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeLayout, type HeroEmoji } from '@/lib/hero-emoji-layout'

const stub = (n: number): HeroEmoji[] =>
  Array.from({ length: n }, (_, i) => ({ char: `e${i}`, era: 2000 + i }))

describe('computeLayout', () => {
  it('returns entries within viewport bounds (desktop)', () => {
    const out = computeLayout(stub(150), 1280, 800, 'desktop')
    out.forEach(p => {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1280)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(800)
    })
  })

  it('drops emojis inside the central safe ellipse (desktop)', () => {
    const vw = 1280, vh = 800
    const cx = vw / 2, cy = vh / 2
    const rx = 240, ry = 140
    const out = computeLayout(stub(200), vw, vh, 'desktop')
    out.forEach(p => {
      const dx = (p.x - cx) / rx
      const dy = (p.y - cy) / ry
      expect(dx * dx + dy * dy, `entry at ${p.x},${p.y} should not be in safe ellipse`).toBeGreaterThanOrEqual(1)
    })
  })

  it('opacity is clamped between 0.35 and 0.85', () => {
    const out = computeLayout(stub(150), 1280, 800, 'desktop')
    out.forEach(p => {
      expect(p.opacity).toBeGreaterThanOrEqual(0.35)
      expect(p.opacity).toBeLessThanOrEqual(0.85)
    })
  })

  it('is deterministic — same inputs yield byte-identical output', () => {
    const a = computeLayout(stub(150), 1280, 800, 'desktop')
    const b = computeLayout(stub(150), 1280, 800, 'desktop')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('mobile profile yields fewer cells than desktop', () => {
    const desk = computeLayout(stub(200), 1280, 800, 'desktop')
    const mob = computeLayout(stub(200), 375, 700, 'mobile')
    expect(mob.length).toBeLessThan(desk.length)
  })

  it('short-viewport profile reduces row count', () => {
    const out = computeLayout(stub(200), 800, 400, 'short')
    // 12 cols × 6 rows = 72 cells max; minus safe-zone drops
    expect(out.length).toBeLessThanOrEqual(72)
  })

  it('assigns emojis in source order (chronological reading)', () => {
    const out = computeLayout(stub(150), 1280, 800, 'desktop')
    const eras = out.map(p => p.era)
    const sorted = [...eras].sort((a, b) => a - b)
    expect(eras).toEqual(sorted)
  })

  it('returned chars are unique (no duplicates from wrapping)', () => {
    const out = computeLayout(stub(200), 1280, 800, 'desktop')
    const seen = new Set(out.map(p => p.char))
    expect(seen.size).toBe(out.length)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd /root/tyx/VINCI && npm test -- tests/lib/hero-emoji-layout.test.ts --run`
Expected: FAIL with module-not-found error.

- [ ] **Step 3: Implement the layout helper**

Create `lib/hero-emoji-layout.ts`:

```ts
import type { HeroEmoji } from '@/lib/hero-emoji-timeline'
export type { HeroEmoji }

export type LayoutProfile = 'desktop' | 'mobile' | 'short'

export type Positioned = {
  char: string
  era: number
  x: number       // px from container left edge (cell centre after jitter)
  y: number       // px from container top edge
  opacity: number // 0.35 – 0.85
  size: number    // px font-size
}

type Profile = {
  cols: number
  rows: number
  rx: number      // safe ellipse radius x
  ry: number      // safe ellipse radius y
  baseSize: number
  sizeJitter: number
}

const PROFILES: Record<LayoutProfile, Profile> = {
  desktop: { cols: 16, rows: 10, rx: 240, ry: 140, baseSize: 28, sizeJitter: 8 },
  mobile:  { cols: 10, rows: 12, rx: 160, ry: 110, baseSize: 22, sizeJitter: 6 },
  short:   { cols: 12, rows: 6,  rx: 220, ry: 90,  baseSize: 22, sizeJitter: 6 },
}

// Deterministic PRNG so SSR and CSR produce identical positions.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function computeLayout(
  emojis: HeroEmoji[],
  vw: number,
  vh: number,
  profile: LayoutProfile,
): Positioned[] {
  const cfg = PROFILES[profile]
  const cellW = vw / cfg.cols
  const cellH = vh / cfg.rows
  const cx = vw / 2
  const cy = vh / 2

  const surviving: Array<{ r: number; c: number; x: number; y: number; t: number }> = []

  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const seed = r * cfg.cols + c + 1
      const rand = mulberry32(seed)
      const jitterX = (rand() - 0.5) * 0.6 * cellW
      const jitterY = (rand() - 0.5) * 0.6 * cellH
      const x = (c + 0.5) * cellW + jitterX
      const y = (r + 0.5) * cellH + jitterY

      const dx = (x - cx) / cfg.rx
      const dy = (y - cy) / cfg.ry
      const t = dx * dx + dy * dy
      if (t < 1) continue  // inside safe ellipse — drop

      surviving.push({ r, c, x, y, t })
    }
  }

  // Reading order: top-to-bottom, left-to-right
  surviving.sort((a, b) => (a.r - b.r) || (a.c - b.c))

  // Sort emojis by era ascending so the chronological reading flows visually
  const ordered = [...emojis].sort((a, b) => a.era - b.era)

  const limit = Math.min(surviving.length, ordered.length)

  return surviving.slice(0, limit).map((cell, i) => {
    const e = ordered[i]
    const sizeRand = mulberry32(cell.r * cfg.cols + cell.c + 999)()
    const size = cfg.baseSize + sizeRand * cfg.sizeJitter
    // Opacity ramps from 0.35 at the edge of the safe ellipse to 0.85 farther out
    const opacity = Math.min(0.85, Math.max(0.35, 0.35 + (cell.t - 1) * 0.5))
    return {
      char: e.char,
      era: e.era,
      x: cell.x,
      y: cell.y,
      opacity,
      size,
    }
  })
}
```

- [ ] **Step 4: Run the test to verify all assertions pass**

Run: `cd /root/tyx/VINCI && npm test -- tests/lib/hero-emoji-layout.test.ts --run`
Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /root/tyx/VINCI && git add lib/hero-emoji-layout.ts tests/lib/hero-emoji-layout.test.ts && git commit -m "$(cat <<'EOF'
feat(hero): add deterministic emoji wallpaper layout helper

Pure function maps emoji list + viewport to positioned entries with
jittered grid placement, central safe-ellipse drop, opacity ramp from
safe-zone edge, and three profiles (desktop / mobile / short).
mulberry32 PRNG ensures SSR-CSR position parity.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build `EmojiField` (static render only)

**Files:**
- Create: `components/hero/EmojiField.tsx`

This task adds the component with positioning, opacity, size — no hover / click / motion yet. We verify with a dev-server screenshot at the end.

- [ ] **Step 1: Create the component file with static render**

Create `components/hero/EmojiField.tsx`:

```tsx
'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HERO_EMOJIS } from '@/lib/hero-emoji-timeline'
import { computeLayout, type LayoutProfile } from '@/lib/hero-emoji-layout'

type Props = {
  labelEnlarge: string  // i18n: "放大 {char}" / "Enlarge {char}"
  labelShrink: string   // i18n: "缩小 {char}" / "Shrink {char}"
}

function pickProfile(vw: number, vh: number): LayoutProfile {
  if (vh < 480) return 'short'
  if (vw < 768) return 'mobile'
  return 'desktop'
}

export function EmojiField({ labelEnlarge, labelShrink }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ vw: number; vh: number } | null>(null)

  // Measure container after mount
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({ vw: rect.width, vh: rect.height })
    }
    measure()
    const ro = new ResizeObserver(() => {
      // 150ms debounce
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(measure, 150)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const debounceRef = useRef<number | null>(null)

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
          aria-label={labelEnlarge.replace('{char}', p.char)}
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
```

Notes:
- `labelEnlarge` / `labelShrink` will be wired from `Hero.tsx` in Task 5.
- `aria-label` swaps depending on `aria-pressed` state in Task 7 — for now it's always the "enlarge" label since nothing is pressed yet.

- [ ] **Step 2: Verify it typechecks**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit 2>&1 | head -30`
Expected: no errors. (If a TS path-alias issue arises, the file imports both with `@/` so they should resolve from existing `tsconfig.json` settings.)

- [ ] **Step 3: Verify Vitest is still happy**

Run: `cd /root/tyx/VINCI && npm test -- --run`
Expected: all tests still PASS (we haven't broken anything; new component has no tests of its own).

- [ ] **Step 4: Commit**

```bash
cd /root/tyx/VINCI && git add components/hero/EmojiField.tsx && git commit -m "$(cat <<'EOF'
feat(hero): add EmojiField client component with static wallpaper render

Renders ~140 emoji buttons positioned by computeLayout, sized + faded by
distance from center. ResizeObserver-driven, no interactions yet — hover
and click toggle land in subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Wire `EmojiField` into `Hero` + add CSS vignette

**Files:**
- Modify: `components/Hero.tsx`
- Modify: `app/[locale]/globals.css`
- Modify: `messages/zh.json` (add `hero.enlarge` / `hero.shrink` keys)
- Modify: `messages/en.json` (mirror)

- [ ] **Step 1: Add i18n keys for aria-labels (both locales)**

Open `messages/zh.json`, locate the `hero` block:

```json
  "hero": {
    "eyebrow": "A DATA STORY",
    "title": "Let's emojify: Trends and Patterns in Emoji Usage",
    "subtitle": "从 📟 到 🤖 · 1999–2026",
    "scrollCue": "scroll"
  },
```

Add two new keys inside `hero` (after `scrollCue`):

```json
  "hero": {
    "eyebrow": "A DATA STORY",
    "title": "Let's emojify: Trends and Patterns in Emoji Usage",
    "subtitle": "从 📟 到 🤖 · 1999–2026",
    "scrollCue": "scroll",
    "enlarge": "放大 {char}",
    "shrink": "缩小 {char}"
  },
```

Open `messages/en.json`, locate the matching `hero` block, and add the English mirrors:

```json
    "enlarge": "Enlarge {char}",
    "shrink": "Shrink {char}"
```

- [ ] **Step 2: Verify the existing i18n parity test still passes**

Run: `cd /root/tyx/VINCI && npm test -- tests/i18n --run`
Expected: PASS (assuming `tests/i18n/message-keys.test.ts` exists; if it doesn't, skip — keys will be checked at compile time via next-intl).

If `tests/i18n/` doesn't exist (verify with `ls tests/i18n 2>/dev/null`), skip this step and trust the typecheck.

- [ ] **Step 3: Refactor `components/Hero.tsx`**

Open `components/Hero.tsx`. Current content:

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <header className="relative h-[88vh] grid place-items-center bg-gradient-to-br from-pink-100 via-rose-50 to-violet-100 overflow-hidden">
      <div className="text-center px-6">
        <div className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{t('eyebrow')}</div>
        <h1 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black leading-[1.05] text-balance max-w-4xl mx-auto">{t('title')}</h1>
        <p className="mt-3 text-sm md:text-lg font-bold text-neutral-700">{t('subtitle')}</p>
        <div className="mt-6 text-3xl md:text-5xl tracking-wide leading-none">📟 😀 ❤️ 🥺 🫶 🤖</div>
        <div className="mt-8 text-xs text-[color:var(--muted)]">↓ {t('scrollCue')}</div>
      </div>
    </header>
  )
}
```

Replace it entirely with:

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { EmojiField } from '@/components/hero/EmojiField'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <header className="relative h-[88vh] overflow-hidden bg-[var(--bg)]">
      <EmojiField
        labelEnlarge={t('enlarge', { char: '' }).trim() || 'Enlarge'}
        labelShrink={t('shrink', { char: '' }).trim() || 'Shrink'}
      />
      <div className="absolute inset-0 grid place-items-center pointer-events-none z-10">
        <div className="text-center px-6 pointer-events-auto">
          <div className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{t('eyebrow')}</div>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black leading-[1.05] text-balance max-w-4xl mx-auto">{t('title')}</h1>
          <p className="mt-3 text-sm md:text-lg font-bold text-neutral-700">{t('subtitle')}</p>
          <div className="mt-8 text-xs text-[color:var(--muted)]">↓ {t('scrollCue')}</div>
        </div>
      </div>
    </header>
  )
}
```

Notes:
- The label props are placeholder strings; `EmojiField` does the actual `{char}` substitution per emoji.
- The gradient and the small 6-emoji row are removed (replaced by `EmojiField`).
- `z-10` on the text overlay sits above the field; `pointer-events-none` on the wrapper passes mousemove through to `EmojiField`; inner card restores `pointer-events-auto` for text selection.

- [ ] **Step 4: Refine label substitution in EmojiField**

The `t('enlarge', { char: '' })` trick above gives us the template prefix/suffix but loses the `{char}` placeholder. Cleaner: pass the raw template and substitute inside `EmojiField`.

Open `components/Hero.tsx` and change the `EmojiField` invocation to:

```tsx
<EmojiField
  labelEnlarge={t('enlarge', { char: '__CHAR__' })}
  labelShrink={t('shrink', { char: '__CHAR__' })}
/>
```

Open `components/hero/EmojiField.tsx` and update the `aria-label` line inside the `<button>`:

```tsx
aria-label={labelEnlarge.replace('__CHAR__', p.char)}
```

(The Chinese template becomes `"放大 __CHAR__"`, swapped per-button to `"放大 🌈"` etc.)

- [ ] **Step 5: Add CSS for vignette and emoji buttons**

Open `app/[locale]/globals.css`. Append at the end:

```css
.hero-vignette {
  position: relative;
}
.hero-vignette::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background: radial-gradient(
    ellipse 60% 50% at 50% 50%,
    var(--bg) 0%,
    color-mix(in oklab, var(--bg) 75%, transparent) 35%,
    transparent 75%
  );
}

.hero-emoji-btn {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  line-height: 1;
  user-select: none;
  z-index: 1;
  transition: filter 150ms ease;
}
.hero-emoji-btn:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 4px;
  border-radius: 4px;
}
.hero-emoji-btn[data-active="true"] {
  z-index: 20;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.18));
}
```

- [ ] **Step 6: Boot dev server and eyeball the result**

Run (background): `cd /root/tyx/VINCI && npm run dev > /tmp/hero-dev.log 2>&1 &`
Wait ~3 seconds for Turbopack startup.
Open: `http://localhost:7777/zh` in your browser (or curl-then-screenshot if headless).

Expected:
- Hero is cream-coloured with ~140 small emojis scattered across it
- Center is empty (safe ellipse) with eyebrow + title + subtitle + scroll cue legible
- Vignette softens the centre area
- No interactions yet (just static field)
- No console errors

Stop the dev server before continuing: `pkill -f "next dev"` (or kill the background job).

- [ ] **Step 7: Run typecheck + tests**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit && npm test -- --run`
Expected: typecheck clean, all tests pass.

- [ ] **Step 8: Commit**

```bash
cd /root/tyx/VINCI && git add components/Hero.tsx components/hero/EmojiField.tsx app/[locale]/globals.css messages/zh.json messages/en.json && git commit -m "$(cat <<'EOF'
feat(hero): wire EmojiField into Hero shell + add vignette CSS

Hero loses its pink-violet gradient and tiny 6-emoji row, gains a flat
cream background with a dense emoji wallpaper, central safe-zone, and
soft radial vignette. Text overlay sits at z-10 above the field, z-5
vignette pseudo-element softens the centre. i18n aria-label templates
added to zh + en.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Add hover magnetic push

**Files:**
- Modify: `components/hero/EmojiField.tsx`

- [ ] **Step 1: Add imports for GSAP**

At the top of `components/hero/EmojiField.tsx`, add after the existing imports:

```ts
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
```

- [ ] **Step 2: Add refs for emoji buttons and cached quickTo functions**

Inside the `EmojiField` component, after the `debounceRef`, add:

```tsx
const emojiRefs = useRef<(HTMLButtonElement | null)[]>([])
const quickToRefs = useRef<Array<{ x: (v: number) => void; y: (v: number) => void } | null>>([])
const reducedMotion = usePrefersReducedMotion()
```

- [ ] **Step 3: Attach `ref` to each emoji button**

Inside the `positioned.map(...)` JSX, change the `<button>` to include the ref:

```tsx
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
```

- [ ] **Step 4: Add the useGSAP hover-physics effect**

Inside `EmojiField`, after the `useMemo(positioned)` block, add:

```tsx
useGSAP(
  () => {
    if (reducedMotion || !size) return
    const container = containerRef.current
    if (!container) return

    // Cache one quickTo per axis per emoji
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
```

- [ ] **Step 5: Verify typecheck**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 6: Boot dev server and eyeball**

Run (background): `cd /root/tyx/VINCI && npm run dev > /tmp/hero-dev.log 2>&1 &`
Wait ~3 seconds, open `http://localhost:7777/zh`.

Expected:
- Moving the cursor over the emoji field pushes nearby emojis outward in a soft radius
- Moving the cursor out of the hero triggers an elastic spring back to original positions
- 60 fps feel, no jank
- Title text stays put

Stop: `pkill -f "next dev"`.

- [ ] **Step 7: Commit**

```bash
cd /root/tyx/VINCI && git add components/hero/EmojiField.tsx && git commit -m "$(cat <<'EOF'
feat(hero): add magnetic-push hover with elastic spring-back

Single rAF-throttled mousemove listener on the container; per-emoji
gsap.quickTo for the hot path; mouseleave triggers elastic.out spring
back to origin. Skipped entirely under prefers-reduced-motion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add click toggle + neighbour push

**Files:**
- Modify: `components/hero/EmojiField.tsx`

- [ ] **Step 1: Add active-set state and toggle handler**

Inside `EmojiField`, after the `reducedMotion` line, add:

```tsx
const [active, setActive] = useState<Set<number>>(new Set())

const toggle = (i: number) => {
  setActive(prev => {
    const next = new Set(prev)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    return next
  })
}
```

- [ ] **Step 2: Add onClick + dynamic aria-label/aria-pressed to each button**

Update the `<button>` in the JSX:

```tsx
<button
  key={`${p.char}-${i}`}
  ref={el => { emojiRefs.current[i] = el }}
  type="button"
  aria-pressed={active.has(i)}
  aria-label={(active.has(i) ? labelShrink : labelEnlarge).replace('__CHAR__', p.char)}
  data-active={active.has(i) ? 'true' : 'false'}
  className="hero-emoji-btn"
  onClick={(e) => {
    e.stopPropagation()
    toggle(i)
  }}
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
```

- [ ] **Step 3: Add a separate useGSAP effect for the click-driven scale + neighbour push**

After the hover effect added in Task 6, add:

```tsx
useGSAP(
  () => {
    if (!size) return
    const dur = reducedMotion ? 0.001 : 0.5
    const ease = reducedMotion ? 'none' : 'back.out(1.7)'

    positioned.forEach((p, i) => {
      const el = emojiRefs.current[i]
      if (!el) return

      if (active.has(i)) {
        gsap.to(el, {
          scale: 3,
          duration: dur,
          ease,
        })
      } else {
        // Sum push vectors from all active emojis within 120px
        let pushX = 0
        let pushY = 0
        active.forEach(j => {
          const a = positioned[j]
          if (!a) return
          const dx = p.x - a.x
          const dy = p.y - a.y
          const d = Math.hypot(dx, dy)
          if (d > 0 && d < 120) {
            const f = (1 - d / 120) * 36
            pushX += (dx / d) * f
            pushY += (dy / d) * f
          }
        })
        gsap.to(el, {
          scale: 1,
          x: pushX,
          y: pushY,
          duration: dur,
          ease: reducedMotion ? 'none' : 'back.out(1.4)',
        })
      }
    })
  },
  { scope: containerRef, dependencies: [active, positioned, reducedMotion, size] },
)
```

- [ ] **Step 4: Make the hover handler skip emojis affected by an active click**

Inside the Task 6 `useGSAP` effect, change the `handleMove` body to suppress hover writes while any emoji is active. Replace the inner loop:

```ts
const handleMove = (e: MouseEvent) => {
  if (active.size > 0) return  // freeze hover while click-pop is active
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
```

Then update the hover effect's `dependencies` array to include `active`:

```ts
{ scope: containerRef, dependencies: [positioned, reducedMotion, size, active] },
```

- [ ] **Step 5: Add Esc keybind to collapse all popped emojis**

After the click-toggle effect, add this small `useEffect`:

```tsx
useEffect(() => {
  if (active.size === 0) return
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setActive(new Set())
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [active])
```

- [ ] **Step 6: Verify typecheck**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 7: Boot dev server and verify all interactions**

Run (background): `cd /root/tyx/VINCI && npm run dev > /tmp/hero-dev.log 2>&1 &`
Wait ~3 seconds, open `http://localhost:7777/zh`.

Manual checks:
- Click an emoji → it grows to 3×, neighbours push aside
- Click another emoji → both are active, both grow, neighbours of both are pushed (sum of vectors)
- Click an already-active emoji → it shrinks back, neighbours spring back
- Press Escape → all active emojis collapse
- While any emoji is active, hover does nothing (frozen)
- After Esc / all-deactivated, hover resumes
- Tab through emojis → focus rings visible, Enter toggles
- No console errors

Stop: `pkill -f "next dev"`.

- [ ] **Step 8: Commit**

```bash
cd /root/tyx/VINCI && git add components/hero/EmojiField.tsx && git commit -m "$(cat <<'EOF'
feat(hero): add click-to-enlarge toggle with neighbour push + Esc

Each emoji is a focusable button with aria-pressed. Clicking scales it
3× with back.out ease; neighbours within 120px receive summed push
vectors from all active emojis. Hover handler freezes while any emoji
is active to avoid conflicting transforms. Esc collapses all.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Touch-device branch

**Files:**
- Modify: `components/hero/EmojiField.tsx`

- [ ] **Step 1: Detect fine-pointer support and skip the mousemove listener on coarse-only devices**

Inside the Task 6 hover `useGSAP` effect, at the very top of the inner function, add a fine-pointer check before any listener attach:

```ts
useGSAP(
  () => {
    if (reducedMotion || !size) return
    const container = containerRef.current
    if (!container) return

    // Skip magnetic push on touch-only devices (no fine pointer)
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!hasFinePointer) return

    // ... (existing quickTo cache + handleMove + handleLeave + listeners) ...
  },
  { scope: containerRef, dependencies: [positioned, reducedMotion, size, active] },
)
```

Place the new lines right after the existing `if (!container) return`. The rest of the effect body is unchanged.

- [ ] **Step 2: Verify reduced-motion already short-circuits (sanity check the existing code)**

Read the hover effect — first line should already be `if (reducedMotion || !size) return`. Read the click effect — it should branch ease/duration on `reducedMotion`. Both come from Tasks 6 and 7; just confirm they're in place.

Run: `cd /root/tyx/VINCI && grep -n "reducedMotion" components/hero/EmojiField.tsx`
Expected: 4 hits (1 declaration + 3 usages — hover guard, click duration, click ease, button focus-visible isn't a usage).

- [ ] **Step 3: Verify with DevTools emulation**

Run (background): `cd /root/tyx/VINCI && npm run dev > /tmp/hero-dev.log 2>&1 &`
Wait ~3 seconds, open `http://localhost:7777/zh`.

Manual:
1. DevTools → Rendering → check "Emulate CSS media feature `prefers-reduced-motion`" = `reduce`. Reload. Hover: nothing moves. Click an emoji: instant scale (no spring), neighbours instant push. Esc: instant collapse. PASS.
2. DevTools → Device toolbar → iPhone 12 (or any touch profile). Reload. Hover with mouse (the simulator forwards as touch): no magnetic push. Tap an emoji: scales as expected.

Stop: `pkill -f "next dev"`.

- [ ] **Step 4: Commit**

```bash
cd /root/tyx/VINCI && git add components/hero/EmojiField.tsx && git commit -m "$(cat <<'EOF'
feat(hero): skip magnetic hover on touch-only devices

Detect via matchMedia('(hover: hover) and (pointer: fine)'). Click
toggle and Esc still work on touch. Pairs with the existing
prefers-reduced-motion guard added in Task 6.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Final verification, build, and project-memory update

**Files:**
- Modify: `project-memory.md`

- [ ] **Step 1: Full test suite green**

Run: `cd /root/tyx/VINCI && npm test -- --run`
Expected: 100% PASS, including the two new files (`hero-emoji-timeline.test.ts`, `hero-emoji-layout.test.ts`) plus all pre-existing tests.

- [ ] **Step 2: TypeScript clean**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: ESLint clean**

Run: `cd /root/tyx/VINCI && npm run lint`
Expected: no errors. Warnings about `any` or unused vars in the new files must be addressed before continuing.

- [ ] **Step 4: Production build succeeds**

Run: `cd /root/tyx/VINCI && npm run build`
Expected: build completes; `/[locale]` route compiles; bundle size for the locale entry increases by roughly 35 kB gzipped (gsap core) — acceptable.

- [ ] **Step 5: Cross-locale smoke check**

Run (background): `cd /root/tyx/VINCI && npm run start > /tmp/hero-prod.log 2>&1 &`
Wait ~3 seconds.

Manual via browser:
1. Visit `http://localhost:7777/zh` — hero shows dense Chinese-locale emoji wallpaper, eyebrow / title / subtitle / scroll cue legible, all interactions work.
2. Visit `http://localhost:7777/en` — same hero, English aria-labels (verify by tabbing to an emoji and inspecting `aria-label` attribute in DevTools).
3. Resize window from 1440px → 600px → 320px: layout reflows at 768px and short-viewport breakpoints; no overflow, no broken text.

Stop: `pkill -f "next start"`.

- [ ] **Step 6: Update `project-memory.md`**

Open `project-memory.md` (existing file at repo root) and locate the section describing the hero component. Add one line under it (or extend the existing one) noting:

```markdown
- Hero: `<EmojiField>` renders ~140-emoji 1999→2026 chronological wallpaper. Magnetic-push hover (GSAP `quickTo` + `elastic.out`) and click-to-enlarge toggle (3× scale + neighbour push). Central safe-ellipse + cream vignette keep title legible. Reduced-motion and touch-only branches skip the hover physics. Layout via pure `lib/hero-emoji-layout.ts` (deterministic, SSR-safe).
```

(If `project-memory.md` has no hero entry yet, add the line under whichever section enumerates top-level page sections.)

- [ ] **Step 7: Commit**

```bash
cd /root/tyx/VINCI && git add project-memory.md && git commit -m "$(cat <<'EOF'
docs: note hero emoji wallpaper in project-memory

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: Final git log review**

Run: `cd /root/tyx/VINCI && git log --oneline -10`
Expected: 9 new commits on top of the prior `fa0b338` baseline (one per task), in order: deps → timeline → layout → static field → wire-in → hover → click → touch/reduced-motion → docs.

---

## Self-review summary

- **Spec coverage:** Every section of the spec maps to a task — install deps (T1), timeline data (T2), layout helper (T3), static field (T4), wire-in + CSS + i18n (T5), hover physics (T6), click toggle (T7), reduced-motion + touch branches (T8), verification + docs (T9). Edge-cases table from the spec is covered by T7 (Esc, rage-click), T8 (touch / reduced-motion), T5 (resize via ResizeObserver), and T4 (SSR via measure-then-render).
- **Placeholder scan:** No `TODO`, no `add appropriate error handling`, no `similar to Task N`. Every code step shows complete code.
- **Type consistency:** `HeroEmoji` is exported from both `lib/hero-emoji-timeline.ts` and `lib/hero-emoji-layout.ts` — same shape. `Positioned` declared once in layout module. `LayoutProfile` declared once. Component prop names (`labelEnlarge`, `labelShrink`) are used consistently across `Hero.tsx` and `EmojiField.tsx`.
