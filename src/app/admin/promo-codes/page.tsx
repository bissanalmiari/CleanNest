// src/app/(admin)/admin-promo-codes/page.tsx
"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Ticket,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  BarChart3,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PromoCodeFormModal, {
  type PromoCodeFormData,
} from "@/components/promo-codes/PromoCodeFormModal";

interface PromoCodeRow {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  description?: string;
  startDate?: string;
  expiryDate: string;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number | null;
  maximumUses: number;
  perCustomerLimit?: number;
  applicableServiceIds?: Array<string | { _id?: string; name?: string }>;
  usedCount: number;
  usesRemaining: number;
  isExpired: boolean;
  isScheduled?: boolean;
  isActive: boolean;
}

interface UsageRow {
  _id: string;
  discountAmount: number;
  usedAt: string;
  customerId?: { name?: string; email?: string } | string | null;
  bookingId?: { bookingNumber?: string } | string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function formatDiscount(code: PromoCodeRow): string {
  return code.discountType === "percentage"
    ? `${code.discountValue}% off`
    : `$${code.discountValue} off`;
}

function customerLabel(customer: UsageRow["customerId"]): string {
  if (!customer || typeof customer === "string") return "—";
  return customer.name ?? customer.email ?? "—";
}

function bookingLabel(booking: UsageRow["bookingId"]): string {
  if (!booking || typeof booking === "string") return "—";
  return booking.bookingNumber ?? "—";
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCode, setEditingCode] = useState<PromoCodeFormData | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageByCode, setUsageByCode] = useState<Record<string, UsageRow[]>>({});
  const [usageLoading, setUsageLoading] = useState(false);
  const lastListRequestKey = useRef("");

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") {
        params.set("isActive", String(statusFilter === "active"));
      }

      const res = await fetch(`/api/admin/promo-codes?${params.toString()}`);
      const json: ApiEnvelope<{ promoCodes: PromoCodeRow[]; total: number }> = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to load promo codes");
      }
      setCodes(json.data?.promoCodes ?? []);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const key = `${search}:${statusFilter}`;
    if (lastListRequestKey.current === key) return;
    lastListRequestKey.current = key;
    void fetchCodes();
  }, [fetchCodes, search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const campaignStats = useMemo(() => {
    const now = Date.now();
    return {
      active: codes.filter((code) => code.isActive && !code.isExpired && !code.isScheduled).length,
      scheduled: codes.filter(
        (code) =>
          code.isActive &&
          (code.isScheduled || (code.startDate ? new Date(code.startDate).getTime() > now : false))
      ).length,
      redemptions: codes.reduce((total, code) => total + code.usedCount, 0),
    };
  }, [codes]);

  const toggleExpand = async (code: PromoCodeRow) => {
    if (expandedId === code._id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(code._id);

    if (!usageByCode[code._id]) {
      setUsageLoading(true);
      try {
        const res = await fetch(`/api/admin/promo-codes/${code._id}`);
        const json: ApiEnvelope<{ recentUsage: UsageRow[] }> = await res.json();
        if (json.success) {
          setUsageByCode((prev) => ({
            ...prev,
            [code._id]: json.data?.recentUsage ?? [],
          }));
        }
      } finally {
        setUsageLoading(false);
      }
    }
  };

  const handleDelete = async (code: PromoCodeRow) => {
    const confirmed = window.confirm(
      code.usedCount > 0
        ? `Archive "${code.code}"? It will stop accepting new redemptions while its history remains available.`
        : `Delete "${code.code}"? This unused campaign will be removed permanently.`
    );
    if (!confirmed) return;

    setDeletingId(code._id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${code._id}`, {
        method: "DELETE",
      });
      const json: ApiEnvelope<unknown> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to delete promo code");
      }
      await fetchCodes();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete promo code");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1450px] space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_58%,#1675cf_100%)] p-6 text-white shadow-[0_28px_75px_rgba(11,37,69,0.22)] sm:p-8">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-cyan-200/20 bg-cyan-300/10" />
          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles size={13} />
                Revenue campaign studio
              </div>
              <h1 className="mt-5 font-heading text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Offers that feel intentional.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-blue-100/65">
                Launch targeted discounts, protect margins with smart limits, and follow every
                redemption from one operational workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setEditingCode(undefined);
              }}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 text-sm font-black text-navy shadow-xl transition hover:bg-white"
            >
              <Plus size={17} />
              Create campaign
            </button>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <Metric icon={ShieldCheck} label="Live campaigns" value={campaignStats.active} />
            <Metric icon={Clock3} label="Scheduled" value={campaignStats.scheduled} />
            <Metric icon={BarChart3} label="Total redemptions" value={campaignStats.redemptions} />
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {errorMessage}
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-navy/[0.06] bg-white p-3.5 shadow-card sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35"
              strokeWidth={2.25}
            />
            <input
              type="text"
              placeholder="Search by code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 py-2.5 pl-10 pr-3 font-mono text-sm tracking-wide text-navy transition-all placeholder:font-sans placeholder:text-navy/35 focus:border-primary/40 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="min-h-11 rounded-xl border border-navy/10 bg-surface-soft/60 px-4 text-sm font-bold text-navy outline-none focus:border-primary/40"
          >
            <option value="all">All campaigns</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy/[0.06] bg-surface-soft/50 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                  <th className="py-3.5 pl-6 pr-3">Code</th>
                  <th className="px-3 py-3.5">Discount</th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> Expires
                    </span>
                  </th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} /> Uses
                    </span>
                  </th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-navy/[0.05] last:border-0">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-4 w-full animate-pulse rounded-full bg-navy/[0.06]" />
                      </td>
                    </tr>
                  ))
                ) : codes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft">
                          <Ticket size={24} className="text-navy/25" strokeWidth={1.75} />
                        </span>
                        <span className="text-sm font-medium text-navy/40">
                          No promo codes yet — create your first one
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => {
                    const isExpanded = expandedId === code._id;
                    const statusLabel = code.isExpired
                      ? "Expired"
                      : code.isScheduled
                        ? "Scheduled"
                        : code.isActive
                          ? "Active"
                          : "Inactive";
                    const statusStyle = code.isExpired
                      ? "bg-navy/5 text-navy/50 ring-navy/10"
                      : code.isScheduled
                        ? "bg-blue-50 text-blue-600 ring-blue-100"
                        : code.isActive
                          ? "bg-status-confirmed/10 text-status-confirmed ring-status-confirmed/15"
                          : "bg-status-pending/10 text-status-pending ring-status-pending/15";

                    return (
                      <Fragment key={code._id}>
                        <tr
                          onClick={() => toggleExpand(code)}
                          className="cursor-pointer border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-surface-soft/60"
                        >
                          <td className="py-3.5 pl-6 pr-3">
                            <span className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wide text-navy">
                              <ChevronDown
                                size={14}
                                className={`text-navy/30 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                              {code.code}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="flex items-center gap-1.5 text-navy/70">
                              {code.discountType === "percentage" ? (
                                <Percent size={13} className="text-primary" />
                              ) : (
                                <DollarSign size={13} className="text-primary" />
                              )}
                              {formatDiscount(code)}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-navy/60">
                            {new Date(code.expiryDate).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-3 py-3.5 text-navy/60">
                            <span className="font-medium text-navy">{code.usedCount}</span> /{" "}
                            {code.maximumUses}
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 pl-3 pr-6">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalMode("edit");
                                  setEditingCode(code);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-primary-light hover:text-primary"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === code._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(code);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-status-cancelled/10 hover:text-status-cancelled disabled:opacity-40"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-navy/[0.05] bg-surface-soft/40 last:border-0">
                            <td colSpan={6} className="px-6 py-4">
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/40">
                                Recent Usage
                              </h4>
                              {usageLoading && !usageByCode[code._id] ? (
                                <div className="h-4 w-40 animate-pulse rounded-full bg-navy/[0.06]" />
                              ) : (usageByCode[code._id]?.length ?? 0) === 0 ? (
                                <p className="text-sm text-navy/40">No usage yet</p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {(usageByCode[code._id] ?? []).map((usage) => (
                                    <li
                                      key={usage._id}
                                      className="flex items-center justify-between text-sm text-navy/70"
                                    >
                                      <span>
                                        {customerLabel(usage.customerId)} · Booking{" "}
                                        {bookingLabel(usage.bookingId)}
                                      </span>
                                      <span className="flex items-center gap-3">
                                        <span className="font-medium text-navy">
                                          -${usage.discountAmount.toLocaleString()}
                                        </span>
                                        <span className="text-navy/40">
                                          {new Date(usage.usedAt).toLocaleDateString()}
                                        </span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalMode && (
        <PromoCodeFormModal
          mode={modalMode}
          initialData={editingCode}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            setModalMode(null);
            fetchCodes();
          }}
        />
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/55">
          {label}
        </p>
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>
      <p className="mt-3 font-heading text-2xl font-black text-white">{value.toLocaleString()}</p>
    </div>
  );
}
