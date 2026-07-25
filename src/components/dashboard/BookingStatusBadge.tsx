// src/components/dashboard/BookingStatusBadge.tsx
// Small status pill shared by the customer dashboard's booking lists.
// Same color mapping as the admin BookingReportsTable, kept in one place.

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-primary",
  in_progress: "border-cyan-200 bg-cyan-50 text-cyan-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_DOTS: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-primary",
  in_progress: "bg-cyan-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
        STATUS_STYLES[status] ?? "border-navy/10 bg-navy/5 text-navy/60"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] ?? "bg-navy/40"}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
