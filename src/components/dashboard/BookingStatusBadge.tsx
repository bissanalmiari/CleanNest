// src/components/dashboard/BookingStatusBadge.tsx
// Small status pill shared by the customer dashboard's booking lists.
// Same color mapping as the admin BookingReportsTable, kept in one place.

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-pending/10 text-status-pending",
  confirmed: "bg-status-confirmed/10 text-status-confirmed",
  in_progress: "bg-status-inProgress/10 text-status-inProgress",
  completed: "bg-status-confirmed/10 text-status-confirmed",
  cancelled: "bg-status-cancelled/10 text-status-cancelled",
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-navy/10 text-navy/60"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
