# §01 Cumulative Chart · Version Diff Interaction — Design Spec

**Date:** 2026-05-20
**Author:** Claude (brainstorm session with user)
**Status:** Draft for review

## 1. Overview

Add an interactive **version diff** affordance to the §01 cumulative-growth chart (`components/chapter-01/CumulativeChart.tsx`), so a reader can choose any two contributing Unicode emoji versions and see how many emojis were added between them, the growth percentage, and a chronological strip of representative new emojis.

### 1.1 Goals

- Let the reader compare any two emoji versions in the §01 timeline by **explicit picker** rather than chart gesture.
- Surface both **statistical signal** (count, growth, span) and **representative artefacts** (new emojis) in one panel.
- Coordinate the chart with the picker via a **light visual annotation** (A / B labels on the two chosen markers) — no heavy chart restyling.
- Ship without changing the existing data schema, types, or dependencies.

### 1.2 Non-Goals

- No emoji-level *complete* diff. Each version in `data/chapter-01.json` only carries 3–4 `highlightEmojis` (representative samples). Expanding the dataset to per-version full emoji lists is out of scope; the diff panel always labels the emoji strip as a *sample*.
- No new chart visual encoding (no shaded A→B band, no dimming of non-selected markers). Highlight is restricted to A and B markers themselves.
- No coupling of the new picker to the chart's existing range-zoom buttons or to the marker hover/pin tooltip — the two interactions live on independent tracks.
- No persisted state (URL params, localStorage). Selection is component-local.
- No new external dependency, no new file in `components/chapter-01/`.

## 2. UX Decisions (Recap of Brainstorm)

| Dimension | Decision | Rationale |
|---|---|---|
| Diff content | Stats + representative emoji samples | C from Q1 |
| Selection mechanism | Two dropdowns "From → To" below the chart | B from Q2 — discoverable, mobile-native, doesn't conflict with existing chart click semantics |
| Chart coordination | Light: only A and B markers get bold stroke + A / B label badge | B from Q3 — keeps chart clean |
| Panel layout | Vertical stacked card (eyebrow / stats row / emoji grid) | A from Q4 — matches §01 card vocabulary |
| Selectable versions | Only `newEmojiCount !== null` entries (15 of 17) | iPhone JP 2007 and Apple Genmoji 2024 have no count, can't be diffed |
| Initial selection | A = Unicode 6.0 (2010), B = Emoji 17.0 (2025) | Wide, dramatic, meaningful first-paint comparison |
| Same version (A == B) | Hide the diff card entirely | Cleanest no-op |
| Reverse selection (B before A in time) | Auto-swap by year; labels reflect early → late | User shouldn't need to think about order |
| Emoji 18.0 draft | Selectable, option text suffixed `(Draft)`, card carries DRAFT badge when on the late end | Consistent with existing draft pattern in tooltip and marker |
| Emoji sample order | Versions after A through and including B, concatenated in chronological order | Reads like a "story since A" |

## 3. Architecture

### 3.1 Scope of Change

All new logic and UI go inside the existing `CumulativeChart.tsx`. No new component file is created. Justification: the new state (`fromId`, `toId`) couples tightly to ① the two dropdowns, ② marker-side A/B labels in the SVG, and ③ the diff card under the chart. Splitting these into separate files would require threading several derived values through props with no reuse benefit elsewhere — the new code only services this chart.

File-level change summary:

| File | Change |
|---|---|
| `components/chapter-01/CumulativeChart.tsx` | Add 2 `useState`, derived `diffResult`, `<DiffControls>` and `<VersionDiffCard>` local components, marker A/B label rendering |
| `messages/zh.json` and `messages/en.json` | Add `ch01.chart.diff.*` keys (15 keys, see §6). Parity enforced by existing `tests/i18n/message-keys.test.ts` |
| `tests/logic/version-diff.test.ts` | New file. Unit tests for the pure `computeVersionDiff` function |

No change to `types/chapter-01.ts`, `data/chapter-01.json`, `tests/data/chapter-01.test.ts`, or any other file.

