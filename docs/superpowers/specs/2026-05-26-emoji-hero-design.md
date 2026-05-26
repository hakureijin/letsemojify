# Hero Emoji Wallpaper · Design

Date: 2026-05-26

## Goal

Replace the current `<Hero>` (a small 6-emoji row on a pink-violet gradient) with a dense, interactive **emoji-timeline wallpaper** that reinforces the article's 1999→2026 thesis the moment the reader lands.

Three interactions, all GSAP-driven:

1. **Hover** — a soft magnetic field around the cursor pushes nearby emojis outward; releasing snaps them back with an elastic spring.
2. **Click** — the clicked emoji enlarges 3× in place and pushes its neighbours aside; clicking it again restores it.
3. **Idle** — emojis sit still at their assigned positions, rendered roughly chronologically left-to-right / top-to-bottom (1999 top-left → 2026 bottom-right). A central "avoidance zone" keeps the eyebrow / title / subtitle / scroll cue fully legible.

The text colour, font, copy, and layout of the hero text itself do not change. Only the background treatment and interactions are new.

## In scope

- `components/Hero.tsx` — refactor into a thin shell rendering `<EmojiField>` + the existing centered text overlay
- `components/hero/EmojiField.tsx` — new client component owning the emoji wallpaper, hover physics, and click state
- `lib/hero-emoji-timeline.ts` — new module exporting the ordered emoji list `{ char, era }[]`
- `lib/hero-emoji-layout.ts` — new pure module exporting `computeLayout(emojis, vw, vh) → Positioned[]`
- `package.json` — add `gsap` (core only, free tier — no Club GSAP plugins required)
- `app/[locale]/globals.css` — add `.hero-vignette` radial-gradient overlay token; keep existing `--bg` / `--ink` / `--muted` tokens unchanged
- A vitest unit test for `lib/hero-emoji-layout.ts` at `tests/lib/hero-emoji-layout.test.ts` (pure function — easy to cover; see Testing section for assertions)

## Out of scope

