# §01 Cumulative Chart · Version Diff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive version-diff to the §01 cumulative chart — two dropdowns under the chart let the reader pick any two contributing Unicode emoji versions, the two markers gain A/B chips, and a card below shows stats + a chronological strip of representative new emojis.

**Architecture:** All changes land inside `components/chapter-01/CumulativeChart.tsx` (one new pure module-level function + two local subcomponents + 2 useState + 2 useMemo). I18n keys added to both `messages/zh.json` and `messages/en.json` under the existing `ch01.chart.diff` namespace. One new test file: `tests/logic/version-diff.test.ts`. No data-schema, type, or dependency changes.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · next-intl · Vitest · d3-* (existing, unchanged).

**Spec:** `docs/superpowers/specs/2026-05-20-emoji-version-diff-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `messages/zh.json` | Modify | Add `ch01.chart.diff.*` keys (Chinese) |
| `messages/en.json` | Modify | Add `ch01.chart.diff.*` keys (English) — must mirror zh |
| `components/chapter-01/CumulativeChart.tsx` | Modify | Export new pure function `computeVersionDiff`; add module-level defaults and types; inside component add 2 state + derived memos + 2 local subcomponents + marker A/B chip rendering |
| `tests/logic/version-diff.test.ts` | Create | Unit tests for `computeVersionDiff` |
| `project-memory.md` | Modify | Note the new diff feature in §01 description |

---

## Task 1: Add i18n keys for version diff (zh + en)

**Files:**
- Modify: `messages/zh.json` (inside `ch01.chart`, after `"close"`)
- Modify: `messages/en.json` (inside `ch01.chart`, after `"close"`)
- Verify: `tests/i18n/message-keys.test.ts` (existing parity test)

- [ ] **Step 1: Run the existing i18n parity test as a baseline**

Run: `cd /root/tyx/VINCI && npm test -- tests/i18n/message-keys.test.ts`
Expected: PASS (we want a green baseline before mutating)

- [ ] **Step 2: Add the `diff` block to `messages/zh.json`**

Open `messages/zh.json`, locate the line `"close": "关闭"` inside `ch01.chart` (around line 36). Change that line and add the block below so the chart object reads:

```json
      "draftBadge": "草案",
      "close": "关闭",
      "diff": {
        "eyebrow": "版本对比",
        "from": "从",
        "to": "到",
        "fromAria": "选择起始版本",
        "toAria": "选择结束版本",
        "optionLabel": "{version} · {year}",
        "draftSuffix": " (草案)",
        "cardEyebrow": "DIFF · {fromYear} → {toYear}",
        "cardTitle": "{fromVersion} → {toVersion}",
        "cardSpan": "跨越 {years} 年 · {versions} 版本",
        "cardSpanSameYear": "同年 · {versions} 版本",
        "sampleHeader": "代表性新 EMOJI（中间 {versions} 版本样本）",
        "moreCount": "…+{count} 更多",
        "markerAriaA": "对比起始",
        "markerAriaB": "对比结束"
      }
```

(The `"close": "关闭"` line picks up a trailing comma; the new `"diff"` block sits between `"close"` and the closing `}` of `chart`.)

- [ ] **Step 3: Add the same block to `messages/en.json`**

Open `messages/en.json`, locate `"close": "Close"` inside `ch01.chart` (around line 35). Mirror with English copy:

```json
      "draftBadge": "Draft",
      "close": "Close",
      "diff": {
        "eyebrow": "VERSION DIFF",
        "from": "From",
        "to": "To",
        "fromAria": "Select start version",
        "toAria": "Select end version",
        "optionLabel": "{version} · {year}",
        "draftSuffix": " (Draft)",
        "cardEyebrow": "DIFF · {fromYear} → {toYear}",
        "cardTitle": "{fromVersion} → {toVersion}",
        "cardSpan": "{years} years · {versions} versions",
        "cardSpanSameYear": "Same year · {versions} versions",
        "sampleHeader": "Representative new emoji ({versions}-version sample)",
        "moreCount": "…+{count} more",
        "markerAriaA": "Compare A (start)",
        "markerAriaB": "Compare B (end)"
      }
```

- [ ] **Step 4: Run the parity test to confirm both languages match**

Run: `cd /root/tyx/VINCI && npm test -- tests/i18n/message-keys.test.ts`
Expected: PASS — both files now share the same key set.

- [ ] **Step 5: Commit**

```bash
cd /root/tyx/VINCI
git add messages/zh.json messages/en.json
git commit -m "$(cat <<'EOF'
feat(i18n): add ch01.chart.diff keys for version-diff feature

