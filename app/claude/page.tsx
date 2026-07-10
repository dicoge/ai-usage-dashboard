"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { UsageChart } from "@/components/UsageChart";
import { computeClaudeUsage } from "@/lib/claude-compute";
import { formatDateTime, formatReset, formatTokens, formatUsd } from "@/lib/format";
import { loadClaude, saveClaude, clearClaude, type StoredClaude } from "@/lib/storage";
import type { UsageTotals } from "@/lib/types";

function Stat({ label, total }: { label: string; total: UsageTotals }) {
  return (
    <div className="card">
      <div className="metric-label" style={{ marginTop: 0 }}>
        {label}
      </div>
      <div className="metric" style={{ fontSize: 24 }}>
        {formatTokens(total.totalTokens)}
      </div>
      <div className="metric-sub" style={{ marginTop: 8 }}>
        <span className="pill">≈ {formatUsd(total.costUsd)}</span>
        {total.hasUnknownModel && (
          <span
            className="pill"
            style={{ color: "#f0c36d" }}
            title="部分模型無公開價格，此費用僅計入已知模型，實際可能更高"
          >
            ⚠️ 部分費用未估
          </span>
        )}
      </div>
    </div>
  );
}

export default function ClaudePage() {
  const [stored, setStored] = useState<StoredClaude | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStored(loadClaude());
    setLoaded(true);
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const texts = await Promise.all(Array.from(files).map((f) => f.text()));
      const usage = computeClaudeUsage(texts);
      const data: StoredClaude = {
        usage,
        fileCount: files.length,
        updatedAt: new Date().toISOString(),
      };
      saveClaude(data);
      setStored(data);
      if (usage.allTime.totalTokens === 0) {
        setError(
          "No Claude Code usage entries were found in those files. Upload the .jsonl session logs from ~/.claude/projects.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse files");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClear() {
    clearClaude();
    setStored(null);
    setError(null);
  }

  const u = stored?.usage;
  const hasData = !!u && u.allTime.totalTokens > 0;

  return (
    <main>
      <Link href="/" className="back-link">
        ← Overview
      </Link>
      <div className="section-title" style={{ marginTop: 4 }}>
        Claude Max — Token Usage
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div className="card-title">Upload Claude Code logs</div>
          {stored && (
            <button type="button" className="btn-ghost" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Select your <span className="code">.jsonl</span> session logs from{" "}
          <span className="code">~/.claude/projects</span>. Everything is parsed in your browser and
          cached locally — nothing is uploaded to a server.
        </p>
        <label className="upload-btn">
          {busy ? "Parsing…" : "Choose JSONL files"}
          <input
            ref={inputRef}
            type="file"
            accept=".jsonl,application/jsonl,application/x-ndjson,text/plain"
            multiple
            hidden
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        {stored && (
          <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            Loaded {stored.fileCount} file{stored.fileCount === 1 ? "" : "s"} ·{" "}
            {formatDateTime(stored.updatedAt)}
          </p>
        )}
        {error && (
          <p style={{ color: "#f0a5a5", fontSize: 13, marginBottom: 0 }}>{error}</p>
        )}
      </div>

      {!loaded ? null : !hasData ? (
        <div className="card">
          <p className="muted">
            No usage data yet. Upload your Claude Code <span className="code">.jsonl</span> logs above
            to see token usage and estimated cost.
          </p>
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Last activity: {formatDateTime(u!.lastActivity)}
          </p>

          {u!.activeBlock && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head">
                <div className="card-title">Active 5-hour session window</div>
                <span className="badge ok">Live</span>
              </div>
              <div className="metric-sub" style={{ marginTop: 0 }}>
                <span className="pill">
                  {formatTokens(u!.activeBlock.usage.totalTokens)} tokens
                </span>
                <span className="pill">≈ {formatUsd(u!.activeBlock.usage.costUsd)}</span>
                <span className="pill">resets in {formatReset(u!.activeBlock.resetTime)}</span>
                <span className="muted">({formatDateTime(u!.activeBlock.resetTime)})</span>
              </div>
            </div>
          )}

          <div className="stat-row">
            <Stat label="Today" total={u!.today} />
            <Stat label="This week" total={u!.week} />
            <Stat label="This month" total={u!.month} />
            <Stat label="All time" total={u!.allTime} />
          </div>

          <div className="section-title">Daily usage (last 30 days)</div>
          <div className="chart-wrap">
            <UsageChart data={u!.daily} />
          </div>

          <div className="section-title">By model</div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="num">Msgs</th>
                  <th className="num">Input</th>
                  <th className="num">Output</th>
                  <th className="num">Cache R/W</th>
                  <th className="num">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {u!.models.map((m) => (
                  <tr key={m.model}>
                    <td>{m.model}</td>
                    <td className="num">{m.messages.toLocaleString()}</td>
                    <td className="num">{formatTokens(m.inputTokens)}</td>
                    <td className="num">{formatTokens(m.outputTokens)}</td>
                    <td className="num">
                      {formatTokens(m.cacheReadTokens)} / {formatTokens(m.cacheCreationTokens)}
                    </td>
                    <td className="num">
                      {m.priceKnown ? (
                        formatUsd(m.costUsd)
                      ) : (
                        <span className="pill" title="No list price for this model — cost not estimated">
                          未知價格
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Costs are estimates using public API list prices applied to your uploaded logs. Claude Max
            is a flat subscription — this figure reflects equivalent pay-as-you-go spend.
          </p>
        </>
      )}
    </main>
  );
}
