# §01 Emoji Category Treemap + Chapter Pruning · Design

Date: 2026-05-21

## Goal

Two coupled changes to the single-page Emoji 进化志 feature:

1. **Add a Unicode-category treemap** inside §01 directly below `<CumulativeChart>`. A time slider (snapping to Unicode-version release years) drives an animated 9-group treemap that shows how the *composition* of the emoji catalogue has shifted as the catalogue itself grew. This is the natural sister-visualisation to the existing cumulative line chart: cumulative *total* answers "how many?", treemap answers "of what kind?".
2. **Delete §03 (Always On) and §04 (Beyond the Screen)** along with all their components, data, types, tests, i18n keys, and bibliography references. The site collapses to two chapters: §01 evolution → §02 who gets in.

As a consequence of these two changes, §02 "谁能成为 emoji" naturally sits "further back" — after both the cumulative chart and the new treemap — without needing any reorder logic on its own.

## In scope

- `components/chapter-01/CategoryTreemap.tsx` — new client component
- `data/chapter-01-categories.json` — new data file (generated, committed)
- `scripts/build-emoji-categories.mjs` — reproducible build script
- Type extensions in `types/chapter-01.ts`
- i18n keys `ch01.categoryTreemap.*` in `messages/{zh,en}.json`
- Deletion of `components/chapter-03/`, `components/chapter-04/`, `data/chapter-{03,04}.json`, `types/chapter-{03,04}.ts`, `tests/data/chapter-{03,04}.test.ts`
- Deletion of `ch03.*` and `ch04.*` i18n key trees + `nav.{ch03,ch04}` keys
- `TopNav.tsx` chapter list trimmed to `['ch01', 'ch02']`
- `Footer.tsx` `collect()` updated to drop `data03`/`data04` imports
- README and project-memory updated
- New `d3-hierarchy` dependency (aligns with existing `d3-array`, `d3-geo`, `d3-scale`, `d3-shape`)

## Out of scope

- Chapter renumbering visible to readers (§01 stays "CHAPTER 01", §02 stays "CHAPTER 02")
- Reflowing the §01 evolution path or cumulative chart itself
- Adding new years/data outside the Unicode `emoji-test.txt` catalogue
- Touching §02 content

## Component design

### Position
Inside the §01 `<Section>`, directly below `<CumulativeChart>`, in the same `max-w-6xl px-6` container. Adds a thin separator above to break the visual flow between the line chart and the treemap.

### Subcomponents

**Header**
- Eyebrow + title (i18n: `ch01.categoryTreemap.eyebrow` / `.title`)
- Headline counter showing current frame's total emoji count + version label (e.g., "Emoji 17.0 · 共 3,790 个")

**Time slider**
- Snap points: every Unicode-version release year for which the data file has a frame. Concretely: 2010 (6.0), 2014 (7.0), 2015 (8.0), 2016 (9.0), 2017 (10.0), 2018 (11.0), 2019 (12.0 + 12.1), 2020 (13.0 + 13.1), 2021 (14.0), 2022 (15.0), 2023 (15.1), 2024 (16.0), 2025 (17.0).
- 1999 (DoCoMo) and 2007 (iPhone-JP) are *not* slider snap points because they predate Unicode CLDR group categorization. The pre-2010 era is acknowledged in the subtitle ("Starting from Unicode 6.0 — the first standardised, categorised emoji catalogue.").
- Tick labels visible only for "round" anchor years (2010, 2015, 2020, 2025).
- Play/pause button auto-advances every 1.6 s with a 600 ms transition.
- Keyboard: ← / → step one frame, Home / End jump to ends, Space toggles play.
- `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (the latter formatted as "2020 — Emoji 13.1 · 共 2,078 个").
- Initial frame: latest (Emoji 17.0).

**Treemap**
- 9 Unicode CLDR groups, in display order: Smileys & Emotion, People & Body, Animals & Nature, Food & Drink, Travel & Places, Activities, Objects, Symbols, Flags. (The internal "Component" group is excluded — it contains skin-tone modifiers etc. that are not standalone emoji.)
- Squarified layout from `d3-hierarchy.treemap()`.
- Each tile: representative glyph in large type, group name (translated), count, and percent of total.
- Small tiles (< 60 px × 40 px) collapse to glyph + tooltip-on-hover.
- Color per group: an extended 9-hue palette declared in `globals.css` as `--cat-{group}` tokens, calibrated to read distinctly while staying in the page's warm palette family.
- Framer Motion `motion.rect` animates `x/y/width/height` over 600 ms `easeInOut` on frame change. Tile text fades out at 100 ms and fades back in at 400 ms to prevent text-on-changing-rect flicker.
- `MotionConfig reducedMotion="user"` (already set globally) collapses transitions to 0 ms, and the auto-play button is hidden in reduced-motion mode.

**Interaction model** (same as `CumulativeChart`/`OriginMap`/`DayInLife`)
- `useState<string|null>` for `activeId` + `pinnedId`
- `useEffect` for outside-click + Escape to unpin
- Tiles are `role="button" tabIndex={0}`, hover/focus shows transient tooltip, click / Enter / Space pins it
- Tooltip content: group name, exact count, percent of total, year context, list of 4-6 representative emojis sampled from that group at the current frame

**Source line**
- Citation block at bottom referencing the Unicode CLDR URL that the data was built from. Same component as elsewhere (`<Citation>`).

## Data design

### Source
Official Unicode CLDR `emoji-test.txt`. Build pulls from `https://unicode.org/Public/emoji/17.0/emoji-test.txt` for the latest version, and reads the canonical version-added marker (`E<version>`) on each line.