### 3.2 Internal Component Tree

```
CumulativeChart
├── (existing) title row / range buttons / SVG / hover-tooltip overlay
├── DiffControls           ← new: "From" / "To" dropdowns
└── VersionDiffCard        ← new: rendered only when diffResult !== null
```

`DiffControls` and `VersionDiffCard` are local function components declared inside `CumulativeChart.tsx`. They are not exported. They receive minimal props (`diffResult`, the selectable list, the two setters); they hold no state of their own.

### 3.3 Pure Function (Testable Surface)

A module-level pure function carries the diff math:

```ts
function computeVersionDiff(
  contributingSeries: EnrichedNode[],   // already enriched from fullSeries
  fromId: string,
  toId: string
): DiffResult | null
```

`EnrichedNode` is the existing shape produced by the chart's `fullSeries` memo: `{ node: TimelineNode, runningTotal, previousTotal, growthPct }`.

`DiffResult` shape:

```ts
interface DiffResult {
  fromNode: EnrichedNode      // chronologically earlier (post-swap)
  toNode:   EnrichedNode      // chronologically later
  yearSpan: number            // toNode.node.year - fromNode.node.year, >= 0
  versionCount: number        // count of contributing versions in (from, to]
  addedTotal: number          // sum of newEmojiCount over (from, to]
  growthPct: number | null    // addedTotal / fromNode.runningTotal * 100; null if denom == 0
  sampleEmojis: string[]      // concat of highlightEmojis from (from, to] in chronological order
  isDraft: boolean            // toNode.node.draft === true
}
```

Returns `null` when `fromId === toId` or either id resolves to an entry not in `contributingSeries`.

## 4. Data Flow

```
fullSeries (existing, contributing-only)
     │
     ├──→ selectableNodes (= fullSeries; no extra filter needed)
     │
     └──→ computeVersionDiff(fullSeries, fromId, toId)
                │
                └──→ diffResult (single source of truth)
                          ↓
              ┌───────────┼─────────────────┐
              ↓           ↓                 ↓
         compareIds   <VersionDiffCard/>  dropdowns' selected={}
         (Set of 2)
              ↓
     marker render path
     (adds A / B label if id in compareIds)
```

- The dropdowns are controlled by `fromId` / `toId` state.
- The chart's existing `range`, `activeId`, `pinnedId` state are **untouched** and unaffected by the new selection.
- Clicking a chart marker does **not** mutate `fromId` / `toId`. The two interactions stay orthogonal.

## 5. UI Specifics

### 5.1 Layout (chart container, top to bottom)

```
[Eyebrow]                              [Headline total]
[Title]
[Range buttons]                        [Hint]
SVG chart (existing, plus A/B labels on chosen markers)
DiffControls:  [Version diff]  From [Unicode 6.0 · 2010 ▾]  To [Emoji 17.0 · 2025 ▾]
VersionDiffCard (white card, accent border, rendered only if diffResult !== null)
```

### 5.2 DiffControls

- Container: flex row, wrap on narrow screens.
- Eyebrow label (`版本对比 / VERSION DIFF`) uses the same small uppercase tracked style as the existing `时间窗口` label.
- Native `<select>` elements — keyboard, mobile picker, and ARIA come for free.
- Option text format: `{versionLabel} · {year}`. Draft versions append the localized draft suffix (` (草案)` / ` (Draft)`).
- Each `<select>` has an `aria-label` (`ch01.chart.diff.fromAria` / `ch01.chart.diff.toAria`).
- Styling tokens: white background, `1.5px` border with `var(--line)` resting and `var(--accent-01)` on `:focus-visible`, rounded `8px`. Matches the look of existing range buttons family without being identical (a `<select>` carries the chevron natively).

### 5.3 SVG Marker Annotation

The existing marker `<g>` block already handles hover, focus, pin, draft badge, flagship year text. Add a conditional sibling block:

