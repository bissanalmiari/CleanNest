// src/app/(customer)/payments/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  CreditCard,
  Banknote,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";

interface ServiceRef {
  _id: string;
  name?: string;
}

interface PaymentRow {
  _id: string;
  amount: number;
  method: "cash" | "card";
  status: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  createdAt: string;
  bookingId?: {
    _id: string;
    bookingNumber: string;
    bookingDate: string;
    status: string;
    serviceId?: ServiceRef | string | null;
  } | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaymentListData {
  payments: PaymentRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function serviceName(service: ServiceRef | string | null | undefined): string {
  if (!service || typeof service === "string") return "Cleaning service";
  return service.name ?? "Cleaning service";
}

function money(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaymentListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPayments = useCallback(async (currentStatus: string, currentPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage) });
      if (currentStatus) params.set("status", currentStatus);

      const res = await fetch(`/api/customer/payments?${params.toString()}`);
      const json: ApiEnvelope<PaymentListData> = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to load your payments");
      }
      setData(json.data ?? null);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load your payments"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(status, page);
  }, [status, page, fetchPayments]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
            <Wallet size={20} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-navy">
              My Payments
            </h1>
            <p className="text-sm text-navy/60">
              Cash and card payments for your bookings.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-card bg-status-cancelled/10 px-4 py-3 text-sm text-status-cancelled">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setPage(1);
                setStatus(tab.value);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-primary text-white"
                  : "bg-surface text-navy/60 shadow-card hover:bg-primary-light"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-card bg-surface shadow-card"
              />
            ))
          ) : !data || data.payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-card bg-surface p-10 text-center text-navy/40 shadow-card">
              <Wallet size={28} className="text-navy/20" />
              <span>No payments found</span>
            </div>
          ) : (
            data.payments.map((payment) => {
              const booking = payment.bookingId;
              const canPayNow =
                payment.method === "card" &&
                (payment.status === "unpaid" || payment.status === "failed");

              return (
                <div
                  key={payment._id}
                  className="rounded-card bg-surface p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
                        {payment.method === "cash" ? (
                          <Banknote size={16} />
                        ) : (
                          <CreditCard size={16} />
                        )}
                      </span>
                      <div>
                        <p className="font-medium text-navy">
                          {booking?.bookingNumber ?? "Booking"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-navy/50">
                          <Sparkles size={12} />
                          {serviceName(booking?.serviceId)}
                        </p>
                        <p className="mt-0.5 text-xs text-navy/40">
                          {booking
                            ? new Date(booking.bookingDate).toLocaleDateString()
                            : new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="font-heading text-lg font-semibold text-navy">
                        {money(payment.amount)}
                      </span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  </div>

                  {canPayNow && booking && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/payments/pay/${booking._id}`)
                      }
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                    >
                      Pay now <ChevronRight size={14} />
                    </button>
                  )}

                  {payment.status === "pending" && (
                    <p className="mt-3 rounded-md bg-status-pending/10 px-3 py-2 text-xs font-medium text-status-pending">
                      Your payment is being processed.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-navy/60">
            <span>
              Page {data.page} of {totalPages}
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
  );
}
