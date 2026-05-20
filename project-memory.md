# VINCI · Project Memory

Last updated: 2026-05-11

## Current project

**Emoji 进化志 · The Evolution of Emoji** — a single-page bilingual (zh/en) scrollytelling web feature about emoji as a cultural artifact, deployed on port `7777`.

- README · `./README.md`
- Spec · `docs/superpowers/specs/2026-05-11-emoji-trends-multi-topic-design.md`
- Plan · `docs/superpowers/plans/2026-05-11-emoji-trends-multi-topic.md`

The site has four chapter sections, in time order:

1. §01 进化之路 / The Evolution Path — horizontal pin-and-translate timeline of every Unicode emoji version (DoCoMo 1999 → Emoji 18.0 draft 2026), followed by an **interactive cumulative-growth chart** (`components/chapter-01/CumulativeChart.tsx`). Each version is an **emoji medallion** (the version's first highlight emoji on a circle), with decade-anchor years (1999/2010/2015/2020/2024/2026) styled as larger flagship markers. Three **range-zoom buttons** (`全部 / 2015→ / 2020→`) narrow the x-domain so the dense modern era spreads out. Tooltips show year + version + +new + cumulative + growth-percent + narrative + source on hover/Tab+Enter/tap; clip-path keeps the line/area visually continuous across range changes. Two **version-diff dropdowns** (`从 / 到`) beneath the chart let readers pick any two contributing versions; the chosen markers gain bold accent strokes and small A/B chips, and a card below shows added count, growth %, year span, and a chronological strip of representative new emojis for the intermediate versions. Pure `computeVersionDiff` exported from the same component file and covered by `tests/logic/version-diff.test.ts`.
2. §02 谁能成为 emoji / Who Gets In — Unicode proposal pipeline + **minimalist criteria cards** (no left-edge stripes; tone shown via a small uppercase tag inside each card) + 4 case cards + **interactive cultural-origins world map** where every pin is a focusable button with the same hover/tap-pin tooltip pattern as the §01 chart.
3. §03 Z 世代手机依赖 / Always On — generational screen-time stats, top-emoji-by-generation, semantic-shift, and a **two-curve generational comparison** for the 24-hour pattern (Gen Z teens vs all adults overlaid on the same axis, with hover-anywhere-shows-both-values interaction).
4. §04 屏幕之外 / Beyond the Screen — 9 case cards across AI / AR-3D / Brand / Interface / Art categories with chip-filtered Framer Motion layout reflow.

Visual register is intentionally playful (gradient backgrounds, rounded cards, emoji-led big type) while content discipline is strict — every quantitative claim has a source URL and surfaces in the footer bibliography.

Tech stack: Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 · next-intl · Framer Motion · d3-* + world-atlas · Vitest.

## Run

```bash
cd /root/tyx/VINCI
npm install
npm run dev          # port 7777
# or
npm run build && npm run start
```

## Relationship to the previous Figure 4.17 work

The prior brainstorm in this repo was a single-page mockup for Figure 4.17 of the paper (a bump chart of "Top emojis on X.com: 2023-2026"). Per the new spec's §1, this current project is **intentionally decoupled** from that work — it occupies the same port 7777 but is not a continuation. The Figure 4.17 mockup artifacts still live under `.superpowers/brainstorm/1421938-1777524397/` and are tracked in git, in case they're useful as a style reference.

Useful research notes carried over from the Figure 4.17 brainstorm (still accurate as background):

- **`😂` Face with Tears of Joy** had long-term dominance on Twitter through the 2010s.
- **`😭` Loudly Crying Face** challenged/overtook `😂` around the COVID pandemic.
- **`🥺` Pleading Face** declined after its pandemic-era rise.
- These shifts informed §03's "same emoji, different meaning by generation" block — `😂` is now Gen-Z code for "cringe" (use `💀` instead).

Data sources investigated in the prior brainstorm (some used here, some not):

- Emojipedia · `https://emojipedia.org/emoji-versions` — authoritative for per-version emoji counts; **heavily used in §01**.
- X.com / Twitter API — full-archive search and counts. Not used in current project (would need paid access).
- Emojitracker · `https://emojitracker.com/` — real-time popularity; not used.

## Open follow-ups

- **§02 rejected case** — the spec called for a verified rejected Unicode proposal. The current data ships with a "deity category" policy-based rejection (citing the Unicode exclusion factors page) because no specific L2 PDF for a rejected proposal could be confirmed during the implementation pass. If a real rejected proposal can be found in the L2 archive, swap it in.
- **§04 emoji wallet** — the plan originally called for an emoji-mnemonic crypto-wallet case, which was substituted with GitHub Emoji Reactions (same `interface` category) when no primary source could be verified. Documented in the commit message.
- **A11y verification in a real browser** — code-level fixes are in place (MotionConfig, prefers-reduced-motion CSS, focus-visible rings, 44 px touch targets on chart markers, role/aria-expanded/aria-live on tooltips), but a Lighthouse / axe-core run in an actual browser was not performed during the implementation session.
- **Content depth** — §02 has 4 cases / 8 origin pins, §04 has 9 cases. Each chapter could comfortably take more rows; the data structures and i18n keying support it without any code changes.
- **Stale `cumulative` array** — the §01 chart now derives the running total from `timeline` directly. The `cumulative` field in `data/chapter-01.json` and the `Chapter01Data['cumulative']` type are no longer read by any component. They're still validated by `tests/data/chapter-01.test.ts` for shape consistency, but could be removed in a future cleanup pass.
- **§03 hour-by-generation data is reconstructed** — the two DayInLife curves are 24-point series synthesized from descriptive findings in CSM 2021 (teens) and Reviews.org 2023 (adults), with explicit disclosure in the chart caption. A fully-reproducible public dataset would require paid access to Nielsen / Snap internal segmentation; if such a source becomes available, replace the curves and remove the methodology disclaimer.
- **Emoji 17.0 stand-in glyphs** — Emoji 17.0 shipped Sept 2025 with new codepoints (🫪 🫯 🫍 🪊 etc.) that most system fonts won't have until 2026 platform rollouts complete. The chart medallion currently shows visually-similar pre-existing emojis (🫨 💥 🐳 🎺) with a stand-in disclosure in the tooltip narrative. When system-font support is widespread, the `highlightEmojis` array in `data/chapter-01.json` can be reverted to the canonical 17.0 codepoints.
- **Emoji 18.0 codepoints are provisional** — final glyphs may shift between now (May 2026) and the Sept 2026 release. Same stand-in pattern as 17.0; expected to need updates when 18.0 is finalised.

## Conventions for future edits

- **Adding a data row**: add to `data/chapter-XX.json` with a `source` block, then add the corresponding string keys to BOTH `messages/zh.json` and `messages/en.json`. The i18n parity test enforces this.
- **Adding a new section / chapter**: extend the types under `types/`, add a `data/chapter-XX.json`, write the components under `components/chapter-XX/`, wire into `app/[locale]/page.tsx`. Follow the existing per-chapter accent-color pattern (each chapter has one primary CSS variable accent).
- **Animations**: prefer Framer Motion gated by the global `<MotionConfig reducedMotion="user">` over hand-rolled CSS transitions. The CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` is the safety net for anything outside Framer Motion.
- **Interactive chart marker pattern**: all three of `CumulativeChart`, `OriginMap`, `DayInLife` use the same shape — `useState` for `activeId`/`pinnedId`, `useEffect` for outside-click + Escape, 44 px invisible hit areas, `role="button" tabIndex={0}`, hover/focus/blur for transient state, click + Enter/Space for pin/unpin. New interactive charts should follow this same shape for consistency.
- **i18n with fully-qualified keys**: when a component's `useTranslations()` has a namespace prefix (e.g. `useTranslations('ch01.chart')`) but it also needs to resolve a fully-qualified key from data (e.g. `node.narrativeKey = 'ch01.timeline.x.narrative'`), declare a second un-namespaced `useTranslations()` for the fully-qualified path. Otherwise the namespace double-prefixes and produces `MISSING_MESSAGE` errors. See `CumulativeChart.tsx` and `OriginMap.tsx`.
- **Stand-in emojis for unsupported codepoints**: if a data row references emojis that aren't yet in mainstream system fonts (e.g. Emoji 17.0 / 18.0 codepoints), use a visually-similar pre-existing emoji in `highlightEmojis` and disclose the substitution in the narrative text. Keep the source URL pointing at the canonical version page.
- **Commits**: project uses git on `master` branch. Commit messages follow `<type>: <imperative>` form (e.g., `feat:`, `fix:`, `data:`, `test:`, `chore:`).

## Known dependency quirks

- **Node 18.20** is enough to run, but `@tailwindcss/oxide` prefers Node 20+. The native binding `@tailwindcss/oxide-linux-x64-gnu` had to be installed explicitly (it's now a `devDependency`) to work around an npm optional-deps bug. If you upgrade to Node 20+, this manual dep can be removed.
- **`pnpm` is not installed** on the dev host. Project scripts use `npm`. The package-lock.json is committed.
- Production build uses **Turbopack** (`next build --turbopack`). Dev too.
