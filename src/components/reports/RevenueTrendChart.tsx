// src/components/reports/RevenueTrendChart.tsx
// Lightweight, dependency-free bar chart (plain divs) for the revenue
// series in the reports page. Mirrors the style of the dashboard's
// RevenueChart but kept self-contained here to avoid cross-feature coupling.

"use client";

import { useState } from "react";

interface RevenuePoint {
  date: string;
  revenue: number;
  count: number;
}

interface RevenueTrendChartProps {
  data: RevenuePoint[];
  loading?: boolean;
}

function formatLabel(date: string): string {
  // date is "YYYY-MM-DD" or "YYYY-MM"
  const parts = date.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[Number(parts[1]) - 1] ?? date;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function RevenueTrendChart({
  data,
  loading = false,
}: RevenueTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartHeight = 180;

  if (loading) {
    return (
      <div
        className="animate-pulse rounded-xl bg-navy/[0.04]"
        style={{ height: chartHeight }}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-surface-soft text-sm text-navy/40"
        style={{ height: chartHeight }}
      >
        No revenue in this period
      </div>
    );
  }

  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));

  return (
    <div className="flex items-end gap-1" style={{ height: chartHeight }}>
      {data.map((point, i) => {
        const barHeight = Math.max(
          3,
          (point.revenue / maxRevenue) * (chartHeight - 20)
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
              <div className="absolute -top-8 z-10 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-xs font-medium text-white shadow-card">
                {formatCurrency(point.revenue)}
              </div>
            )}
            <div
              className={`w-full rounded-t-sm transition-colors ${
                isHovered ? "bg-primary-dark" : "bg-primary/70"
              }`}
              style={{ height: barHeight }}
            />
            {data.length <= 14 && (
              <span className="mt-1.5 text-[9px] text-navy/35">
                {formatLabel(point.date)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
