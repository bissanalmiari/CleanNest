"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FilterX,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
type StatusFilter = "" | PaymentStatus;
type MethodFilter = "" | "cash" | "card";
type ActionKind = "mark-cash-paid" | "fail" | "refund";

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
  status: PaymentStatus;
  transactionReference?: string;
  paidAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  failureReason?: string;
  createdAt: string;
  bookingId?: {
    _id: string;
    bookingNumber: string;
    bookingDate?: string;
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
  _id: PaymentStatus;
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
  status: StatusFilter;
  method: MethodFilter;
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

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const METHOD_OPTIONS: Array<{ value: MethodFilter; label: string }> = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash payments" },
  { value: "card", label: "Card payments" },
];

function populatedValue(
  reference: PopulatedRef | string | null | undefined,
  key: "name" | "email"
) {
  if (!reference || typeof reference === "string") return "Not available";
  return reference[key] ?? "Not available";
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Beirut",
  }).format(date);
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-2 p-3" aria-label="Loading payments">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[minmax(230px,1.2fr)_minmax(190px,1fr)_120px_120px_130px] items-center gap-5 rounded-2xl px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded-full bg-slate-100" />
              <div className="h-2.5 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="h-3 w-36 rounded-full bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
          <div className="h-4 w-20 rounded-full bg-slate-100" />
          <div className="h-9 w-24 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaymentListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<PaymentRow | null>(null);
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (currentFilters: FiltersState, currentPage: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "12",
        });
        if (currentFilters.status) params.set("status", currentFilters.status);
        if (currentFilters.method) params.set("method", currentFilters.method);
        if (currentFilters.dateFrom) {
          params.set("dateFrom", currentFilters.dateFrom);
        }
        if (currentFilters.dateTo) {
          params.set("dateTo", currentFilters.dateTo);
        }
        if (currentFilters.search) {
          params.set("search", currentFilters.search);
        }

        const response = await fetch(`/api/admin/payments?${params.toString()}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<PaymentListData> = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Payments could not be loaded.");
        }

        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Payments could not be loaded.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchPayments(filters, page);
  }, [fetchPayments, filters, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = searchInput.trim();
      setPage(1);
      setFilters((current) => (current.search === search ? current : { ...current, search }));
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const summary = useMemo(() => {
    const byStatus = new Map<PaymentStatus, SummaryEntry>(
      (data?.summary ?? []).map((entry) => [entry._id, entry])
    );
    const get = (status: PaymentStatus) =>
      byStatus.get(status) ?? { _id: status, count: 0, total: 0 };

    return {
      byStatus,
      totalCount: Array.from(byStatus.values()).reduce((sum, entry) => sum + entry.count, 0),
      collected: get("paid").total,
      openBalance: get("unpaid").total + get("pending").total + get("failed").total,
      refunded: get("refunded").total,
      attentionCount: get("unpaid").count + get("failed").count,
    };
  }, [data]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasFilters = Boolean(
    filters.status || filters.method || filters.dateFrom || filters.dateTo || filters.search
  );

  function updateFilters(patch: Partial<FiltersState>) {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setSearchInput("");
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  function openAction(payment: PaymentRow, action: ActionKind) {
    setActivePayment(payment);
    setActiveAction(action);
    setReasonInput("");
    setAmountInput(String(payment.amount));
    setActionError(null);
  }

  function closeAction() {
    if (submitting) return;
    setActivePayment(null);
    setActiveAction(null);
    setActionError(null);
  }

  async function submitAction() {
    if (!activePayment || !activeAction) return;
    if (activeAction === "fail" && !reasonInput.trim()) {
      setActionError("Add a reason so this finance action has an audit note.");
      return;
    }
    if (activeAction === "refund") {
      const refundAmount = Number(amountInput);
      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0 ||
        refundAmount > activePayment.amount
      ) {
        setActionError(`Enter an amount between $0.01 and ${formatMoney(activePayment.amount)}.`);
        return;
      }
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const url = `/api/admin/payments/${activePayment._id}/${activeAction}`;
      let body: Record<string, unknown> | undefined;

      if (activeAction === "fail") {
        body = { reason: reasonInput.trim() };
      } else if (activeAction === "refund") {
        body = {
          amount: Number(amountInput),
          reason: reasonInput.trim() || undefined,
        };
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json: ApiEnvelope<PaymentRow> = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Payment action failed.");
      }

      setActivePayment(null);
      setActiveAction(null);
      await fetchPayments(filters, page, true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Payment action failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -right-40 top-24 h-[480px] w-[480px] rounded-full bg-cyan-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-[1450px] space-y-6">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8 lg:p-10"
        >
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-cyan-200/20 bg-cyan-300/10" />
          <div className="absolute -bottom-44 left-[28%] h-96 w-96 rounded-full bg-primary/25 blur-3xl" />

          <div className="relative grid items-end gap-9 xl:grid-cols-[minmax(0,1fr)_680px]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                <LockKeyhole className="h-3.5 w-3.5 text-cyan-300" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                  Finance operations
                </p>
              </div>
              <h1 className="mt-6 max-w-xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                Every transaction,
                <span className="block text-cyan-300">confidently managed.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                Monitor incoming revenue, reconcile cash collections, and manage payment exceptions
                from one secure workspace.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4 text-xs font-bold text-blue-100/65">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Admin-controlled actions
                </span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>USD settlement</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FinanceMetric
                icon={CircleDollarSign}
                label="Collected"
                value={formatMoney(summary.collected)}
                note={`${summary.byStatus.get("paid")?.count ?? 0} payments`}
                accent="emerald"
                loading={loading && !data}
              />
              <FinanceMetric
                icon={TrendingUp}
                label="Open balance"
                value={formatMoney(summary.openBalance)}
                note="Awaiting resolution"
                accent="cyan"
                loading={loading && !data}
              />
              <FinanceMetric
                icon={RotateCcw}
                label="Refunded"
                value={formatMoney(summary.refunded)}
                note={`${summary.byStatus.get("refunded")?.count ?? 0} refunds`}
                accent="blue"
                loading={loading && !data}
              />
              <FinanceMetric
                icon={AlertCircle}
                label="Needs attention"
                value={String(summary.attentionCount)}
                note="Unpaid or failed"
                accent="amber"
                loading={loading && !data}
              />
            </div>
          </div>
        </motion.section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                  Transaction ledger
                </p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                  Payment management
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Search, reconcile, refund, and review booking payments.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-[340px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search booking or reference..."
                    className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-navy outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void fetchPayments(filters, page, true)}
                  disabled={refreshing}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-xs font-extrabold text-navy transition hover:border-primary/30 hover:bg-primary-light disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-primary ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Filter payment status"
              className="mt-5 flex gap-2 overflow-x-auto pb-1"
            >
              {STATUS_OPTIONS.map((option) => {
                const count =
                  option.value === ""
                    ? summary.totalCount
                    : (summary.byStatus.get(option.value)?.count ?? 0);
                const active = filters.status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => updateFilters({ status: option.value })}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-navy text-white shadow-[0_10px_24px_rgba(11,37,69,0.18)]"
                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:border-primary/20 hover:bg-primary-light hover:text-primary"
                    }`}
                  >
                    {option.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        active ? "bg-white/15 text-cyan-100" : "bg-white text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <select
                value={filters.method}
                onChange={(event) =>
                  updateFilters({
                    method: event.target.value as MethodFilter,
                  })
                }
                className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-navy outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              >
                {METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  From
                </span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => updateFilters({ dateFrom: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-navy outline-none"
                />
              </label>

              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  To
                </span>
                <input
                  type="date"
                  min={filters.dateFrom || undefined}
                  value={filters.dateTo}
                  onChange={(event) => updateFilters({ dateTo: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-navy outline-none"
                />
              </label>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <FilterX className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div aria-live="polite">
            {errorMessage ? (
              <ErrorState
                message={errorMessage}
                onRetry={() => void fetchPayments(filters, page)}
              />
            ) : loading ? (
              <PaymentsSkeleton />
            ) : !data || data.payments.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1080px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                        <th className="px-6 py-4">Booking payment</th>
                        <th className="px-4 py-4">Customer</th>
                        <th className="px-4 py-4">Method</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Created</th>
                        <th className="px-4 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-right">Finance actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {data.payments.map((payment, index) => (
                          <PaymentTableRow
                            key={payment._id}
                            payment={payment}
                            index={index}
                            reduceMotion={Boolean(reduceMotion)}
                            onAction={openAction}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {data.payments.map((payment) => (
                    <PaymentMobileCard key={payment._id} payment={payment} onAction={openAction} />
                  ))}
                </div>
              </>
            )}
          </div>

          {data && totalPages > 1 && !loading && !errorMessage && (
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs font-semibold text-slate-500">
                Page <span className="font-extrabold text-navy">{data.page}</span> of{" "}
                <span className="font-extrabold text-navy">{totalPages}</span>
                <span className="mx-2 text-slate-300">•</span>
                {data.total} matching payments
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-navy transition hover:border-primary/30 hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-extrabold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {activePayment && activeAction && (
          <PaymentActionModal
            payment={activePayment}
            action={activeAction}
            reason={reasonInput}
            amount={amountInput}
            submitting={submitting}
            error={actionError}
            reduceMotion={Boolean(reduceMotion)}
            onReasonChange={setReasonInput}
            onAmountChange={setAmountInput}
            onClose={closeAction}
            onSubmit={() => void submitAction()}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function FinanceMetric({
  icon: Icon,
  label,
  value,
  note,
  accent,
  loading,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
  accent: "emerald" | "cyan" | "blue" | "amber";
  loading: boolean;
}) {
  const accents = {
    emerald: "bg-emerald-300 text-navy",
    cyan: "bg-cyan-300 text-navy",
    blue: "bg-blue-300 text-navy",
    amber: "bg-amber-300 text-navy",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent]}`}>
        <Icon className="h-4 w-4" />
      </span>
      {loading ? (
        <div className="mt-4 h-7 w-24 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="mt-4 truncate font-heading text-xl font-black tracking-[-0.04em] text-white">
          {value}
        </p>
      )}
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.13em] text-blue-100/55">
        {label}
      </p>
      <p className="mt-1 text-[9px] font-bold text-blue-100/40">{note}</p>
    </div>
  );
}

function PaymentIdentity({ payment }: { payment: PaymentRow }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          payment.method === "cash"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-primary-light text-primary"
        }`}
      >
        {payment.method === "cash" ? (
          <Banknote className="h-5 w-5" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate font-heading text-sm font-bold text-navy">
          {payment.bookingId?.bookingNumber ?? "Booking unavailable"}
        </p>
        <p className="mt-1 truncate font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {payment.transactionReference ?? `PAY-${payment._id.slice(-8)}`}
        </p>
      </div>
    </div>
  );
}

function PaymentTableRow({
  payment,
  index,
  reduceMotion,
  onAction,
}: {
  payment: PaymentRow;
  index: number;
  reduceMotion: boolean;
  onAction: (payment: PaymentRow, action: ActionKind) => void;
}) {
  return (
    <motion.tr
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.025, 0.15) }}
      className="border-b border-slate-100 last:border-0 hover:bg-primary/[0.025]"
    >
      <td className="px-6 py-4">
        <PaymentIdentity payment={payment} />
      </td>
      <td className="px-4 py-4">
        <p className="text-xs font-bold text-navy">
          {populatedValue(payment.bookingId?.customerId, "name")}
        </p>
        <p className="mt-1 text-[10px] font-medium text-slate-400">
          {populatedValue(payment.bookingId?.customerId, "email")}
        </p>
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-bold capitalize text-slate-600">
          <WalletCards className="h-3.5 w-3.5 text-primary" />
          {payment.method}
          {payment.method === "card" && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-slate-400">
              Test
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-4">
        <PaymentStatusBadge status={payment.status} />
      </td>
      <td className="px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {formatDate(payment.createdAt)}
        </p>
      </td>
      <td className="px-4 py-4 text-right">
        <p className="font-heading text-base font-black text-navy">{formatMoney(payment.amount)}</p>
        <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
          {payment.currency}
        </p>
      </td>
      <td className="px-6 py-4">
        <PaymentActions payment={payment} onAction={onAction} />
      </td>
    </motion.tr>
  );
}

function PaymentMobileCard({
  payment,
  onAction,
}: {
  payment: PaymentRow;
  onAction: (payment: PaymentRow, action: ActionKind) => void;
}) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(11,37,69,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <PaymentIdentity payment={payment} />
        <PaymentStatusBadge status={payment.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Customer
          </p>
          <p className="mt-1 truncate text-xs font-bold text-navy">
            {populatedValue(payment.bookingId?.customerId, "name")}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Amount
          </p>
          <p className="mt-1 font-heading text-sm font-black text-navy">
            {formatMoney(payment.amount)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Method
          </p>
          <p className="mt-1 text-xs font-bold capitalize text-navy">{payment.method}</p>
        </div>
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Created
          </p>
          <p className="mt-1 text-xs font-bold text-navy">{formatDate(payment.createdAt)}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <PaymentActions payment={payment} onAction={onAction} />
      </div>
    </article>
  );
}

function PaymentActions({
  payment,
  onAction,
}: {
  payment: PaymentRow;
  onAction: (payment: PaymentRow, action: ActionKind) => void;
}) {
  const canMarkCashPaid = payment.method === "cash" && payment.status !== "paid";
  const canRefund = payment.method === "card" && payment.status === "paid";
  const canFail =
    payment.status !== "paid" && payment.status !== "refunded" && payment.status !== "failed";

  if (!canMarkCashPaid && !canRefund && !canFail) {
    return (
      <div className="flex justify-end">
        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          No action required
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canMarkCashPaid && (
        <ActionButton
          icon={CheckCircle2}
          label="Confirm cash"
          tone="success"
          onClick={() => onAction(payment, "mark-cash-paid")}
        />
      )}
      {canRefund && (
        <ActionButton
          icon={RotateCcw}
          label="Refund"
          tone="primary"
          onClick={() => onAction(payment, "refund")}
        />
      )}
      {canFail && (
        <ActionButton
          icon={XCircle}
          label="Mark failed"
          tone="danger"
          onClick={() => onAction(payment, "fail")}
        />
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "success" | "primary" | "danger";
  onClick: () => void;
}) {
  const tones = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white",
    primary: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-primary hover:text-white",
    danger: "border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-extrabold transition ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function PaymentActionModal({
  payment,
  action,
  reason,
  amount,
  submitting,
  error,
  reduceMotion,
  onReasonChange,
  onAmountChange,
  onClose,
  onSubmit,
}: {
  payment: PaymentRow;
  action: ActionKind;
  reason: string;
  amount: string;
  submitting: boolean;
  error: string | null;
  reduceMotion: boolean;
  onReasonChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const content = {
    "mark-cash-paid": {
      title: "Confirm cash collection",
      description: "Confirm that the cash payment was received for this booking.",
      icon: CheckCircle2,
      iconClass: "bg-emerald-100 text-emerald-700",
      buttonClass: "bg-emerald-600 hover:bg-emerald-700",
      buttonLabel: "Confirm payment",
    },
    fail: {
      title: "Mark payment as failed",
      description: "Record this payment as unsuccessful and keep an audit reason.",
      icon: XCircle,
      iconClass: "bg-red-100 text-red-600",
      buttonClass: "bg-red-600 hover:bg-red-700",
      buttonLabel: "Mark as failed",
    },
    refund: {
      title: "Issue card refund",
      description: "Return all or part of this paid card transaction to the customer.",
      icon: RotateCcw,
      iconClass: "bg-blue-100 text-blue-700",
      buttonClass: "bg-primary hover:bg-primary-dark",
      buttonLabel: "Issue refund",
    },
  }[action];
  const Icon = content.icon;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-action-title"
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(11,37,69,0.3)]"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(125deg,#071d38,#154f9e)] p-6 text-white">
          <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full bg-cyan-300/10" />
          <div className="relative flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${content.iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="payment-action-title"
                className="font-heading text-xl font-black tracking-[-0.025em]"
              >
                {content.title}
              </h2>
              <p className="mt-2 text-xs font-medium leading-5 text-blue-100/65">
                {content.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-blue-100 transition hover:bg-white/[0.14]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Booking
              </p>
              <p className="mt-1 text-sm font-bold text-navy">
                {payment.bookingId?.bookingNumber ?? "Unavailable"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Payment total
              </p>
              <p className="mt-1 font-heading text-base font-black text-navy">
                {formatMoney(payment.amount)}
              </p>
            </div>
          </div>

          {action === "refund" && (
            <label className="mt-5 block">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500">
                Refund amount
              </span>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payment.amount}
                  value={amount}
                  onChange={(event) => onAmountChange(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 text-sm font-bold text-navy outline-none focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-400">
                Maximum refundable amount: {formatMoney(payment.amount)}
              </p>
            </label>
          )}

          {(action === "fail" || action === "refund") && (
            <label className="mt-5 block">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500">
                Audit reason {action === "refund" && "(optional)"}
              </span>
              <textarea
                rows={3}
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder={
                  action === "fail"
                    ? "Explain why this payment failed..."
                    : "Add an optional refund note..."
                }
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-navy outline-none placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </label>
          )}

          {action === "mark-cash-paid" && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-xs font-medium leading-5 text-emerald-800">
                This will mark the booking payment as paid and confirm the cash was physically
                received.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-11 rounded-xl border border-slate-200 px-5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-extrabold text-white transition disabled:cursor-wait disabled:opacity-50 ${content.buttonClass}`}
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {submitting ? "Processing..." : content.buttonLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-heading text-lg font-bold text-navy">Payment ledger unavailable</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-5 text-xs font-extrabold text-white transition hover:bg-primary"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-[390px] flex-col items-center justify-center p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-[0_14px_35px_rgba(11,37,69,0.08)]">
        <ReceiptText className="h-7 w-7" />
      </span>
      <h3 className="mt-5 font-heading text-xl font-black text-navy">
        {hasFilters ? "No matching payments" : "No payment activity yet"}
      </h3>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        {hasFilters
          ? "Try changing the status, method, date range, or search terms."
          : "Booking payments will appear here as customers begin scheduling services."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-navy px-5 py-3 text-xs font-extrabold text-white transition hover:bg-primary"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
