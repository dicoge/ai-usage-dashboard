import Link from "next/link";

import { formatReset, formatTokens, formatUsd } from "@/lib/format";
import type { ProviderCardData } from "@/lib/types";

function StatusBadge({ status }: { status: ProviderCardData["status"] }) {
  const label =
    status === "ok" ? "Active" : status === "not_configured" ? "Setup" : "Error";
  return <span className={`badge ${status}`}>{label}</span>;
}

function Inner({ data }: { data: ProviderCardData }) {
  const showMetric = data.status === "ok";
  const primary =
    data.remaining != null
      ? { value: formatTokens(data.remaining), label: `${data.unit ?? "credits"} remaining` }
      : { value: formatTokens(data.used ?? 0), label: `${data.unit ?? "tokens"} today` };

  return (
    <>
      <div className="card-head">
        <div className="card-title">{data.name}</div>
        <StatusBadge status={data.status} />
      </div>

      {showMetric ? (
        <>
          <div className="metric">{primary.value}</div>
          <div className="metric-label">{primary.label}</div>
          <div className="metric-sub">
            {data.costUsd != null && data.costUsd > 0 && (
              <span className="pill">≈ {formatUsd(data.costUsd)} today</span>
            )}
            {data.resetTime && <span className="pill">resets in {formatReset(data.resetTime)}</span>}
            {data.message && <span className="muted">{data.message}</span>}
          </div>
        </>
      ) : (
        <div className="metric-sub" style={{ marginTop: 4 }}>
          <span className="muted">{data.message ?? "Not configured"}</span>
        </div>
      )}
    </>
  );
}

export function ProviderCard({ data }: { data: ProviderCardData }) {
  if (data.detailHref) {
    return (
      <Link href={data.detailHref} className="card">
        <Inner data={data} />
      </Link>
    );
  }
  return (
    <div className="card">
      <Inner data={data} />
    </div>
  );
}