```tsx
{compareIds.has(p.id) && (
  <>
    {/* Reinforce the medallion stroke */}
    <circle cx={p.cx} cy={p.cy} r={r} fill="none" stroke="var(--accent-01)" strokeWidth={4} pointerEvents="none" />
    {/* A / B chip */}
    <g pointerEvents="none" transform={`translate(${p.cx}, ${p.cy + baseR + 22})`}>
      <rect x={-9} y={-7} width={18} height={13} rx={3} fill="var(--accent-01)" />
      <text textAnchor="middle" dy={2} fontSize={9} fontWeight={900} fill="white" letterSpacing="0.05em">
        {p.id === diffResult.fromNode.node.id ? 'A' : 'B'}
      </text>
    </g>
  </>
)}
```

Conflict-handling rules:
- **A/B chip vs flagship year label** (currently at `baseR + 12`): when both apply, the year text is suppressed for that marker; identity-as-A/B is more relevant than the year (year is also visible in the dropdown and in the diff card).
- **A/B chip vs DRAFT badge** (currently top-right of marker): independent positions, both render.
- **A/B chip vs active tooltip**: independent, both render. The chip is a static identity tag; the tooltip is transient.

The marker's existing `aria-label` is extended (via i18n template) to mention "compare A (start)" / "compare B (end)" when applicable.

### 5.4 VersionDiffCard

Rendered immediately under `DiffControls`. Skipped entirely when `diffResult === null`.

Structure (top to bottom):

1. **Eyebrow row** — small uppercase: `DIFF · {fromYear} → {toYear}`. If `isDraft`, append a DRAFT chip (reusing the existing `draftBadge` style).
2. **Title row** — `{fromVersionLabel} → {toVersionLabel}` in larger bold ink, followed by `· 跨越 {years} 年 · {versions} 版本` in muted weight. When `yearSpan === 0`, swap to "Same year · {versions} 版本".
3. **Stats row** — three columns:
   - 新增 / Added → `+{addedTotal}`, accent-01 color, tabular, font-black
   - 累计 / Total → `{toNode.runningTotal}`, ink color
   - 增长 / Growth → `+{Math.round(growthPct)}%` accent-04 color; falls back to `—` if `growthPct === null`
4. **Sample emoji header** — small muted uppercase: `代表性新 EMOJI（中间 {versions} 版本样本）`
5. **Emoji strip** — flex-wrap; each emoji rendered as a 18px (desktop) / 16px (mobile) span. If `sampleEmojis.length > 30`, the strip shows the first 30 and a trailing `…+{rest} 更多 / …+{rest} more` label.

Card chrome: white background, rounded `12px`, `1px` border in low-opacity `--accent-01`. Padding `14px`.

A11y: `role="region"`, `aria-live="polite"` on the stats row so screen readers announce updates.

## 6. i18n Keys (zh + en parity)

| Key | zh | en |
|---|---|---|
| `ch01.chart.diff.eyebrow` | 版本对比 | VERSION DIFF |
| `ch01.chart.diff.from` | 从 | From |
| `ch01.chart.diff.to` | 到 | To |
| `ch01.chart.diff.fromAria` | 选择起始版本 | Select start version |
| `ch01.chart.diff.toAria` | 选择结束版本 | Select end version |
| `ch01.chart.diff.optionLabel` | `{version} · {year}` | `{version} · {year}` |
| `ch01.chart.diff.draftSuffix` | ` (草案)` | ` (Draft)` |
| `ch01.chart.diff.cardEyebrow` | `DIFF · {fromYear} → {toYear}` | `DIFF · {fromYear} → {toYear}` |
| `ch01.chart.diff.cardTitle` | `{fromVersion} → {toVersion}` | `{fromVersion} → {toVersion}` |
| `ch01.chart.diff.cardSpan` | `跨越 {years} 年 · {versions} 版本` | `{years} years · {versions} versions` |
| `ch01.chart.diff.cardSpanSameYear` | `同年 · {versions} 版本` | `Same year · {versions} versions` |
| `ch01.chart.diff.sampleHeader` | `代表性新 EMOJI（中间 {versions} 版本样本）` | `Representative new emoji ({versions}-version sample)` |
| `ch01.chart.diff.moreCount` | `…+{count} 更多` | `…+{count} more` |
| `ch01.chart.diff.markerAriaA` | 对比起始 | Compare A (start) |
| `ch01.chart.diff.markerAriaB` | 对比结束 | Compare B (end) |