15 new keys covering the dropdown controls, A/B marker labels,
diff card eyebrow/title/span/sample header/more-count, and
draft suffix. zh + en parity verified by message-keys test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: TDD the pure `computeVersionDiff` function

**Files:**
- Create: `tests/logic/version-diff.test.ts`
- Modify: `components/chapter-01/CumulativeChart.tsx` (add module-level types, defaults, and exported function — no React changes yet)

- [ ] **Step 1: Add module-level scaffolding to `CumulativeChart.tsx`**

Open `components/chapter-01/CumulativeChart.tsx`. After the existing `RANGE_START` block (around line 20) and before the `interface ChartPoint` definition (around line 22), insert:

```tsx
export const DEFAULT_FROM_ID = 'emoji-6-0'
export const DEFAULT_TO_ID = 'emoji-17-0'

export interface EnrichedNode {
  node: TimelineNode & { newEmojiCount: number }
  runningTotal: number
  previousTotal: number
  growthPct: number
}

export interface DiffResult {
  fromNode: EnrichedNode
  toNode: EnrichedNode
  yearSpan: number
  versionCount: number
  addedTotal: number
  growthPct: number | null
  sampleEmojis: string[]
  isDraft: boolean
}

export function computeVersionDiff(
  contributingSeries: EnrichedNode[],
  fromId: string,
  toId: string,
): DiffResult | null {
  throw new Error('not implemented')
}
```

(Stub the body — TDD will drive the real implementation. The export is what makes the function importable from the test.)

- [ ] **Step 2: Create the failing test file**

