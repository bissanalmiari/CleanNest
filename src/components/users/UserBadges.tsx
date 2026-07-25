// src/components/users/UserBadges.tsx
// Refined colored pills for a user's role and account status, shared between
// the users table and the user detail page.

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-primary-light text-primary ring-1 ring-primary/15",
  cleaner: "bg-status-inProgress/10 text-status-inProgress ring-1 ring-status-inProgress/15",
  customer: "bg-status-confirmed/10 text-status-confirmed ring-1 ring-status-confirmed/15",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  cleaner: "Cleaner",
  customer: "Customer",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${
        ROLE_STYLES[role] ?? "bg-navy/5 text-navy/60 ring-1 ring-navy/10"
      }`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-status-confirmed/10 text-status-confirmed ring-1 ring-status-confirmed/15",
  inactive: "bg-navy/5 text-navy/50 ring-1 ring-navy/10",
  pending_verification: "bg-status-pending/10 text-status-pending ring-1 ring-status-pending/15",
  suspended: "bg-status-cancelled/10 text-status-cancelled ring-1 ring-status-cancelled/15",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-status-confirmed",
  inactive: "bg-navy/40",
  pending_verification: "bg-status-pending",
  suspended: "bg-status-cancelled",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  pending_verification: "Pending verification",
  suspended: "Suspended",
};

export function AccountStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${
        STATUS_STYLES[status] ?? "bg-navy/5 text-navy/60 ring-1 ring-navy/10"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          STATUS_DOT[status] ?? "bg-navy/40"
        }`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
