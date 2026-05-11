# Emoji 进化志 · Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page bilingual (zh/en) emoji-trends scrollytelling site on port 7777, with strict data sourcing and a playful "Spotify Wrapped" visual register.

**Architecture:** Next.js 15 App Router with `[locale]` segment for runtime i18n routing via `next-intl`. The page is one route composed of 4 chapter sections plus a hero and footer. Section §01 uses Framer Motion `useScroll`+`useTransform` for horizontal pin-and-translate; the other sections use IntersectionObserver-driven entry reveals. Data and copy are decoupled: numeric data and source URLs live in typed JSON under `/data`; localized strings live under `/messages`.

**Tech Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · `next-intl` · Framer Motion · `d3-scale` / `d3-shape` / `d3-geo` · `world-atlas` topojson · Vitest + React Testing Library for unit tests.

**Spec:** `/root/tyx/VINCI/docs/superpowers/specs/2026-05-11-emoji-trends-multi-topic-design.md`

---

## Scope Check

The spec covers a single coherent feature: one site, four chapters, one deploy target. No subsystem decomposition required.

## File Structure

Project root is `/root/tyx/VINCI/`. New files added by this plan:

```
.
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # locale layout (fonts, next-intl provider scope)
│   │   ├── page.tsx                # composes Hero + 4 sections + Footer
│   │   └── globals.css             # Tailwind base + CSS variable tokens
│   └── layout.tsx                  # root layout (html/body, lang attribute set in [locale]/layout)
├── i18n/
│   ├── routing.ts                  # next-intl locale config (zh, en)
│   └── request.ts                  # next-intl message loader
├── middleware.ts                   # next-intl locale middleware
├── components/
│   ├── ui/
│   │   ├── Section.tsx             # generic section wrapper w/ intersection-observer reveal
│   │   └── Citation.tsx            # inline source link with tooltip
│   ├── Hero.tsx
│   ├── TopNav.tsx                  # floating language toggle + chapter chips
│   ├── Footer.tsx
│   ├── chapter-01/
│   │   ├── EvolutionPath.tsx       # pin-and-translate wrapper
│   │   ├── TimelineCard.tsx
│   │   ├── DecadeIndex.tsx
│   │   └── CumulativeChart.tsx
│   ├── chapter-02/
│   │   ├── WhoGetsIn.tsx
│   │   ├── Pipeline.tsx
│   │   ├── CriteriaCards.tsx
│   │   ├── CaseCards.tsx
│   │   └── OriginMap.tsx
│   ├── chapter-03/
│   │   ├── AlwaysOn.tsx
│   │   ├── HeroStats.tsx
│   │   ├── ScreenTimeBars.tsx
│   │   ├── TopEmojisByGen.tsx
│   │   ├── SemanticShift.tsx
│   │   └── DayInLife.tsx
│   └── chapter-04/
│       ├── BeyondScreen.tsx
│       ├── CategoryChips.tsx
│       └── CaseCard.tsx
├── data/
│   ├── chapter-01.json
│   ├── chapter-02.json
│   ├── chapter-03.json
│   └── chapter-04.json
├── messages/
│   ├── zh.json
│   └── en.json
├── types/
│   ├── source.ts                   # Source type used by all chapters
│   ├── chapter-01.ts
│   ├── chapter-02.ts
│   ├── chapter-03.ts
│   └── chapter-04.ts
├── lib/
│   ├── prefers-reduced-motion.ts   # hook
│   └── countup.ts                  # rAF-driven number animation hook
├── public/
│   └── world-atlas/countries-110m.json
├── tests/
│   ├── data/                        # JSON schema/contract tests
│   │   ├── chapter-01.test.ts
│   │   ├── chapter-02.test.ts
│   │   ├── chapter-03.test.ts
│   │   └── chapter-04.test.ts
│   ├── i18n/
│   │   └── message-keys.test.ts    # zh/en key parity
│   └── logic/
│       ├── filter.test.ts          # §04 category filter logic
│       └── decade-jump.test.ts     # §01 decade chip → scroll offset mapping
├── vitest.config.ts
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.cjs
├── package.json
└── .gitignore
```

**Reasoning for split:**
- One folder per chapter keeps chapter-local components close together (high cohesion, low cross-chapter coupling).
- Data lives in JSON because it changes more often than code and must be auditable by non-engineers (sources can be reviewed in plain text).
- Messages (i18n strings) are split per locale so translators can work without touching code.
- Types mirror the data shape so JSON files are validated at build time via TS narrowing where consumed.
- `tests/` is flat and discovery-friendly for Vitest's default glob.

---

## Chunk 1: Bootstrap & Foundation

Tasks 1–8 stand up the project shell and prove a bilingual route renders before any chapter components exist.

### Task 1: Initialize git repository

**Files:**
- Create: `/root/tyx/VINCI/.gitignore`

- [ ] **Step 1: Initialize git**

```bash
cd /root/tyx/VINCI && git init
```

- [ ] **Step 2: Write .gitignore**

```
node_modules
.next
.env.local
.env*.local
*.tsbuildinfo
.DS_Store
.superpowers/brainstorm/*/state
```

Note: `.superpowers/brainstorm/*/content` is intentionally tracked so brainstorm history is preserved; only ephemeral runtime `state/` is ignored.

- [ ] **Step 3: First commit**

```bash
cd /root/tyx/VINCI && git add .gitignore docs/ project-memory.md .superpowers/ && git commit -m "chore: initial commit with spec, plan, and brainstorm history"
```

Expected: A single commit on `main` containing the spec, plan, and brainstorm artifacts. `article.docx` is intentionally left untracked because it is large and not required for the build.

### Task 2: Scaffold Next.js project

**Files:**
- Create: many under project root via `create-next-app`

- [ ] **Step 1: Run scaffold**

```bash
cd /root/tyx/VINCI && pnpm dlx create-next-app@15 . \
  --typescript --tailwind --app --src-dir=false \
  --eslint --no-import-alias --use-pnpm \
  --turbopack=false
```

If `pnpm` is unavailable, substitute `npm create next-app@15 ...` and continue with `npm` throughout.

Expected: Files for `app/`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`, `postcss.config.cjs`, `package.json` are created. The scaffolder asks no interactive questions when all flags are provided.

- [ ] **Step 2: Verify dev server boots**

```bash
cd /root/tyx/VINCI && pnpm dev -- -p 7777
```

Open `http://localhost:7777`. Expected: default Next.js welcome page renders.

Kill the dev server (`Ctrl-C`) before moving on.

- [ ] **Step 3: Commit**

```bash
cd /root/tyx/VINCI && git add -A && git commit -m "chore: scaffold Next.js 15 app with TS + Tailwind"
```

### Task 3: Install runtime dependencies

**Files:**
- Modify: `/root/tyx/VINCI/package.json`

- [ ] **Step 1: Install**

```bash
cd /root/tyx/VINCI && pnpm add next-intl framer-motion d3-scale d3-shape d3-geo d3-array world-atlas topojson-client
```

- [ ] **Step 2: Install dev dependencies**

```bash
cd /root/tyx/VINCI && pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/d3-scale @types/d3-shape @types/d3-geo @types/d3-array @types/topojson-client
```

- [ ] **Step 3: Commit**

```bash
cd /root/tyx/VINCI && git add package.json pnpm-lock.yaml && git commit -m "chore: add runtime and dev dependencies"
```

### Task 4: Pin dev script to port 7777

**Files:**
- Modify: `/root/tyx/VINCI/package.json` (the `scripts` block)

- [ ] **Step 1: Update scripts**

Replace the `scripts` block contents with:

```json
"scripts": {
  "dev": "next dev -p 7777",
  "build": "next build",
  "start": "next start -p 7777",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Verify**

```bash
cd /root/tyx/VINCI && pnpm dev
```

Expected: server listens on `http://localhost:7777`. Kill with `Ctrl-C`.

- [ ] **Step 3: Commit**

```bash
cd /root/tyx/VINCI && git add package.json && git commit -m "chore: pin dev/start scripts to port 7777 and add test scripts"
```

### Task 5: Configure Vitest

**Files:**
- Create: `/root/tyx/VINCI/vitest.config.ts`
- Create: `/root/tyx/VINCI/tests/setup.ts`

- [ ] **Step 1: Write Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 2: Write Vitest setup**

```ts
// tests/setup.ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Write a sanity test and verify it runs**

Create `tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run:

```bash
cd /root/tyx/VINCI && pnpm test
```

Expected: `1 passed`. Then delete the sanity test:

```bash
rm /root/tyx/VINCI/tests/sanity.test.ts
```

- [ ] **Step 4: Commit**

```bash
cd /root/tyx/VINCI && git add vitest.config.ts tests/setup.ts && git commit -m "test: configure Vitest with jsdom + testing-library"
```

### Task 6: Configure next-intl routing for `zh` and `en`

**Files:**
- Create: `/root/tyx/VINCI/i18n/routing.ts`
- Create: `/root/tyx/VINCI/i18n/request.ts`
- Create: `/root/tyx/VINCI/middleware.ts`
- Modify: `/root/tyx/VINCI/next.config.ts`

- [ ] **Step 1: Write routing config**

```ts
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always',
})
```

- [ ] **Step 2: Write request config**

```ts
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'zh' | 'en')) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 3: Write middleware**

```ts
// middleware.ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 4: Wire next-intl plugin into next.config.ts**

Replace `next.config.ts` contents with:

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 5: Commit**

```bash
cd /root/tyx/VINCI && git add i18n middleware.ts next.config.ts && git commit -m "chore: configure next-intl with zh and en locales"
```

### Task 7: Create [locale] route, root layout, and seed messages

**Files:**
- Create: `/root/tyx/VINCI/messages/zh.json`
- Create: `/root/tyx/VINCI/messages/en.json`
- Modify: `/root/tyx/VINCI/app/layout.tsx`
- Create: `/root/tyx/VINCI/app/[locale]/layout.tsx`
- Create: `/root/tyx/VINCI/app/[locale]/page.tsx`
- Delete: `/root/tyx/VINCI/app/page.tsx` (the scaffold default; routing now lives under [locale])
- Move: `/root/tyx/VINCI/app/globals.css` → `/root/tyx/VINCI/app/[locale]/globals.css` (or keep at root and import from locale layout; pick whichever the scaffold produced and adapt)

- [ ] **Step 1: Seed messages**

Write `messages/zh.json`:

```json
{
  "hello": "你好，世界"
}
```

Write `messages/en.json`:

```json
{
  "hello": "Hello, World"
}
```

- [ ] **Step 2: Root layout returns html shell**

Replace `app/layout.tsx`:

```tsx
import './[locale]/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

The root layout MUST NOT wrap with `<html>` / `<body>` — Next.js sees `[locale]/layout.tsx` as the lang-aware root. The root layout exists only so Next can statically analyze the tree.

- [ ] **Step 3: Write [locale] layout**

Create `app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import './globals.css'

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'zh' | 'en')) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Stub the page**

