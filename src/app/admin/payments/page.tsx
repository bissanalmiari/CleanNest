// src/app/admin/payments/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Calendar,
  Wallet,
  CreditCard,
  Banknote,
  ReceiptText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  X,
} from "lucide-react";
import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";

interface PopulatedRef {
  _id: string;
  name?: string;
  email?: string;
}

interface PaymentRow {
  _id: string;
  amount: number;
  currency: string;
  method: "cash" | "card";
  status: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  transactionReference?: string;
  paidAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  failureReason?: string;
  createdAt: string;
  bookingId?: {
    _id: string;
    bookingNumber: string;
    customerId?: PopulatedRef | string | null;
    serviceId?: PopulatedRef | string | null;
  } | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SummaryEntry {
  _id: string;
  count: number;
  total: number;
}

interface PaymentListData {
  payments: PaymentRow[];
  total: number;
  page: number;
  limit: number;
  summary: SummaryEntry[];
}

interface FiltersState {
  status: string;
  method: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const EMPTY_FILTERS: FiltersState = {
  status: "",
  method: "",
  dateFrom: "",
  dateTo: "",
  search: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card (test mode)" },
];

function personName(ref: PopulatedRef | string | null | undefined): string {
  if (!ref || typeof ref === "string") return "—";
  return ref.name ?? "—";
}

function money(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type ActionKind = "mark-cash-paid" | "fail" | "refund";

export default function AdminPaymentsPage() {
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaymentListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activePayment, setActivePayment] = useState<PaymentRow | null>(null);
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (currentFilters: FiltersState, currentPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(currentPage) });
        if (currentFilters.status) params.set("status", currentFilters.status);
        if (currentFilters.method) params.set("method", currentFilters.method);
        if (currentFilters.dateFrom)
          params.set("dateFrom", currentFilters.dateFrom);
        if (currentFilters.dateTo) params.set("dateTo", currentFilters.dateTo);
        if (currentFilters.search) params.set("search", currentFilters.search);

        const res = await fetch(`/api/admin/payments?${params.toString()}`);
        const json: ApiEnvelope<PaymentListData> = await res.json();