- Touching any §01, §02, navigation, or footer component
- Adding any GSAP paid plugin (no Flip, no Inertia, no Draggable)
- Adding new emoji to the article's data layer — the wallpaper consumes a curated list, not the chapter-01 catalogue
- Internationalising the wallpaper itself (the emoji glyphs are universal; only the existing hero text is i18n'd)
- Persisting which emojis the reader has "popped" across navigations or sessions

## Component design

### `components/Hero.tsx` (refactored)

Thin client component:

```tsx
<header className="relative h-[88vh] overflow-hidden bg-[var(--bg)]">
  <EmojiField />
  <div className="absolute inset-0 grid place-items-center pointer-events-none">
    <div className="text-center px-6 pointer-events-auto">
      <div className="eyebrow">{t('eyebrow')}</div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <div className="scroll-cue">↓ {t('scrollCue')}</div>
    </div>
  </div>
</header>
```

- The gradient background `bg-gradient-to-br from-pink-100 via-rose-50 to-violet-100` is removed; the hero is now flat `var(--bg)` (cream) with `EmojiField` providing all visual energy.
- The 6-emoji row currently on line 12 is removed.
- The text overlay is `pointer-events: none` on the wrapper so `EmojiField` receives all mousemove events; the inner card is `pointer-events: auto` so text remains selectable.

### `components/hero/EmojiField.tsx`

Client component, single ref per emoji, single mousemove listener on the container.

State:

```ts
const [active, setActive] = useState<Set<number>>(new Set());
const containerRef = useRef<HTMLDivElement>(null);
const emojiRefs = useRef<(HTMLButtonElement | null)[]>([]);
const positioned = useMemo(() => computeLayout(EMOJIS, vw, vh, isMobile), [vw, vh, isMobile]);
```

Rendering:

```tsx
<div ref={containerRef} className="absolute inset-0 hero-vignette" role="presentation">
  {positioned.map((p, i) => (
    <button
      key={i}
      ref={el => { emojiRefs.current[i] = el; }}
      type="button"
      aria-pressed={active.has(i)}
      aria-label={`${active.has(i) ? '缩小' : '放大'} ${p.char}`}
      onClick={(e) => { e.stopPropagation(); toggle(i); }}
      style={{
        position: 'absolute',
        left: p.x,
        top: p.y,
        opacity: p.opacity,
        fontSize: p.size,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {p.char}
    </button>
  ))}
</div>
```

- Each emoji is a real `<button>` so keyboard users can Tab through, Enter/Space to toggle.
- The container has `role="presentation"` so the screen reader doesn't announce 150 buttons in the document outline; users who *do* Tab into one still get the per-button `aria-label`.
- Buttons are otherwise unstyled (no background, no border) — they read as floating glyphs.

### `lib/hero-emoji-timeline.ts`

Exports:

```ts
export type HeroEmoji = { char: string; era: number };
export const HERO_EMOJIS: HeroEmoji[];  // length ~150, sorted by era ascending
```

Source composition:

1. All `highlightEmojis` from `data/chapter-01.json` timeline entries (≈ 60 entries × ~3 emojis ≈ 60 tagged with the entry's `year`)
2. Supplemented with ~90 curated era-appropriate additions, hand-picked to fill gaps:
   - 1999–2007 (pager / early-i-mode era): ☀️ ☂️ ❄️ ⭐ 📞 📠 ✉️ 💾 📺 etc.
   - 2010–2014 (Unicode 6.0 launch): 😀 😂 ❤️ 👍 🎉 🍔 🍕 🐱 🐶 🌍 ⚽ 📱 etc.
   - 2015–2018 (skin-tone & ZWJ era): 🦄 🌮 🥑 🤔 🙏 🌈 🦸 🥶 🤖 etc.
   - 2019–2022 (pandemic emotional era): 🥲 🥺 🫶 🫠 🤍 🫀 🧘 ❤️‍🔥 etc.
   - 2023–2026 (recent / draft): 🩷 🫨 🪷 🍋‍🟩 🫩 🪾 🫆 ⚙️ ✨ etc.
3. Deduplicated (a glyph that already appears as a chapter-01 highlight is not re-added by the curated list)

The whole list is sorted by `era` ascending so a downstream `computeLayout` can simply iterate.

### `lib/hero-emoji-layout.ts`

Pure function — no React, no DOM:

```ts
export type Positioned = {
  char: string;
  era: number;
  x: number;        // px from container left edge
  y: number;        // px from container top edge
  opacity: number;  // 0.35 – 0.85
  size: number;     // px font-size (28–36 desktop, 22–28 mobile)
};

export function computeLayout(
  emojis: HeroEmoji[],
  vw: number,
  vh: number,
  isMobile: boolean,
): Positioned[];
```

Algorithm:

1. Grid sizing — `isMobile` is `vw < 768`. Desktop: `cols=16, rows=10`. Mobile: `cols=10, rows=12`. Very short viewports (`vh < 480`, e.g. landscape phone) override to `cols=12, rows=6`. Cell size = `(vw/cols, vh/rows)`.
2. For each cell `(r, c)`:
   - `cx = (c + 0.5) * cellW`, `cy = (r + 0.5) * cellH`
   - Jitter: `cx += deterministic_random(r, c) * 0.3 * cellW - 0.15 * cellW` (deterministic so SSR-CSR match; seeded by `r*cols+c`)
3. Compute distance from the safe ellipse `(centerX, centerY, rx, ry)`:
   - `rx, ry`: desktop 240 × 140; mobile 160 × 110
   - `t = (dx/rx)² + (dy/ry)²` — `t < 1` is inside, `t >= 1` is outside
4. Drop cells where `t < 1` (inside safe zone) — emojis just don't exist there
5. For surviving cells, opacity ramps: `opacity = clamp(0.35 + (t - 1) * 0.5, 0.35, 0.85)` so the ring just outside the safe ellipse fades from cream to ~85% by ~80px out
6. Size jitter: `size = baseSize + deterministic_random(r, c) * sizeRange` (e.g. desktop 28 + [0, 8])
7. Assign emojis in order: surviving cells sorted by `(r, c)` get `HERO_EMOJIS[k]` in turn (chronological reading order top-to-bottom, left-to-right). If `cells.length > emojis.length`, wrap modulo; if fewer, truncate.

Deterministic random: a tiny `mulberry32(seed)` PRNG inlined — no external dependency.

### Vignette

`.hero-vignette { background: radial-gradient(ellipse 60% 50% at 50% 50%, var(--bg) 0%, transparent 75%); }` — a soft cream wash behind the emoji field that strengthens the central "safe zone" already created by the layout drop.

DOM layering inside the hero:
- `z-index: 1` — emoji buttons (children of `EmojiField` container)
- `z-index: 5` — `.hero-vignette::after` pseudo-element on the `EmojiField` container, `pointer-events: none`, the radial-gradient cream wash. Sits *over* emojis so the centre is muted.
- `z-index: 10` — text overlay (eyebrow / title / subtitle / scroll cue)

Active (popped) emojis temporarily get `z-index: 20` so they lift above the vignette during their 3× scale.

## Interaction design

### Hover — magnetic push + spring back

- One `mousemove` listener bound to `containerRef.current` on mount, removed on unmount (handled by `useGSAP` cleanup)
- Throttled via rAF (`useRef<number | null>(null)` request-id flag)
- For each emoji `i`:
  - Cache `quickToX[i] = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' })` and `quickToY[i] = ...` once on mount
  - On each tick: `dx = ex - mx; dy = ey - my; d = hypot(dx, dy)`. If `d < 100`: `force = (1 - d/100)² × 28`; call `quickToX[i](dx/d × force)`, `quickToY[i](dy/d × force)`. Else: `quickToX[i](0)`, `quickToY[i](0)`.
- On `mouseleave`: `gsap.to(emojiRefs.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' })`
- All `quickTo` functions and listeners scoped via `useGSAP(() => { ... }, { scope: containerRef })` so they're cleaned up automatically

`gsap.matchMedia()` shim: when `(prefers-reduced-motion: reduce)` matches, the mousemove handler is never attached and the elastic spring is skipped (`x` and `y` stay at 0 always).

### Click — toggle scale + push neighbours

State change: `setActive(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })`.

A `useGSAP` effect with `dependencies: [active, positioned]` rewrites every emoji's transform target:

```ts
positioned.forEach((p, i) => {
  const el = emojiRefs.current[i];
  if (!el) return;

  if (active.has(i)) {
    // ACTIVE: scale 3, lift, halo
    gsap.to(el, {
      scale: 3,
      zIndex: 20,
      duration: 0.5,
      ease: 'back.out(1.7)',
    });
  } else {
    // INACTIVE: compute neighbour push from all active emojis
    let pushX = 0, pushY = 0;
    active.forEach(j => {
      const a = positioned[j];
      const dx = p.x - a.x, dy = p.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < 120) {
        const f = (1 - d / 120) * 36;
        pushX += (dx / d) * f;
        pushY += (dy / d) * f;
      }
    });
    gsap.to(el, {
      scale: 1,
      x: pushX,  // additive with hover offset? see note below
      y: pushY,
      zIndex: 'auto',
      duration: 0.5,
      ease: 'back.out(1.4)',
    });
  }
});
```

**Hover/click translation collision**: hover writes `x`/`y` via `quickTo`; click writes `x`/`y` via `gsap.to`. They conflict. Resolution: while `active.size > 0`, the mousemove handler ignores any emoji that is in `active` OR within 120px of any active one (so push offsets are stable while emojis are popped). When the active set becomes empty again, mousemove fully resumes.

Active emoji styling: a thin `outline: 2px solid color-mix(in oklch, var(--ink) 30%, transparent); outline-offset: 4px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.18));` toggled via a `data-active` attribute the CSS reads. This gives popped emojis visible weight without adding more GSAP work.

`prefers-reduced-motion`: click still works, but `duration: 0.001` and ease `none` so the change is effectively instant.

## Accessibility

- Each emoji is a focusable `<button>` with `aria-pressed` and a Chinese `aria-label` (page is bilingual; defer to the locale prop for `aria-label` translation — pass via prop from `Hero.tsx`)
- Tab order follows DOM order (top-to-bottom, left-to-right — matches the chronological reading)
- Keyboard: Tab to focus, Enter / Space to toggle. Esc collapses any popped emoji (handler on container)
- Screen reader: container `role="presentation"` keeps the 150 buttons out of the document outline; users who Tab in still get per-button labels
- Hero text `<h1>`, `<p>`, eyebrow `<div>` retain semantic markup — no change
- `prefers-reduced-motion`: implemented via `gsap.matchMedia()` (see Interaction sections)
- Focus ring: visible 2px ring on focused emoji using `:focus-visible` — required for keyboard navigation
- Skip-link: not added in this change (the article already has `TopNav` providing navigation)

## Performance

- ~150 DOM nodes (buttons with text) — well under any concern threshold on modern browsers
- All animation via CSS `transform` (`translate`, `scale`) + `opacity` — composited on GPU, no layout/paint
- `will-change: transform` is *not* set globally (would force ~150 layers) — only applied transiently via `data-hovering` attribute set by mousemove on the topmost ~20 closest emojis
- Mousemove handler is rAF-throttled — at most one update per frame regardless of event rate
- `gsap.quickTo()` (not `gsap.to()`) for the mousemove path — quickTo skips object allocation and is the canonical hot-path API
- Resize: `ResizeObserver` on container, debounced 150 ms; `computeLayout` re-runs and emoji positions re-render (acceptable given typical user behaviour — they don't constantly resize)
- SSR: `EmojiField` renders nothing on the server (returns `null` while `vw === 0`), measures on `useLayoutEffect`, then renders. Brief blank flash is acceptable for a hero on a static article. (Alternative considered: render with default viewport `1280 × 800` server-side; rejected because mismatch causes hydration error.) **Decision: render `null` until measured.**
- Touch devices: no `mousemove` listener attached (detected via `matchMedia('(hover: hover) and (pointer: fine)')`); click-toggle still works

## Bundle cost

- `gsap` core: ~33 kB gzipped. Acceptable for a hero on a data-story site where users will spend > 5 minutes scrolling
- No plugins added → no Club GSAP licensing required
- Tree-shaking: `import { gsap } from 'gsap'` only — no plugin registrations

## Text-readability contrast

Concrete numbers for review:

- Title (`text-3xl sm:text-4xl md:text-6xl font-black text-[var(--ink)]`, `var(--ink) = #181817`) over `var(--bg) = #fff8f0` cream → contrast ratio 14.8:1 ≫ WCAG AA 7:1
- Safe ellipse drops emojis entirely from the centre 480 × 280 px box; outside that, vignette fades emojis further with cream wash
- Mobile safe ellipse 320 × 220 px keeps the smaller text size legible
- If post-launch testing shows the eyebrow text on the *edge* of the safe ellipse interferes with adjacent emojis, the vignette band can be widened by tuning the ellipse `rx, ry` constants in `lib/hero-emoji-layout.ts` — single change

## Testing

- Unit test `tests/lib/hero-emoji-layout.test.ts` (vitest, follows existing project conventions):
  - Given 150 emojis and 1280×800 viewport, returns ≤ 160 positioned entries
  - All returned entries have `x` in `[0, vw]`, `y` in `[0, vh]`, opacity in `[0.35, 0.85]`
  - No entry lies inside the safe ellipse
  - Two calls with same inputs return byte-identical output (determinism check)
- Manual checks: load the page, mouse across the hero, click a few emojis, Tab through, toggle DevTools reduced-motion emulation, resize the window, load on a touch device

## Edge cases

| Case | Behaviour |
|---|---|
| User opens page with reduced-motion preference | Static field at unchanged opacity; click still works instantly |
| Touch-only device (no fine pointer) | No magnetic push; click toggle still works |
| Container height < 480px (e.g. landscape phone) | Layout uses short-viewport profile (`cols=12, rows=6`) and base font size shrinks to 22–28 px |
| User pops 30 emojis | All animate to `scale: 3`; performance still fine (transforms only). No artificial cap is added |
| User rage-clicks the same emoji | `useGSAP` re-runs on each state flip; GSAP cancels in-flight tweens on the same target automatically |
| Window resized mid-interaction | `ResizeObserver` debounces 150 ms, then `computeLayout` re-runs, GSAP transforms reset to 0 via the active-set effect |
| `localStorage` disabled | No effect — nothing is persisted |
| Page loaded as second locale (`/en`) | Same emojis, English aria-labels via the locale-aware label prop |

## Open questions

None. All four design decisions are confirmed:

1. **Emoji source** — timeline-curated 1999→2026 chronological wallpaper
2. **Hover physics** — magnetic push + elastic spring back (`gsap.quickTo` + `elastic.out`)
3. **Click behaviour** — in-place 3× scale + neighbour push (toggle, multiple simultaneously allowed)
4. **Text readability** — central avoidance ellipse + cream vignette (no frosted card)

## Implementation order (handed to writing-plans)

1. Install `gsap`, add to deps
2. Write `lib/hero-emoji-timeline.ts` + its unit test
3. Write `lib/hero-emoji-layout.ts` + its unit test
4. Build `components/hero/EmojiField.tsx` — start with static render only (no interactions)
5. Add hover physics (`mousemove` + `quickTo` + `elastic.out`)
6. Add click toggle (`useState` + `useGSAP` effect + push computation)
7. Add `prefers-reduced-motion` shim and touch-device branch
8. Refactor `components/Hero.tsx` to embed `EmojiField` and drop the gradient + small emoji row
9. Add `.hero-vignette` to `globals.css`
10. Manual verification across reduced-motion / touch / resize / Tab / Esc
