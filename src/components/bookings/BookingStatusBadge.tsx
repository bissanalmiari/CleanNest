// src/components/bookings/BookingStatusBadge.tsx
// Small colored pill used to display a booking's status consistently
// across the bookings table and the booking detail page.

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-pending/10 text-status-pending",
  confirmed: "bg-status-confirmed/10 text-status-confirmed",
  in_progress: "bg-status-inProgress/10 text-status-inProgress",
  completed: "bg-status-confirmed/10 text-status-confirmed",
  cancelled: "bg-status-cancelled/10 text-status-cancelled",
};

const DOT_COLORS: Record<string, string> = {
  pending: "bg-status-pending",
  confirmed: "bg-status-confirmed",
  in_progress: "bg-status-inProgress",
  completed: "bg-status-confirmed",
  cancelled: "bg-status-cancelled",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface BookingStatusBadgeProps {
  status: string;
}

export default function BookingStatusBadge({
  status,
}: BookingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-navy/10 text-navy/60"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          DOT_COLORS[status] ?? "bg-navy/40"
        }`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}