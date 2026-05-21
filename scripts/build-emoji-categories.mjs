#!/usr/bin/env node
/**
 * Build per-version per-group cumulative emoji counts AND a variant-mechanism
 * snapshot for the latest version, both from Unicode CLDR `emoji-test.txt`.
 *
 *   data/chapter-01-categories.json  ← per-version 9-group counts
 *   data/chapter-01-variants.json    ← latest-version variant decomposition
 *
 * Usage:
 *   node scripts/build-emoji-categories.mjs             # fetch from unicode.org
 *   node scripts/build-emoji-categories.mjs --from-file .tmp/emoji-test.txt
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')

// Unicode/Emoji version → release year. Pre-11 Unicode emoji shipped tied to
// the parent Unicode standard; emoji got its own versioning at 11.0.
const VERSION_RELEASE = {
  '0.6': { year: 2010, label: 'Unicode 6.0' },
  '0.7': { year: 2014, label: 'Unicode 7.0' },
  '1.0': { year: 2015, label: 'Unicode 8.0' },
  '2.0': { year: 2016, label: 'Unicode 9.0' },
  '3.0': { year: 2016, label: 'Emoji 3.0' },
  '4.0': { year: 2016, label: 'Emoji 4.0' },
  '5.0': { year: 2017, label: 'Emoji 5.0' },
  '11.0': { year: 2018, label: 'Emoji 11.0' },
  '12.0': { year: 2019, label: 'Emoji 12.0' },
  '12.1': { year: 2019, label: 'Emoji 12.1' },
  '13.0': { year: 2020, label: 'Emoji 13.0' },
  '13.1': { year: 2020, label: 'Emoji 13.1' },
  '14.0': { year: 2021, label: 'Emoji 14.0' },
  '15.0': { year: 2022, label: 'Emoji 15.0' },
  '15.1': { year: 2023, label: 'Emoji 15.1' },
  '16.0': { year: 2024, label: 'Emoji 16.0' },
  '17.0': { year: 2025, label: 'Emoji 17.0' },
}

const GROUP_KEYS = {
  'Smileys & Emotion':   'smileys-emotion',
  'People & Body':       'people-body',
  'Animals & Nature':    'animals-nature',
  'Food & Drink':        'food-drink',
  'Travel & Places':     'travel-places',
  'Activities':          'activities',
  'Objects':             'objects',
  'Symbols':             'symbols',
  'Flags':               'flags',
}

export const GROUP_ORDER = [
  'smileys-emotion', 'people-body', 'animals-nature',
  'food-drink', 'travel-places', 'activities',
  'objects', 'symbols', 'flags',
]

export const MECHANISM_ORDER = [
  'base', 'skin-tone', 'multi-skin-tone',
  'zwj-family', 'zwj-role', 'zwj-other',
  'hair-style', 'direction-flipped',
]

const SOURCE_URL = 'https://unicode.org/Public/emoji/latest/emoji-test.txt'

// Codepoint groups referenced by the variant classifier (hex strings, no 'U+').
const ZWJ = '200D'
const SKIN_TONES = new Set(['1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF'])
const HAIR_STYLES = new Set(['1F9B0', '1F9B1', '1F9B2', '1F9B3'])
const DIRECTION_ARROWS = new Set(['27A1', '2194', '2195'])
const PERSON_CODEPOINTS = new Set([
  '1F466', // boy
  '1F467', // girl
  '1F468', // man
  '1F469', // woman
  '1F474', // old man
  '1F475', // old woman
  '1F476', // baby
  '1F9D1', // person
  '1F9D3', // older person
])

/**
 * Classify a fully-qualified emoji into a primary variant mechanism, based
 * solely on its codepoint sequence. Rules are evaluated top to bottom; the
 * first match wins. The prioritisation labels each emoji under its most
 * informative mechanism — e.g. a hair-style ZWJ with a skin tone reports as
 * `hair-style`, not `skin-tone` or `zwj-role`.
 *
 * Exposed for unit testing.
 *
 * @param {string} codepoints space-separated hex codepoints, as emitted by
 *   emoji-test.txt (e.g. `"1F468 200D 1F4BB"`).
 * @returns {('base'|'skin-tone'|'multi-skin-tone'|'zwj-family'|'zwj-role'|'zwj-other'|'hair-style'|'direction-flipped')}
 */
