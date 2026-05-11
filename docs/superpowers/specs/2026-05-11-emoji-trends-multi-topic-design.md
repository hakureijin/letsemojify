# Emoji 进化志 · The Evolution of Emoji — Design Spec

**Date:** 2026-05-11
**Author:** Claude (brainstorm session with user)
**Status:** Draft for review

## 1. Project Overview

Build a single-page bilingual scrollytelling web feature that covers four emoji-related trend topics, anchored in publicly-sourced data.

The page is deployed to **port 7777**, replacing the previous Figure 4.17 bump-chart mockup that occupied that port. This project is intentionally decoupled from the previous Figure 4.17 work — it is not a continuation or extension.

### 1.1 Working Title

- Chinese: 《Emoji 进化志》
- English: *The Evolution of Emoji*

### 1.2 Four Chapter Topics

| # | Slug | Chinese title | English title | Accent color |
|---|------|---------------|---------------|--------------|
| 01 | history | 进化之路 | The Evolution Path | `#ff7f6e` peach |
| 02 | criteria | 谁能成为 emoji | Who Gets In | `#6ed1b3` mint |
| 03 | genz | Z 世代手机依赖 | Always On | `#ffc857` sunshine |
| 04 | future | 屏幕之外 | Beyond the Screen | `#8a7fff` violet |

### 1.3 Audience & Tone

Audience is a general-interest reader who is curious about emoji as a cultural artifact. Tone is data-journalism with a playful visual register — Spotify Wrapped's vibe applied to Pew/Unicode-grade evidence. Every quantitative claim carries a source. Every visual is rounded, generous, share-friendly.

## 2. Goals & Non-Goals

### 2.1 Goals

- Build a single coherent web feature that tells four trend stories in sequence.
- Every numerical claim must be traceable to a public, citable source.
- Provide bilingual (zh / en) content with a runtime switcher.
- Look and feel "playful" (Direction C): gradient backgrounds, bold sans-serif, emoji-led, rounded cards, generous whitespace.
- Deploy as a long-running web server on port 7777.

### 2.2 Non-Goals

- This project does **not** modify, replace inline, or reuse the previous Figure 4.17 bump-chart mockup beyond freeing port 7777.
- This project does **not** rely on private/paid datasets (X.com full-archive, Snap proprietary internals beyond their published reports, etc.).
- This project does **not** require a build step toolchain beyond what Next.js provides out of the box (no custom Webpack/Rspack tuning, no SSR streaming experiments).
- This project does **not** include user-generated content, auth, or persistence layers.

## 3. Architecture

### 3.1 Top-Level Shape

Single-page scrollytelling. Vertical scroll drives the journey. Section §01 internally uses horizontal pin-and-translate (vertical scroll input → horizontal translation output within a pinned viewport).

```
Hero
  ↓
§01 The Evolution Path   ← horizontal pin-and-translate
  ↓
§02 Who Gets In          ← stacked sub-blocks
  ↓
§03 Always On            ← stacked sub-blocks
  ↓
§04 Beyond the Screen    ← case-gallery grid with category chips
  ↓
Footer (references)
```

### 3.2 Navigation

- Top-right floating widget combines: language toggle (中 / EN) + table of contents (4 chapter chips that smooth-scroll to each section).
- Section §01 has an additional in-chapter decade index (1999 / 2010 / 2015 / 2024 / etc.) that click-to-jumps within the horizontal timeline.

## 4. Tech Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | Next.js 15 (App Router) | SSG output (`output: 'export'` not used; serve via `next start` for runtime i18n routing) |
| UI | React 19 + TypeScript | Strict mode |
| Styling | Tailwind CSS v4 + CSS variables | Per-section accent colors as CSS vars |
| i18n | `next-intl` | Locale-prefixed routes: `/zh`, `/en`; default redirect from `/` to `/zh` (configurable) |
| Animation | Framer Motion + IntersectionObserver | `useScroll` + `useTransform` for §01 pin; `useInView` for section reveal |
| Charts | Custom SVG using D3 helpers (`d3-scale`, `d3-shape`) | No heavy chart library; bar/area charts are simple SVG; world map uses `d3-geo` with `world-atlas` topojson |
| Data | Typed JSON in `/data/*.json` | One file per section; shared types in `/types` |
| Content strings | JSON in `/messages/{zh,en}.json` | Section structure mirrors data layout |
| Deploy | `next build && next start -p 7777` | Long-running; managed manually (no PM2/systemd in scope) |

## 5. Visual Language

