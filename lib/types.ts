export type ProviderId = "claude" | "opencodego" | "codex" | "gemini";

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface ModelBreakdown extends UsageTotals {
  model: string;
  messages: number;
}

export interface DailyUsage extends UsageTotals {
  date: string; // YYYY-MM-DD
}

export interface SessionBlock {
  startTime: string; // ISO
  endTime: string; // ISO (startTime + 5h)
  isActive: boolean;
  resetTime: string; // ISO, when the current window resets
  minutesRemaining: number;
  usage: UsageTotals;
}

export interface ClaudeUsage {
  today: UsageTotals;
  week: UsageTotals;
  month: UsageTotals;
  allTime: UsageTotals;
  models: ModelBreakdown[];
  daily: DailyUsage[]; // last ~30 days
  activeBlock: SessionBlock | null;
  lastActivity: string | null;
}

export type ProviderStatus = "ok" | "not_configured" | "error";

export interface ProviderCardData {
  id: ProviderId;
  name: string;
  status: ProviderStatus;
  message?: string;
  // Generic headline metrics for the dashboard card.
  used?: number; // tokens used or credits used
  remaining?: number | null; // remaining credits, null if unknown
  unit?: string; // "tokens" | "credits"
  costUsd?: number;
  resetTime?: string | null;
  detailHref?: string;
}