Create `tests/logic/version-diff.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  computeVersionDiff,
  type EnrichedNode,
} from '@/components/chapter-01/CumulativeChart'
import chapter01 from '@/data/chapter-01.json'
import type { TimelineNode } from '@/types/chapter-01'

function buildContributing(): EnrichedNode[] {
  const contributing = (chapter01.timeline as TimelineNode[]).filter(
    (n): n is TimelineNode & { newEmojiCount: number } => n.newEmojiCount !== null,
  )
  let running = 0
  return contributing.map((n) => {
    const previousTotal = running
    running += n.newEmojiCount
    return {
      node: n,
      runningTotal: running,
      previousTotal,
      growthPct: previousTotal === 0 ? 0 : (n.newEmojiCount / previousTotal) * 100,
    }
  })
}

describe('computeVersionDiff', () => {
  const series = buildContributing()

  it('returns null when fromId === toId', () => {
    expect(computeVersionDiff(series, 'emoji-6-0', 'emoji-6-0')).toBeNull()
  })

  it('returns null when fromId is unknown', () => {
    expect(computeVersionDiff(series, 'no-such-id', 'emoji-6-0')).toBeNull()
  })

  it('returns null when toId is unknown', () => {
    expect(computeVersionDiff(series, 'emoji-6-0', 'no-such-id')).toBeNull()
  })

  it('default case (6.0 → 17.0) produces expected stats', () => {
    const r = computeVersionDiff(series, 'emoji-6-0', 'emoji-17-0')
    expect(r).not.toBeNull()
    expect(r!.fromNode.node.id).toBe('emoji-6-0')
    expect(r!.toNode.node.id).toBe('emoji-17-0')
    expect(r!.yearSpan).toBe(15)
    expect(r!.versionCount).toBe(12)
    // Sum of newEmojiCount for emoji-7-0..emoji-17-0
    expect(r!.addedTotal).toBe(1612)
    expect(r!.isDraft).toBe(false)
    expect(r!.sampleEmojis.length).toBeGreaterThan(0)
  })

  it('reversed selection auto-swaps (early → late always)', () => {
    const forward = computeVersionDiff(series, 'emoji-6-0', 'emoji-17-0')
    const reversed = computeVersionDiff(series, 'emoji-17-0', 'emoji-6-0')
    expect(reversed).not.toBeNull()
    expect(reversed!.fromNode.node.id).toBe('emoji-6-0')
    expect(reversed!.toNode.node.id).toBe('emoji-17-0')
    expect(reversed!.addedTotal).toBe(forward!.addedTotal)
    expect(reversed!.versionCount).toBe(forward!.versionCount)
  })

  it('same year, different versions (12.0 → 12.1)', () => {
    const r = computeVersionDiff(series, 'emoji-12-0', 'emoji-12-1')
    expect(r).not.toBeNull()
    expect(r!.yearSpan).toBe(0)
    expect(r!.versionCount).toBe(1)
  })

  it('draft destination (17.0 → 18.0) sets isDraft = true', () => {
    const r = computeVersionDiff(series, 'emoji-17-0', 'emoji-18-0')
    expect(r).not.toBeNull()
    expect(r!.isDraft).toBe(true)
  })

  it('sampleEmojis is chronological concat of (from, to] highlightEmojis', () => {
    const r = computeVersionDiff(series, 'emoji-15-0', 'emoji-15-1')
    expect(r).not.toBeNull()
    // (15.0, 15.1] = only 15.1
    expect(r!.sampleEmojis).toEqual(['🙂‍↕️', '🍋‍🟩', '🍄‍🟫'])
  })

  it('adjacent versions (17.0 → 18.0) has versionCount 1 and 18.0 stats', () => {
    const r = computeVersionDiff(series, 'emoji-17-0', 'emoji-18-0')
    expect(r).not.toBeNull()
    expect(r!.versionCount).toBe(1)
    // emoji-18-0 newEmojiCount = 19
    expect(r!.addedTotal).toBe(19)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails as expected**

Run: `cd /root/tyx/VINCI && npm test -- tests/logic/version-diff.test.ts`
Expected: All 9 tests fail with `Error: not implemented`.

- [ ] **Step 4: Implement `computeVersionDiff`**

Replace the stubbed body in `CumulativeChart.tsx` with:

```tsx
export function computeVersionDiff(
  contributingSeries: EnrichedNode[],
  fromId: string,
  toId: string,
): DiffResult | null {
  if (fromId === toId) return null
  const idxA = contributingSeries.findIndex((n) => n.node.id === fromId)
  const idxB = contributingSeries.findIndex((n) => n.node.id === toId)
  if (idxA === -1 || idxB === -1) return null

  const [earlyIdx, lateIdx] = idxA < idxB ? [idxA, idxB] : [idxB, idxA]
  const fromNode = contributingSeries[earlyIdx]
  const toNode = contributingSeries[lateIdx]

  // Intermediate = (early, late] — excludes from, includes to
  const intermediate = contributingSeries.slice(earlyIdx + 1, lateIdx + 1)
  const addedTotal = intermediate.reduce((acc, n) => acc + n.node.newEmojiCount, 0)
  const growthPct =
    fromNode.runningTotal === 0 ? null : (addedTotal / fromNode.runningTotal) * 100
  const sampleEmojis = intermediate.flatMap((n) => n.node.highlightEmojis)

  return {
    fromNode,
    toNode,
    yearSpan: toNode.node.year - fromNode.node.year,
    versionCount: intermediate.length,
    addedTotal,
    growthPct,
    sampleEmojis,
    isDraft: toNode.node.draft === true,
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /root/tyx/VINCI && npm test -- tests/logic/version-diff.test.ts`
Expected: All 9 tests PASS.

- [ ] **Step 6: Run the full test suite (regression check)**

Run: `cd /root/tyx/VINCI && npm test`
Expected: PASS — no existing test broken by the new exports.

- [ ] **Step 7: Commit**

```bash
cd /root/tyx/VINCI
git add tests/logic/version-diff.test.ts components/chapter-01/CumulativeChart.tsx
git commit -m "$(cat <<'EOF'
feat(ch01 chart): pure computeVersionDiff function

Exports a module-level pure function from CumulativeChart that takes the
enriched contributing series + two version ids and returns aggregated stats
(addedTotal, growthPct, yearSpan, versionCount, sampleEmojis, isDraft) for
the (from, to] interval. Returns null for same-id or invalid-id inputs.
Auto-swaps reversed selections by series index. Covered by 9 unit tests.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add diff state, derived values, and the `DiffControls` dropdowns

**Files:**
- Modify: `components/chapter-01/CumulativeChart.tsx`

- [ ] **Step 1: Add state and derived values inside the `CumulativeChart` function**

In `CumulativeChart.tsx`, inside the `CumulativeChart` component body, locate the existing state block (around lines 42–44):

```tsx
  const [range, setRange] = useState<RangeId>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
```

Append the new diff state immediately after:

```tsx
  const [fromId, setFromId] = useState<string>(DEFAULT_FROM_ID)
  const [toId, setToId] = useState<string>(DEFAULT_TO_ID)
```

Then locate the existing `fullSeries` useMemo (around lines 49–60). Immediately after that block, add:

```tsx
  const diffResult = useMemo(
    () => computeVersionDiff(fullSeries, fromId, toId),
    [fullSeries, fromId, toId],
  )

  const compareIds = useMemo(() => {
    if (!diffResult) return new Set<string>()
    return new Set<string>([diffResult.fromNode.node.id, diffResult.toNode.node.id])
  }, [diffResult])
```

- [ ] **Step 2: Add the `DiffControls` local component above the `return` statement**

Inside the `CumulativeChart` function but before the `return (...)` JSX (i.e. immediately after the `RANGES` constant declaration around line 178), declare the local component:

```tsx
  function DiffControls() {
    return (
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--muted)]">
          {t('diff.eyebrow')}
        </span>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--muted)]">
          {t('diff.from')}
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            aria-label={t('diff.fromAria')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[color:var(--line)] text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-01)]/50"
          >
            {fullSeries.map((n) => (
              <option key={n.node.id} value={n.node.id}>
                {t('diff.optionLabel', { version: n.node.versionLabel, year: n.node.year })}
                {n.node.draft ? t('diff.draftSuffix') : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--muted)]">
          {t('diff.to')}
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            aria-label={t('diff.toAria')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[color:var(--line)] text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-01)]/50"
          >
            {fullSeries.map((n) => (
              <option key={n.node.id} value={n.node.id}>
                {t('diff.optionLabel', { version: n.node.versionLabel, year: n.node.year })}
                {n.node.draft ? t('diff.draftSuffix') : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    )
  }
```

- [ ] **Step 3: Render `<DiffControls />` in the JSX immediately after the closing `</svg>`**

Locate `</svg>` in the JSX (around line 436). Add immediately after it (and before the existing `{activePoint && (...)}` tooltip overlay):

```tsx
      <DiffControls />
```

- [ ] **Step 4: Verify there's no TypeScript error**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Start dev server and verify the dropdowns render and update state**

Run (in a separate terminal): `cd /root/tyx/VINCI && npm run dev`
Open `http://localhost:7777` in browser, scroll to §01 chart.

Expected:
- Below the SVG, see "版本对比 (or VERSION DIFF) 从 [Unicode 6.0 · 2010 ▾] 到 [Emoji 17.0 · 2025 ▾]"
- Both dropdowns show 15 options (DoCoMo 1999 through Emoji 18.0 (草案)/(Draft))
- Changing a dropdown value sticks (the selected text updates)
- No browser console errors

Stop dev server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
cd /root/tyx/VINCI
git add components/chapter-01/CumulativeChart.tsx
git commit -m "$(cat <<'EOF'
feat(ch01 chart): version-diff dropdown controls

Adds two from/to <select> dropdowns beneath the chart and the diffResult
/compareIds memos that drive them. Marker A/B coordination and the diff
card come in the next two commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Add marker A/B coordination on the SVG chart

**Files:**
- Modify: `components/chapter-01/CumulativeChart.tsx`

- [ ] **Step 1: Suppress flagship year label when marker is in compareIds**

In `CumulativeChart.tsx`, locate the flagship-year text inside the marker `<g>` block (around line 392):

```tsx
              {p.flagship && !isActive && (
                <text
                  x={p.cx}
                  y={p.cy + baseR + 12}
                  ...
                >
                  {p.year}
                </text>
              )}
```

Change the conditional to also exclude markers in `compareIds`:

```tsx
              {p.flagship && !isActive && !compareIds.has(p.id) && (
```

(Leave the rest of the block unchanged.)

- [ ] **Step 2: Add the A/B chip rendering inside the marker `<g>`**

In the same marker `<g>` block (around line 363, the `<g key={p.id} ...>` opening), add a child block just before the closing `</g>` (around line 430, after the draft badge). The full insertion:

```tsx
              {compareIds.has(p.id) && diffResult && (
                <g pointerEvents="none">
                  {/* Reinforced stroke */}
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={r}
                    fill="none"
                    stroke="var(--accent-01)"
                    strokeWidth={4}
                  />
                  {/* A / B chip */}
                  <g transform={`translate(${p.cx}, ${p.cy + baseR + 22})`}>
                    <rect x={-9} y={-7} width={18} height={13} rx={3} fill="var(--accent-01)" />
                    <text
                      textAnchor="middle"
                      dy={2}
                      fontSize={9}
                      fontWeight={900}
                      fill="white"
                      letterSpacing="0.05em"
                    >
                      {p.id === diffResult.fromNode.node.id ? 'A' : 'B'}
                    </text>
                  </g>
                </g>
              )}
```

- [ ] **Step 3: Extend the marker's `aria-label` to mention A/B status**

In the same marker `<g>`, locate the existing `aria-label` (around line 341):

```tsx
              aria-label={t('markerAria', {
                year: p.year,
                version: p.versionLabel,
                added: p.newEmojiCount ?? 0,
                total: p.runningTotal,
              })}
```

Add a compare-status suffix:

```tsx
              aria-label={`${t('markerAria', {
                year: p.year,
                version: p.versionLabel,
                added: p.newEmojiCount ?? 0,
                total: p.runningTotal,
              })}${
                compareIds.has(p.id) && diffResult
                  ? ` · ${p.id === diffResult.fromNode.node.id ? t('diff.markerAriaA') : t('diff.markerAriaB')}`
                  : ''
              }`}
```

- [ ] **Step 4: Verify TypeScript**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Manual verification in browser**

Run: `cd /root/tyx/VINCI && npm run dev`
Open `http://localhost:7777` and scroll to §01 chart.

Expected:
- Default selection (6.0, 17.0) shows two markers with bold orange stroke and a small accent-01 chip with letter "A" on the 2010 medallion and "B" on the 2025 medallion, positioned slightly below the marker.
- 2010 flagship year label is suppressed under the chip; other flagship years (1999, 2020, 2024, 2026) still show.
- Changing the dropdowns moves the chips to the new markers.
- Selecting both dropdowns to the same value removes the chips entirely.
- Hovering a non-A/B marker still shows the existing tooltip; the chips don't intercept clicks.

Stop dev server.

- [ ] **Step 6: Commit**

```bash
cd /root/tyx/VINCI
git add components/chapter-01/CumulativeChart.tsx
git commit -m "$(cat <<'EOF'
feat(ch01 chart): A/B chip annotation on selected diff markers

Markers chosen via the from/to dropdowns gain a thicker accent-01 stroke
and an accent-colored A or B chip below the medallion. The flagship year
label is suppressed for those markers to avoid visual conflict. Marker
aria-label is extended with the compare status for screen readers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add the `VersionDiffCard` component

**Files:**
- Modify: `components/chapter-01/CumulativeChart.tsx`

- [ ] **Step 1: Declare the `VersionDiffCard` local component**

In `CumulativeChart.tsx`, inside the `CumulativeChart` function and immediately after the `DiffControls` declaration (from Task 3 Step 2), add:

```tsx
  function VersionDiffCard() {
    if (!diffResult) return null

    const MAX_SAMPLES = 30
    const samples = diffResult.sampleEmojis
    const visibleSamples = samples.slice(0, MAX_SAMPLES)
    const overflow = Math.max(0, samples.length - MAX_SAMPLES)

    const spanText =
      diffResult.yearSpan === 0
        ? t('diff.cardSpanSameYear', { versions: diffResult.versionCount })
        : t('diff.cardSpan', {
            years: diffResult.yearSpan,
            versions: diffResult.versionCount,
          })

    return (
      <div className="mt-3 rounded-xl bg-white p-3.5 border border-[color:var(--accent-01)]/25">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-extrabold tracking-wider text-[color:var(--accent-01)] uppercase">
              {t('diff.cardEyebrow', {
                fromYear: diffResult.fromNode.node.year,
                toYear: diffResult.toNode.node.year,
              })}
            </div>
            <div className="mt-0.5 text-sm font-extrabold text-[color:var(--ink)]">
              {t('diff.cardTitle', {
                fromVersion: diffResult.fromNode.node.versionLabel,
                toVersion: diffResult.toNode.node.versionLabel,
              })}
              <span className="ml-2 text-[11px] font-bold text-[color:var(--muted)]">
                · {spanText}
              </span>
            </div>
          </div>
          {diffResult.isDraft && (
            <span className="text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-[color:var(--muted)] text-white">
              {t('draftBadge')}
            </span>
          )}
        </div>

        <div
          className="mt-3 grid grid-cols-3 gap-3 text-xs border-t border-[color:var(--line)]/60 pt-3"
          aria-live="polite"
        >
          <div>
            <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">
              {t('added')}
            </div>
            <div className="text-base font-black tabular text-[color:var(--accent-01)] leading-tight">
              +{diffResult.addedTotal.toLocaleString(locale)}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">
              {t('total')}
            </div>
            <div className="text-base font-black tabular leading-tight">
              {diffResult.toNode.runningTotal.toLocaleString(locale)}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold">
              {t('growth')}
            </div>
            <div className="text-base font-black tabular text-[color:var(--accent-04)] leading-tight">
              {diffResult.growthPct === null
                ? '—'
                : `+${Math.round(diffResult.growthPct)}%`}
            </div>
          </div>
        </div>

        {visibleSamples.length > 0 && (
          <div className="mt-3 border-t border-[color:var(--line)]/60 pt-3">
            <div className="text-[9px] uppercase tracking-wide text-[color:var(--muted)] font-bold mb-1.5">
              {t('diff.sampleHeader', { versions: diffResult.versionCount })}
            </div>
            <div className="flex flex-wrap gap-1.5 text-base md:text-lg leading-none">
              {visibleSamples.map((e, i) => (
                <span key={i}>{e}</span>
              ))}
              {overflow > 0 && (
                <span className="text-[11px] font-bold text-[color:var(--muted)] self-end">
                  {t('diff.moreCount', { count: overflow })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
```

- [ ] **Step 2: Render `<VersionDiffCard />` immediately after `<DiffControls />`**

In the JSX, locate the `<DiffControls />` line you added in Task 3. Add the card immediately below:

```tsx
      <DiffControls />
      <VersionDiffCard />
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Run: `cd /root/tyx/VINCI && npm run dev`
Open `http://localhost:7777`, scroll to §01 chart.

Expected:
- Below the dropdowns: a white rounded card with `1px` accent-tinted border.
- Eyebrow reads `DIFF · 2010 → 2025` in accent-01 uppercase.
- Title reads `Unicode 6.0 → Emoji 17.0 · 跨越 15 年 · 12 版本` (Chinese) or `Unicode 6.0 → Emoji 17.0 · 15 years · 12 versions` (English).
- Three columns of stats: `+1,612` / `2,510` / `+180%` (numbers locale-formatted; English locale uses `1,612` and Chinese uses `1,612` — both work because `toLocaleString` handles separators).
- Below stats: emoji strip with all 12 versions' highlightEmojis concatenated chronologically. If more than 30 emojis (e.g., wide ranges), trailing `…+N` label appears.
- Selecting `from = to` (same id in both dropdowns) → card disappears entirely.
- Selecting `to = Emoji 18.0` → DRAFT badge appears in the card's top-right.
- Selecting `from = Emoji 12.0`, `to = Emoji 12.1` → span line reads "同年 · 1 版本" / "Same year · 1 versions".
- Reversing the selection (e.g., from = 17.0, to = 6.0) → card label still reads "Unicode 6.0 → Emoji 17.0".
- Switch language via the top-right toggle — labels and copy update in place.

Stop dev server.

- [ ] **Step 5: Run the full test suite to make sure nothing broke**

Run: `cd /root/tyx/VINCI && npm test`
Expected: PASS (all existing tests + the 9 new diff tests).

- [ ] **Step 6: Commit**

```bash
cd /root/tyx/VINCI
git add components/chapter-01/CumulativeChart.tsx
git commit -m "$(cat <<'EOF'
feat(ch01 chart): VersionDiffCard with stats + emoji strip

Renders beneath the dropdowns when both versions resolve to a valid diff.
Vertical stacked card with eyebrow (DIFF · year → year), title (version →
version · span), three-column stats (added / cumulative / growth), and a
chronological emoji strip (capped at 30, overflow shown as +N more).
DRAFT badge appears when the late end is a draft version; same-year copy
swaps in when yearSpan === 0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update project memory + final verification

**Files:**
- Modify: `project-memory.md`

- [ ] **Step 1: Update the §01 description in `project-memory.md`**

Open `project-memory.md`. Locate the §01 description bullet (around line 15 — starts with "§01 进化之路"). Inside that bullet, add a sentence about the new diff feature. The diff is "interactive cumulative-growth chart" — extend with mention of "version diff dropdowns".

Find:
```
followed by an **interactive cumulative-growth chart** (`components/chapter-01/CumulativeChart.tsx`). Each version is an **emoji medallion** (the version's first highlight emoji on a circle), with decade-anchor years (1999/2010/2015/2020/2024/2026) styled as larger flagship markers. Three **range-zoom buttons** (`全部 / 2015→ / 2020→`) narrow the x-domain so the dense modern era spreads out.
```

Append after the range-zoom sentence:
```
Two **version-diff dropdowns** (`从 / 到`) beneath the chart let readers pick any two contributing versions; the chosen markers gain bold accent strokes and small A/B chips, and a card below shows the count added, growth %, year span, and a chronological strip of representative new emojis for the intermediate versions.
```

- [ ] **Step 2: Final clean check — run lint + typecheck + full test suite**

Run: `cd /root/tyx/VINCI && npx tsc --noEmit && npm test && npm run lint`
Expected: All PASS.

If `npm run lint` is not defined in `package.json`, skip that command and just run the typecheck + test.

- [ ] **Step 3: Final manual browser walkthrough**

Run: `cd /root/tyx/VINCI && npm run dev`. Visit `http://localhost:7777`. Verify the full diff feature end-to-end:

| Check | Expected |
|---|---|
| First-paint shows default diff | Markers A on Unicode 6.0 (2010), B on Emoji 17.0 (2025), card visible with full stats and emoji strip |
| Reverse selection auto-swaps | Setting from = Emoji 17.0, to = Unicode 6.0 — card still labels 6.0 → 17.0 |
| Same-id hides card | from = to → card disappears, no chips on markers |
| Same year copy | from = Emoji 12.0, to = Emoji 12.1 — card span reads "同年" / "Same year" |
| Draft destination | from = Emoji 17.0, to = Emoji 18.0 — DRAFT badge on card, "(草案)" / "(Draft)" suffix on option text |
| Overflow truncation | from = DoCoMo, to = Emoji 18.0 — emoji strip caps at 30 with "…+N more" suffix |
| Existing tooltip still works | Hover a non-A/B marker — its tooltip appears as before |
| Range-zoom doesn't disturb diff | Click `2020 →` range button — markers A/B remain at correct positions if visible; card unchanged |
| Bilingual | Switch zh↔en — all diff copy translates |
| Keyboard | Tab into dropdowns, use arrow keys to change selection, watch chart + card update |

Stop dev server.

- [ ] **Step 4: Commit memory update**

```bash
cd /root/tyx/VINCI
git add project-memory.md
git commit -m "$(cat <<'EOF'
docs: note version-diff dropdowns in §01 project-memory entry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

Coverage trace from spec to plan:

| Spec section | Implemented in |
|---|---|
| §1 Overview / Goals / Non-Goals | Whole plan respects the scope; no schema/dependency changes |
| §2 UX Decisions (recap) | Tasks 1–5 each implement one decision |
| §3 Architecture (single-file + pure fn) | Task 2 exports the fn from the component file; Tasks 3–5 stay within `CumulativeChart.tsx` |
| §3.3 `computeVersionDiff` contract | Task 2 implementation matches the documented signature, return shape, and null cases |
| §4 Data Flow | Task 3 wires state → diffResult → compareIds; Task 4 reads compareIds; Task 5 reads diffResult |
| §5.1 Layout (chart container) | Task 3 inserts DiffControls after `</svg>`; Task 5 inserts VersionDiffCard after DiffControls |
| §5.2 DiffControls | Task 3 Step 2 |
| §5.3 SVG Marker Annotation | Task 4 (year suppression + chip + aria) |
| §5.4 VersionDiffCard | Task 5 Step 1 |
| §6 i18n Keys (15 keys × 2 locales) | Task 1 |
| §7 Edge Cases | `fromId===toId` and invalid ids covered by Task 2 tests; reverse pick covered by Task 2 test; same year, draft, overflow covered in Task 5 Step 4 manual verification |
| §8 Testing (8 unit tests + adjacent) | Task 2 Step 2 has 9 tests (adjacent test is the 9th) |
| §10 Conventions | Plan uses existing tokens, `useState`/`useMemo`, `ch01.chart.*` namespace, locale-aware `toLocaleString`, no new files outside the existing structure |

No placeholders, no TBD, no "implement later" — every code-touching step contains the exact code to paste.