export function classifyEmojiVariant(codepoints) {
  // Strip variation selectors (FE0F) before counting — they're cosmetic.
  const tokens = codepoints.split(/\s+/).filter(t => t && t !== 'FE0F')
  const tokenSet = new Set(tokens)
  const hasZwj = tokenSet.has(ZWJ)

  const skinCount = tokens.filter(t => SKIN_TONES.has(t)).length

  if (hasZwj) {
    // Hair-style sequences are always ZWJ; check before generic role/family
    // since 1F9B0..3 functionally describes the person, not their action.
    if (tokens.some(t => HAIR_STYLES.has(t))) return 'hair-style'
    // Direction-flipped sequences use ZWJ + arrow codepoint (with FE0F stripped).
    if (tokens.some(t => DIRECTION_ARROWS.has(t))) return 'direction-flipped'
    const personCount = tokens.filter(t => PERSON_CODEPOINTS.has(t)).length
    if (personCount >= 2) return 'zwj-family'
    // Multi-skin-tone handshakes (e.g. 1FAF1 1F3FB 200D 1FAF2 1F3FC) don't
    // contain a "person" codepoint but read as a 2-skin-tone variant.
    if (skinCount >= 2) return 'multi-skin-tone'
    if (personCount === 1) return 'zwj-role'
    return 'zwj-other'
  }

  if (skinCount >= 2) return 'multi-skin-tone'
  if (skinCount === 1) return 'skin-tone'
  return 'base'
}

const argFromFile = (() => {
  const i = process.argv.indexOf('--from-file')
  return i > -1 ? process.argv[i + 1] : null
})()

