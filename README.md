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

§01 opens with a horizontal pin-and-translate timeline (Framer Motion `useScroll` + `useTransform`) running from DoCoMo 1999 through Emoji 18.0 (draft, 2026). Below it sits an **interactive cumulative-growth chart**: each Unicode version is a focusable emoji medallion (the version's first highlight emoji on a circle); decade-anchor years (1999 / 2010 / 2015 / 2020 / 2024 / 2026) get larger medallions and a year label. Three range-zoom buttons — `全部 / 2015 → 至今 / 2020 → 至今` — narrow the x-domain so the dense 2015-onward markers spread out and become individually clickable. Tooltips reveal year + version + +new + cumulative total + **growth-percent vs. previous** + narrative + source on hover / Tab+Enter / tap; click pins them; Escape or outside-click dismiss. Edge-aware flipping keeps tooltips on-screen. Draft versions (currently Emoji 18.0) render with a dashed medallion stroke + muted color + a `DRAFT` badge.

§02 stacks a 5-step Unicode-proposal pipeline, a 6-card minimalist criteria grid (no decorative borders — tone conveyed by a small uppercase tag inside each card), 4 case cards (3 accepted including 🥟 dumpling / 🧕 headscarf / 🧉 mate, 1 rejected on policy grounds), and an **interactive cultural-origins world map**. Each pin on the map is a focusable button: hover / focus / click reveals a rich tooltip with the emoji + country code + year + cultural-origin label, with the same pin-and-dismiss pattern as the §01 chart.

§03's "Always On" block compares **Gen Z (teens) vs all adults on the same 24-hour axis** as two overlapping smoothed curves; hovering any hour column drops a vertical guide and pops a detail card showing both populations' values plus any documented spike label that applies. The chart includes an explicit methodology disclosure: the 24-point curves are reconstructed from descriptive findings in CSM 2021 (teens) and Reviews.org 2023 (adults), since a fully-reproducible public hour-by-generation dataset doesn't exist.

§04 is a curated 9-case gallery (AI · AR/3D · Brand · Interface · Art) with chip-filtered Framer Motion layout reflow.

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

- §01 — `emojipedia.org/emoji-versions` (per-version pages from Emoji 6.0 through 18.0 draft) + `unicode.org/emoji/charts` (cumulative count cross-check) + `moma.org` (DoCoMo collection) + `apple.com/newsroom` (Genmoji) + `blog.emojipedia.org/whats-new-in-unicode-17-0` + `blog.emojipedia.org/draft-emoji-list-for-2026-2027` (Emoji 17.0 + 18.0 draft)
- §02 — `unicode.org/emoji/proposals.html` + individual L2 proposal PDFs at `unicode.org/L2/`
- §03 — Pew Research · Reviews.org · Adweek/Emogi · Adobe · Common Sense Media Census · Dictionary.com · Deseret News · Bustle
- §04 — Apple Newsroom · Apple Vision Pro Support · Bitmoji · Emojipedia · Slack Help · MoMA · Google Noto Emoji · GitHub Docs · Tencent

The Footer aggregates every cited `source` into a deduplicated bibliography grouped by chapter.

### Stand-in emoji glyphs

Two §01 versions ship with **stand-in emojis** on their medallion because their actual codepoints aren't yet supported by most system fonts:

- **Emoji 17.0** (Sept 2025, rolling out through 2026) — the canonical new chars are 🫪 Distorted Face, 🫯 Fight Cloud, 🫍 Orca, 🪊 Trombone, 🛘 Landslide, 🪎 Treasure Chest. The medallion shows 🫨 (Shaking Face) as a visual stand-in; the tooltip narrative names the actual characters.
- **Emoji 18.0** (draft, expected Sept 2026) — 19 provisional emojis (9 core + 10 skin-tone variants). Candidates include cracking face, pickle, lighthouse, meteor. Codepoints + glyphs are still subject to change, so the medallion uses approximate existing emojis (😬 🥒 🗼 ☄️) and is rendered with a dashed stroke + `DRAFT` badge.

Both narratives explicitly disclose the substitution.

## Accessibility

- **Reduced motion** — `<MotionConfig reducedMotion="user">` makes Framer Motion automatically substitute opacity-only or no-op animations when the OS preference is set. A global CSS `@media (prefers-reduced-motion: reduce)` rule catches anything outside Framer Motion (animation, transition, scroll-behavior). The §01 horizontal pin specifically degrades to a horizontally-swipe-able scroll-snap container.
- **Keyboard** — All interactive elements (chapter chips, language toggle, decade index, range-zoom buttons, category chips, footer source links, cumulative-chart medallions, origin-map pins, day-in-life hour columns) carry `focus-visible:ring-2` styles in the appropriate accent color. Markers are reachable via Tab and activatable with Enter/Space; Escape dismisses any pinned tooltip.
- **Touch** — Every interactive chart marker carries a 44 × 44 px invisible hit area around its visible glyph to meet the WCAG / Apple-HIG touch-target minimum on mobile.
- **Screen readers** — Chart medallions and map pins are `role="button"` with an `aria-label` describing what activating them will reveal. Pinned tooltips switch to `role="dialog"` with `aria-live="polite"`. The §03 dual-curve hour cells read out both populations' values in their aria-label.
- **Bilingual** — The `<html lang>` attribute is set per locale; the language toggle is labelled with `aria-label="Switch to <other locale>"`.

## Implementation history

This project was brainstormed, spec-written, plan-authored, reviewed, and executed across one Claude Code session using the Superpowers workflow:

1. `superpowers:brainstorming` — clarifying questions, design proposals, mockups
2. `superpowers:writing-plans` — 7-chunk / 42-task implementation plan
3. `superpowers:subagent-driven-development` — execution with implementer + reviewer subagents per task

Post-build refinements (designed against the `ui-ux-pro-max` and `frontend-design` skills):

- Interactive §01 cumulative-growth chart with emoji medallions, decade-milestone hierarchy, range-zoom for the dense 2015→ window, growth-percent in the tooltip, and dynamic title
- Emoji 17.0 (Sept 2025, 163 new) + Emoji 18.0 (draft, 2026) data, with stand-in glyphs and a draft badge
- §02 minimalist criteria cards (left-edge stripe removed) and §02 interactive origin-map with the same pin/dismiss interaction pattern
- §03 DayInLife refactor: single mixed-population heat-strip → two-curve generational comparison (Gen Z teens vs all adults) with explicit methodology disclosure
- Global a11y pass: MotionConfig + reduced-motion CSS + focus-visible rings throughout

The spec lives at `docs/superpowers/specs/2026-05-11-emoji-trends-multi-topic-design.md` and the plan at `docs/superpowers/plans/2026-05-11-emoji-trends-multi-topic.md`.
