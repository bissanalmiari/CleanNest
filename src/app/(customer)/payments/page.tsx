"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

interface ServiceRef {
  _id: string;
  name?: string;
}

interface PaymentRow {
  _id: string;
  amount: number;
  method: "cash" | "card";
  status: PaymentStatus;
  createdAt: string;
  transactionReference?: string | null;
  bookingId?: {
    _id: string;
    bookingNumber: string;
    bookingDate: string;
    status: string;
    serviceId?: ServiceRef | string | null;
  } | null;
}

interface PaymentSummaryRow {
  _id: PaymentStatus;
  count: number;
  total: number;
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
  summary: PaymentSummaryRow[];
}

const STATUS_TABS: Array<{ value: "" | PaymentStatus; label: string }> = [
  { value: "", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_MESSAGES: Record<PaymentStatus, string> = {
  unpaid: "Payment is ready when you are.",
  pending: "We are securely processing this payment.",
  paid: "Payment completed successfully.",
  failed: "This payment needs your attention.",
  refunded: "The payment was returned to you.",
};

function serviceName(service: ServiceRef | string | null | undefined) {
  if (!service || typeof service === "string") return "Professional cleaning";
  return service.name ?? "Professional cleaning";
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

function SummarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[108px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.07]"
        />
      ))}
    </div>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading payments">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse gap-5 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 sm:grid-cols-[1fr_auto]"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-40 rounded-full bg-slate-100" />
              <div className="h-3 w-64 max-w-full rounded-full bg-slate-100" />
              <div className="h-3 w-32 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="space-y-3 sm:text-right">
            <div className="h-5 w-24 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<"" | PaymentStatus>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaymentListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (
      currentStatus: "" | PaymentStatus,
      currentPage: number,
      isRefresh = false,
    ) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "8",
        });
        if (currentStatus) params.set("status", currentStatus);

        const response = await fetch(
          `/api/customer/payments?${params.toString()}`,
          { cache: "no-store" },
        );
        const json: ApiEnvelope<PaymentListData> = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "We could not load your payments.");
        }

        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We could not load your payments.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchPayments(status, page);
  }, [fetchPayments, page, status]);

  const metrics = useMemo(() => {
    const summary = data?.summary ?? [];
    const byStatus = new Map(
      summary.map((item) => [
        item._id,
        { count: item.count, total: item.total },
      ]),
    );
    const get = (value: PaymentStatus) =>
      byStatus.get(value) ?? { count: 0, total: 0 };
    const attentionStatuses: PaymentStatus[] = ["unpaid", "failed"];
    const outstandingStatuses: PaymentStatus[] = [
      "unpaid",
      "pending",
      "failed",
    ];

    return {
      byStatus,
      totalCount: summary.reduce((sum, item) => sum + item.count, 0),
      paidTotal: get("paid").total,
      attentionCount: attentionStatuses.reduce(
        (sum, value) => sum + get(value).count,
        0,
      ),
      outstandingTotal: outstandingStatuses.reduce(
        (sum, value) => sum + get(value).total,
        0,
      ),
    };
  }, [data]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.limit))
    : 1;

  function changeStatus(nextStatus: "" | PaymentStatus) {
    setStatus(nextStatus);
    setPage(1);
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1380px] space-y-6">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8 lg:p-10"
        >
          <div
            aria-hidden="true"
            className="absolute -right-28 -top-36 h-96 w-96 rounded-full border border-cyan-200/20 bg-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-primary/30 blur-3xl"
          />

          <div className="relative grid items-end gap-8 xl:grid-cols-[minmax(0,1fr)_620px]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                  Secure payment center
                </p>
              </div>

              <h1 className="mt-6 max-w-xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                Every payment,
                <span className="block text-cyan-300">clear and organized.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                Review receipts, follow payment progress, and securely complete
                anything that still needs your attention.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold text-blue-100/70">
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-emerald-300" />
                  Protected transactions
                </span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>USD billing</span>
              </div>
            </div>

            {loading && !data ? (
              <SummarySkeleton />
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard
                  icon={CheckCircle2}
                  label="Successfully paid"
                  value={formatMoney(metrics.paidTotal)}
                  note={`${metrics.byStatus.get("paid")?.count ?? 0} completed`}
                  accent="emerald"
                />
                <SummaryCard
                  icon={Clock3}
                  label="Open balance"
                  value={formatMoney(metrics.outstandingTotal)}
                  note="Across active payments"
                  accent="cyan"
                />
                <SummaryCard
                  icon={AlertCircle}
                  label="Needs attention"
                  value={String(metrics.attentionCount)}
                  note={
                    metrics.attentionCount === 1
                      ? "Payment to review"
                      : "Payments to review"
                  }
                  accent="amber"
                />
              </div>
            )}
          </div>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_60px_rgba(11,37,69,0.08)] sm:p-6">
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                  Payment activity
                </p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                  Your transaction history
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void fetchPayments(status, page, true)}
                disabled={refreshing}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-navy transition hover:border-primary/30 hover:bg-primary-light disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 text-primary ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Filter payments by status"
              className="mt-5 flex gap-2 overflow-x-auto pb-2"
            >
              {STATUS_TABS.map((tab) => {
                const count =
                  tab.value === ""
                    ? metrics.totalCount
                    : (metrics.byStatus.get(tab.value)?.count ?? 0);
                const active = status === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => changeStatus(tab.value)}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-navy text-white shadow-[0_10px_24px_rgba(11,37,69,0.18)]"
                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:border-primary/20 hover:bg-primary-light hover:text-primary"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        active
                          ? "bg-white/15 text-cyan-100"
                          : "bg-white text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5" aria-live="polite">
              {errorMessage ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50/60 p-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold text-navy">
                    Payments could not be loaded
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => void fetchPayments(status, page)}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-5 text-xs font-extrabold text-white transition hover:bg-primary"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </div>
              ) : loading ? (
                <PaymentsSkeleton />
              ) : !data || data.payments.length === 0 ? (
                <EmptyPaymentsState filtered={status !== ""} />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${status}-${page}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {data.payments.map((payment, index) => (
                      <PaymentCard
                        key={payment._id}
                        payment={payment}
                        index={index}
                        reduceMotion={Boolean(reduceMotion)}
                        onPay={() => {
                          if (payment.bookingId) {
                            router.push(
                              `/payments/pay/${payment.bookingId._id}`,
                            );
                          }
                        }}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {data && totalPages > 1 && !loading && !errorMessage && (
              <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Showing page{" "}
                  <span className="font-extrabold text-navy">{data.page}</span>{" "}
                  of{" "}
                  <span className="font-extrabold text-navy">{totalPages}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  {data.total} payments
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-navy transition hover:border-primary/30 hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-extrabold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,#0b2545,#154f9e)] p-6 text-white shadow-[0_20px_55px_rgba(11,37,69,0.18)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-navy">
                <ReceiptText className="h-5 w-5" />
              </span>
              <h2 className="mt-6 font-heading text-xl font-black tracking-[-0.025em]">
                Simple, secure billing
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-blue-100/70">
                Each payment is connected to its booking, so your service and
                transaction history always stay together.
              </p>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                <TrustItem icon={LockKeyhole} text="Secure payment workflow" />
                <TrustItem icon={FileText} text="Clear payment records" />
                <TrustItem icon={ShieldCheck} text="Admin-verified cash status" />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_45px_rgba(11,37,69,0.07)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-navy">
                    Need another clean?
                  </p>
                  <p className="text-xs text-slate-400">Build a new route</p>
                </div>
              </div>
              <Link
                href="/book-service"
                className="group mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-white shadow-[0_12px_25px_rgba(30,111,217,0.2)] transition hover:bg-primary-dark"
              >
                Book a service
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

interface SummaryCardProps {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  note: string;
  accent: "emerald" | "cyan" | "amber";
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
  accent,
}: SummaryCardProps) {
  const accents = {
    emerald: "bg-emerald-300 text-navy",
    cyan: "bg-cyan-300 text-navy",
    amber: "bg-amber-300 text-navy",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${accents[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-blue-100/60">
          {label}
        </p>
      </div>
      <p className="mt-4 font-heading text-xl font-black tracking-[-0.03em] text-white">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold text-blue-100/50">{note}</p>
    </div>
  );
}

interface PaymentCardProps {
  payment: PaymentRow;
  index: number;
  reduceMotion: boolean;
  onPay: () => void;
}

function PaymentCard({
  payment,
  index,
  reduceMotion,
  onPay,
}: PaymentCardProps) {
  const booking = payment.bookingId;
  const canPayNow =
    payment.method === "card" &&
    (payment.status === "unpaid" || payment.status === "failed") &&
    Boolean(booking);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.035, 0.16) }}
      className="group relative overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(11,37,69,0.1)]"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${
          payment.status === "paid"
            ? "bg-emerald-400"
            : payment.status === "failed"
              ? "bg-red-400"
              : payment.status === "pending"
                ? "bg-amber-400"
                : payment.status === "refunded"
                  ? "bg-blue-400"
                  : "bg-slate-300"
        }`}
      />

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="flex min-w-0 gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              payment.method === "card"
                ? "bg-primary-light text-primary"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {payment.method === "card" ? (
              <CreditCard className="h-5 w-5" />
            ) : (
              <Banknote className="h-5 w-5" />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-heading text-base font-bold text-navy">
                {serviceName(booking?.serviceId)}
              </h3>
              <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {booking?.bookingNumber ?? "Booking"}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {formatDate(booking?.bookingDate ?? payment.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <WalletCards className="h-3.5 w-3.5 text-primary" />
                {payment.method}
              </span>
              {payment.transactionReference && (
                <span className="inline-flex items-center gap-1.5">
                  <ReceiptText className="h-3.5 w-3.5 text-primary" />
                  {payment.transactionReference}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs font-medium text-slate-400">
              {STATUS_MESSAGES[payment.status]}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
          <div className="sm:text-right">
            <p className="font-heading text-xl font-black tracking-[-0.03em] text-navy">
              {formatMoney(payment.amount)}
            </p>
            <div className="mt-2">
              <PaymentStatusBadge status={payment.status} />
            </div>
          </div>

          {canPayNow && (
            <button
              type="button"
              onClick={onPay}
              className="group/pay inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(30,111,217,0.2)] transition hover:bg-primary-dark"
            >
              Pay securely
              <ChevronRight className="h-4 w-4 transition-transform group-hover/pay:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function EmptyPaymentsState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_14px_35px_rgba(11,37,69,0.08)]">
        <CircleDollarSign className="h-7 w-7" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      </span>
      <h3 className="mt-5 font-heading text-xl font-black tracking-[-0.025em] text-navy">
        {filtered ? "No matching payments" : "Your payment history starts here"}
      </h3>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        {filtered
          ? "There are no payments with this status. Try another filter to see more activity."
          : "Once you book a cleaning, its payment details and status will appear here automatically."}
      </p>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold text-blue-100/70">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-cyan-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {text}
    </div>
  );
}
