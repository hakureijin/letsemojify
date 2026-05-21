#!/usr/bin/env node
/**
 * Build per-version per-group cumulative emoji counts from Unicode CLDR
 * `emoji-test.txt`. Writes `data/chapter-01-categories.json`.
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

// Maps emoji-test.txt group strings to our stable kebab-case keys.
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

const GROUP_ORDER = [
  'smileys-emotion', 'people-body', 'animals-nature',
  'food-drink', 'travel-places', 'activities',
  'objects', 'symbols', 'flags',
]

const SOURCE_URL = 'https://unicode.org/Public/emoji/latest/emoji-test.txt'

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
  const rows = []   // { codepoints, glyph, version, group }

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
  const versions = Object.keys(VERSION_RELEASE).sort((a, b) => {
    const [aMaj, aMin] = a.split('.').map(Number)
    const [bMaj, bMin] = b.split('.').map(Number)
    return aMaj === bMaj ? aMin - bMin : aMaj - bMaj
  })

  const frames = []
  for (const v of versions) {
    const meta = VERSION_RELEASE[v]
    const upTo = rows.filter(r => semverLEq(r.version, v))
    if (upTo.length === 0) continue
    const counts = Object.fromEntries(GROUP_ORDER.map(g => [g, 0]))
    const samplesByGroup = Object.fromEntries(GROUP_ORDER.map(g => [g, []]))
    for (const r of upTo) {
      counts[r.group] = (counts[r.group] || 0) + 1
      if (samplesByGroup[r.group].length < 6) {
        samplesByGroup[r.group].push(r.glyph)
      }
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

  const frames = buildFrames(rows)
  console.log(`[build] ${frames.length} frames`)
  for (const f of frames) {
    console.log(`         ${f.year} · ${f.versionLabel}  total=${f.total}`)
  }

  const out = {
    groupOrder: GROUP_ORDER,
    frames,
    source: {
      id: 'unicode-emoji-test',
      title: {
        zh: `Unicode CLDR · emoji-test.txt v${fileVersion}`,
        en: `Unicode CLDR · emoji-test.txt v${fileVersion}`,
      },
      publisher: 'Unicode Consortium',
      url: SOURCE_URL,
      accessed: new Date().toISOString().slice(0, 10),
    },
  }

  const outPath = resolve(REPO, 'data/chapter-01-categories.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
  console.log(`[write] ${outPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