        if (!json.success) {
          throw new Error(json.error ?? "Failed to load payments");
        }
        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load payments"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPayments(filters, page);
  }, [filters, page, fetchPayments]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleFilterChange = (patch: Partial<FiltersState>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const summaryFor = (status: string): SummaryEntry =>
    data?.summary.find((s) => s._id === status) ?? { _id: status, count: 0, total: 0 };

  const openAction = (payment: PaymentRow, action: ActionKind) => {
    setActivePayment(payment);
    setActiveAction(action);
    setReasonInput("");
    setAmountInput(String(payment.amount));
    setActionError(null);
  };

  const closeModal = () => {
    setActivePayment(null);
    setActiveAction(null);
    setActionError(null);
  };

  const submitAction = async () => {
    if (!activePayment || !activeAction) return;
    setSubmitting(true);
    setActionError(null);
    try {
      let url = `/api/admin/payments/${activePayment._id}/${activeAction}`;
      let body: Record<string, unknown> | undefined;

      if (activeAction === "fail") {
        body = { reason: reasonInput };
      } else if (activeAction === "refund") {
        body = {
          amount: amountInput ? Number(amountInput) : undefined,
          reason: reasonInput,
        };
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json: ApiEnvelope<PaymentRow> = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Action failed");
      }

      closeModal();
      fetchPayments(filters, page);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
            <Wallet size={20} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-navy">
              Payment Management
            </h1>
            <p className="text-sm text-navy/60">
              Track cash and test-mode card payments across every booking.
            </p>
          </div>
          {data && !loading && (
            <span className="ml-auto rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary">
              {data.total} total
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-card bg-status-cancelled/10 px-4 py-3 text-sm text-status-cancelled">
            {errorMessage}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_OPTIONS.filter((o) => o.value).map((opt) => {
            const s = summaryFor(opt.value);
            return (
              <div
                key={opt.value}
                className="rounded-card bg-surface p-4 shadow-card"
              >
                <PaymentStatusBadge status={opt.value} />
                <p className="mt-2 font-heading text-xl font-semibold text-navy">
                  {money(s.total)}
                </p>
                <p className="text-xs text-navy/50">{s.count} payments</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface p-4 shadow-card">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search booking # or reference..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-md border border-navy/10 py-2 pl-9 pr-3 text-sm text-navy transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-navy/10 px-2 py-1.5">
            <Calendar size={15} className="text-navy/40" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="text-sm text-navy focus:outline-none"
            />
            <span className="text-navy/30">–</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              className="text-sm text-navy focus:outline-none"
            />
          </div>

          <select
            value={filters.method}
            onChange={(e) => handleFilterChange({ method: e.target.value })}
            className="rounded-md border border-navy/10 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="rounded-md border border-navy/10 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-card bg-surface p-5 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/40">
                  <th className="py-3 font-medium">Booking #</th>
                  <th className="py-3 font-medium">Customer</th>
                  <th className="py-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <ReceiptText size={13} /> Method
                    </span>
                  </th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 text-right font-medium">Amount</th>
                  <th className="py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-navy/5">
                      <td colSpan={7} className="py-3.5">
                        <div className="h-4 w-full animate-pulse rounded bg-navy/5" />
                      </td>
                    </tr>
                  ))
                ) : !data || data.payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-navy/40">
                        <Wallet size={28} className="text-navy/20" />
                        <span>No payments match these filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-navy/5 text-navy transition-colors hover:bg-surface-soft"
                    >
                      <td className="py-3.5 font-medium">
                        {payment.bookingId?.bookingNumber ?? "—"}
                      </td>
                      <td className="py-3.5">
                        {personName(payment.bookingId?.customerId)}
                      </td>
                      <td className="py-3.5">
                        <span className="flex items-center gap-1.5 text-navy/70">
                          {payment.method === "cash" ? (
                            <Banknote size={14} />
                          ) : (
                            <CreditCard size={14} />
                          )}
                          {payment.method === "cash" ? "Cash" : "Card (test)"}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="py-3.5 text-navy/60">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right font-semibold">
                        {money(payment.amount)}
                      </td>
                      <td className="py-3.5">
                        <div className="flex justify-end gap-2">
                          {payment.method === "cash" &&
                            payment.status !== "paid" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(payment, "mark-cash-paid")
                                }
                                className="flex items-center gap-1 rounded-md border border-status-confirmed/30 px-2 py-1 text-xs font-medium text-status-confirmed transition-colors hover:bg-status-confirmed/10"
                              >
                                <CheckCircle2 size={13} /> Mark paid
                              </button>
                            )}
                          {payment.status === "paid" &&
                            payment.method === "card" && (
                              <button
                                type="button"
                                onClick={() => openAction(payment, "refund")}
                                className="flex items-center gap-1 rounded-md border border-status-inProgress/30 px-2 py-1 text-xs font-medium text-status-inProgress transition-colors hover:bg-status-inProgress/10"
                              >
                                <RotateCcw size={13} /> Refund
                              </button>
                            )}
                          {payment.status !== "paid" &&
                            payment.status !== "refunded" && (
                              <button
                                type="button"
                                onClick={() => openAction(payment, "fail")}
                                className="flex items-center gap-1 rounded-md border border-status-cancelled/30 px-2 py-1 text-xs font-medium text-status-cancelled transition-colors hover:bg-status-cancelled/10"
                              >
                                <XCircle size={13} /> Mark failed
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-navy/60">
              <span>
                Page {data.page} of {totalPages} · {data.total} payments
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md border border-navy/10 px-3 py-1 transition-colors hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-navy/10 px-3 py-1 transition-colors hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activePayment && activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-navy">
                {activeAction === "mark-cash-paid" && "Mark cash payment received"}
                {activeAction === "fail" && "Mark payment as failed"}
                {activeAction === "refund" && "Refund payment"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-navy/40 hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-3 text-sm text-navy/60">
              Booking {activePayment.bookingId?.bookingNumber ?? "—"} ·{" "}
              {money(activePayment.amount)}
            </p>

            {activeAction === "refund" && (
              <div className="mb-3 space-y-1.5">
                <label className="block text-sm font-medium text-navy">
                  Refund amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={activePayment.amount}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {(activeAction === "fail" || activeAction === "refund") && (
              <div className="mb-3 space-y-1.5">
                <label className="block text-sm font-medium text-navy">
                  Reason {activeAction === "fail" ? "" : "(optional)"}
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
                  placeholder="Add a short note for the record..."
                />
              </div>
            )}

            {actionError && (
              <p className="mb-3 rounded-md bg-status-cancelled/10 px-3 py-2 text-xs font-medium text-status-cancelled">
                {actionError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-navy/10 px-4 py-2 text-sm text-navy hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitAction}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
