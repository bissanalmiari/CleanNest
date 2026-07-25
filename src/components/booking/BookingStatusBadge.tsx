// src/components/bookings/BookingStatusBadge.tsx
// Small colored pill used to display a booking's status consistently
// across the bookings table and the booking detail page.

const STATUS_STYLES: Record<string, string> = {
  pending:
    "border-status-pending/15 bg-status-pending/10 text-status-pending shadow-[0_3px_10px_rgba(217,119,6,0.08)]",
  confirmed:
    "border-status-confirmed/15 bg-status-confirmed/10 text-status-confirmed shadow-[0_3px_10px_rgba(22,163,74,0.08)]",
  in_progress:
    "border-status-inProgress/15 bg-status-inProgress/10 text-status-inProgress shadow-[0_3px_10px_rgba(37,99,235,0.08)]",
  completed:
    "border-status-confirmed/15 bg-status-confirmed/10 text-status-confirmed shadow-[0_3px_10px_rgba(22,163,74,0.08)]",
  cancelled:
    "border-status-cancelled/15 bg-status-cancelled/10 text-status-cancelled shadow-[0_3px_10px_rgba(220,38,38,0.08)]",
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
  confirmed: "Approved",
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "border-navy/10 bg-navy/5 text-navy/60"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {(status === "pending" || status === "in_progress") && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 motion-reduce:animate-none ${
              DOT_COLORS[status] ?? "bg-navy/40"
            }`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            DOT_COLORS[status] ?? "bg-navy/40"
          }`}
        />
      </span>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