### 5.1 Base Palette

- Background: `#fff8f0` warm off-white (lighter than the prior Fig 4.17 cream)
- Ink: `#181817` near-black
- Muted text: `#6f706d`
- Soft border: `#eadfd0`

### 5.2 Per-Section Accents

Each section has one named accent color used for: chapter header, key SVG strokes/fills, accent dividers, focus state.

- §01 `#ff7f6e` peach
- §02 `#6ed1b3` mint
- §03 `#ffc857` sunshine
- §04 `#8a7fff` violet

Additional secondary colors (for cross-cutting signals):
- Cultural-factor highlight: `#ffb84a` amber (used in §02 criterion cards)
- Reject / negative signal: `#ff7a85` rose (used in §02 reject case + §03 negative-semantic call-outs)

### 5.3 Typography

- Headings: Inter Tight 800–900 (or Inter 900 if Tight unavailable in the chosen font pipeline).
- Body: Inter 400 / 500.
- Numerical hero stats: tabular numerals (`font-variant-numeric: tabular-nums`).

### 5.4 Card / Surface System

- Cards: `border-radius: 12px–16px`, white background, soft shadow `0 4–8px 14–22px rgba(0,0,0,0.04–0.08)`.
- Pill / chip components for category filters and language toggle: `border-radius: 999px`.
- Generous internal padding (10–22px depending on density).

### 5.5 Background Treatments

- Hero: animated gradient mesh (pink `#ffd5e5` → blue `#c4d9ff`).
- Section dividers: subtle linear-gradient strips using the upcoming section's accent.
- §01 inner background: 90° horizontal gradient that shifts hue as the timeline translates (warm pixel-era → cool AI-era).

## 6. Internationalization

### 6.1 Routing

- `/zh/*` and `/en/*` routes provided by `next-intl` middleware.
- Root `/` redirects to `/zh` by default (configurable via env).
- Language toggle button in the top-right rewrites the path between `/zh` and `/en` while preserving the scroll anchor.

### 6.2 Content Files

- `/messages/zh.json` and `/messages/en.json` mirror the same key tree.
- All UI strings (chapter labels, captions, chip labels, footer headings) live in these files.
- All narrative prose lives in these files keyed per-section per-block.
- Long-form prose is allowed to use simple inline markup (e.g., `<b>`) via `next-intl` rich-text feature.

### 6.3 Numbers & Dates

- Numbers formatted with `Intl.NumberFormat` per locale.
- Dates: ISO-style `2024-09` for both locales (avoid locale-specific date ambiguity).
- Citations are language-neutral URLs; descriptive titles localized.

## 7. Data Rigor & Sourcing

### 7.1 Citation Rule

Every quantitative claim (number, percentage, date, ranking) must have a `source` field in the data JSON, with:
- `title` (localized)
- `publisher` (e.g., "Pew Research", "Unicode Consortium")
- `url` (canonical public URL)
- `accessed` (ISO date the URL was verified during development)

### 7.2 Footer References

The page footer renders the deduplicated source list grouped by section, with publisher + title + URL. This is the page's "bibliography."

### 7.3 Primary Source Map

| Section | Primary sources |
|---------|-----------------|
| §01 | `emojipedia.org/emoji-versions`, `unicode.org/emoji/charts` (version release dates + counts) |
| §02 | `unicode.org/emoji/proposals.html`, UTC meeting minutes archive at `unicode.org/L2`, individual proposal PDFs (e.g., L2/15-239 for dumpling) |
| §03 | Pew Research "Teens, Social Media and Technology" 2023; Common Sense Media Census 2024; Adobe Future of Creativity / Emoji Trend Report 2024; Snap Friendship Report 2023; Asurion phone-pickup survey 2024 |
| §04 | Apple newsroom + WWDC24, Snap 2024 Annual Report, MoMA collection record 196070, Google Fonts repo, Tencent annual report (for WeChat sticker economy), individual brand campaign coverage |

### 7.4 Soft-Data Disclosures

Some Block C content in §03 ("same emoji different meaning") is based on cited journalism (WSJ, Vox, Duolingo blog) rather than primary survey data. The block is rendered with a "based on reported usage trends" sub-caption so readers do not mistake it for hard quantitative data.

## 8. Section Designs

### 8.1 Hero

- Full-viewport gradient block (pink → blue mesh).
- Eyebrow `A DATA STORY` label.
- Bilingual title stacked: zh primary, en subtitle (in zh locale); reversed in en locale.
- Subtitle: "From 📟 to 🤖 · 1999–2026".
- Decorative emoji row (6 emojis spanning the four chapters).
- Scroll cue (↓ scroll).
- Top-right floating widget: language toggle + 4 chapter chips.

