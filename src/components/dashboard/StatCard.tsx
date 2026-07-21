// src/components/dashboard/StatCard.tsx
// Small reusable stat card used across the admin dashboard overview.

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "confirmed" | "pending" | "cancelled" | "inProgress";
  loading?: boolean;
}

const accentStyles: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary-light text-primary",
  confirmed: "bg-status-confirmed/10 text-status-confirmed",
  pending: "bg-status-pending/10 text-status-pending",
  cancelled: "bg-status-cancelled/10 text-status-cancelled",
  inProgress: "bg-status-inProgress/10 text-status-inProgress",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  loading = false,
}: StatCardProps) {
  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-navy/60">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${accentStyles[accent]}`}
        >
          <Icon className="h-4.5 w-4.5" size={18} />
        </span>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-navy/10" />
        ) : (
          <span className="font-heading text-2xl font-semibold text-navy">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
