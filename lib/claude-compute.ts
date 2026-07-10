import { estimateCost, hasKnownPrice } from "@/lib/pricing";
import type {
  ClaudeUsage,
  DailyUsage,
  ModelBreakdown,
  SessionBlock,
  UsageTotals,
} from "@/lib/types";

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface Entry {
  ts: number; // epoch ms
  model: string;
  usage: RawUsage;
  cost: number;
  priceKnown: boolean;
}

function emptyTotals(): UsageTotals {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    hasUnknownModel: false,
  };
}

function addEntry(t: UsageTotals, e: Entry): void {
  t.inputTokens += e.usage.input_tokens ?? 0;
  t.outputTokens += e.usage.output_tokens ?? 0;
  t.cacheCreationTokens += e.usage.cache_creation_input_tokens ?? 0;
  t.cacheReadTokens += e.usage.cache_read_input_tokens ?? 0;
  t.totalTokens +=
    (e.usage.input_tokens ?? 0) +
    (e.usage.output_tokens ?? 0) +
    (e.usage.cache_creation_input_tokens ?? 0) +
    (e.usage.cache_read_input_tokens ?? 0);
  t.costUsd += e.cost;
  if (!e.priceKnown) t.hasUnknownModel = true;
}

function localDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parse the assistant token-usage entries out of one JSONL file's text.
// Mirrors the server-side parser: only `type === "assistant"` lines with a real
// model carry usage, and identical logical messages are de-duped on
// messageId:requestId (falling back to the stable messageId, then the record
// uuid) the way ccusage does.
function parseText(text: string, seen: Set<string>, entries: Entry[]): void {
  for (const line of text.split("\n")) {
    if (!line) continue;
    let d: any;
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }
    if (d?.type !== "assistant") continue;
    const msg = d.message ?? {};
    const model: string = msg.model ?? "";
    if (!model || model === "<synthetic>") continue;
    const usage: RawUsage = msg.usage ?? {};

    const dedupeKey =
      msg.id && d.requestId ? `${msg.id}:${d.requestId}` : msg.id ?? d.uuid ?? "";
    if (dedupeKey && seen.has(dedupeKey)) continue;
    if (dedupeKey) seen.add(dedupeKey);

    const ts = Date.parse(d.timestamp);
    if (Number.isNaN(ts)) continue;

    entries.push({
      ts,
      model,
      usage,
      cost: estimateCost(model, usage),
      priceKnown: hasKnownPrice(model),
    });
  }
}

function buildSessionBlocks(sorted: Entry[]): SessionBlock[] {
  if (sorted.length === 0) return [];
  const blocks: SessionBlock[] = [];
  let blockStart = Math.floor(sorted[0].ts / (60 * 60 * 1000)) * (60 * 60 * 1000);
  let lastTs = sorted[0].ts;
  let totals = emptyTotals();

  const flush = () => {
    const start = new Date(blockStart);
    const end = new Date(blockStart + FIVE_HOURS_MS);
    const now = Date.now();
    const isActive = now < blockStart + FIVE_HOURS_MS && now - lastTs < FIVE_HOURS_MS;
    blocks.push({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isActive,
      resetTime: end.toISOString(),
      minutesRemaining: isActive
        ? Math.max(0, Math.round((blockStart + FIVE_HOURS_MS - now) / 60000))
        : 0,
      usage: totals,
    });
  };

  for (const e of sorted) {
    const overWindow = e.ts - blockStart >= FIVE_HOURS_MS;
    const overGap = e.ts - lastTs >= FIVE_HOURS_MS;
    if (overWindow || overGap) {
      flush();
      blockStart = Math.floor(e.ts / (60 * 60 * 1000)) * (60 * 60 * 1000);
      totals = emptyTotals();
    }
    addEntry(totals, e);
    lastTs = e.ts;
  }
  flush();
  return blocks;
}

// Compute the full Claude usage summary from the raw text of one or more
// uploaded `.jsonl` files. Runs entirely in the browser — no filesystem.
export function computeClaudeUsage(fileTexts: string[]): ClaudeUsage {
  const seen = new Set<string>();
  const entries: Entry[] = [];
  for (const text of fileTexts) {
    parseText(text, seen, entries);
  }
  entries.sort((a, b) => a.ts - b.ts);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - ((now.getDay() + 6) % 7) * 24 * 60 * 60 * 1000; // Monday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const today = emptyTotals();
  const week = emptyTotals();
  const month = emptyTotals();
  const allTime = emptyTotals();
  const modelMap = new Map<string, ModelBreakdown>();
  const dailyMap = new Map<string, DailyUsage>();

  for (const e of entries) {
    addEntry(allTime, e);
    if (e.ts >= startOfToday) addEntry(today, e);
    if (e.ts >= startOfWeek) addEntry(week, e);
    if (e.ts >= startOfMonth) addEntry(month, e);

    let mb = modelMap.get(e.model);
    if (!mb) {
      mb = { model: e.model, messages: 0, priceKnown: hasKnownPrice(e.model), ...emptyTotals() };
      modelMap.set(e.model, mb);
    }
    mb.messages += 1;
    addEntry(mb, e);

    const key = localDateKey(e.ts);
    let dd = dailyMap.get(key);
    if (!dd) {
      dd = { date: key, ...emptyTotals() };
      dailyMap.set(key, dd);
    }
    addEntry(dd, e);
  }

  const blocks = buildSessionBlocks(entries);
  const activeBlock = blocks.find((b) => b.isActive) ?? null;

  const daily: DailyUsage[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday - i * 24 * 60 * 60 * 1000);
    const key = localDateKey(d.getTime());
    daily.push(dailyMap.get(key) ?? { date: key, ...emptyTotals() });
  }

  const models = Array.from(modelMap.values()).sort((a, b) => b.costUsd - a.costUsd);

  return {
    today,
    week,
    month,
    allTime,
    models,
    daily,
    activeBlock,
    lastActivity: entries.length ? new Date(entries[entries.length - 1].ts).toISOString() : null,
  };
}

export function emptyClaudeUsage(): ClaudeUsage {
  const daily: DailyUsage[] = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday - i * 24 * 60 * 60 * 1000);
    daily.push({ date: localDateKey(d.getTime()), ...emptyTotals() });
  }
  return {
    today: emptyTotals(),
    week: emptyTotals(),
    month: emptyTotals(),
    allTime: emptyTotals(),
    models: [],
    daily,
    activeBlock: null,
    lastActivity: null,
  };
}
