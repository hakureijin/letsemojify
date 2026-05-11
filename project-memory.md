# VINCI Emoji Figure 4.17 Project Memory

Date: 2026-04-30

## Goal

Update the paper's Figure 4.17 and build a web visualization published on port `7777`.

The target figure is about emoji popularity over time. The current preferred visual form is a **Bump chart**, not a bar chart race. The chart should show rank movement by month, with frequency/count values available as detail labels or tooltips.

## Paper Context

Source document:

- `/root/tyx/VINCI/article.docx`

Relevant section:

- Chapter `4.3 Emotional Conveyance`
- Research question: `RQ3: What are the most popular emojis in the past three years?`
- Original Figure 4.17 caption: `Top emojis on Twitter: 2020-2023, visualized by the author`

Original metric described in the paper:

- Monthly percentage of tweets/posts containing at least one instance of each emoji.
- If one tweet/post contains the same emoji multiple times, that emoji is counted once for that tweet/post.
- The original text cites a sample of about 6.5 billion tweets collected by Internet Archive and Emojipedia.

Important interpretation in the paper:

- `😂` Face with Tears of Joy had long-term dominance.
- `😭` Loudly Crying Face challenged/overtook `😂` around the pandemic period.
- `🥺` Pleading Face declined after its pandemic-era rise.

## Current Preview

Visual companion / preview URL:

- `http://117.72.27.33:7777/`

Current preview is a design mockup only. It must not be treated as real research data.

Current visual direction:

- Bump chart redesigned as a "rank-course" view.
- Use thick colored routes/ribbons instead of thin lines.
- Use large emoji medallion nodes at key points.
- Add endpoint ranking panel on the right.
- Add annotation cards for important rank reversals or new emoji growth.
- Add detail layer for frequency percentage/counts.

Current mockup note:

- The values and post-2023走势 currently shown in the preview are placeholder/mock data.
- Production data must replace all mock trajectories and endpoint values.

## Data Source Findings

### 1. Emojipedia / Flourish Reference

Useful for visual and historical context:

- Emojipedia article: https://blog.emojipedia.org/10-years-of-emojipedia-10-years-of-record-breaking-emoji-popularity/
- Reference Flourish visual: https://public.flourish.studio/visualisation/14054577/

The Flourish reference is:

- Title: `The World's Top Smiley Emojis #WorldEmojiDay2023`
- Author: Keith Broni
- Template: Bar chart race
- Tags include `race`, `change-over-time`, `ranks`, `images`

This is useful as style/data-journalism reference, but the user requested the final visualization as a **Bump chart**.

### 2. X.com / Twitter API

Best source for a true update of Figure 4.17 if the figure remains about X/Twitter posts.

Official docs checked:

- Post Counts: https://docs.x.com/x-api/posts/counts/introduction
- Search Operators: https://docs.x.com/x-api/posts/search/integrate/operators
- Full Archive Search: https://docs.x.com/enterprise-api/posts/search/quickstart/full-archive-search
- Rate Limits: https://docs.x.com/x-api/fundamentals/rate-limits

Relevant facts:

- X search supports emoji query matching.
- Full-archive counts/search can cover historical data, but requires the correct access level.
- Recent counts only cover recent windows and cannot rebuild 2023-2026 history.
- Full-archive / enterprise access is needed for a rigorous 2023-2026 monthly series.

Recommended production metric if X data is available:

- For each month and emoji:
  - numerator: number of posts containing the emoji at least once
  - denominator: number of sampled posts or total posts in the same sampling frame
  - frequency: numerator / denominator
  - rank: rank emojis by monthly frequency

Need to confirm:

- Whether the user has X Full-Archive/Enterprise API access and Bearer Token.
- Whether the paper must remain strictly X/Twitter-based or can switch to another source.

### 3. Emojitracker

User asked whether Emojitracker data can be used.

Site:

- https://emojitracker.com/

Current Emojitracker homepage description:

- Real-time emoji analysis powered by Emojipedia's global user base.
- It tracks emojis copied from Emojipedia and GetEmoji in real time.
- It shows the most popular 1,000 emojis globally and across select countries.

Current public endpoints discovered:

- `GET /api/ranking?s=<session_hash>&country=ALL`
- `GET /api/countries?s=<session_hash>`
- `GET /api/updates?s=<session_hash>` via Server-Sent Events
- `GET /api/detail?s=<session_hash>&lang=en&emoji=<emoji>`

Implementation detail:

- The `s` value is embedded in the homepage in `<script type="application/json" id="hm2">`.
- Do not hard-code the observed `s`; parse it from the page before API requests.

Example current ranking observed during this session:

- `❤️`, `✅`, `😭`, `✨`, `🔥`, `😂`, `😊`, `💀`, `⭐`, `🥹`

Important limitation:

- The new Emojitracker is **not X/Twitter post data**.
- It is real-time/global user interaction data from Emojipedia/GetEmoji.
- It can support an alternative chart title such as:
  - `Real-time Emoji Popularity from Emojitracker`
  - `Emoji Copy/Lookup Popularity: 2026 onward`
- It should not be labeled `Top Emojis on X.com` or used as a direct replacement for the paper's Twitter/X metric.

Classic Twitter Emojitracker:

- https://emojitracker.com/twitter/
- The page explicitly says the classic tracker is offline due to Twitter API changes.
- It still exposes frozen historical cumulative endpoints:
  - `/twitter/api/rankings.json`
  - `/twitter/api/details/1F602.json`
- Example observed for `😂`:
  - `score`: about 3.84B
  - `popularity_rank`: 1
- This is a frozen cumulative score, not a monthly 2023-2026 series.

Conclusion on Emojitracker:

- Good for a live/current ranking or for a forward-looking snapshot archive started now.
- Not enough to reconstruct monthly 2023-2026 X/Twitter trends.
- If used, the methodology must say "Emojitracker real-time copy/usage data", not "X.com posts".

## Scraper Planning Notes

### Option A: True X/Twitter Update

Use if X Full-Archive/Enterprise access is available.

Pipeline:

1. Define emoji candidate set.
   - Start with original Figure 4.17 top emojis plus 2023 Emojipedia top emojis.
   - Add newly relevant emojis such as `🫶`, `🥹`, `🩷`, `🫡` if needed.
2. Query monthly counts per emoji.
3. Query denominator counts for the same monthly sampling frame.
4. Compute monthly frequency and rank.
5. Export:
   - `data/monthly_emoji_counts.csv`
   - `data/monthly_emoji_ranks.csv`
   - `data/metadata.json`
6. Feed the Bump chart.

Risks:

- API access/cost.
- Query length and rate limits.
- Need denominator design and sampling reproducibility.

### Option B: Emojitracker Forward Archive

Use if the project accepts switching from X/Twitter posts to Emojitracker popularity.

Pipeline:

1. Fetch homepage and parse `s` session hash.
2. Fetch `/api/ranking?s=<s>&country=ALL` regularly.
3. Store snapshots with timestamp.
4. Compute interval deltas for each emoji.
5. Aggregate deltas by day/week/month.
6. Generate Bump chart from monthly delta ranks.

Risks:

- Cannot backfill 2023-2025 from current public API.
- Data source measures Emojipedia/GetEmoji user behavior, not tweets/posts.
- Need snapshot collection to begin before a meaningful trend exists.

### Option C: Hybrid / Literature-Supported

Use if X archive access is unavailable but the paper needs historical context.

Approach:

- Keep 2020-2023 from Emojipedia/paper context.
- Use Emojitracker only as a clearly labeled 2026 real-time supplement.
- Do not draw a continuous 2023-2026 trend unless a real historical source is obtained.

## Visualization Requirements

Final web page should:

- Run on / publish to port `7777`.
- Use Bump chart as primary chart.
- Keep rank as the main visual signal.
- Show frequency/count values on hover and endpoint labels.
- Include source/method note directly on the page.
- Clearly state whether data source is X.com, Emojitracker, or mixed.
- Avoid presenting mock data as measured data.

Design direction:

- Data-journalism style.
- Light background, strong typography, restrained color palette.
- Emoji nodes should help identify lines without relying only on color.
- Avoid spaghetti-line effect by:
  - emphasizing top 5-7 routes
  - muting lower ranks
  - allowing click-to-focus
  - using endpoint ranking panel

## Open Decisions

1. Data source:
   - X Full-Archive/Enterprise
   - Emojitracker forward snapshots
   - hybrid/literature-supported

2. Title:
   - If X data: `Top Emojis on X.com: 2023-2026`
   - If Emojitracker data: `Real-time Emoji Popularity from Emojitracker`

3. Time coverage:
   - True historical monthly series from 2023-2026
   - Forward-only series from the first scrape date
   - Snapshot-only current ranking

4. Emoji set:
   - Top 10 overall
   - Top 10 smileys only
   - Mixed categories: faces, hearts, gestures, symbols

## Immediate Next Steps

1. Decide whether the production chart must use X/Twitter post data.
2. If yes, confirm X Full-Archive/Enterprise access.
3. If no, rename the chart and build an Emojitracker snapshot collector.
4. Replace current mock data with real snapshot/API data only after data collection is implemented.
5. Keep all methodology and source notes visible in the final web page.