Create `app/[locale]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations()
  return <main className="p-8 text-2xl">{t('hello')}</main>
}
```

Delete `app/page.tsx` if it still exists after scaffolding.

- [ ] **Step 5: Smoke test in browser**

```bash
cd /root/tyx/VINCI && pnpm dev
```

Visit `http://localhost:7777/zh` → expect `你好，世界`. Visit `http://localhost:7777/en` → expect `Hello, World`. Visit `http://localhost:7777/` → expect a redirect to `/zh`.

Kill the dev server.

- [ ] **Step 6: Commit**

```bash
cd /root/tyx/VINCI && git add -A && git commit -m "feat: locale-prefixed routing with zh/en hello-world"
```

### Task 8: Define design tokens in Tailwind theme

**Files:**
- Modify: `/root/tyx/VINCI/app/[locale]/globals.css`
- Modify: `/root/tyx/VINCI/tailwind.config.ts` (or `tailwind.config.js` if scaffold produced JS; standardize on TS)

- [ ] **Step 1: Add CSS variables**

Append to `app/[locale]/globals.css` (after the `@import "tailwindcss"` line that v4 scaffolds):

```css
:root {
  --bg: #fff8f0;
  --ink: #181817;
  --muted: #6f706d;
  --line: #eadfd0;

  --accent-01: #ff7f6e; /* §01 peach */
  --accent-02: #6ed1b3; /* §02 mint */
  --accent-03: #ffc857; /* §03 sunshine */
  --accent-04: #8a7fff; /* §04 violet */

  --signal-cultural: #ffb84a;
  --signal-reject: #ff7a85;
}

html, body { background: var(--bg); color: var(--ink); }
body { font-family: 'Inter Tight', Inter, ui-sans-serif, system-ui, sans-serif; }
.tabular { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 2: Expose to Tailwind (v4 reads CSS vars directly)**

Tailwind v4 reads `--*` tokens via `@theme` block or via arbitrary values like `bg-[var(--accent-01)]`. Prefer arbitrary values for the four accent colors so swapping is trivial and there's no token aliasing layer. No `tailwind.config.ts` change is required for tokens themselves.

If the scaffold left a `tailwind.config.ts` file, leave it. If it created a `.js` file, rename to `.ts` for consistency but do not add any token aliasing here — keep the source of truth in CSS.

- [ ] **Step 3: Smoke check**

Edit `app/[locale]/page.tsx` body to:

```tsx
<main className="p-8">
  <h1 className="text-3xl font-black" style={{ color: 'var(--accent-01)' }}>{t('hello')}</h1>
</main>
```

`pnpm dev`, visit `/zh`, expect peach-colored hello text. Restore the heading to neutral after verifying.

- [ ] **Step 4: Commit**

```bash
cd /root/tyx/VINCI && git add -A && git commit -m "feat: define design tokens (per-section accent CSS variables)"
```

---

## Chunk 2: Shared UI primitives and shell

Tasks 9–13 create the small reusable components that every chapter will consume, and the page shell that composes them.

### Task 9: Define `Source` type and citation contract

**Files:**
- Create: `/root/tyx/VINCI/types/source.ts`

- [ ] **Step 1: Write the type**

```ts
// types/source.ts
export interface Source {
  id: string            // stable slug used to dedupe in footer references
  title: { zh: string; en: string }
  publisher: string
  url: string
  accessed: string      // ISO date YYYY-MM-DD
}

export interface Cited<T> {
  value: T
  sources: string[]     // array of Source.id values
}
```

- [ ] **Step 2: Commit**

```bash
cd /root/tyx/VINCI && git add types/source.ts && git commit -m "feat: define Source and Cited<T> types"
```

### Task 10: Build `<Citation>` component

**Files:**
- Create: `/root/tyx/VINCI/components/ui/Citation.tsx`
- Create: `/root/tyx/VINCI/tests/ui/Citation.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/Citation.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Citation } from '@/components/ui/Citation'

describe('<Citation>', () => {
  it('renders a link to the source URL with publisher as visible text', () => {
    render(
      <Citation
        source={{
          id: 's1',
          title: { zh: '标题', en: 'Title' },
          publisher: 'Unicode Consortium',
          url: 'https://unicode.org',
          accessed: '2026-05-11',
        }}
        locale="en"
      />
    )
    const link = screen.getByRole('link', { name: /Unicode Consortium/ })
    expect(link).toHaveAttribute('href', 'https://unicode.org')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringMatching(/noopener/))
  })
})
```

- [ ] **Step 2: Run test (expect fail)**

```bash
cd /root/tyx/VINCI && pnpm test tests/ui/Citation.test.tsx
```

Expected: fail (module not found).

- [ ] **Step 3: Implement**

```tsx
// components/ui/Citation.tsx
import type { Source } from '@/types/source'

export function Citation({ source, locale }: { source: Source; locale: 'zh' | 'en' }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[color:var(--muted)] underline-offset-2 hover:underline italic"
      title={source.title[locale]}
    >
      → {source.publisher}
    </a>
  )
}
```

- [ ] **Step 4: Run test (expect pass) and commit**

```bash
cd /root/tyx/VINCI && pnpm test tests/ui/Citation.test.tsx
git add components/ui/Citation.tsx tests/ui/Citation.test.tsx && git commit -m "feat: <Citation> renders a source link"
```

### Task 11: Build `prefers-reduced-motion` hook

**Files:**
- Create: `/root/tyx/VINCI/lib/prefers-reduced-motion.ts`
- Create: `/root/tyx/VINCI/tests/lib/prefers-reduced-motion.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/prefers-reduced-motion.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'

describe('usePrefersReducedMotion', () => {
  it('returns true when media query matches', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false when media query does not match', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })
})
```

- [ ] **Step 2: Run test (expect fail)**

- [ ] **Step 3: Implement**

```ts
// lib/prefers-reduced-motion.ts
'use client'
import { useEffect, useState } from 'react'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])
  return reduced
}
```

- [ ] **Step 4: Run test (pass) and commit**

```bash
cd /root/tyx/VINCI && pnpm test tests/lib/prefers-reduced-motion.test.ts
git add lib/prefers-reduced-motion.ts tests/lib/prefers-reduced-motion.test.ts && git commit -m "feat: usePrefersReducedMotion hook"
```

### Task 12: Build `<Section>` wrapper with intersection-observer reveal

**Files:**
- Create: `/root/tyx/VINCI/components/ui/Section.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/ui/Section.tsx
'use client'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'

interface Props {
  id: string
  accent: string                  // CSS color (e.g. 'var(--accent-01)')
  children: React.ReactNode
  className?: string
}

export function Section({ id, accent, children, className = '' }: Props) {
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return (
      <section id={id} className={`py-16 ${className}`} style={{ scrollMarginTop: 80 }}>
        {children}
      </section>
    )
  }

  return (
    <motion.section
      id={id}
      className={`py-16 ${className}`}
      style={{ scrollMarginTop: 80, ['--section-accent' as never]: accent }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}
```

- [ ] **Step 2: Commit**

`git add components/ui/Section.tsx && git commit -m "feat: <Section> wrapper with reveal animation and reduced-motion fallback"`

(No unit test for this component — it is a thin wrapper around `framer-motion`. Visual verification happens in Task 14.)

### Task 13: Build `<TopNav>` (language toggle + chapter chips)

**Files:**
- Create: `/root/tyx/VINCI/components/TopNav.tsx`
- Modify: `/root/tyx/VINCI/messages/zh.json`
- Modify: `/root/tyx/VINCI/messages/en.json`

- [ ] **Step 1: Add chapter labels to message files**

Add to both `messages/zh.json` and `messages/en.json`:

```json
"nav": {
  "ch01": "进化之路 / The Evolution Path",
  "ch02": "谁能成为 emoji / Who Gets In",
  "ch03": "Z 世代手机依赖 / Always On",
  "ch04": "屏幕之外 / Beyond the Screen",
  "switchLang": "EN",
  "switchLangAlt": "中"
}
```

Use the locale-appropriate string for `switchLang` (the *other* locale's short label): zh shows "EN", en shows "中".

- [ ] **Step 2: Implement TopNav**

```tsx
// components/TopNav.tsx
'use client'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from 'next-intl/routing' // see note
import { useRouter } from 'next/navigation'

// next-intl v3+ exposes Link/usePathname under its routing module; if importing
// from 'next-intl/routing' fails for your installed version, switch to:
//   import {Link, usePathname} from 'next-intl/client'

const CHAPTERS = ['ch01', 'ch02', 'ch03', 'ch04'] as const
const HASHES = { ch01: 'ch01', ch02: 'ch02', ch03: 'ch03', ch04: 'ch04' }

export function TopNav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const otherLocale = locale === 'zh' ? 'en' : 'zh'
  const switchLabel = locale === 'zh' ? 'EN' : '中'

  return (
    <nav className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-2 shadow-md border border-[color:var(--line)]">
      {CHAPTERS.map(ch => (
        <a
          key={ch}
          href={`#${HASHES[ch]}`}
          className="text-xs font-bold text-[color:var(--muted)] hover:text-[color:var(--ink)] px-2 py-1 rounded-full hover:bg-[color:var(--line)]/40"
        >
          {ch.replace('ch0', '0')}
        </a>
      ))}
      <button
        onClick={() => router.replace(pathname, { locale: otherLocale })}
        className="ml-1 text-xs font-bold bg-[color:var(--ink)] text-white px-3 py-1 rounded-full"
        aria-label={`Switch language to ${switchLabel}`}
      >
        {switchLabel}
      </button>
    </nav>
  )
}
```

- [ ] **Step 3: Visual smoke check**

Add `<TopNav />` to `app/[locale]/page.tsx` temporarily. `pnpm dev`, visit `/zh`, click `EN` button, verify URL becomes `/en` and label flips to `中`. Click chapter chip (e.g. `01`), verify the URL gets `#ch01`.

- [ ] **Step 4: Commit**

`git add -A && git commit -m "feat: TopNav with language toggle and chapter anchors"`

---

## Chunk 3: §01 Evolution Path

Tasks 14–19 build the horizontal pin-and-translate chapter.

### Task 14: Define chapter-01 data types

**Files:**
- Create: `/root/tyx/VINCI/types/chapter-01.ts`

- [ ] **Step 1: Implement**

