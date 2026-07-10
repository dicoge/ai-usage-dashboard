"use client";

import { useEffect, useState } from "react";

import { ProviderCard } from "@/components/ProviderCard";
import { loadClaude } from "@/lib/storage";
import type { ProviderCardData } from "@/lib/types";

function claudeCard(): ProviderCardData {
  const stored = typeof window !== "undefined" ? loadClaude() : null;
  const u = stored?.usage;
  const hasData = !!u && u.allTime.totalTokens > 0;
  return {
    id: "claude",
    name: "Claude Max (Claude Code)",
    status: hasData ? "ok" : "not_configured",
    unit: "tokens",
    used: u?.today.totalTokens ?? 0,
    remaining: null,
    costUsd: u?.today.costUsd ?? 0,
    resetTime: u?.activeBlock?.resetTime ?? null,
    detailHref: "/claude",
    message: hasData ? undefined : "Upload your Claude Code JSONL logs to get started.",
  };
}

// Other providers relied on reading local files / private APIs on the machine,
// which the browser-only web build can't do. They stay as informational cards.
const STATIC_CARDS: ProviderCardData[] = [
  {
    id: "opencodego",
    name: "OpenCode Go",
    status: "not_configured",
    unit: "credits",
    message: "Web mode: local balance sync isn't available.",
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    status: "not_configured",
    unit: "tokens",
    message: "Web mode: reads local ~/.codex logs — not available in the browser.",
  },
  {
    id: "gemini",
    name: "Gemini / Antigravity CLI",
    status: "not_configured",
    unit: "tokens",
    message: "Web mode: reads local ~/.gemini config — not available in the browser.",
  },
];

export default function HomePage() {
  const [cards, setCards] = useState<ProviderCardData[]>([claudeCard(), ...STATIC_CARDS]);

  useEffect(() => {
    setCards([claudeCard(), ...STATIC_CARDS]);
  }, []);

  return (
    <main>
      <div className="section-title" style={{ marginTop: 0 }}>
        Providers
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>
        Usage across your AI coding subscriptions. Upload your Claude Code logs on the Claude page —
        everything is processed in your browser.
      </p>
      <div className="grid">
        {cards.map((c) => (
          <ProviderCard key={c.id} data={c} />
        ))}
      </div>
    </main>
  );
}