### 8.2 §01 The Evolution Path

**Layout:** Horizontal pin-and-translate.

**Pin mechanics:**
- Outer container sets height ≈ `250vh` (configurable based on node count).
- Inner `sticky top-0` viewport-height container.
- `useScroll` measures progress within the outer container; `useTransform` maps it to horizontal `translateX` on the timeline row.
- A central "focus zone" magnifies the card crossing the viewport center (scale 1.08 + thicker shadow + show full content).
- Cards outside focus zone are dimmed (opacity 0.25–0.7 by distance).

**Timeline content:**
- ~14 Unicode emoji version nodes (Emoji 0.6 → Emoji 16.0).
- 3 non-Unicode milestones: DoCoMo 1999, iPhone-keyboard-in-Japan 2007, Genmoji 2024.
- Each node: year, version label, brief narrative (one sentence), 3–5 highlight emojis, source URL link.

**Top-of-section decade index:**
- Sticky-or-static decade chips above the timeline: 1999 / 2007 / 2010 / 2015 / 2020 / 2024.
- Clicking a chip scrolls the outer container to the position corresponding to that node (computed offset).

**Bottom progress bar:**
- Horizontal progress with current-node-index / total-nodes label.

**After-pin tail (still inside §01 vertical scroll):**
- Cumulative emoji-count area+line chart from 1999 → 2024, with the same node markers labeled.
- Source caption: Unicode + Emojipedia version totals.

**Fallback:** On mobile or `prefers-reduced-motion`, pin is disabled; cards become a horizontal-swipe scroll container (`scroll-snap-type: x mandatory`).

### 8.3 §02 Who Gets In

Four stacked sub-blocks in mint accent.

**Sub-block 1 — 18-Month Pipeline:**
- 5-step horizontal process diagram: 提交提案 → ESC 小组委评审 → UTC 表决 → Unicode 发布 → 厂商绘制.
- Each step is a numbered circle + label + 1-line description below.
- Entry animation: dots and connectors light up in sequence when the block scrolls into view.
- Caption: "12–18 个月 / 12–18 months from submission to public release."

**Sub-block 2 — Six Criteria Cards (3×2 grid):**
- 5 acceptance criteria + 1 reject-signal card.
- Mint-bordered: usage frequency, multiple usage / extensible meaning, distinctiveness, **cultural representativeness** (amber), **non-brand / non-deity** (amber).
- Rose-bordered: "REJECT WHEN" — short-term fad / overly specific / impossible to render at small size.
- The two "cultural factor" criteria use the amber `#ffb84a` left-border to fulfil the chapter's "cultural" theme.

**Sub-block 3 — Four Case Cards:**
- Three accepted cases: 🥟 Dumpling (Yiying Lu, 2017), 🧕 Person with Headscarf (Rayouf Alhumedhi, 2017), 🧉 Mate (2019).
- One rejected case: a real, verifiable rejected proposal. Working assumption is a brand-mark proposal (e.g., a brand emoji submission that violated Criterion 5 — non-brand rule). **Open item:** the exact proposal must be confirmed from the public L2 archive during implementation; the "Big Mac" placeholder in the design mockup is illustrative only.
- Each card: emoji on gradient header, year + Unicode version, proposer/origin, 2–3 sentence story, link to the L2 proposal PDF.

**Sub-block 4 — Cultural Origins World Map (added per feedback):**
- Small, simplified world map (no political-boundary nuance — use Robinson projection from `world-atlas` topojson).
- Pin markers at recent culturally-representative emoji origins (recent 5–10 years), e.g., dumpling (CN), headscarf (SA), mate (AR/UY), sari (IN), matryoshka (RU), and any other defensible pins.
- Hover/tap a pin to reveal a popover with the emoji, country, year, and proposer.
- Mobile fallback: list view of origin pins instead of map.

### 8.4 §03 Always On

Sunshine accent. Five blocks stacked.

**Hero stat (4 numbers in a row):**
- Daily screen time (Gen Z): 7h 12m — source Common Sense Media Census 2024.
- Daily emoji usage rate (Gen Z): 92% — source Adobe.
- Daily phone pickups (cross-gen): 144 — source Asurion 2024.
- "Almost constantly online" rate (teens): 46% — source Pew 2023.
- All numbers exposed via the cited source for verification.