async function loadText() {
  if (argFromFile) {
    return readFileSync(resolve(REPO, argFromFile), 'utf8')
  }
  const cachePath = resolve(REPO, '.tmp/emoji-test.txt')
  if (existsSync(cachePath)) {
    console.log(`[cache] reading ${cachePath}`)
    return readFileSync(cachePath, 'utf8')
  }
  console.log(`[fetch] ${SOURCE_URL}`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${SOURCE_URL}`)
  const text = await res.text()
  mkdirSync(dirname(cachePath), { recursive: true })
  writeFileSync(cachePath, text)
  return text
}

function parseEmojiTest(text) {
  const groupRe   = /^# group: (.+)$/
  const dataRe    = /^([0-9A-F][0-9A-F ]*?)\s*;\s*fully-qualified\s*#\s*(\S+)\s+E(\d+\.\d+)\b/u
  const fileVerRe = /^#\s*Version:\s*(\d+\.\d+)/

  let currentGroup = null
  let fileVersion = null
  const rows = []

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (!fileVersion) {
      const fv = line.match(fileVerRe)
      if (fv) fileVersion = fv[1]
    }
    const gm = line.match(groupRe)
    if (gm) {
      const key = GROUP_KEYS[gm[1]]
      currentGroup = key ?? null
      continue
    }
    if (!currentGroup) continue
    if (line.startsWith('#') || !line) continue
    const dm = line.match(dataRe)
    if (!dm) continue
    rows.push({
      codepoints: dm[1].trim(),
      glyph: dm[2],
      version: dm[3],
      group: currentGroup,
    })
  }
  return { fileVersion, rows }
}

function buildFrames(rows) {
  const versions = Object.keys(VERSION_RELEASE).sort(semverCompare)
  const frames = []
  for (const v of versions) {
    const meta = VERSION_RELEASE[v]
    const upTo = rows.filter(r => semverLEq(r.version, v))
    if (upTo.length === 0) continue
    const counts = Object.fromEntries(GROUP_ORDER.map(g => [g, 0]))
    const samplesByGroup = Object.fromEntries(GROUP_ORDER.map(g => [g, []]))
    for (const r of upTo) {
      counts[r.group] = (counts[r.group] || 0) + 1
      if (samplesByGroup[r.group].length < 6) samplesByGroup[r.group].push(r.glyph)
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    frames.push({
      year: meta.year,
      versionId: `emoji-${v.replace('.', '-')}`,
      versionLabel: meta.label,
      counts,
      samples: samplesByGroup,
      total,
    })
  }
  return frames
}

function buildVariantSnapshot(rows) {
  // Latest version we know about that has data.
  const versions = Object.keys(VERSION_RELEASE).sort(semverCompare)
  const latest = versions.filter(v => rows.some(r => r.version === v)).pop()
  const meta = VERSION_RELEASE[latest]

  const classified = rows.map(r => ({ ...r, mechanism: classifyEmojiVariant(r.codepoints) }))

  // Mechanism aggregates
  const mechanisms = MECHANISM_ORDER.map(id => {
    const subset = classified.filter(r => r.mechanism === id)
    return {
      id,
      count: subset.length,
      examples: subset.slice(0, 4).map(r => r.glyph),
    }
  })

  // Flows: every (mechanism, group) pair with count > 0
  const flows = []
  for (const m of MECHANISM_ORDER) {
    for (const g of GROUP_ORDER) {
      const subset = classified.filter(r => r.mechanism === m && r.group === g)
      if (subset.length === 0) continue
      flows.push({
        mechanism: m,
        group: g,
        count: subset.length,
        examples: subset.slice(0, 4).map(r => r.glyph),
      })
    }
  }

  const total = classified.length
  return {
    snapshot: {
      year: meta.year,
      versionId: `emoji-${latest.replace('.', '-')}`,
      versionLabel: meta.label,
      total,
    },
    mechanisms: mechanisms.map(m => ({
      ...m,
      share: total === 0 ? 0 : m.count / total,
    })),
    flows,
  }
}

function semverCompare(a, b) {
  const [aMaj, aMin] = a.split('.').map(Number)
  const [bMaj, bMin] = b.split('.').map(Number)
  return aMaj === bMaj ? aMin - bMin : aMaj - bMaj
}

function semverLEq(a, b) {
  const [aMaj, aMin] = a.split('.').map(Number)
  const [bMaj, bMin] = b.split('.').map(Number)
  if (aMaj !== bMaj) return aMaj < bMaj
  return aMin <= bMin
}

async function main() {
  const text = await loadText()
  const { fileVersion, rows } = parseEmojiTest(text)
  if (!rows.length) throw new Error('No fully-qualified rows parsed')
  console.log(`[parse] file version ${fileVersion}, ${rows.length} fully-qualified emoji parsed`)

  const accessed = new Date().toISOString().slice(0, 10)
  const sourceBlock = {
    id: 'unicode-emoji-test',
    title: {
      zh: `Unicode CLDR · emoji-test.txt v${fileVersion}`,
      en: `Unicode CLDR · emoji-test.txt v${fileVersion}`,
    },
    publisher: 'Unicode Consortium',
    url: SOURCE_URL,
    accessed,
  }

  // 1. Per-version 9-group counts
  const frames = buildFrames(rows)
  console.log(`[build] ${frames.length} frames`)
  for (const f of frames) {
    console.log(`         ${f.year} · ${f.versionLabel}  total=${f.total}`)
  }
  const categoriesOut = { groupOrder: GROUP_ORDER, frames, source: sourceBlock }
  const categoriesPath = resolve(REPO, 'data/chapter-01-categories.json')
  writeFileSync(categoriesPath, JSON.stringify(categoriesOut, null, 2) + '\n')
  console.log(`[write] ${categoriesPath}`)

  // 2. Variant-mechanism snapshot for the latest version
  const variant = buildVariantSnapshot(rows)
  const variantOut = {
    groupOrder: GROUP_ORDER,
    mechanismOrder: MECHANISM_ORDER,
    ...variant,
    source: sourceBlock,
  }
  console.log(`[build] variants snapshot at ${variant.snapshot.versionLabel}  total=${variant.snapshot.total}`)
  for (const m of variant.mechanisms) {
    console.log(`         ${m.id.padEnd(20)} count=${m.count}  share=${(m.share * 100).toFixed(1)}%`)
  }
  const variantPath = resolve(REPO, 'data/chapter-01-variants.json')
  writeFileSync(variantPath, JSON.stringify(variantOut, null, 2) + '\n')
  console.log(`[write] ${variantPath}`)
}

const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file://${resolve(process.argv[1] || '')}`

if (invokedDirectly) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
