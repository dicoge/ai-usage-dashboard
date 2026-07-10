"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatTokens } from "@/lib/format";
import type { DailyUsage } from "@/lib/types";

export function UsageChart({ data }: { data: DailyUsage[] }) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    tokens: d.totalTokens,
    cost: Number(d.costUsd.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ea8fe" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6ea8fe" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#232b3a" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#5c6675"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#232b3a" }}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis
          stroke="#5c6675"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatTokens(v as number)}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "#141922",
            border: "1px solid #232b3a",
            borderRadius: 10,
            color: "#e6edf3",
            fontSize: 13,
          }}
          formatter={(value: number, name: string) =>
            name === "tokens"
              ? [formatTokens(value), "Tokens"]
              : [`$${value.toFixed(2)}`, "Est. cost"]
          }
        />
        <Area
          type="monotone"
          dataKey="tokens"
          stroke="#6ea8fe"
          strokeWidth={2}
          fill="url(#g)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
