import type { ClaudeUsage } from "@/lib/types";

const CLAUDE_KEY = "ai-usage:claude";

export interface StoredClaude {
  usage: ClaudeUsage;
  fileCount: number;
  updatedAt: string; // ISO
}

export function loadClaude(): StoredClaude | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLAUDE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredClaude;
  } catch {
    return null;
  }
}

export function saveClaude(data: StoredClaude): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAUDE_KEY, JSON.stringify(data));
}

export function clearClaude(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLAUDE_KEY);
}
