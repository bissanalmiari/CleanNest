"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  UsersRound,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import ServiceProofReportPanel from "@/components/proof/ServiceProofReportPanel";

interface PopulatedRef {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface BookingDetail {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  baseAmount?: number;
  serviceBaseAmount?: number;
  propertyAdjustmentAmount?: number;
  addOnsAmount?: number;
  serviceAreaFee?: number;
  discountAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;
  customerNotes?: string;
  adminNotes?: string;
  customerId?: PopulatedRef;
  serviceId?: {
    _id: string;
    name: string;
    category?: string;
    price?: number;
    durationMinutes?: number;
  };
  addressId?: {
    city: string;
    area: string;
    street: string;
    building?: string;
    floor?: string;
    apartment?: string;
  };
  promoCodeId?: {
    code: string;
    discountType: string;
    discountValue: number;
  };
}

interface BookingAddonRow {
  _id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addonId?: { name: string };
}

interface AssignmentRow {
  _id: string;
  status: string;
  assignedAt: string;
  cleanerId?: PopulatedRef;
  assignedByUserId?: { name: string };
}

interface StatusHistoryRow {
  _id: string;
  previousStatus?: string;
  newStatus: string;
  reason?: string;
  metadata?: { actor?: string };
  createdAt: string;
  changedByUserId?: { name: string };
}

interface AvailableCleaner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BookingDetailData {
  booking: BookingDetail;
  addons: BookingAddonRow[];
  assignments: AssignmentRow[];
  statusHistory: StatusHistoryRow[];
  availableCleaners: AvailableCleaner[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  confirmed: "Approved",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const WORKFLOW_STEPS = [
  { status: "pending", label: "Request received" },
  { status: "confirmed", label: "Approved" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
];

function formatMoney(value = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string, includeYear = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f8fd] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-8 w-40 rounded-full bg-navy/10" />
        <div className="h-64 rounded-[28px] bg-navy/10" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[520px] rounded-[24px] bg-navy/[0.06]" />
          <div className="h-[520px] rounded-[24px] bg-navy/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const bookingId = params.bookingId;

  const [data, setData] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCleanerIds, setSelectedCleanerIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<BookingDetailData> = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load booking");
        }
        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load booking"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingId]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Keeps an open detail page synchronized with the automatic status engine.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchDetail(true);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchDetail]);

  const assignedCleanerIds = useMemo(
    () =>
      new Set(
        (data?.assignments ?? [])
          .map((assignment) => assignment.cleanerId?._id)
          .filter((id): id is string => Boolean(id))
      ),
    [data?.assignments]
  );

  const selectableCleaners = (data?.availableCleaners ?? []).filter(
    (cleaner) => !assignedCleanerIds.has(cleaner._id)
  );

  function toggleCleaner(cleanerId: string) {
    setSelectedCleanerIds((current) =>
      current.includes(cleanerId)
        ? current.filter((id) => id !== cleanerId)
        : [...current, cleanerId]
    );
  }

  async function handleAssignCleaners() {
    if (selectedCleanerIds.length === 0) return;
    setAssigning(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanerIds: selectedCleanerIds }),
      });
      const json: ApiEnvelope<unknown> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Failed to assign cleaners");
      }
      const count = selectedCleanerIds.length;
      setSelectedCleanerIds([]);
      setSuccessMessage(
        `${count} ${count === 1 ? "cleaner" : "cleaners"} added to the team.`
      );
      await fetchDetail(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to assign cleaners"
      );
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusChange(status: string) {
    setUpdatingStatus(status);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: statusNote.trim() || undefined }),
      });
      const json: ApiEnvelope<unknown> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Failed to update status");
      }
      setStatusNote("");
      setSuccessMessage(
        status === "confirmed"
          ? "Booking approved and officially scheduled."
          : `Booking marked ${STATUS_LABELS[status]?.toLowerCase() ?? status}.`
      );
      await fetchDetail(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setUpdatingStatus(null);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f4f8fd] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[24px] border border-status-cancelled/15 bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-status-cancelled/10 text-status-cancelled">
            <CircleAlert size={28} />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-semibold text-navy">
            Booking could not be opened
          </h1>
          <p className="mt-2 text-sm text-navy/55">
            {errorMessage ?? "The booking is unavailable."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/bookings")}
              className="rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy"
            >
              Back to bookings
            </button>
            <button
              type="button"
              onClick={() => fetchDetail()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const { booking, addons, assignments, statusHistory } = data;
  const currentStep = WORKFLOW_STEPS.findIndex(
    (step) => step.status === booking.status
  );
  const address = [
    booking.addressId?.street,
    booking.addressId?.building,
    booking.addressId?.floor && `Floor ${booking.addressId.floor}`,
    booking.addressId?.apartment && `Apartment ${booking.addressId.apartment}`,
    booking.addressId?.area,
    booking.addressId?.city,
  ]
    .filter(Boolean)
    .join(", ");
  const isClosed = ["completed", "cancelled"].includes(booking.status);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8fd] px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#1e6fd9 1px, transparent 1px), linear-gradient(90deg, #1e6fd9 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(to bottom, black, transparent 68%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-primary/15 blur-[110px]"
        animate={
          reduceMotion ? undefined : { x: [0, -45, 0], y: [0, 35, 0] }
        }
        transition={{ duration: 15, repeat: 0, ease: "easeInOut" }}
      />

      <motion.div
        className="relative mx-auto max-w-7xl space-y-6"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/bookings")}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-navy/55 transition-colors hover:text-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-navy/10 bg-white shadow-sm transition-transform group-hover:-translate-x-1">
              <ArrowLeft size={16} />
            </span>
            Back to bookings
          </button>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchDetail(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-xs font-semibold text-navy/55 shadow-sm transition hover:text-primary disabled:opacity-50"
          >
            <RotateCcw
              size={14}
              className={refreshing ? "animate-spin motion-reduce:animate-none" : ""}
            />
            Refresh
          </button>
        </div>

        <AnimatePresence initial={false}>
          {(errorMessage || successMessage) && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-3 overflow-hidden rounded-2xl border bg-white px-4 py-3.5 text-sm shadow-card ${
                errorMessage
                  ? "border-status-cancelled/20 text-status-cancelled"
                  : "border-status-confirmed/20 text-status-confirmed"
              }`}
            >
              {errorMessage ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
              <span className="flex-1 font-medium">
                {errorMessage ?? successMessage}
              </span>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_50%,#1265b6_100%)] p-6 text-white shadow-[0_24px_70px_rgba(11,37,69,0.23)] sm:p-8">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,.45) 1px, transparent 0)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(90deg, transparent, black)",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-cyan-200/20 bg-cyan-300/10"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 28, repeat: 0, ease: "linear" }}
          />

          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200 backdrop-blur-md">
                    Booking control room
                  </span>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  {booking.bookingNumber}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/65">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-cyan-300" />
                    {formatDate(booking.bookingDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={16} className="text-cyan-300" />
                    {booking.startTime} – {booking.endTime}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <HeroMetric
                  icon={UsersRound}
                  label="Cleaning team"
                  value={String(assignments.length)}
                />
                <HeroMetric
                  icon={Sparkles}
                  label="Service"
                  value={booking.serviceId?.name ?? "Unavailable"}
                />
                <HeroMetric
                  icon={Banknote}
                  label="Booking total"
                  value={formatMoney(booking.totalAmount)}
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            </div>

            {booking.status === "cancelled" ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-rose-200/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <XCircle size={18} />
                This booking was cancelled and its schedule is closed.
              </div>
            ) : (
              <div className="mt-9 grid grid-cols-4">
                {WORKFLOW_STEPS.map((step, index) => {
                  const reached = currentStep >= index;
                  const active = currentStep === index;
                  return (
                    <div key={step.status} className="relative">
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <div className="absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-px bg-white/15">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: reached && currentStep > index ? 1 : 0 }}
                            className="h-full origin-left bg-cyan-300"
                          />
                        </div>
                      )}
                      <div className="relative flex flex-col items-center text-center">
                        <span
                          className={`relative flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all ${
                            reached
                              ? "border-cyan-200/50 bg-cyan-300 text-navy shadow-[0_0_20px_rgba(103,232,249,0.35)]"
                              : "border-white/15 bg-white/5 text-white/35"
                          }`}
                        >
                          {reached && !active ? <Check size={14} /> : index + 1}
                          {active && (
                            <span className="absolute inset-0 animate-ping rounded-full border border-cyan-300/50 motion-reduce:animate-none" />
                          )}
                        </span>
                        <span
                          className={`mt-2 text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
                            reached ? "text-white/85" : "text-white/35"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <SectionCard
              icon={Home}
              eyebrow="Booking profile"
              title="Customer, service & destination"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoPanel icon={UserRound} label="Customer">
                  <p className="font-semibold text-navy">
                    {booking.customerId?.name ?? "Customer unavailable"}
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs text-navy/50">
                    {booking.customerId?.email && (
                      <p className="flex items-center gap-2">
                        <Mail size={13} /> {booking.customerId.email}
                      </p>
                    )}
                    {booking.customerId?.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} /> {booking.customerId.phone}
                      </p>
                    )}
                  </div>
                </InfoPanel>

                <InfoPanel icon={Sparkles} label="Cleaning service">
                  <p className="font-semibold text-navy">
                    {booking.serviceId?.name ?? "Service unavailable"}
                  </p>
                  <p className="mt-2 text-xs capitalize text-navy/50">
                    {booking.serviceId?.category ?? booking.propertyType ?? "Cleaning"}
                    {booking.serviceId?.durationMinutes
                      ? ` · ${booking.serviceId.durationMinutes} min`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-navy/50">
                    {booking.propertySize
                      ? `${booking.propertySize} m²`
                      : "Size unavailable"}
                    {booking.bedrooms !== undefined
                      ? ` · ${booking.bedrooms} bedrooms`
                      : ""}
                    {booking.bathrooms !== undefined
                      ? ` · ${booking.bathrooms} bathrooms`
                      : ""}
                  </p>
                </InfoPanel>

                <InfoPanel icon={MapPin} label="Service address" className="sm:col-span-2">
                  <p className="leading-6 text-navy">{address || "Address unavailable"}</p>
                </InfoPanel>
              </div>
            </SectionCard>

            <SectionCard
              icon={Banknote}
              eyebrow="Financial summary"
              title="Price breakdown"
            >
              <div className="divide-y divide-navy/[0.06]">
                <PriceLine
                  label="Service base price"
                  value={booking.serviceBaseAmount ?? booking.baseAmount}
                />
                {(booking.propertyAdjustmentAmount ?? 0) > 0 && (
                  <PriceLine
                    label={`Property adjustment · ${booking.propertySize ?? 0} m²`}
                    value={booking.propertyAdjustmentAmount}
                  />
                )}
                <PriceLine label="Add-ons" value={booking.addOnsAmount} />
                <PriceLine label="Service-area fee" value={booking.serviceAreaFee} />
                {(booking.discountAmount ?? 0) > 0 && (
                  <PriceLine
                    label={`Discount${
                      booking.promoCodeId ? ` · ${booking.promoCodeId.code}` : ""
                    }`}
                    value={-(booking.discountAmount ?? 0)}
                    discount
                  />
                )}
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-heading text-lg font-semibold text-navy">Total</p>
                    <p className="mt-0.5 text-xs capitalize text-navy/45">
                      {booking.paymentMethod ?? "Payment"} ·{" "}
                      {booking.paymentStatus ?? "unpaid"}
                    </p>
                  </div>
                  <p className="font-heading text-2xl font-semibold text-navy">
                    {formatMoney(booking.totalAmount)}
                  </p>
                </div>
              </div>

              {addons.length > 0 && (
                <div className="mt-5 rounded-2xl bg-surface-soft p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy/45">
                    <Tag size={13} /> Selected add-ons
                  </p>
                  <div className="space-y-2">
                    {addons.map((addon) => (
                      <div
                        key={addon._id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-navy/65">
                          {addon.addonId?.name ?? "Add-on"} × {addon.quantity}
                        </span>
                        <span className="font-semibold text-navy">
                          {formatMoney(addon.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {(booking.customerNotes || booking.adminNotes) && (
              <SectionCard icon={Tag} eyebrow="Context" title="Booking notes">
                <div className="grid gap-4 sm:grid-cols-2">
                  {booking.customerNotes && (
                    <InfoPanel icon={UserRound} label="Customer note">
                      <p className="text-sm leading-6 text-navy/65">
                        {booking.customerNotes}
                      </p>
                    </InfoPanel>
                  )}
                  {booking.adminNotes && (
                    <InfoPanel icon={ShieldCheck} label="Internal admin note">
                      <p className="text-sm leading-6 text-navy/65">
                        {booking.adminNotes}
                      </p>
                    </InfoPanel>
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard
              icon={BadgeCheck}
              eyebrow="Quality assurance"
              title="Proof of service"
            >
              <ServiceProofReportPanel
                bookingId={booking._id}
                audience="admin"
              />
            </SectionCard>

            <SectionCard
              icon={Zap}
              eyebrow="Audit trail"
              title="Booking activity"
            >
              {statusHistory.length === 0 ? (
                <p className="rounded-2xl bg-surface-soft p-5 text-sm text-navy/45">
                  No status changes have been recorded yet.
                </p>
              ) : (
                <ol className="relative ml-2 space-y-6 border-l border-primary/15 pl-7">
                  {statusHistory.map((entry, index) => (
                    <motion.li
                      key={entry._id}
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.3) }}
                      className="relative"
                    >
                      <span className="absolute -left-[35px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary-light ring-4 ring-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-navy">
                            {entry.previousStatus
                              ? `${STATUS_LABELS[entry.previousStatus]} → `
                              : ""}
                            {STATUS_LABELS[entry.newStatus] ?? entry.newStatus}
                          </p>
                          {entry.reason && (
                            <p className="mt-1 text-sm text-navy/55">{entry.reason}</p>
                          )}
                        </div>
                        <span className="text-xs text-navy/40">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-navy/40">
                        by{" "}
                        {entry.metadata?.actor === "system"
                          ? "CleanNest automation"
                          : entry.changedByUserId?.name ?? "System"}
                      </p>
                    </motion.li>
                  ))}
                </ol>
              )}
            </SectionCard>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-[24px] border border-navy/[0.07] bg-white shadow-[0_20px_50px_rgba(11,37,69,0.11)]">
              <div className="border-b border-navy/[0.06] bg-[linear-gradient(135deg,#f7fbff,#edf5ff)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Cleaning crew
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-semibold text-navy">
                      Build the team
                    </h2>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_7px_18px_rgba(30,111,217,0.25)]">
                    <UsersRound size={19} />
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-navy/50">
                  Assign one cleaner or select several for a larger job.
                </p>
              </div>

              <div className="p-5">
                {assignments.length > 0 && (
                  <div className="mb-5 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                      Assigned team · {assignments.length}
                    </p>
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment._id}
                          className="flex items-center gap-3 rounded-2xl border border-status-confirmed/10 bg-status-confirmed/[0.045] p-3"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-confirmed/10 text-sm font-bold text-status-confirmed">
                            {initials(assignment.cleanerId?.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-navy">
                              {assignment.cleanerId?.name ?? "Cleaner"}
                            </p>
                            <p className="truncate text-xs text-navy/45">
                              {assignment.cleanerId?.email ?? assignment.status}
                            </p>
                          </div>
                          <BadgeCheck size={18} className="text-status-confirmed" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isClosed && (
                  <>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                      Available cleaners
                    </p>
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {selectableCleaners.length === 0 ? (
                        <p className="rounded-2xl bg-surface-soft p-4 text-center text-sm text-navy/45">
                          No more active cleaners are available.
                        </p>
                      ) : (
                        selectableCleaners.map((cleaner) => {
                          const selected = selectedCleanerIds.includes(cleaner._id);
                          return (
                            <motion.button
                              key={cleaner._id}
                              type="button"
                              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                              onClick={() => toggleCleaner(cleaner._id)}
                              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                                selected
                                  ? "border-primary/25 bg-primary-light shadow-[0_6px_18px_rgba(30,111,217,0.08)]"
                                  : "border-navy/[0.07] hover:border-primary/15 hover:bg-surface-soft"
                              }`}
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-primary shadow-sm">
                                {initials(cleaner.name)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-navy">
                                  {cleaner.name}
                                </p>
                                <p className="truncate text-xs text-navy/40">
                                  {cleaner.email}
                                </p>
                              </div>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                  selected
                                    ? "border-primary bg-primary text-white"
                                    : "border-navy/15 bg-white"
                                }`}
                              >
                                {selected && <Check size={13} />}
                              </span>
                            </motion.button>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={selectedCleanerIds.length === 0 || assigning}
                      onClick={handleAssignCleaners}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,37,69,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {assigning ? (
                        <RotateCcw
                          size={16}
                          className="animate-spin motion-reduce:animate-none"
                        />
                      ) : (
                        <Plus size={16} />
                      )}
                      {assigning
                        ? "Adding team..."
                        : `Add ${
                            selectedCleanerIds.length || ""
                          } cleaner${selectedCleanerIds.length === 1 ? "" : "s"}`}
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-navy/[0.07] bg-white shadow-[0_20px_50px_rgba(11,37,69,0.11)]">
              <div className="border-b border-navy/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-cyan-200">
                    <ShieldCheck size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Admin control
                    </p>
                    <h2 className="font-heading text-lg font-semibold text-navy">
                      Schedule decision
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {isClosed ? (
                  <div className="rounded-2xl bg-surface-soft p-4 text-sm leading-6 text-navy/55">
                    This booking is closed as{" "}
                    <strong className="font-semibold text-navy">
                      {STATUS_LABELS[booking.status]?.toLowerCase()}
                    </strong>
                    . No further scheduling action is required.
                  </div>
                ) : (
                  <>
                    <textarea
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      placeholder="Optional internal note for the activity timeline..."
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-navy/10 bg-surface-soft/60 px-3.5 py-3 text-sm text-navy outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />

                    {booking.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={assignments.length === 0 || Boolean(updatingStatus)}
                          onClick={() => handleStatusChange("confirmed")}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(30,111,217,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(30,111,217,0.34)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                        >
                          {updatingStatus === "confirmed" ? (
                            <RotateCcw
                              size={16}
                              className="animate-spin motion-reduce:animate-none"
                            />
                          ) : (
                            <BadgeCheck size={17} />
                          )}
                          Approve & schedule
                          {!updatingStatus && <ArrowRight size={16} />}
                        </button>
                        {assignments.length === 0 && (
                          <p className="mt-2 text-center text-xs text-status-pending">
                            Assign at least one cleaner before approval.
                          </p>
                        )}
                      </>
                    )}

                    {booking.status === "confirmed" && (
                      <button
                        type="button"
                        disabled={Boolean(updatingStatus)}
                        onClick={() => handleStatusChange("in_progress")}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(30,111,217,0.25)] transition hover:-translate-y-0.5"
                      >
                        <Zap size={16} />
                        Mark cleaning started
                      </button>
                    )}

                    {booking.status === "in_progress" && (
                      <button
                        type="button"
                        disabled={Boolean(updatingStatus)}
                        onClick={() => handleStatusChange("completed")}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-status-confirmed px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(22,163,74,0.24)] transition hover:-translate-y-0.5"
                      >
                        <CheckCircle2 size={17} />
                        Complete now
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={Boolean(updatingStatus)}
                      onClick={() => handleStatusChange("cancelled")}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-status-cancelled/15 px-4 py-3 text-sm font-semibold text-status-cancelled transition hover:bg-status-cancelled/5 disabled:opacity-40"
                    >
                      <XCircle size={16} />
                      Cancel booking
                    </button>

                    <div className="mt-5 flex gap-3 rounded-2xl border border-cyan-200/30 bg-cyan-50/70 p-3.5 text-xs leading-5 text-navy/55">
                      <Clock3 size={17} className="mt-0.5 shrink-0 text-primary" />
                      <p>
                        After approval, CleanNest automatically closes this booking
                        after <strong className="text-navy">{booking.endTime}</strong>{" "}
                        on {formatDate(booking.bookingDate, false)}.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>
      </motion.div>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.09] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md ${className}`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
        <Icon size={13} className="text-cyan-300" /> {label}
      </p>
      <p className="mt-2 truncate font-heading text-sm font-semibold text-white">
        {value}
      </p>
    </motion.div>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof Home;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_18px_45px_rgba(11,37,69,0.08)] backdrop-blur-md sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
            {eyebrow}
          </p>
          <h2 className="font-heading text-lg font-semibold text-navy">{title}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function InfoPanel({
  icon: Icon,
  label,
  className = "",
  children,
}: {
  icon: typeof Home;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-navy/[0.06] bg-surface-soft/65 p-4 transition-colors hover:border-primary/10 hover:bg-primary/[0.035] ${className}`}
    >
      <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-navy/40">
        <Icon size={13} className="text-primary" /> {label}
      </p>
      {children}
    </div>
  );
}

function PriceLine({
  label,
  value = 0,
  discount = false,
}: {
  label: string;
  value?: number;
  discount?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-navy/55">{label}</span>
      <span
        className={`font-semibold ${
          discount ? "text-status-confirmed" : "text-navy"
        }`}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}