**Block A — Generational Screen Time Bar:**
- 4 horizontal bars: Gen Z, Millennial, Gen X, Boomer.
- Value labels in bold sunshine accent.
- Caption with primary data sources.

**Block B — Top 5 Emojis Per Generation:**
- 4 columns: Gen Z, Millennial, Gen X, Boomer.
- Each column lists the top 5 emojis in a large emoji row.
- One-line semantic descriptor per column.
- Data source: Snap Friendship Report 2023 + Adobe 2024.

**Block C — Same Emoji, Different Meaning:**
- 3 large emojis: 👍 , 😂 , 🙂.
- For each: older-generation interpretation (positive/literal) vs. Gen Z interpretation (passive-aggressive / cringe / sarcastic).
- Sub-caption discloses this block is "based on reported usage trends" (cited journalism, not primary survey data).

**Block D — 24-Hour Day-in-the-Life (added per feedback):**
- Horizontal 24-hour ribbon (00:00 → 24:00).
- Color intensity encodes self-reported phone-engagement intensity.
- 4–5 labeled spikes: morning unlock, lunch peak, after-school surge, evening peak, late-night doom-scroll.
- Tooltips link to the data source per spike.
- Data sources: Snap "Inside Out" peak-hours data, Common Sense Media time-of-day breakdown. **Open item:** exact source URLs to be confirmed; if some hour-level data is unavailable, the block will use the strongest available proxy and disclose its provenance in the caption.

### 8.5 §04 Beyond the Screen

Violet accent. Curated case gallery.

**Filter row:** six chips — `ALL` plus five category chips (`AI` / `AR/3D` / `Brand` / `Interface` / `Art`). The `ALL` chip is the default; the others filter the grid. Currently-selected chip is highlighted in violet.

**Grid:** 9 cards (4-column on desktop, 2-column on tablet, 1-column on mobile). Every card belongs to exactly one of the five filter categories.

| # | Case | Category | Source anchor |
|---|------|----------|---------------|
| 1 | Apple Genmoji (iOS 18) | AI | apple.com/newsroom, WWDC24 |
| 2 | Vision Pro Spatial Memoji / Persona | AR/3D | developer.apple.com/visionos |
| 3 | Snap AR Bitmoji + Lens | AR/3D | Snap 2024 Annual Report, snap.com/ar |
| 4 | World Emoji Day brand marketing | Brand | emojipedia.org/world-emoji-day |
| 5 | Slack / GitHub emoji as workflow | Interface | Slack workflow docs |
| 6 | DoCoMo originals at MoMA | Art | moma.org/collection/works/196070 |
| 7 | Google Noto Color/Black Emoji | Art | github.com/googlefonts/noto-emoji |
| 8 | Emoji-mnemonic crypto wallet experiment | Interface | Coinbase Engineering / Intuition.eng (TBC) |
| 9 | **WeChat 表情包经济** (added per feedback) | Brand | Tencent annual reports; news coverage of the Tencent sticker open platform |

Each card: emoji + gradient header (color cued to category) + category chip + year/origin label + 1–2 sentence narrative + source link.

**Filter behavior:** clicking a chip filters the grid in place — non-matching cards fade to opacity 0.15 and shrink slightly (using Framer Motion `layout` animations).

**Open items:** Card 8 (emoji-mnemonic wallet) needs a verified canonical source; if none is found, replace with another defensible experimental case (e.g., emoji-based password research papers, or an emoji-emitter art installation).

### 8.6 Footer

- "Sources & Methodology / 来源与方法" heading.
- Grouped reference list (one heading per section).
- Each entry: publisher · title · URL · accessed date.
- Credit line: design + research attribution + project description.
- Echo of language toggle for end-of-page convenience.

## 9. Animation Strategy

| Trigger | Effect | Library |
|---------|--------|---------|
| Section enters viewport | Fade-in + slight slide-up (10–14px) | Framer Motion `useInView` |
| Hero stat numbers visible | Count-up to final value | `useEffect` + `requestAnimationFrame` |
| §01 horizontal pin | Vertical scroll → horizontal translation; central focus zoom | `useScroll` + `useTransform` |
| §01 decade chip click | Smooth scroll to computed offset | Native `scrollTo` |
| Cards / chips hover | scale 1.04 + shadow intensify | Tailwind transitions |
| §04 filter chip click | Cards reflow with layout animation | Framer Motion `layout` |

**Reduced-motion fallbacks:** All scroll-driven and entry animations check `prefers-reduced-motion: reduce` and disable transform/scale animations, replacing them with static layouts. The §01 horizontal pin specifically degrades to a horizontally-swipe-able scroll container.