### Build script
`scripts/build-emoji-categories.mjs` is a Node ESM script run manually whenever the data needs refresh (e.g. when Unicode 18.0 ships). It:
1. Fetches `emoji-test.txt` to `.tmp/emoji-test-{ver}.txt` (cached).
2. Walks lines:
   - `# group: <name>` lines set the current group.
   - `<codepoints> ; fully-qualified # <emoji> E<version> <description>` lines record an emoji's group + first-seen version.
   - Only `fully-qualified` rows are counted (this is Unicode's authoritative "distinct user-facing emoji" set).
3. For each Unicode/Emoji version `v ∈ {6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 12.1, 13.0, 13.1, 14.0, 15.0, 15.1, 16.0, 17.0}`, computes the cumulative count per group of emoji with `firstSeenVersion <= v`.
4. Maps Unicode version → release year using a small embedded table.
5. For each frame, picks 6 representative emojis per group (the first 6 by codepoint added at or before the frame).
6. Writes `data/chapter-01-categories.json`.

### Output shape

```ts
interface Chapter01CategoryData {
  groupOrder: CategoryGroupKey[]               // canonical display order
  frames: CategoryFrame[]                       // chronological
  source: Source                                // canonical Unicode URL
}

interface CategoryFrame {
  year: number                                  // release year
  versionId: string                             // matches timeline node id where applicable
  versionLabel: string                          // e.g. "Emoji 17.0"
  counts: Record<CategoryGroupKey, number>      // cumulative per group
  samples: Record<CategoryGroupKey, string[]>   // 6 representative emojis per group
  total: number                                 // sum of counts
}

type CategoryGroupKey =
  | 'smileys-emotion' | 'people-body' | 'animals-nature'
  | 'food-drink' | 'travel-places' | 'activities'
  | 'objects' | 'symbols' | 'flags'
```

The source object cites `https://unicode.org/Public/emoji/17.0/emoji-test.txt` (canonical, single-URL, satisfies the project's "every quantitative claim has a verifiable source URL" rule).

## i18n

New keys under `ch01.categoryTreemap`:
- `eyebrow`, `title`, `subtitle`, `play`, `pause`, `playAria`, `pauseAria`
- `sliderAriaText` — formatted string for `aria-valuetext`
- `total` — small label for tile percent line
- `groups.{key}` — translated names for the 9 groups
- `tooltipPercent`, `tooltipCount` — small labels in tooltip
- `caption` — note about Unicode 6.0 (2010) being the earliest categorised catalogue
- `play`, `pause`, `close` — button labels

zh + en parity enforced by existing `tests/i18n/parity.test.ts`.

## File-by-file changes

| File | Change |
| --- | --- |
| `app/[locale]/page.tsx` | Remove `<AlwaysOn>`, `<BeyondScreen>` + their imports/data. Add `<CategoryTreemap data={catData} />` below `<CumulativeChart>`. |
| `components/TopNav.tsx` | `CHAPTERS` → `['ch01', 'ch02']`. |
| `components/Footer.tsx` | Remove `data03`, `data04` imports and their pushes. |
| `components/chapter-01/CategoryTreemap.tsx` | New file. |
| `data/chapter-01-categories.json` | New file (generated). |
| `scripts/build-emoji-categories.mjs` | New build script. |
| `types/chapter-01.ts` | Add `Chapter01CategoryData`, `CategoryFrame`, `CategoryGroupKey`. |
| `messages/zh.json`, `messages/en.json` | Drop `nav.ch03`/`nav.ch04`, `ch03.*`, `ch04.*`. Add `ch01.categoryTreemap.*`. |
| `tests/data/chapter-01-categories.test.ts` | New shape/chronology test. |
| `tests/data/chapter-03.test.ts`, `tests/data/chapter-04.test.ts` | Delete. |
| `components/chapter-03/`, `components/chapter-04/` | Delete entire directories. |
| `data/chapter-03.json`, `data/chapter-04.json` | Delete. |
| `types/chapter-03.ts`, `types/chapter-04.ts` | Delete. |
| `app/[locale]/globals.css` | Add `--cat-{group}` color tokens (9). |
| `package.json` | Add `d3-hierarchy` + `@types/d3-hierarchy`. |
| `README.md`, `project-memory.md` | Reflect 2-chapter structure + new treemap. |

## Testing

- `tests/data/chapter-01-categories.test.ts`: shape validation, chronology, sums-of-counts matching totals, all group keys present.
- `tests/logic/category-frame.test.ts`: pure `frameAt(year)` helper exported from the component file.
- Existing `tests/i18n/*` parity test will fail until both zh and en have the new keys and have shed the ch03/ch04 keys — addressed.
- Manual: `npm run dev` on port 7777, verify slider scrubs, tooltips show, reduced-motion respects, source link clickable, no console warnings.

## Risks & notes

- **Network dependency at build time.** `scripts/build-emoji-categories.mjs` requires reachability to `unicode.org`. If running in a restricted env, the script accepts a `--from-file` flag pointing at a locally cached `emoji-test.txt`. The cached file is committed to `.tmp/` and gitignored so re-runs are reproducible.
- **DoCoMo 1999 not categorised.** The treemap starts at 2010 (Unicode 6.0). This is honest — the 1999 set predates CLDR categorisation. The slider caption discloses this. (The cumulative line chart above continues to show 1999 — they're complementary, not duplicate, views.)
- **Tile-label legibility at small sizes.** Smallest groups (Flags is often <2% of the total in early years) may not fit text. Mitigation: collapse-to-glyph-only with full info in tooltip; min-tile-size enforcement; truncated label with title attribute.

## Open follow-up the user should know about

- After deleting ch03/ch04, the page becomes notably shorter. If the visual rhythm feels abrupt, a future PR could expand §01 or §02 — but that's an editorial decision, not part of this design.
