# AI Usage Dashboard

A dark-themed web dashboard for tracking your Claude Code token usage and
estimated cost. You upload your Claude Code `.jsonl` session logs in the
browser; everything is parsed **client-side** and cached in `localStorage`. No
server, no account, no upload — your logs never leave your machine.

Built with **Next.js 14 + TypeScript**, deployable to Vercel as a static site.
Inspired by [CodexBar](https://github.com/steipete/CodexBar) and Claude Code
Usage Monitor.

## What it shows

- **Overview** — one card per provider. The Claude card reflects your uploaded
  data (today's tokens + estimated cost); the other providers are informational
  placeholders in web mode.
- **Claude detail** — a JSONL upload button plus today / this week / this month /
  all-time token totals, a 30-day usage trend chart, a per-model breakdown table,
  and the current live **5-hour session window** with its reset countdown.
- **Settings** — how to find your logs and how the browser-only model works.

## How it works

Claude Code stores per-session logs as `.jsonl` files under
`~/.claude/projects/**`. On the **Claude** page, click **Choose JSONL files** and
select any number of them. The browser:

1. Reads each file with the File API.
2. Parses assistant messages, sums input/output/cache tokens, and dedupes
   resumed sessions (keyed on `messageId:requestId`).
3. Estimates cost from public per-model API list prices.
4. Reconstructs 5-hour session blocks and daily/weekly/monthly totals.
5. Saves the computed summary to `localStorage` so it survives a refresh.

Cost figures are **estimates**: public pay-as-you-go API list prices applied to
your logs. Claude Max is a flat-rate subscription, so the number represents
equivalent API spend, not your actual bill.

## Deploy to Vercel

This is a standard Next.js app with no server-side data dependencies, so it
deploys as-is:

```bash
npm i -g vercel
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for auto-deploys on push.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 and upload your `.jsonl` logs on the Claude page.

## Project layout

```
app/
  page.tsx              Overview (reads localStorage)
  claude/page.tsx       Claude upload + detail + chart
  settings/page.tsx     Static help page
lib/
  claude-compute.ts     Browser-safe JSONL parser + aggregation
  storage.ts            localStorage load/save helpers
  pricing.ts            Model price table + cost estimation
  types.ts, format.ts
components/              UI (cards, chart, nav)
```
