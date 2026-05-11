# Emoji 进化志 · The Evolution of Emoji

A single-page bilingual (zh / en) scrollytelling web feature that tells four emoji-related trend stories anchored in publicly-sourced data, presented in a playful "Spotify Wrapped" register.

Published on port **7777**.

## Story

| § | Slug | 中文 | English | Accent |
|---|------|------|---------|--------|
| 01 | history | 进化之路 | The Evolution Path | `#ff7f6e` peach |
| 02 | criteria | 谁能成为 emoji | Who Gets In | `#6ed1b3` mint |
| 03 | genz | Z 世代手机依赖 | Always On | `#ffc857` sunshine |
| 04 | future | 屏幕之外 | Beyond the Screen | `#8a7fff` violet |

§01 uses Framer Motion `useScroll` + `useTransform` to drive a horizontal pin-and-translate timeline of every Unicode emoji version from DoCoMo 1999 to Apple Genmoji 2024. Below the pin sits an **interactive cumulative-growth chart**: every Unicode-version data point is a focusable marker that reveals a tooltip with the version's year, label, new-emoji count, running total, narrative, highlight emojis, and source URL on hover / Tab+Enter / tap. Tooltips can be pinned by clicking and dismissed via outside-click or Escape; edge-aware flipping keeps them on-screen.

The other sections stack sub-blocks with intersection-observer reveals.

Every quantitative claim carries a public, citable source — every number, percentage, date, and ranking has a `source` field in the data JSON and surfaces in the footer bibliography.

## Tech stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (CSS-variable token system)
- `next-intl` for locale-prefixed routing (`/zh`, `/en`)
- Framer Motion (scrollytelling, layout animations, `<MotionConfig reducedMotion="user">` for global a11y)
- `d3-scale` / `d3-shape` / `d3-geo` + `world-atlas` topojson for custom SVG charts
- Vitest + React Testing Library

## Run

```bash
# install
npm install

# dev (port 7777)
npm run dev

# production
npm run build && npm run start

# tests
npm test
```

Then open `http://localhost:7777/` — you'll be redirected to `/zh`. Use the language toggle in the top-right to flip between `/zh` and `/en`.

## File layout

```
.
├── app/
│   ├── layout.tsx                # bare root (pass-through; locale layout owns <html>)
│   └── [locale]/
│       ├── layout.tsx            # locale layout + Providers (i18n + MotionConfig)
│       ├── page.tsx              # composes Hero + 4 chapters + Footer
│       └── globals.css           # Tailwind import + design tokens + reduced-motion CSS
├── components/
│   ├── Hero.tsx · TopNav.tsx · Footer.tsx · Providers.tsx
│   ├── ui/                       # Section wrapper · Citation
│   ├── chapter-01/               # EvolutionPath · TimelineCard · DecadeIndex · CumulativeChart
│   ├── chapter-02/               # WhoGetsIn · Pipeline · CriteriaCards · CaseCards · OriginMap
│   ├── chapter-03/               # AlwaysOn · HeroStats · ScreenTimeBars · TopEmojisByGen · SemanticShift · DayInLife
│   └── chapter-04/               # BeyondScreen · CategoryChips · CaseCard
├── data/                         # chapter-{01..04}.json — typed source-cited content
├── messages/                     # zh.json · en.json — locale strings (parity-tested)
├── types/                        # Source · Chapter01–04 types
├── lib/                          # prefers-reduced-motion · countup · decade-jump · filter
├── i18n/                         # routing · request · navigation
├── public/world-atlas/           # countries-110m.json
├── tests/                        # data contracts · logic · i18n parity
├── docs/superpowers/
│   ├── specs/2026-05-11-emoji-trends-multi-topic-design.md
│   └── plans/2026-05-11-emoji-trends-multi-topic.md
└── middleware.ts                 # next-intl locale routing
```

## Data and sourcing

Every chapter has a typed JSON data file under `/data` and a localized-string file under `/messages`. The two are intentionally decoupled so that adding/changing copy never requires touching code, and adding a new data row needs only:

1. Add the row to `data/chapter-XX.json` with its `source` block.
2. Add the `xxKey` translations to BOTH `messages/zh.json` and `messages/en.json`.
3. The i18n parity test (`tests/i18n/message-keys.test.ts`) fails fast if a key only exists in one locale.

Primary sources, by chapter:

- §01 — `emojipedia.org/emoji-versions` + `unicode.org/emoji/charts` (cumulative count cross-check) + `moma.org` (DoCoMo collection) + `apple.com/newsroom` (Genmoji)
- §02 — `unicode.org/emoji/proposals.html` + individual L2 proposal PDFs at `unicode.org/L2/`
- §03 — Pew Research · Reviews.org · Adweek/Emogi · Adobe · Dictionary.com · Deseret News · Bustle
- §04 — Apple Newsroom · Apple Vision Pro Support · Bitmoji · Emojipedia · Slack Help · MoMA · Google Noto Emoji · GitHub Docs · Tencent

The Footer aggregates every cited `source` into a deduplicated bibliography grouped by chapter.

## Accessibility

- **Reduced motion** — `<MotionConfig reducedMotion="user">` makes Framer Motion automatically substitute opacity-only or no-op animations when the OS preference is set. A global CSS `@media (prefers-reduced-motion: reduce)` rule catches anything outside Framer Motion (animation, transition, scroll-behavior). The §01 horizontal pin specifically degrades to a horizontally-swipe-able scroll-snap container.
- **Keyboard** — All interactive elements (chapter chips, language toggle, decade index, category chips, footer source links, cumulative-chart markers) carry `focus-visible:ring-2` styles in the appropriate accent color. The §01 chart markers are reachable via Tab and activatable with Enter/Space; Escape dismisses any pinned tooltip.
- **Touch** — Every interactive chart marker carries a 44 × 44 px invisible hit area around its visible dot to meet the WCAG / Apple-HIG touch-target minimum on mobile.
- **Screen readers** — Chart markers are `role="button"` with an `aria-label` that reads `"<year> <version>: +<added> new emoji, <total> cumulative. Press Enter for details."` Pinned tooltips switch to `role="dialog"` with `aria-live="polite"`.
- **Bilingual** — The `<html lang>` attribute is set per locale; the language toggle is labelled with `aria-label="Switch to <other locale>"`.

## Implementation history

This project was brainstormed, spec-written, plan-authored, reviewed, and executed across one Claude Code session using the Superpowers workflow:

1. `superpowers:brainstorming` — clarifying questions, design proposals, mockups
2. `superpowers:writing-plans` — 7-chunk / 42-task implementation plan
3. `superpowers:subagent-driven-development` — execution with implementer + reviewer subagents per task

Post-build refinements added the interactive cumulative-growth chart in §01 (designed against `ui-ux-pro-max` and `frontend-design` skills) and the global a11y pass (MotionConfig + reduced-motion CSS + focus-visible rings).

The spec lives at `docs/superpowers/specs/2026-05-11-emoji-trends-multi-topic-design.md` and the plan at `docs/superpowers/plans/2026-05-11-emoji-trends-multi-topic.md`.