Stat sub-labels (`added`, `total`, `growth`) reuse existing keys.

## 7. Edge Cases

| Case | Handling |
|---|---|
| Default first paint | A = `emoji-6-0`, B = `emoji-17-0`; full diff renders |
| `fromId === toId` | `computeVersionDiff` returns `null`; card not rendered; markers not labeled |
| `toNode.year < fromNode.year` (reverse pick) | Internal swap by year; labels always reflect early → late |
| Same year, different version (e.g. 12.0 + 12.1, both 2019) | `yearSpan === 0`; use `cardSpanSameYear` copy |
| Adjacent versions (`versionCount === 1`) | Standard copy; no special case |
| `sampleEmojis.length > 30` | Render first 30 + `moreCount` label |
| `sampleEmojis.length === 0` (defensive) | Skip the strip; render stats only |
| Range-zoom hides A or B marker | Selection persists; A/B chip in the off-screen marker is clipped by the existing chart `clip-path`; diff card still renders normally |
| `growthPct` denominator is zero | Render `—` for growth |
| Draft on `toId` (typical for 18.0) | Card DRAFT badge present; option suffix in dropdown |
| Draft on `fromId` (atypical but allowed) | No DRAFT badge on card; option suffix in dropdown |
| Language switch mid-selection | Dropdown re-renders with translated labels; selection (`fromId` / `toId` strings) is locale-independent |

## 8. Testing

| Test | File | What it covers |
|---|---|---|
| Default scenario | `tests/logic/version-diff.test.ts` | `computeVersionDiff(series, 'emoji-6-0', 'emoji-17-0')` returns expected `addedTotal`, `growthPct`, `versionCount`, `yearSpan`, `isDraft === false`, `sampleEmojis` chronologically ordered |
| Auto-swap | same file | Calling with reversed ids returns same result (modulo `fromNode`/`toNode` order from year ascent) |
| Same-id null | same file | `(s, 'emoji-6-0', 'emoji-6-0') === null` |
| Same year | same file | `(s, 'emoji-12-0', 'emoji-12-1')` has `yearSpan === 0`, `versionCount === 1` |
| Draft destination | same file | `(s, 'emoji-17-0', 'emoji-18-0')` has `isDraft === true` |
| Sample order | same file | `sampleEmojis` length and order match the concat of highlightEmojis from (from, to] in time order |
| Invalid id | same file | Either id missing from contributingSeries → returns `null` |
| Message-key parity | `tests/i18n/message-keys.test.ts` (existing) | All 15 new keys present in both zh and en |

Out of scope for automation:
- Dropdown `onChange` behavior (trivial native semantics)
- VersionDiffCard rendering snapshot (high churn vs. low signal)
- Axe-core accessibility check (matches existing project convention — manual browser pass)

## 9. Open Questions / Future Work

- A future enhancement could expand `data/chapter-01.json` so each version carries its full emoji set, enabling a true "every emoji added between A and B" gallery. Out of scope for this spec.
- The diff card might gain a "swap A ↔ B" affordance if telemetry shows users frequently re-selecting in reverse. Not added now (auto-swap covers correctness).

## 10. Conventions Followed

- Stays inside `useState` + `useMemo` pattern from the existing `CumulativeChart.tsx`.
- New i18n keys are added under the existing `ch01.chart.*` namespace.
- Chart marker rendering remains a single `<g>` per node, with overlay layers added on top.
- All numeric output uses `toLocaleString(locale)` and the `tabular` font-numeric class already used in the existing chart.
- Color tokens reuse `--accent-01` (chart accent), `--accent-04` (growth highlight), `--muted`, `--ink`, `--line`.
- Project memory entry will be updated post-implementation to mention the diff feature alongside emoji medallions, range zoom, and decade markers.
