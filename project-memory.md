# VINCI · Project Memory

Last updated: 2026-05-11

## Current project

**Emoji 进化志 · The Evolution of Emoji** — a single-page bilingual (zh/en) scrollytelling web feature about emoji as a cultural artifact, deployed on port `7777`.

- README · `./README.md`
- Spec · `docs/superpowers/specs/2026-05-11-emoji-trends-multi-topic-design.md`
- Plan · `docs/superpowers/plans/2026-05-11-emoji-trends-multi-topic.md`

The site has four chapter sections, in time order:

1. §01 进化之路 / The Evolution Path — horizontal pin-and-translate timeline of every Unicode emoji version (DoCoMo 1999 → Apple Genmoji 2024), followed by an **interactive cumulative-growth chart** (`components/chapter-01/CumulativeChart.tsx`) where every version is a hoverable/focusable/tappable marker with a flip-aware, pinnable tooltip
2. §02 谁能成为 emoji / Who Gets In — Unicode proposal pipeline + 6 selection criteria + 4 case cards + cultural-origins world map
3. §03 Z 世代手机依赖 / Always On — generational screen-time stats, top-emoji-by-generation, semantic-shift, 24h day-in-life
4. §04 屏幕之外 / Beyond the Screen — 9 case cards across AI / AR-3D / Brand / Interface / Art categories with chip-filtered grid

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
- **Content depth** — §02 has 4 cases / 8 origin pins, §03 has 4 stats per block, §04 has 9 cases. Each chapter could comfortably take more rows; the data structures and i18n keying support it without any code changes.
- **Stale `cumulative` array** — the §01 chart now computes the running total from `timeline` directly (see commit `a7f85c0`). The `cumulative` field in `data/chapter-01.json` and the `Chapter01Data['cumulative']` type are no longer read by any component. They're still validated by `tests/data/chapter-01.test.ts` for shape consistency, but could be removed in a future cleanup pass.

## Conventions for future edits

- **Adding a data row**: add to `data/chapter-XX.json` with a `source` block, then add the corresponding string keys to BOTH `messages/zh.json` and `messages/en.json`. The i18n parity test enforces this.
- **Adding a new section / chapter**: extend the types under `types/`, add a `data/chapter-XX.json`, write the components under `components/chapter-XX/`, wire into `app/[locale]/page.tsx`. Follow the existing per-chapter accent-color pattern (each chapter has one primary CSS variable accent).
- **Animations**: prefer Framer Motion gated by the global `<MotionConfig reducedMotion="user">` over hand-rolled CSS transitions. The CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` is the safety net for anything outside Framer Motion.
- **Commits**: project uses git on `master` branch. Commit messages follow `<type>: <imperative>` form (e.g., `feat:`, `fix:`, `data:`, `test:`, `chore:`).

## Known dependency quirks

- **Node 18.20** is enough to run, but `@tailwindcss/oxide` prefers Node 20+. The native binding `@tailwindcss/oxide-linux-x64-gnu` had to be installed explicitly (it's now a `devDependency`) to work around an npm optional-deps bug. If you upgrade to Node 20+, this manual dep can be removed.
- **`pnpm` is not installed** on the dev host. Project scripts use `npm`. The package-lock.json is committed.
- Production build uses **Turbopack** (`next build --turbopack`). Dev too.
