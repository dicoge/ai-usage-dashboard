/**
 * Cost estimation for Claude models. Prices are USD per 1,000,000 tokens.
 *
 * These are best-effort published list prices used to *estimate* spend from
 * local logs. Claude Max is a flat subscription, so this figure is "what the
 * same usage would cost on the pay-as-you-go API", which is the number
 * CodexBar / ccusage-style tools surface. Adjust freely in one place.
 */
export interface ModelPrice {
  input: number;
  output: number;
  cacheWrite: number; // cache creation (5m)
  cacheRead: number;
}

const OPUS: ModelPrice = { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 };
const SONNET: ModelPrice = { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 };
const HAIKU: ModelPrice = { input: 0.8, output: 4, cacheWrite: 1.0, cacheRead: 0.08 };

// Prefix match so future dated variants (e.g. claude-opus-4-9) are covered.
const PRICE_TABLE: Array<[string, ModelPrice]> = [
  ["claude-opus", OPUS],
  ["claude-sonnet", SONNET],
  ["claude-haiku", HAIKU],
];

const ZERO: ModelPrice = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

// Remember which unknown models we've already warned about so a large log with
// thousands of entries for one new model only logs once, not per entry.
const warnedUnknownModels = new Set<string>();

// True when the model matches a known price-table prefix. The "By model" table
// uses this to flag rows whose estimated cost is $0 only because we have no
// list price for that model (as opposed to genuinely tiny spend).
export function hasKnownPrice(model: string): boolean {
  const m = model.toLowerCase();
  return PRICE_TABLE.some(([prefix]) => m.startsWith(prefix));
}

export function priceForModel(model: string): ModelPrice {
  const m = model.toLowerCase();
  for (const [prefix, price] of PRICE_TABLE) {
    if (m.startsWith(prefix)) return price;
  }
  if (model && !warnedUnknownModels.has(m)) {
    warnedUnknownModels.add(m);
    console.warn(
      `[pricing] No price table entry for model "${model}" — cost estimated as $0. Add it to PRICE_TABLE in lib/pricing.ts.`,
    );
  }
  return ZERO;
}

export function estimateCost(
  model: string,
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  },
): number {
  const p = priceForModel(model);
  const inTok = usage.input_tokens ?? 0;
  const outTok = usage.output_tokens ?? 0;
  const ccTok = usage.cache_creation_input_tokens ?? 0;
  const crTok = usage.cache_read_input_tokens ?? 0;
  return (
    (inTok * p.input +
      outTok * p.output +
      ccTok * p.cacheWrite +
      crTok * p.cacheRead) /
    1_000_000
  );
}