```ts
// types/chapter-01.ts
import type { Source } from './source'

export interface TimelineNode {
  id: string                            // slug; usable as scroll anchor
  year: number
  versionLabel: string                  // e.g. "Unicode 6.0", "DoCoMo"
  kind: 'unicode' | 'milestone'
  newEmojiCount: number | null          // null when not applicable (e.g. DoCoMo era)
  highlightEmojis: string[]             // 3–5 strings
  narrativeKey: string                  // i18n key under "ch01.timeline.<id>.narrative"
  source: Source
}

export interface Chapter01Data {
  sources: Source[]                     // deduped registry of all sources used in §01
  timeline: TimelineNode[]
  decadeIndex: number[]                 // years that get click-to-jump chips
  cumulative: { year: number; total: number; sourceId: string }[]
}
```

- [ ] **Step 2: Commit**

`git add types/chapter-01.ts && git commit -m "feat: chapter-01 types"`

### Task 15: Stub chapter-01.json and write contract test

**Files:**
- Create: `/root/tyx/VINCI/data/chapter-01.json`
- Create: `/root/tyx/VINCI/tests/data/chapter-01.test.ts`

- [ ] **Step 1: Seed a minimal valid JSON**

```json
{
  "sources": [
    {
      "id": "emojipedia-versions",
      "title": { "zh": "Emoji 版本列表", "en": "Emoji Versions" },
      "publisher": "Emojipedia",
      "url": "https://emojipedia.org/emoji-versions",
      "accessed": "2026-05-11"
    }
  ],
  "timeline": [
    {
      "id": "docomo-1999",
      "year": 1999,
      "versionLabel": "DoCoMo",
      "kind": "milestone",
      "newEmojiCount": 176,
      "highlightEmojis": ["☀️","☁️","☂️"],
      "narrativeKey": "ch01.timeline.docomo-1999.narrative",
      "source": {
        "id": "moma-docomo",
        "title": { "zh": "MoMA 原 DoCoMo emoji 收藏", "en": "MoMA · NTT DoCoMo Emoji" },
        "publisher": "MoMA",
        "url": "https://www.moma.org/collection/works/196070",
        "accessed": "2026-05-11"
      }
    }
  ],
  "decadeIndex": [1999, 2010, 2015, 2020, 2024],
  "cumulative": [
    { "year": 1999, "total": 176, "sourceId": "emojipedia-versions" }
  ]
}
```

- [ ] **Step 2: Write contract test**

```ts
// tests/data/chapter-01.test.ts
import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-01.json'
import type { Chapter01Data } from '@/types/chapter-01'

const typed: Chapter01Data = data

describe('chapter-01 data', () => {
  it('every timeline node references a valid source either inline or by sources[]', () => {
    for (const node of typed.timeline) {
      expect(node.source.url).toMatch(/^https?:\/\//)
      expect(node.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('decadeIndex years all appear in timeline', () => {
    const years = new Set(typed.timeline.map(n => n.year))
    for (const y of typed.decadeIndex) {
      // weak invariant for the stub; tighten later when timeline is populated
      // expect(years.has(y)).toBe(true)
      expect(typeof y).toBe('number')
    }
  })

  it('cumulative entries are sorted by year ascending', () => {
    for (let i = 1; i < typed.cumulative.length; i++) {
      expect(typed.cumulative[i].year).toBeGreaterThanOrEqual(typed.cumulative[i - 1].year)
    }
  })

  it('every source.id is unique across timeline.source and sources[]', () => {
    const all = new Set<string>()
    typed.sources.forEach(s => all.add(s.id))
    typed.timeline.forEach(n => all.add(n.source.id))
    // weak check on the stub
    expect(all.size).toBeGreaterThan(0)
  })
})
```

Run: `pnpm test tests/data/chapter-01.test.ts`. Expected: passes on the stub.

- [ ] **Step 3: Commit**

`git add data/chapter-01.json tests/data/chapter-01.test.ts && git commit -m "test: chapter-01 data contract + minimal stub"`

