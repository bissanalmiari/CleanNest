const STATUS_STYLES: Record<string, string> = {
  paid: "bg-status-confirmed/10 text-status-confirmed",
  pending: "bg-status-pending/10 text-status-pending",
  unpaid: "bg-navy/10 text-navy/60",
  failed: "bg-status-cancelled/10 text-status-cancelled",
  refunded: "bg-status-inProgress/10 text-status-inProgress",
};

const DOT_COLORS: Record<string, string> = {
  paid: "bg-status-confirmed",
  pending: "bg-status-pending",
  unpaid: "bg-navy/40",
  failed: "bg-status-cancelled",
  refunded: "bg-status-inProgress",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  unpaid: "Unpaid",
  failed: "Failed",
  refunded: "Refunded",
};

interface PaymentStatusBadgeProps {
  status: string;
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-navy/10 text-navy/60"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[status] ?? "bg-navy/40"}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