## 10. File Structure

```
/                                # project root
├─ app/
│   ├─ [locale]/
│   │   ├─ layout.tsx            # locale-scoped layout (language attr, fonts, providers)
│   │   ├─ page.tsx              # the scrollytelling page
│   │   └─ globals.css           # Tailwind base + CSS vars (per-section accents)
│   ├─ favicon.ico
│   └─ layout.tsx                # root layout (next-intl provider)
├─ components/
│   ├─ Hero.tsx
│   ├─ TopNav.tsx                # language toggle + chapter chips
│   ├─ Footer.tsx
│   ├─ chapter-01/
│   │   ├─ EvolutionPath.tsx     # pin-and-translate wrapper
│   │   ├─ TimelineCard.tsx
│   │   ├─ DecadeIndex.tsx
│   │   └─ CumulativeChart.tsx
│   ├─ chapter-02/
│   │   ├─ WhoGetsIn.tsx
│   │   ├─ Pipeline.tsx
│   │   ├─ CriteriaCards.tsx
│   │   ├─ CaseCards.tsx
│   │   └─ OriginMap.tsx
│   ├─ chapter-03/
│   │   ├─ AlwaysOn.tsx
│   │   ├─ HeroStats.tsx
│   │   ├─ ScreenTimeBars.tsx
│   │   ├─ TopEmojisByGen.tsx
│   │   ├─ SemanticShift.tsx
│   │   └─ DayInLife.tsx
│   ├─ chapter-04/
│   │   ├─ BeyondScreen.tsx
│   │   ├─ CategoryChips.tsx
│   │   └─ CaseCard.tsx
│   └─ ui/
│       ├─ Section.tsx           # section wrapper with intersection-observer animation
│       └─ Citation.tsx          # inline source link + tooltip
├─ data/
│   ├─ chapter-01.json
│   ├─ chapter-02.json
│   ├─ chapter-03.json
│   └─ chapter-04.json
├─ messages/
│   ├─ zh.json
│   └─ en.json
├─ types/
│   ├─ source.ts                 # Source { title, publisher, url, accessed }
│   ├─ chapter-01.ts
│   └─ ...
├─ public/
│   └─ world-atlas/countries-110m.json
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

## 11. Build & Deploy

- Local dev: `pnpm dev` (or npm/yarn equivalent) on port 7777 via `dev -- -p 7777` or `next.config.ts` server config.
- Production: `pnpm build && pnpm start -p 7777`.
- Long-running process management is **out of scope** for this spec; the user runs it manually for now.
- No SSR caching layer, no CDN, no analytics.

## 12. Open Items (resolved during implementation, not blockers for the plan)

1. **§02 reject case:** confirm a real rejected proposal from the L2 archive to replace the illustrative "Big Mac" placeholder.
2. **§02 world map pins:** finalize the list of culturally-representative recent emojis and their country attribution (avoid politicizing borders; use cultural-origin convention).
3. **§03 Block D 24-hour data:** verify per-hour engagement data sources; if granular hour data is unavailable, use the most defensible proxy and disclose.
4. **§04 card 8:** confirm a citable source for the emoji-mnemonic wallet experiment, or substitute with another verifiable experimental case.
5. **Hero gradient mesh:** confirm whether to animate (subtle radial motion) or keep static; default to static if performance budget is tight.

## 13. Out of Scope (explicit non-features)

- User accounts, comments, sharing dialogs (beyond default OS share).
- Server-side database, persistence, analytics.
- Custom CMS or content authoring UI; content lives in JSON files in the repo.
- Migration of the previous Figure 4.17 bump-chart code; this is a new codebase under a new directory.
- A `/admin`, `/api` route surface; the page is a pure static-ish single-route experience.
- Print stylesheet / PDF export.

## 14. Acceptance Criteria (high-level)

- Page renders at `http://<host>:7777/` and routes between `/zh` and `/en` via a visible toggle.
- All four sections are visible by scrolling top-to-bottom; in-section navigation (§01 decade index, §04 category chips) functions.
- Every numeric/factual claim has a clickable source link and appears in the footer references list.
- `prefers-reduced-motion: reduce` users see a layout without transform/translate animation.
- Lighthouse Performance ≥ 80 on a mid-tier laptop in production build (informational, not a hard gate).

---

**End of design spec.** The implementation plan (to be authored next via the `writing-plans` skill) will derive its tasks from this document.