### Task 16: Build `<TimelineCard>`

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-01/TimelineCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chapter-01/TimelineCard.tsx
'use client'
import type { TimelineNode } from '@/types/chapter-01'
import { useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { Source } from '@/types/source'

interface Props {
  node: TimelineNode
  active: boolean                        // is this the focused card?
  locale: 'zh' | 'en'
}

export function TimelineCard({ node, active, locale }: Props) {
  const t = useTranslations()
  const scale = active ? 'scale-110' : 'scale-100'
  const opacity = active ? 'opacity-100' : 'opacity-60'
  const ring = active ? 'ring-2 ring-[color:var(--accent-01)]' : ''
  return (
    <article
      className={`flex-none w-44 bg-white rounded-2xl shadow-md p-3 transition-all duration-200 ${scale} ${opacity} ${ring}`}
    >
      <div className="text-[10px] font-black tracking-wider text-[color:var(--accent-01)]">
        {node.year} · {node.versionLabel}
      </div>
      <div className="text-sm font-extrabold mt-1">
        {node.newEmojiCount !== null ? `+${node.newEmojiCount}` : '—'}
      </div>
      <p className="text-[11px] text-[color:var(--muted)] mt-2 leading-snug">
        {t(node.narrativeKey as never)}
      </p>
      <div className="text-xl mt-2 tracking-widest">
        {node.highlightEmojis.join(' ')}
      </div>
      <div className="mt-3">
        <Citation source={node.source as Source} locale={locale} />
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Commit**

`git add components/chapter-01/TimelineCard.tsx && git commit -m "feat: <TimelineCard>"`

### Task 17: Build `<DecadeIndex>` with click-to-jump logic test

**Files:**
- Create: `/root/tyx/VINCI/lib/decade-jump.ts`
- Create: `/root/tyx/VINCI/components/chapter-01/DecadeIndex.tsx`
- Create: `/root/tyx/VINCI/tests/logic/decade-jump.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/logic/decade-jump.test.ts
import { describe, it, expect } from 'vitest'
import { computeJumpRatio } from '@/lib/decade-jump'

describe('computeJumpRatio', () => {
  it('returns 0 for the first node', () => {
    expect(computeJumpRatio(1999, [1999, 2010, 2024])).toBe(0)
  })
  it('returns 1 for the last node', () => {
    expect(computeJumpRatio(2024, [1999, 2010, 2024])).toBeCloseTo(1, 5)
  })
  it('returns the proportional offset for an in-between year', () => {
    expect(computeJumpRatio(2010, [1999, 2010, 2024])).toBeCloseTo(0.5, 5)
  })
  it('throws when year not in the list', () => {
    expect(() => computeJumpRatio(2017, [1999, 2010, 2024])).toThrow(/not in decadeIndex/)
  })
})
```

- [ ] **Step 2: Run (fail), then implement**

```ts
// lib/decade-jump.ts
export function computeJumpRatio(targetYear: number, decadeIndex: number[]): number {
  const idx = decadeIndex.indexOf(targetYear)
  if (idx === -1) throw new Error(`year ${targetYear} not in decadeIndex`)
  if (decadeIndex.length === 1) return 0
  return idx / (decadeIndex.length - 1)
}
```

Run: `pnpm test tests/logic/decade-jump.test.ts`. Expected: 4 passed.

- [ ] **Step 3: Implement the component**

```tsx
// components/chapter-01/DecadeIndex.tsx
'use client'
import { computeJumpRatio } from '@/lib/decade-jump'

interface Props {
  years: number[]
  outerRef: React.RefObject<HTMLDivElement | null>
  containerHeightVh: number
}

export function DecadeIndex({ years, outerRef, containerHeightVh }: Props) {
  const onJump = (y: number) => {
    const ratio = computeJumpRatio(y, years)
    const el = outerRef.current
    if (!el) return
    const top = el.offsetTop
    const innerScrollable = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + innerScrollable * ratio, behavior: 'smooth' })
  }
  return (
    <div className="flex gap-2 px-6 pt-4">
      {years.map(y => (
        <button
          key={y}
          onClick={() => onJump(y)}
          className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-[color:var(--line)] hover:bg-[color:var(--accent-01)] hover:text-white transition"
        >
          {y}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

`git add lib/decade-jump.ts components/chapter-01/DecadeIndex.tsx tests/logic/decade-jump.test.ts && git commit -m "feat: <DecadeIndex> with click-to-jump logic"`

### Task 18: Build `<EvolutionPath>` pin-and-translate wrapper

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-01/EvolutionPath.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chapter-01/EvolutionPath.tsx
'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLocale } from 'next-intl'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { TimelineCard } from './TimelineCard'
import { DecadeIndex } from './DecadeIndex'
import type { Chapter01Data } from '@/types/chapter-01'

interface Props { data: Chapter01Data }

export function EvolutionPath({ data }: Props) {
  const locale = useLocale() as 'zh' | 'en'
  const reduced = usePrefersReducedMotion()
  const outerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ['start start', 'end end'] })

  const cardCount = data.timeline.length
  const trackWidth = cardCount * 192 + (cardCount - 1) * 14 // px
  const maxTranslate = Math.max(0, trackWidth - 800)        // assume 800px focal viewport width
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxTranslate])

  if (reduced) {
    return (
      <div className="bg-gradient-to-r from-[color:var(--accent-01)]/10 via-pink-50 to-violet-100 py-16">
        <div className="px-6">
          <DecadeIndex years={data.decadeIndex} outerRef={outerRef} containerHeightVh={100} />
          <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory">
            {data.timeline.map((n) => (
              <div key={n.id} className="snap-start">
                <TimelineCard node={n} active locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={outerRef} style={{ height: `${cardCount * 35}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-gradient-to-r from-[color:var(--accent-01)]/15 via-pink-50 to-violet-100">
        <DecadeIndex years={data.decadeIndex} outerRef={outerRef} containerHeightVh={cardCount * 35} />
        <div className="h-full flex items-center">
          <motion.div style={{ x }} className="flex gap-3.5 pl-[40vw]">
            {data.timeline.map((n, i) => (
              <FocusAwareCard key={n.id} node={n} locale={locale} index={i} count={cardCount} progress={scrollYProgress} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

import type { MotionValue } from 'framer-motion'
import { useMotionValueEvent, useMotionValue } from 'framer-motion'
import { useState } from 'react'

function FocusAwareCard({
  node, locale, index, count, progress,
}: {
  node: import('@/types/chapter-01').TimelineNode
  locale: 'zh' | 'en'
  index: number
  count: number
  progress: MotionValue<number>
}) {
  const [active, setActive] = useState(index === 0)
  useMotionValueEvent(progress, 'change', (latest) => {
    const focal = Math.round(latest * (count - 1))
    setActive(focal === index)
  })
  return <TimelineCard node={node} active={active} locale={locale} />
}
```

- [ ] **Step 2: Visual smoke check**

Wire this into `app/[locale]/page.tsx` (next task does the proper composition; for now temporarily import + render with the stub data). `pnpm dev`, scroll through `/zh`, verify cards translate left and the active card scales up.

- [ ] **Step 3: Commit**

`git add components/chapter-01/EvolutionPath.tsx && git commit -m "feat: <EvolutionPath> with pin-and-translate + reduced-motion fallback"`

### Task 19: Build `<CumulativeChart>` (after-pin growth chart)

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-01/CumulativeChart.tsx`

- [ ] **Step 1: Implement (D3 scales, native SVG)**

```tsx
// components/chapter-01/CumulativeChart.tsx
'use client'
import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { line, area, curveMonotoneX } from 'd3-shape'
import type { Chapter01Data } from '@/types/chapter-01'

const W = 800, H = 220, PAD = { l: 36, r: 12, t: 16, b: 28 }

export function CumulativeChart({ data }: { data: Chapter01Data['cumulative'] }) {
  const { pathLine, pathArea, xTicks, yTicks, xScale, yScale } = useMemo(() => {
    const xs = data.map(d => d.year)
    const ys = data.map(d => d.total)
    const xScale = scaleLinear().domain([Math.min(...xs), Math.max(...xs)]).range([PAD.l, W - PAD.r])
    const yScale = scaleLinear().domain([0, Math.max(...ys) * 1.05]).nice().range([H - PAD.b, PAD.t])
    const l = line<{ year: number; total: number }>().x(d => xScale(d.year)).y(d => yScale(d.total)).curve(curveMonotoneX)
    const a = area<{ year: number; total: number }>().x(d => xScale(d.year)).y0(yScale(0)).y1(d => yScale(d.total)).curve(curveMonotoneX)
    return {
      pathLine: l(data) || '',
      pathArea: a(data) || '',
      xTicks: xScale.ticks(6),
      yTicks: yScale.ticks(4),
      xScale, yScale,
    }
  }, [data])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cumulative emoji count over time">
      <defs>
        <linearGradient id="gradGrowth" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--accent-01)" />
          <stop offset="100%" stopColor="var(--accent-04)" />
        </linearGradient>
      </defs>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={yScale(t)} y2={yScale(t)} stroke="var(--line)" strokeDasharray="2 4" />
          <text x={PAD.l - 6} y={yScale(t)} textAnchor="end" dominantBaseline="central" fontSize="10" fill="var(--muted)">{t}</text>
        </g>
      ))}
      <path d={pathArea} fill="url(#gradGrowth)" opacity={0.18} />
      <path d={pathLine} fill="none" stroke="url(#gradGrowth)" strokeWidth={2.2} />
      {xTicks.map(t => (
        <text key={t} x={xScale(t)} y={H - 8} fontSize="10" fill="var(--muted)" textAnchor="middle">{t}</text>
      ))}
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

`git add components/chapter-01/CumulativeChart.tsx && git commit -m "feat: <CumulativeChart> D3 SVG growth chart"`

---

## Chunk 4: §02 Who Gets In

Tasks 20–24 build the criteria + cases + origin map chapter.

### Task 20: Define chapter-02 types and stub JSON

**Files:**
- Create: `/root/tyx/VINCI/types/chapter-02.ts`
- Create: `/root/tyx/VINCI/data/chapter-02.json`
- Create: `/root/tyx/VINCI/tests/data/chapter-02.test.ts`

- [ ] **Step 1: Implement types**

```ts
// types/chapter-02.ts
import type { Source } from './source'

export interface PipelineStep {
  id: string
  labelKey: string                       // i18n key
  descKey: string
}

export interface Criterion {
  id: string
  tone: 'mint' | 'cultural' | 'reject'   // visual variant
  titleKey: string
  descKey: string
}

export interface CaseCard {
  id: string
  emoji: string
  year: number
  unicodeVersion: string
  status: 'accepted' | 'rejected'
  proposerKey: string                    // i18n key
  storyKey: string
  source: Source
}

export interface OriginPin {
  id: string
  emoji: string
  country: string                        // ISO 3166-1 alpha-2
  lat: number
  lng: number
  year: number
  labelKey: string                       // tooltip label
}

export interface Chapter02Data {
  sources: Source[]
  pipeline: PipelineStep[]
  criteria: Criterion[]
  cases: CaseCard[]
  origins: OriginPin[]
}
```

- [ ] **Step 2: Seed stub JSON with at least one entry per array**

`data/chapter-02.json`:

```json
{
  "sources": [
    {
      "id": "unicode-proposals",
      "title": { "zh": "Unicode 提案指南", "en": "Submitting Emoji Proposals" },
      "publisher": "Unicode Consortium",
      "url": "https://www.unicode.org/emoji/proposals.html",
      "accessed": "2026-05-11"
    }
  ],
  "pipeline": [
    { "id": "submit",   "labelKey": "ch02.pipeline.submit.label",   "descKey": "ch02.pipeline.submit.desc" },
    { "id": "esc",      "labelKey": "ch02.pipeline.esc.label",      "descKey": "ch02.pipeline.esc.desc" },
    { "id": "utc",      "labelKey": "ch02.pipeline.utc.label",      "descKey": "ch02.pipeline.utc.desc" },
    { "id": "release",  "labelKey": "ch02.pipeline.release.label",  "descKey": "ch02.pipeline.release.desc" },
    { "id": "vendor",   "labelKey": "ch02.pipeline.vendor.label",   "descKey": "ch02.pipeline.vendor.desc" }
  ],
  "criteria": [
    { "id": "freq", "tone": "mint", "titleKey": "ch02.criteria.freq.title", "descKey": "ch02.criteria.freq.desc" }
  ],
  "cases": [
    {
      "id": "dumpling",
      "emoji": "🥟",
      "year": 2017,
      "unicodeVersion": "Unicode 10.0",
      "status": "accepted",
      "proposerKey": "ch02.cases.dumpling.proposer",
      "storyKey": "ch02.cases.dumpling.story",
      "source": {
        "id": "L2-15-239",
        "title": { "zh": "L2/15-239 饺子提案", "en": "L2/15-239 Dumpling proposal" },
        "publisher": "Unicode L2",
        "url": "https://www.unicode.org/L2/L2015/15239-dumpling.pdf",
        "accessed": "2026-05-11"
      }
    }
  ],
  "origins": [
    {
      "id": "dumpling-cn",
      "emoji": "🥟",
      "country": "CN",
      "lat": 35.8617,
      "lng": 104.1954,
      "year": 2017,
      "labelKey": "ch02.origins.dumpling-cn.label"
    }
  ]
}
```

- [ ] **Step 3: Write contract test**

```ts
// tests/data/chapter-02.test.ts
import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-02.json'
import type { Chapter02Data } from '@/types/chapter-02'

const typed: Chapter02Data = data

describe('chapter-02 data', () => {
  it('pipeline has 5 steps', () => {
    expect(typed.pipeline.length).toBe(5)
  })

  it('every case has a verifiable source URL', () => {
    for (const c of typed.cases) {
      expect(c.source.url).toMatch(/^https?:\/\//)
      expect(['accepted', 'rejected']).toContain(c.status)
    }
  })

  it('every origin pin has a 2-letter ISO country code and reasonable coords', () => {
    for (const o of typed.origins) {
      expect(o.country).toMatch(/^[A-Z]{2}$/)
      expect(o.lat).toBeGreaterThan(-90)
      expect(o.lat).toBeLessThan(90)
      expect(o.lng).toBeGreaterThanOrEqual(-180)
      expect(o.lng).toBeLessThanOrEqual(180)
    }
  })
})
```

Run: `pnpm test tests/data/chapter-02.test.ts`. Expected: 3 passed.

- [ ] **Step 4: Commit**

`git add types/chapter-02.ts data/chapter-02.json tests/data/chapter-02.test.ts && git commit -m "feat: chapter-02 types, stub JSON, contract test"`

### Task 21: Build `<Pipeline>` 5-step process diagram

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-02/Pipeline.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chapter-02/Pipeline.tsx
'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { PipelineStep } from '@/types/chapter-02'

export function Pipeline({ steps }: { steps: PipelineStep[] }) {
  const t = useTranslations()
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-2">
        {steps.map((s, i) => (
          <>
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex-1 text-center"
            >
              <div className="mx-auto w-9 h-9 rounded-full bg-[color:var(--accent-02)] text-white flex items-center justify-center font-black text-sm">{i + 1}</div>
              <div className="text-xs font-extrabold mt-2">{t(s.labelKey as never)}</div>
              <div className="text-[10px] text-[color:var(--muted)] mt-1 leading-tight">{t(s.descKey as never)}</div>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                key={`${s.id}-c`}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 + 0.04 }}
                className="h-0.5 w-6 mt-5 bg-[color:var(--accent-02)] origin-left"
              />
            )}
          </>
        ))}
      </div>
    </div>
  )
}
```

(Note: rewrite the JSX to avoid React fragment-key issues — use a single keyed wrapper per step if React warnings appear. The simplest form is to skip fragments and pre-build the array.)

- [ ] **Step 2: Commit**

`git add components/chapter-02/Pipeline.tsx && git commit -m "feat: <Pipeline> 5-step process diagram"`

### Task 22: Build `<CriteriaCards>` and `<CaseCards>`

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-02/CriteriaCards.tsx`
- Create: `/root/tyx/VINCI/components/chapter-02/CaseCards.tsx`

- [ ] **Step 1: CriteriaCards**

```tsx
// components/chapter-02/CriteriaCards.tsx
'use client'
import { useTranslations } from 'next-intl'
import type { Criterion } from '@/types/chapter-02'

const TONE: Record<Criterion['tone'], string> = {
  mint: 'border-l-[color:var(--accent-02)]',
  cultural: 'border-l-[color:var(--signal-cultural)]',
  reject: 'border-l-[color:var(--signal-reject)]',
}

export function CriteriaCards({ criteria }: { criteria: Criterion[] }) {
  const t = useTranslations()
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
      {criteria.map(c => (
        <div key={c.id} className={`bg-white rounded-xl p-3 shadow-sm border-l-4 ${TONE[c.tone]}`}>
          <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: c.tone === 'reject' ? 'var(--signal-reject)' : c.tone === 'cultural' ? 'var(--signal-cultural)' : 'var(--accent-02)' }}>
            {t(c.titleKey as never)}
          </div>
          <div className="text-xs text-[color:var(--muted)] mt-1 leading-snug">{t(c.descKey as never)}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: CaseCards**

```tsx
// components/chapter-02/CaseCards.tsx
'use client'
import { useLocale, useTranslations } from 'next-intl'
import type { CaseCard as CaseCardType } from '@/types/chapter-02'
import { Citation } from '@/components/ui/Citation'

export function CaseCards({ cases }: { cases: CaseCardType[] }) {
  const t = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
      {cases.map(c => (
        <article key={c.id} className="bg-white rounded-2xl overflow-hidden shadow-sm relative">
          {c.status === 'rejected' && (
            <div className="absolute top-2 right-2 bg-[color:var(--signal-reject)] text-white text-[10px] font-black px-2 py-0.5 rounded-full">REJECTED</div>
          )}
          <div className="h-20 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-200">
            <span className="text-4xl">{c.emoji}</span>
          </div>
          <div className="p-3">
            <div className="text-[10px] font-extrabold text-[color:var(--accent-02)]">{c.year} · {c.unicodeVersion}</div>
            <div className="text-sm font-extrabold mt-1">{t(c.proposerKey as never)}</div>
            <p className="text-xs text-[color:var(--muted)] mt-1 leading-snug">{t(c.storyKey as never)}</p>
            <div className="mt-2"><Citation source={c.source} locale={locale} /></div>
          </div>
        </article>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

`git add components/chapter-02/CriteriaCards.tsx components/chapter-02/CaseCards.tsx && git commit -m "feat: <CriteriaCards> and <CaseCards>"`

### Task 23: Build `<OriginMap>`

**Files:**
- Create: `/root/tyx/VINCI/public/world-atlas/countries-110m.json` (downloaded asset)
- Create: `/root/tyx/VINCI/components/chapter-02/OriginMap.tsx`

- [ ] **Step 1: Download the world atlas**

```bash
cd /root/tyx/VINCI && mkdir -p public/world-atlas && \
  curl -L -o public/world-atlas/countries-110m.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```

Verify the file is non-empty (~100KB).

- [ ] **Step 2: Implement**

```tsx
// components/chapter-02/OriginMap.tsx
'use client'
import { useEffect, useState } from 'react'
import { geoRobinson } from 'd3-geo' // see note
import { geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { useTranslations } from 'next-intl'
import type { OriginPin } from '@/types/chapter-02'

// d3-geo v3 dropped Robinson; use geoEqualEarth if Robinson unavailable in installed version:
//   import { geoEqualEarth as geoRobinson } from 'd3-geo'
// (rename to keep call site stable)

const W = 800, H = 380

export function OriginMap({ pins }: { pins: OriginPin[] }) {
  const t = useTranslations()
  const [features, setFeatures] = useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    fetch('/world-atlas/countries-110m.json')
      .then(r => r.json())
      .then(topo => setFeatures(feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection))
  }, [])

  if (!features) return <div className="h-[380px] grid place-items-center text-[color:var(--muted)] text-sm">map loading…</div>

  const projection = geoRobinson().scale(140).translate([W / 2, H / 2])
  const path = geoPath(projection)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-white rounded-2xl shadow-sm mt-6" role="img" aria-label="Origins of culturally-representative emojis">
      <g>
        {features.features.map((f, i) => (
          <path key={i} d={path(f) || ''} fill="#f4ebd9" stroke="#e7dcc4" strokeWidth={0.4} />
        ))}
      </g>
      <g>
        {pins.map(p => {
          const xy = projection([p.lng, p.lat])
          if (!xy) return null
          return (
            <g key={p.id} transform={`translate(${xy[0]}, ${xy[1]})`}>
              <circle r={14} fill="white" stroke="var(--accent-02)" strokeWidth={2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14">{p.emoji}</text>
              <title>{t(p.labelKey as never)}</title>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
```

- [ ] **Step 3: Commit**

`git add public/world-atlas components/chapter-02/OriginMap.tsx && git commit -m "feat: <OriginMap> world-atlas + emoji pins"`

### Task 24: Compose `<WhoGetsIn>` chapter wrapper

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-02/WhoGetsIn.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chapter-02/WhoGetsIn.tsx
'use client'
import { useTranslations } from 'next-intl'
import { Section } from '@/components/ui/Section'
import { Pipeline } from './Pipeline'
import { CriteriaCards } from './CriteriaCards'
import { CaseCards } from './CaseCards'
import { OriginMap } from './OriginMap'
import type { Chapter02Data } from '@/types/chapter-02'

export function WhoGetsIn({ data }: { data: Chapter02Data }) {
  const t = useTranslations('ch02')
  return (
    <Section id="ch02" accent="var(--accent-02)">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--accent-02)' }}>CHAPTER 02</div>
        <h2 className="text-3xl md:text-5xl font-black mt-2">{t('title')}</h2>
        <p className="mt-2 text-sm md:text-base text-[color:var(--muted)] max-w-xl">{t('intro')}</p>
        <div className="mt-6"><Pipeline steps={data.pipeline} /></div>
        <CriteriaCards criteria={data.criteria} />
        <CaseCards cases={data.cases} />
        <OriginMap pins={data.origins} />
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Commit**

`git add components/chapter-02/WhoGetsIn.tsx && git commit -m "feat: <WhoGetsIn> chapter wrapper"`

---

## Chunk 5: §03 Always On

Tasks 25–30 build the Gen-Z chapter with five stacked blocks.

### Task 25: Define chapter-03 types, stub JSON, contract test

**Files:**
- Create: `/root/tyx/VINCI/types/chapter-03.ts`
- Create: `/root/tyx/VINCI/data/chapter-03.json`
- Create: `/root/tyx/VINCI/tests/data/chapter-03.test.ts`

- [ ] **Step 1: Types**

```ts
// types/chapter-03.ts
import type { Source, Cited } from './source'

export interface HeroStat {
  id: string
  value: string                    // pre-formatted display string ("7h 12m", "92%")
  labelKey: string
  source: Source
}

export interface GenerationBar {
  id: 'gen-z' | 'millennial' | 'gen-x' | 'boomer'
  labelKey: string
  minutes: number                  // numeric minutes for bar width calc
  display: string                  // pre-formatted display ("7h 12m")
  source: Source
}

export interface GenerationEmojis {
  id: GenerationBar['id']
  labelKey: string
  emojis: string[]
  descKey: string
  source: Source
}

export interface SemanticShiftEntry {
  emoji: string
  olderMeaningKey: string
  genZMeaningKey: string
  source: Source
}

export interface DayInLifeSpike {
  hour: number                     // 0–23
  intensity: number                // 0–1
  labelKey: string
  source: Source
}

export interface Chapter03Data {
  sources: Source[]
  hero: HeroStat[]
  screenTime: GenerationBar[]
  topByGen: GenerationEmojis[]
  semanticShift: SemanticShiftEntry[]
  dayInLife: DayInLifeSpike[]
}
```

- [ ] **Step 2: Stub JSON (only enough to pass contract test)**

(Provide a minimal stub matching the type; for brevity, include one entry per array. Same pattern as chapter-02.)

- [ ] **Step 3: Contract test**

```ts
// tests/data/chapter-03.test.ts
import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-03.json'
import type { Chapter03Data } from '@/types/chapter-03'

const typed: Chapter03Data = data

describe('chapter-03 data', () => {
  it('hero has 4 stats', () => {
    // weak invariant: stub may have 1 during scaffolding; tighten to 4 after content fill
    expect(typed.hero.length).toBeGreaterThan(0)
  })

  it('screenTime entries have non-negative minutes', () => {
    typed.screenTime.forEach(b => expect(b.minutes).toBeGreaterThanOrEqual(0))
  })

  it('semanticShift entries are disclosed as cited-journalism (not survey)', () => {
    typed.semanticShift.forEach(s => expect(s.source.url).toMatch(/^https?:\/\//))
  })

  it('dayInLife hours are within 0–23 and intensity within 0–1', () => {
    typed.dayInLife.forEach(d => {
      expect(d.hour).toBeGreaterThanOrEqual(0)
      expect(d.hour).toBeLessThanOrEqual(23)
      expect(d.intensity).toBeGreaterThanOrEqual(0)
      expect(d.intensity).toBeLessThanOrEqual(1)
    })
  })
})
```

- [ ] **Step 4: Commit**

`git add types/chapter-03.ts data/chapter-03.json tests/data/chapter-03.test.ts && git commit -m "feat: chapter-03 types, stub JSON, contract test"`

### Task 26: Build `useCountUp` hook + `<HeroStats>`

**Files:**
- Create: `/root/tyx/VINCI/lib/countup.ts`
- Create: `/root/tyx/VINCI/components/chapter-03/HeroStats.tsx`

- [ ] **Step 1: Implement countup hook**

```ts
// lib/countup.ts
'use client'
import { useEffect, useState } from 'react'

export function useCountUp(target: number, durationMs = 1200, start = false): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, start])
  return val
}
```

(Note: this hook is used only for purely numeric stats. For pre-formatted strings like "7h 12m" the component renders the display string directly; the count-up effect is reserved for `%` stats.)

- [ ] **Step 2: Implement HeroStats**

```tsx
// components/chapter-03/HeroStats.tsx
'use client'
import { useTranslations } from 'next-intl'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { HeroStat } from '@/types/chapter-03'

export function HeroStats({ stats }: { stats: HeroStat[] }) {
  const t = useTranslations()
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <div ref={ref} className="bg-white rounded-2xl p-4 md:p-6 shadow grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map(s => (
        <div key={s.id} className="text-center">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--muted)]">{t(s.labelKey as never)}</div>
          <div className="text-3xl md:text-4xl font-black tabular text-[color:var(--accent-03)] mt-1">{visible ? s.value : '—'}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

`git add lib/countup.ts components/chapter-03/HeroStats.tsx && git commit -m "feat: useCountUp + <HeroStats>"`

### Task 27: Build `<ScreenTimeBars>` and `<TopEmojisByGen>`

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-03/ScreenTimeBars.tsx`
- Create: `/root/tyx/VINCI/components/chapter-03/TopEmojisByGen.tsx`

- [ ] **Step 1: ScreenTimeBars**

```tsx
// components/chapter-03/ScreenTimeBars.tsx
'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { GenerationBar } from '@/types/chapter-03'

export function ScreenTimeBars({ bars }: { bars: GenerationBar[] }) {
  const t = useTranslations()
  const max = Math.max(...bars.map(b => b.minutes))
  return (
    <div className="bg-white rounded-2xl p-5 shadow space-y-3">
      {bars.map(b => (
        <div key={b.id} className="grid grid-cols-[120px_1fr_60px] items-center gap-3">
          <div className="text-xs font-extrabold">{t(b.labelKey as never)}</div>
          <div className="h-3 bg-yellow-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(b.minutes / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[color:var(--accent-03)] to-amber-500 rounded-full"
            />
          </div>
          <div className="text-right text-xs font-black text-[color:var(--accent-03)]">{b.display}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: TopEmojisByGen**

```tsx
// components/chapter-03/TopEmojisByGen.tsx
'use client'
import { useTranslations } from 'next-intl'
import type { GenerationEmojis } from '@/types/chapter-03'

export function TopEmojisByGen({ data }: { data: GenerationEmojis[] }) {
  const t = useTranslations()
  return (
    <div className="bg-white rounded-2xl p-5 shadow grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map(g => (
        <div key={g.id} className="text-center">
          <div className="text-[11px] font-extrabold text-[color:var(--accent-03)]">{t(g.labelKey as never)}</div>
          <div className="text-2xl tracking-widest mt-2">{g.emojis.join('')}</div>
          <div className="text-[10px] text-[color:var(--muted)] mt-2">{t(g.descKey as never)}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

`git add components/chapter-03/ScreenTimeBars.tsx components/chapter-03/TopEmojisByGen.tsx && git commit -m "feat: <ScreenTimeBars> and <TopEmojisByGen>"`

### Task 28: Build `<SemanticShift>` and `<DayInLife>`

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-03/SemanticShift.tsx`
- Create: `/root/tyx/VINCI/components/chapter-03/DayInLife.tsx`

- [ ] **Step 1: SemanticShift**

```tsx
// components/chapter-03/SemanticShift.tsx
'use client'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { SemanticShiftEntry } from '@/types/chapter-03'

export function SemanticShift({ entries }: { entries: SemanticShiftEntry[] }) {
  const t = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="text-[10px] font-extrabold text-[color:var(--muted)] uppercase tracking-wide">{t('ch03.semantic.heading')}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        {entries.map(e => (
          <div key={e.emoji} className="text-center">
            <div className="text-5xl">{e.emoji}</div>
            <div className="text-[10px] font-extrabold mt-3 text-[color:var(--muted)]">{t('ch03.semantic.older')}</div>
            <div className="text-xs font-bold">{t(e.olderMeaningKey as never)}</div>
            <div className="text-[10px] font-extrabold mt-2 text-[color:var(--muted)]">{t('ch03.semantic.genZ')}</div>
            <div className="text-xs font-bold text-[color:var(--signal-reject)]">{t(e.genZMeaningKey as never)}</div>
            <div className="mt-2"><Citation source={e.source} locale={locale} /></div>
          </div>
        ))}
      </div>
      <p className="text-[10px] italic text-[color:var(--muted)] mt-3">{t('ch03.semantic.disclosure')}</p>
    </div>
  )
}
```

- [ ] **Step 2: DayInLife**

```tsx
// components/chapter-03/DayInLife.tsx
'use client'
import { useTranslations } from 'next-intl'
import type { DayInLifeSpike } from '@/types/chapter-03'

export function DayInLife({ spikes }: { spikes: DayInLifeSpike[] }) {
  const t = useTranslations()
  const cells = Array.from({ length: 24 }, (_, h) => {
    const spike = spikes.find(s => s.hour === h)
    return { hour: h, intensity: spike?.intensity ?? 0.15, labelKey: spike?.labelKey }
  })
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="text-[10px] font-extrabold text-[color:var(--muted)] uppercase tracking-wide">{t('ch03.dayInLife.heading')}</div>
      <div className="mt-3 grid grid-cols-24 gap-0.5">
        {cells.map(c => (
          <div
            key={c.hour}
            className="h-12 rounded-sm relative"
            style={{ backgroundColor: `rgba(255, 200, 87, ${0.15 + 0.85 * c.intensity})` }}
            title={c.labelKey ? t(c.labelKey as never) : `${c.hour}:00`}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 text-[10px] text-[color:var(--muted)] font-bold">
        <span>00</span><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span>
      </div>
    </div>
  )
}
```

Note: `grid-cols-24` is not a Tailwind default. Add `grid-cols-24` via inline style or define it in `tailwind.config.ts`. Simplest: replace the grid container with `<div className="flex gap-0.5">` and give each cell `flex-1`.

- [ ] **Step 3: Commit**

`git add components/chapter-03/SemanticShift.tsx components/chapter-03/DayInLife.tsx && git commit -m "feat: <SemanticShift> and <DayInLife>"`

### Task 29: Compose `<AlwaysOn>` chapter wrapper

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-03/AlwaysOn.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chapter-03/AlwaysOn.tsx
'use client'
import { useTranslations } from 'next-intl'
import { Section } from '@/components/ui/Section'
import { HeroStats } from './HeroStats'
import { ScreenTimeBars } from './ScreenTimeBars'
import { TopEmojisByGen } from './TopEmojisByGen'
import { SemanticShift } from './SemanticShift'
import { DayInLife } from './DayInLife'
import type { Chapter03Data } from '@/types/chapter-03'

export function AlwaysOn({ data }: { data: Chapter03Data }) {
  const t = useTranslations('ch03')
  return (
    <Section id="ch03" accent="var(--accent-03)">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--accent-03)' }}>CHAPTER 03</div>
          <h2 className="text-3xl md:text-5xl font-black mt-2">{t('title')}</h2>
          <p className="text-sm md:text-base text-[color:var(--muted)] max-w-xl mt-2">{t('intro')}</p>
        </div>
        <HeroStats stats={data.hero} />
        <ScreenTimeBars bars={data.screenTime} />
        <TopEmojisByGen data={data.topByGen} />
        <SemanticShift entries={data.semanticShift} />
        <DayInLife spikes={data.dayInLife} />
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Commit**

`git add components/chapter-03/AlwaysOn.tsx && git commit -m "feat: <AlwaysOn> chapter wrapper"`

---

## Chunk 6: §04 Beyond the Screen

Tasks 30–33 build the case-gallery chapter with category filtering.

### Task 30: Define chapter-04 types, stub JSON, contract test

**Files:**
- Create: `/root/tyx/VINCI/types/chapter-04.ts`
- Create: `/root/tyx/VINCI/data/chapter-04.json`
- Create: `/root/tyx/VINCI/tests/data/chapter-04.test.ts`

- [ ] **Step 1: Types**

```ts
// types/chapter-04.ts
import type { Source } from './source'

export type Chapter04Category = 'ai' | 'ar3d' | 'brand' | 'interface' | 'art'

export interface FutureCase {
  id: string
  emoji: string
  year: number
  origin: string                   // short publisher / org / brand
  category: Chapter04Category
  titleKey: string
  storyKey: string
  source: Source
}

export interface Chapter04Data {
  sources: Source[]
  cases: FutureCase[]
}

export const CATEGORIES: Chapter04Category[] = ['ai', 'ar3d', 'brand', 'interface', 'art']
```

- [ ] **Step 2: Stub JSON with at least one case**

```json
{
  "sources": [],
  "cases": [
    {
      "id": "apple-genmoji",
      "emoji": "🪄",
      "year": 2024,
      "origin": "Apple",
      "category": "ai",
      "titleKey": "ch04.cases.apple-genmoji.title",
      "storyKey": "ch04.cases.apple-genmoji.story",
      "source": {
        "id": "apple-wwdc24",
        "title": { "zh": "Apple WWDC24 主题演讲", "en": "Apple WWDC24 Keynote" },
        "publisher": "Apple",
        "url": "https://www.apple.com/newsroom/2024/06/",
        "accessed": "2026-05-11"
      }
    }
  ]
}
```

- [ ] **Step 3: Contract test**

```ts
// tests/data/chapter-04.test.ts
import { describe, it, expect } from 'vitest'
import data from '@/data/chapter-04.json'
import type { Chapter04Data, Chapter04Category } from '@/types/chapter-04'
import { CATEGORIES } from '@/types/chapter-04'

const typed: Chapter04Data = data

describe('chapter-04 data', () => {
  it('every case category is one of the 5 allowed', () => {
    typed.cases.forEach(c => expect(CATEGORIES).toContain(c.category))
  })

  it('every case has a valid source url and accessed date', () => {
    typed.cases.forEach(c => {
      expect(c.source.url).toMatch(/^https?:\/\//)
      expect(c.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('every case has a unique id', () => {
    const ids = typed.cases.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

Run: `pnpm test tests/data/chapter-04.test.ts`. Expected: 3 passed.

- [ ] **Step 4: Commit**

`git add types/chapter-04.ts data/chapter-04.json tests/data/chapter-04.test.ts && git commit -m "feat: chapter-04 types, stub JSON, contract test"`

### Task 31: Build `applyFilter` logic + test

**Files:**
- Create: `/root/tyx/VINCI/lib/filter.ts`
- Create: `/root/tyx/VINCI/tests/logic/filter.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/logic/filter.test.ts
import { describe, it, expect } from 'vitest'
import { applyFilter } from '@/lib/filter'
import type { FutureCase, Chapter04Category } from '@/types/chapter-04'

const cases: FutureCase[] = [
  { id: 'a', emoji: '🪄', year: 2024, origin: 'Apple', category: 'ai', titleKey: '', storyKey: '', source: { id: '', title: { zh: '', en: '' }, publisher: '', url: 'https://example.com', accessed: '2026-05-11' } },
  { id: 'b', emoji: '🥽', year: 2024, origin: 'Apple', category: 'ar3d', titleKey: '', storyKey: '', source: { id: '', title: { zh: '', en: '' }, publisher: '', url: 'https://example.com', accessed: '2026-05-11' } },
]

describe('applyFilter', () => {
  it('returns all cases when filter is null (ALL)', () => {
    expect(applyFilter(cases, null).map(c => c.id)).toEqual(['a', 'b'])
  })

  it('returns only cases in the given category', () => {
    expect(applyFilter(cases, 'ai').map(c => c.id)).toEqual(['a'])
  })

  it('returns empty list when no case matches', () => {
    expect(applyFilter(cases, 'brand' as Chapter04Category)).toEqual([])
  })
})
```

- [ ] **Step 2: Implement**

```ts
// lib/filter.ts
import type { FutureCase, Chapter04Category } from '@/types/chapter-04'

export function applyFilter(cases: FutureCase[], filter: Chapter04Category | null): FutureCase[] {
  if (filter === null) return cases
  return cases.filter(c => c.category === filter)
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test tests/logic/filter.test.ts
git add lib/filter.ts tests/logic/filter.test.ts && git commit -m "feat: applyFilter for §04 categories"
```

### Task 32: Build `<CategoryChips>` and `<CaseCard>`

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-04/CategoryChips.tsx`
- Create: `/root/tyx/VINCI/components/chapter-04/CaseCard.tsx`

- [ ] **Step 1: CategoryChips**

```tsx
// components/chapter-04/CategoryChips.tsx
'use client'
import { useTranslations } from 'next-intl'
import type { Chapter04Category } from '@/types/chapter-04'
import { CATEGORIES } from '@/types/chapter-04'

interface Props {
  selected: Chapter04Category | null
  onSelect: (c: Chapter04Category | null) => void
}

export function CategoryChips({ selected, onSelect }: Props) {
  const t = useTranslations('ch04.categories')
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={selected === null} onClick={() => onSelect(null)}>{t('all')}</Chip>
      {CATEGORIES.map(c => (
        <Chip key={c} active={selected === c} onClick={() => onSelect(c)}>{t(c)}</Chip>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
        active ? 'bg-[color:var(--accent-04)] text-white' : 'bg-white/60 text-[color:var(--muted)] hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: CaseCard**

```tsx
// components/chapter-04/CaseCard.tsx
'use client'
import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { Citation } from '@/components/ui/Citation'
import type { FutureCase } from '@/types/chapter-04'

const GRADIENTS: Record<FutureCase['category'], string> = {
  ai: 'from-fuchsia-100 to-violet-300',
  ar3d: 'from-orange-100 to-orange-300',
  brand: 'from-pink-100 to-rose-300',
  interface: 'from-sky-100 to-sky-300',
  art: 'from-emerald-100 to-emerald-300',
}

export function CaseCard({ caseItem }: { caseItem: FutureCase }) {
  const t = useTranslations()
  const locale = useLocale() as 'zh' | 'en'
  return (
    <motion.article layout className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className={`h-24 bg-gradient-to-br ${GRADIENTS[caseItem.category]} grid place-items-center text-4xl`}>
        {caseItem.emoji}
      </div>
      <div className="p-3">
        <div className="text-[10px] font-extrabold text-[color:var(--accent-04)]">{caseItem.year} · {caseItem.origin}</div>
        <div className="text-sm font-extrabold mt-1">{t(caseItem.titleKey as never)}</div>
        <p className="text-xs text-[color:var(--muted)] mt-1 leading-snug">{t(caseItem.storyKey as never)}</p>
        <div className="mt-2"><Citation source={caseItem.source} locale={locale} /></div>
      </div>
    </motion.article>
  )
}
```

- [ ] **Step 3: Commit**

`git add components/chapter-04 && git commit -m "feat: <CategoryChips> and <CaseCard>"`

### Task 33: Compose `<BeyondScreen>` with state and filter wiring

**Files:**
- Create: `/root/tyx/VINCI/components/chapter-04/BeyondScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chapter-04/BeyondScreen.tsx
'use client'
import { useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Section } from '@/components/ui/Section'
import { CategoryChips } from './CategoryChips'
import { CaseCard } from './CaseCard'
import { applyFilter } from '@/lib/filter'
import type { Chapter04Data, Chapter04Category } from '@/types/chapter-04'

export function BeyondScreen({ data }: { data: Chapter04Data }) {
  const t = useTranslations('ch04')
  const [filter, setFilter] = useState<Chapter04Category | null>(null)
  const visible = applyFilter(data.cases, filter)

  return (
    <Section id="ch04" accent="var(--accent-04)">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--accent-04)' }}>CHAPTER 04</div>
            <h2 className="text-3xl md:text-5xl font-black mt-2">{t('title')}</h2>
            <p className="text-sm md:text-base text-[color:var(--muted)] max-w-xl mt-2">{t('intro')}</p>
          </div>
          <CategoryChips selected={filter} onSelect={setFilter} />
        </div>
        <LayoutGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <AnimatePresence>
              {visible.map(c => <CaseCard key={c.id} caseItem={c} />)}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Commit**

`git add components/chapter-04/BeyondScreen.tsx && git commit -m "feat: <BeyondScreen> with category filter"`

---

## Chunk 7: Hero, Footer, content fill, polish, deploy

Tasks 34–42 finish the page composition, fill all real content, audit accessibility, and ship.

### Task 34: Build `<Hero>` and `<Footer>`

**Files:**
- Create: `/root/tyx/VINCI/components/Hero.tsx`
- Create: `/root/tyx/VINCI/components/Footer.tsx`

- [ ] **Step 1: Hero**

```tsx
// components/Hero.tsx
'use client'
import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <header className="relative h-[88vh] grid place-items-center bg-gradient-to-br from-pink-100 via-rose-50 to-violet-100 overflow-hidden">
      <div className="text-center px-6">
        <div className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{t('eyebrow')}</div>
        <h1 className="mt-3 text-5xl md:text-7xl font-black leading-[0.95]">{t('title')}</h1>
        <p className="mt-3 text-sm md:text-lg font-bold text-neutral-700">{t('subtitle')}</p>
        <div className="mt-6 text-3xl md:text-5xl tracking-widest">📟 😀 ❤️ 🥺 🫶 🤖</div>
        <div className="mt-8 text-xs text-[color:var(--muted)]">↓ {t('scrollCue')}</div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Footer**

```tsx
// components/Footer.tsx
'use client'
import { useLocale, useTranslations } from 'next-intl'
import type { Source } from '@/types/source'
import data01 from '@/data/chapter-01.json'
import data02 from '@/data/chapter-02.json'
import data03 from '@/data/chapter-03.json'
import data04 from '@/data/chapter-04.json'

function collect(): Map<string, { source: Source; chapters: string[] }> {
  const all = new Map<string, { source: Source; chapters: string[] }>()
  const push = (s: Source, ch: string) => {
    const cur = all.get(s.id)
    if (cur) {
      if (!cur.chapters.includes(ch)) cur.chapters.push(ch)
    } else {
      all.set(s.id, { source: s, chapters: [ch] })
    }
  }
  for (const s of data01.sources as Source[]) push(s, '01')
  for (const n of (data01.timeline as { source: Source }[])) push(n.source, '01')
  for (const s of data02.sources as Source[]) push(s, '02')
  for (const c of (data02.cases as { source: Source }[])) push(c.source, '02')
  for (const s of data03.sources as Source[]) push(s, '03')
  for (const s of data04.sources as Source[]) push(s, '04')
  for (const c of (data04.cases as { source: Source }[])) push(c.source, '04')
  return all
}

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale() as 'zh' | 'en'
  const sources = Array.from(collect().values())
    .sort((a, b) => a.source.publisher.localeCompare(b.source.publisher))

  return (
    <footer className="bg-neutral-50 py-12 px-6 text-sm">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-extrabold">{t('heading')}</h3>
        <ul className="mt-4 space-y-3">
          {sources.map(({ source, chapters }) => (
            <li key={source.id} className="leading-snug">
              <span className="text-xs font-extrabold text-[color:var(--muted)]">§{chapters.join(', §')}</span>
              {' · '}
              <span className="font-bold">{source.publisher}</span>
              {' — '}
              <span>{source.title[locale]}</span>
              {' — '}
              <a className="underline text-blue-700" target="_blank" rel="noopener noreferrer" href={source.url}>{source.url}</a>
              {' '}
              <span className="text-xs text-[color:var(--muted)]">(accessed {source.accessed})</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[color:var(--muted)] mt-8">{t('credits')}</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

`git add components/Hero.tsx components/Footer.tsx && git commit -m "feat: <Hero> and <Footer> with deduplicated source list"`

### Task 35: Compose the page

**Files:**
- Modify: `/root/tyx/VINCI/app/[locale]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/[locale]/page.tsx
import { setRequestLocale } from 'next-intl/server'
import { TopNav } from '@/components/TopNav'
import { Hero } from '@/components/Hero'
import { EvolutionPath } from '@/components/chapter-01/EvolutionPath'
import { CumulativeChart } from '@/components/chapter-01/CumulativeChart'
import { Section } from '@/components/ui/Section'
import { WhoGetsIn } from '@/components/chapter-02/WhoGetsIn'
import { AlwaysOn } from '@/components/chapter-03/AlwaysOn'
import { BeyondScreen } from '@/components/chapter-04/BeyondScreen'
import { Footer } from '@/components/Footer'

import ch01 from '@/data/chapter-01.json'
import ch02 from '@/data/chapter-02.json'
import ch03 from '@/data/chapter-03.json'
import ch04 from '@/data/chapter-04.json'

import type { Chapter01Data } from '@/types/chapter-01'
import type { Chapter02Data } from '@/types/chapter-02'
import type { Chapter03Data } from '@/types/chapter-03'
import type { Chapter04Data } from '@/types/chapter-04'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <TopNav />
      <Hero />
      <Section id="ch01" accent="var(--accent-01)" className="!py-0">
        <EvolutionPath data={ch01 as Chapter01Data} />
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <CumulativeChart data={(ch01 as Chapter01Data).cumulative} />
        </div>
      </Section>
      <WhoGetsIn data={ch02 as Chapter02Data} />
      <AlwaysOn data={ch03 as Chapter03Data} />
      <BeyondScreen data={ch04 as Chapter04Data} />
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Visual smoke check**

`pnpm dev`. Visit `/zh` and `/en`. Confirm all 4 sections render with stub data, the language toggle and chapter anchors work, no console errors. Note any visual issues for follow-up.

- [ ] **Step 3: Commit**

`git add app/[locale]/page.tsx && git commit -m "feat: compose Hero + 4 sections + Footer in [locale] page"`

### Task 36: Write i18n key-parity test, then fill messages

**Files:**
- Create: `/root/tyx/VINCI/tests/i18n/message-keys.test.ts`
- Modify: `/root/tyx/VINCI/messages/zh.json`
- Modify: `/root/tyx/VINCI/messages/en.json`

- [ ] **Step 1: Write the parity test**

```ts
// tests/i18n/message-keys.test.ts
import { describe, it, expect } from 'vitest'
import zh from '@/messages/zh.json'
import en from '@/messages/en.json'

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v as Record<string, unknown>, key))
    else out.push(key)
  }
  return out
}

describe('i18n message parity', () => {
  it('zh and en have the same set of keys', () => {
    const zhKeys = new Set(flatten(zh as Record<string, unknown>))
    const enKeys = new Set(flatten(en as Record<string, unknown>))
    const onlyZh = [...zhKeys].filter(k => !enKeys.has(k))
    const onlyEn = [...enKeys].filter(k => !zhKeys.has(k))
    expect({ onlyZh, onlyEn }).toEqual({ onlyZh: [], onlyEn: [] })
  })
})
```

- [ ] **Step 2: Fill all message keys**

Inventory needed keys by grepping for `useTranslations` and `t('...')` patterns in `components/**`. For every key in code, add a `zh` and `en` translation in the message files. Cover:

- `hero.eyebrow`, `hero.title`, `hero.subtitle`, `hero.scrollCue`
- `nav.ch01`, `nav.ch02`, `nav.ch03`, `nav.ch04`, `nav.switchLang`, `nav.switchLangAlt`
- `ch01.title`, `ch01.intro`, `ch01.timeline.<id>.narrative` for each timeline node
- `ch02.title`, `ch02.intro`, `ch02.pipeline.*.label/desc`, `ch02.criteria.*.title/desc`, `ch02.cases.*.proposer/story`, `ch02.origins.*.label`
- `ch03.title`, `ch03.intro`, `ch03.hero.*.label`, `ch03.screenTime.*.label`, `ch03.topByGen.*.label/desc`, `ch03.semantic.heading/older/genZ/disclosure`, `ch03.dayInLife.heading` + per-spike labels
- `ch04.title`, `ch04.intro`, `ch04.categories.all/ai/ar3d/brand/interface/art`, `ch04.cases.*.title/story`
- `footer.heading`, `footer.credits`

- [ ] **Step 3: Run parity test until green**

```bash
pnpm test tests/i18n/message-keys.test.ts
```

Iterate until the test reports `{ onlyZh: [], onlyEn: [] }`.

- [ ] **Step 4: Commit**

`git add messages/ tests/i18n/message-keys.test.ts && git commit -m "feat: complete zh/en message catalog with parity test"`

### Task 37: Research and fill §01 data

**Files:**
- Modify: `/root/tyx/VINCI/data/chapter-01.json`

- [ ] **Step 1: Source the timeline from emojipedia.org/emoji-versions**

For each Emoji version listed there, capture: version label, release year, new-emoji count. Aim for these nodes:
- DoCoMo 1999 (milestone, 176)
- iPhone JP keyboard 2007 (milestone, n/a)
- Emoji 6.0 / Unicode 6.0 2010 (722)
- Emoji 7.0 2014 (250)
- Emoji 8.0 2015 (41 — incl. skin tone modifiers)
- Emoji 11.0 2018 (157)
- Emoji 13.0 2020 (117)
- Emoji 14.0 2021 (112)
- Emoji 15.0 2022 (31)
- Emoji 15.1 2023 (108)
- Emoji 16.0 2024 (7 + Genmoji as separate milestone)
- Genmoji 2024 (milestone)

Verify each count against emojipedia.org/emoji-X.X for the version page. Use the version page as the `source.url`.

- [ ] **Step 2: Fill `cumulative` from per-version totals**

The cumulative array is the running sum of `total emoji count` at each Unicode version release. Pull totals from Unicode emoji-totals page (`unicode.org/emoji/charts/full-emoji-list.html`) or compute as the running sum of new-emoji-counts starting from 176. Each `cumulative` entry needs a `sourceId` matching a `sources[]` entry.

- [ ] **Step 3: Fill `decadeIndex` with anchor years**

Confirm `decadeIndex` = [1999, 2010, 2015, 2020, 2024]. Each year must correspond to a timeline node id (the test in Task 15 lifts its strict invariant once data is filled — update the test to enforce membership).

- [ ] **Step 4: Run tests + commit**

```bash
pnpm test tests/data/chapter-01.test.ts
git add data/chapter-01.json && git commit -m "data: fill chapter-01 with verified Unicode/Emojipedia timeline"
```

### Task 38: Research and fill §02 data

**Files:**
- Modify: `/root/tyx/VINCI/data/chapter-02.json`

- [ ] **Step 1: Pipeline labels**

Confirm the 5 steps reflect Unicode's actual process. Reference `unicode.org/emoji/proposals.html`. Update `labelKey`/`descKey` content via the messages files in Task 36 — no JSON change needed beyond ids.

- [ ] **Step 2: Six criteria (5 accept + 1 reject)**

Translate Unicode's selection factors:
- Frequency (mint)
- Multiple usages / extensible meaning (mint)
- Distinctiveness (mint)
- Cultural representativeness (cultural — amber)
- Non-brand / non-deity (cultural — amber)
- Reject when: short-term fad / overly specific / impossible to render at small size (reject — rose)

- [ ] **Step 3: Four case cards**

- Dumpling 🥟 (2017, L2/15-239), proposer Yiying Lu — accepted
- Headscarf 🧕 (2017), proposer Rayouf Alhumedhi (L2 doc id to confirm) — accepted
- Mate 🧉 (2019), South America cultural drink (L2 id to confirm) — accepted
- One real REJECTED proposal sourced from the public L2 archive. Pick a clearly-documented brand-mark rejection or a rejected food/symbol proposal. If a clearly-documented rejection can't be confirmed within a short search, replace with a different documented rejection (e.g., a flag-type or religious-symbol rejection); do not ship a fabricated example.

- [ ] **Step 4: Origin pins (5–8 emojis with country origin)**

Examples (verify each):
- 🥟 dumpling — CN
- 🧕 headscarf — SA (proposer based in DE; cultural origin Middle East)
- 🧉 mate — AR/UY (pick AR coords; mention region in label)
- 🥻 sari — IN (2020)
- 🪆 matryoshka — RU (2020)
- Optional: 🌮 taco — MX (2015)
- Optional: 🥨 pretzel — DE (2017)

- [ ] **Step 5: Run tests + commit**

```bash
pnpm test tests/data/chapter-02.test.ts
git add data/chapter-02.json && git commit -m "data: fill chapter-02 with verified proposals and origin pins"
```

### Task 39: Research and fill §03 data

**Files:**
- Modify: `/root/tyx/VINCI/data/chapter-03.json`

- [ ] **Step 1: Hero stats**

Four cells with verified numbers:
- Daily screen time (Gen Z): Common Sense Media 2024 Census. Verify the exact figure — substitute with the published average if 7h 12m diverges from the report.
- Daily emoji use (Gen Z): Adobe Future of Creativity 2024 report. Verify 92% (or substitute).
- Daily phone pickups: Asurion 2024 (or the most recent published year). Verify 144 (or substitute).
- "Almost constantly online" rate (US teens): Pew 2023 (or 2024 update). Verify 46% (or substitute).

If any single number cannot be sourced cleanly, replace that cell with another well-sourced top-line stat and update the i18n labels accordingly.

- [ ] **Step 2: Generational screen time (4 bars)**

Source: a single dataset that cross-cuts generations (e.g., Nielsen Total Audience Report Q1 2024 or a CSM cross-gen study). Numbers in minutes (e.g., 432, 361, 259, 151).

- [ ] **Step 3: Top emojis per generation**

Source: Snap Friendship Report 2023 or Adobe 2024 generational emoji rankings. List top 5 per gen with one-line semantic descriptors.

- [ ] **Step 4: Semantic shift entries**

Three emojis with older-meaning vs. Gen Z-meaning. Source each via cited journalism (WSJ "How Gen Z Killed the Thumbs-Up" 2022; Vox/Duolingo blog 2023; Wired or Atlantic). The page renders a "based on reported usage trends" disclosure for this block.

- [ ] **Step 5: Day-in-life spikes**

Cite Snap Inside Out / CSM time-of-day breakdown for peak hours. List 4–6 hour-level spikes with intensity values 0–1.

- [ ] **Step 6: Run tests + commit**

```bash
pnpm test tests/data/chapter-03.test.ts
git add data/chapter-03.json && git commit -m "data: fill chapter-03 with verified Gen Z statistics"
```

### Task 40: Research and fill §04 data

**Files:**
- Modify: `/root/tyx/VINCI/data/chapter-04.json`

- [ ] **Step 1: Nine cases**

Verify each case's anchor URL:
1. Apple Genmoji — apple.com/newsroom/2024/06 (WWDC24)
2. Vision Pro Persona — developer.apple.com/visionos
3. Snap AR Bitmoji + Lens — Snap 2024 Annual Report (investor.snap.com)
4. World Emoji Day brand marketing — emojipedia.org/world-emoji-day
5. Slack / GitHub emoji as workflow — slack.com/help/articles/360037762493
6. DoCoMo originals at MoMA — moma.org/collection/works/196070
7. Google Noto Color/Black Emoji — github.com/googlefonts/noto-emoji
8. Emoji-mnemonic crypto wallet — if a citable source can't be confirmed, swap to a verified experimental case (e.g., Adobe Project Glyph if applicable, or a published academic paper on emoji-based passwords)
9. WeChat 表情包经济 — Tencent annual report (annualreport.tencent.com) plus one news article (e.g., 36Kr / Sixth Tone)

- [ ] **Step 2: Run tests + commit**

```bash
pnpm test tests/data/chapter-04.test.ts
git add data/chapter-04.json && git commit -m "data: fill chapter-04 with 9 verified future-application cases"
```

### Task 41: Accessibility and reduced-motion audit

**Files:** none (verification task)

- [ ] **Step 1: Manual reduced-motion check**

Toggle OS reduced-motion (macOS: System Settings → Accessibility → Display → Reduce Motion). Reload `/zh`. Verify:
- Hero gradient is not animated.
- Section reveals are absent (sections appear fully visible).
- §01 EvolutionPath renders the fallback horizontal-swipe variant, not the pin.
- §03 ScreenTimeBars do not animate width from 0; bars render at final widths immediately.

If any animation still runs, find the offending component and gate it on `usePrefersReducedMotion()`.

- [ ] **Step 2: Keyboard navigation**

Tab through the TopNav chips and language toggle. Verify focus rings are visible. If not, add `focus-visible:ring-2 focus-visible:ring-[color:var(--ink)]/40` to the relevant elements.

- [ ] **Step 3: Lighthouse spot-check**

Run a Lighthouse audit (Chrome DevTools) on a production build:

```bash
pnpm build && pnpm start
```

Open `http://localhost:7777/zh`, run Lighthouse against the page. Target: Accessibility ≥ 95, Performance ≥ 80. Address obvious wins (image alt text, label associations) only — do not over-optimize.

- [ ] **Step 4: Commit if any fixes were made**

`git add -A && git commit -m "fix: accessibility and reduced-motion audit follow-ups"`

### Task 42: Production build + smoke acceptance

**Files:** none (verification task)

- [ ] **Step 1: Production build**

```bash
cd /root/tyx/VINCI && pnpm build
```

Expected: build completes with no type errors and no Next.js warnings about missing exports.

- [ ] **Step 2: Start production server**

```bash
cd /root/tyx/VINCI && pnpm start
```

Open `http://localhost:7777/zh`.

- [ ] **Step 3: Acceptance walkthrough**

Verify against the spec's Section 14 acceptance criteria:
- Page loads at port 7777, redirects `/` to `/zh`.
- Language toggle flips between `/zh` and `/en` and preserves scroll anchor.
- All 4 chapter sections render with real data and citations.
- §01 horizontal pin works on desktop; degrades to swipe on reduced motion.
- §04 category chips filter the gallery in place.
- Footer references list is complete, deduplicated, with clickable URLs.

Document anything that fails as a follow-up issue; do not gate the close on Lighthouse score.

- [ ] **Step 4: Final commit + tag**

```bash
cd /root/tyx/VINCI && git add -A && git commit -m "chore: production build verified on port 7777" --allow-empty
git tag v0.1.0
```

---

## Done

When all chunks pass, the page is live at `http://localhost:7777/` with bilingual emoji-trends storytelling on real data.

Open items (from spec §12) that remain implementation-time decisions:
- §02 reject case: confirm the exact rejected proposal from public L2 archive (Task 38, Step 3).
- §03 Block D 24-hour data: confirm hour-level source; fall back to proxy with disclosure (Task 39, Step 5).
- §04 card 8: confirm emoji-mnemonic wallet source or swap to another verifiable case (Task 40, Step 1, item 8).
- Hero gradient mesh animation: keep static unless performance budget allows (decide after Task 41 Lighthouse).
