"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";

interface RevenuePoint {
  date: string;
  revenue: number;
  count: number;
}

interface RevenueTrendChartProps {
  data: RevenuePoint[];
  loading?: boolean;
}

const WIDTH = 760;
const HEIGHT = 270;
const LEFT = 58;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 42;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

function formatLabel(date: string) {
  const parts = date.split("-");
  if (parts.length === 3) {
    const parsed = new Date(`${date}T00:00:00`);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(parsed);
  }

  const parsed = new Date(`${date}-01T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(parsed);
}

function formatCurrency(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

export default function RevenueTrendChart({ data, loading = false }: RevenueTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const maxValue = Math.max(1, ...data.map((point) => point.revenue));
    const roundedMax =
      maxValue <= 10
        ? 10
        : Math.ceil(maxValue / 10 ** Math.floor(Math.log10(maxValue))) *
          10 ** Math.floor(Math.log10(maxValue));
    const points = data.map((point, index) => {
      const x =
        data.length === 1 ? LEFT + PLOT_WIDTH / 2 : LEFT + (index / (data.length - 1)) * PLOT_WIDTH;
      const y = TOP + PLOT_HEIGHT - (point.revenue / roundedMax) * PLOT_HEIGHT;
      return { ...point, x, y };
    });
    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const firstPoint = points[0];
    const lastPoint = points.at(-1);
    const areaPath =
      firstPoint && lastPoint
        ? `${linePath} L ${lastPoint.x} ${
            TOP + PLOT_HEIGHT
          } L ${firstPoint.x} ${TOP + PLOT_HEIGHT} Z`
        : "";
    const labelFrequency = Math.max(1, Math.ceil(data.length / 6));

    return { roundedMax, points, linePath, areaPath, labelFrequency };
  }, [data]);

  if (loading) {
    return <div className="h-[310px] animate-pulse rounded-[1.4rem] bg-slate-100" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[310px] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/60 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
          <BarChart3 className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-bold text-navy">No revenue recorded</p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Paid transactions will appear here.
        </p>
      </div>
    );
  }

  const hovered = hoverIndex === null ? null : chart.points[hoverIndex];

  return (
    <div className="relative h-[310px] w-full">
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 min-w-[145px] -translate-x-1/2 rounded-xl bg-navy px-3.5 py-3 text-white shadow-[0_14px_35px_rgba(11,37,69,0.24)]"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${Math.max(0, (hovered.y / HEIGHT) * 100 - 17)}%`,
          }}
        >
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-cyan-300">
            {formatLabel(hovered.date)}
          </p>
          <p className="mt-1 font-heading text-base font-black">
            {formatCurrency(hovered.revenue)}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-blue-100/60">
            {hovered.count} paid {hovered.count === 1 ? "transaction" : "transactions"}
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="report-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e6fd9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e6fd9" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="report-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#1e6fd9" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = TOP + PLOT_HEIGHT * ratio;
          const value = chart.roundedMax * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={LEFT}
                y1={y}
                x2={WIDTH - RIGHT}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 5"
              />
              <text
                x={LEFT - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-semibold"
              >
                {formatCurrency(value, true)}
              </text>
            </g>
          );
        })}

        <path d={chart.areaPath} fill="url(#report-area)" />
        <path
          d={chart.linePath}
          fill="none"
          stroke="url(#report-line)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.points.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoverIndex === index ? 6 : 4}
              fill="white"
              stroke={hoverIndex === index ? "#0b2545" : "#1e6fd9"}
              strokeWidth="3"
              className="transition-all"
            />
            {(index % chart.labelFrequency === 0 || index === chart.points.length - 1) && (
              <text
                x={point.x}
                y={HEIGHT - 13}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-semibold"
              >
                {formatLabel(point.date)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {chart.points.map((point, index) => (
        <button
          key={point.date}
          type="button"
          aria-label={`${formatLabel(point.date)}: ${formatCurrency(point.revenue)}`}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex(index)}
          onBlur={() => setHoverIndex(null)}
          className="absolute top-0 h-[88%] -translate-x-1/2 focus:outline-none"
          style={{
            left: `${(point.x / WIDTH) * 100}%`,
            width: `${Math.max(2.5, 90 / data.length)}%`,
          }}
        />
      ))}
    </div>
  );
}
