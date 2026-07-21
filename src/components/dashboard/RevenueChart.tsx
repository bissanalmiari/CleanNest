// src/components/dashboard/RevenueChart.tsx
// Lightweight, dependency-free bar chart (plain SVG) so we don't need to
// add a charting library just for one chart. Swap for `recharts` later if
// the team wants richer chart types — the data shape (RevenuePoint[]) stays
// the same either way.

"use client";

import { useState } from "react";
import type { RevenueRange } from "@/services/dashboardService";

interface RevenuePoint {
  date: string;
  revenue: number;
  count: number;
}

interface RevenueChartProps {
  data: RevenuePoint[];
  range: RevenueRange;
  onRangeChange: (range: RevenueRange) => void;
  loading?: boolean;
}

const RANGE_LABELS: Record<RevenueRange, string> = {
  week: "7 Days",
  month: "30 Days",
  year: "12 Months",
};

function formatLabel(date: string, range: RevenueRange): string {
  if (range === "year") {
    const [, month] = date.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return months[Number(month) - 1] ?? date;
  }
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function RevenueChart({
  data,
  range,
  onRangeChange,
  loading = false,
}: RevenueChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
  const chartHeight = 220;
  const barGap = 8;

  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-navy">
          Revenue
        </h3>

        <div className="flex gap-1 rounded-full bg-surface-soft p-1">
          {(Object.keys(RANGE_LABELS) as RevenueRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-primary text-white"
                  : "text-navy/60 hover:text-navy"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          className="mt-6 animate-pulse rounded bg-navy/5"
          style={{ height: chartHeight }}
        />
      ) : data.length === 0 ? (
        <div
          className="mt-6 flex items-center justify-center rounded bg-surface-soft text-sm text-navy/40"
          style={{ height: chartHeight }}
        >
          No revenue in this period yet
        </div>
      ) : (
        <div className="mt-6">
          <div
            className="flex items-end gap-[var(--gap)]"
            style={{
              height: chartHeight,
              // @ts-expect-error -- CSS custom property
              "--gap": `${barGap}px`,
            }}
          >
            {data.map((point, i) => {
              const barHeight = Math.max(
                4,
                (point.revenue / maxRevenue) * (chartHeight - 24)
              );
              const isHovered = hoverIndex === i;

              return (
                <div
                  key={point.date}
                  className="relative flex flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-9 z-10 whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white shadow-card">
                      {formatCurrency(point.revenue)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      isHovered ? "bg-primary-dark" : "bg-primary"
                    }`}
                    style={{ height: barHeight }}
                  />
                  <span className="mt-2 text-[10px] text-navy/40">
                    {formatLabel(point.date, range)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
