"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AccountStatusBadge } from "@/components/users/UserBadges";
import CustomerFormModal, {
  type CustomerFormValues,
  type CustomerRow,
} from "@/components/customers/CustomerFormModal";

interface CustomerListRow extends CustomerRow {
  status: string;
  avatarUrl?: string;
  createdAt: string;
}

interface CustomerSummary {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  newThisMonth: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CustomerListData {
  users: CustomerListRow[];
  total: number;
  page: number;
  limit: number;
  summary: CustomerSummary;
}

type StatusFilter = "" | "active" | "suspended";

interface FiltersState {
  status: StatusFilter;
  search: string;
}

const EMPTY_FILTERS: FiltersState = { status: "", search: "" };
const EMPTY_SUMMARY: CustomerSummary = {
  totalCustomers: 0,
  activeCustomers: 0,
  suspendedCustomers: 0,
  newThisMonth: 0,
};

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "All customers" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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

function CustomerTableSkeleton() {
  return (
    <div className="space-y-2 p-3" aria-label="Loading customers">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[minmax(240px,1.25fr)_minmax(220px,1fr)_150px_130px] items-center gap-5 rounded-2xl px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded-full bg-slate-100" />
              <div className="h-2.5 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="h-3 w-40 rounded-full bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
          <div className="h-8 w-24 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomerListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);

  const fetchCustomers = useCallback(
    async (currentFilters: FiltersState, currentPage: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "12",
        });
        if (currentFilters.status) {
          params.set("status", currentFilters.status);
        }
        if (currentFilters.search) {
          params.set("search", currentFilters.search);
        }

        const response = await fetch(`/api/admin/customers?${params.toString()}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<CustomerListData> = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load customers.");
        }

        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load customers.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchCustomers(filters, page);
  }, [fetchCustomers, filters, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim();
      setPage(1);
      setFilters((current) =>
        current.search === normalizedSearch ? current : { ...current, search: normalizedSearch }
      );
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const summary = useMemo(() => data?.summary ?? EMPTY_SUMMARY, [data]);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasFilters = Boolean(filters.status || filters.search);

  const statusCounts = useMemo(
    () => ({
      "": summary.totalCustomers,
      active: summary.activeCustomers,
      suspended: summary.suspendedCustomers,
    }),
    [summary]
  );

  function handleFilterChange(status: StatusFilter) {
    setPage(1);
    setFilters((current) => ({ ...current, status }));
  }

  function clearFilters() {
    setSearchInput("");
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  function openAddModal() {
    setEditingCustomer(null);
    setModalOpen(true);
  }

  function openEditModal(event: MouseEvent<HTMLButtonElement>, customer: CustomerListRow) {
    event.stopPropagation();
    setEditingCustomer(customer);
    setModalOpen(true);
  }

  async function handleFormSubmit(values: CustomerFormValues) {
    const isEdit = editingCustomer !== null;
    const url = isEdit ? `/api/admin/customers/${editingCustomer._id}` : "/api/admin/customers";
    const method = isEdit ? "PATCH" : "POST";
    const body = isEdit
      ? { name: values.name, email: values.email, phone: values.phone || null }
      : {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          password: values.password,
        };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: ApiEnvelope<unknown> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.error ?? "Customer could not be saved.");
    }

    setModalOpen(false);
    setEditingCustomer(null);
    await fetchCustomers(filters, page, true);
  }

  async function handleToggleBlock(
    event: MouseEvent<HTMLButtonElement>,
    customer: CustomerListRow
  ) {
    event.stopPropagation();
    const action = customer.status === "suspended" ? "unblock" : "block";
    const confirmed = window.confirm(
      action === "block"
        ? `Suspend ${customer.name}? They will not be able to sign in.`
        : `Restore access for ${customer.name}?`
    );
    if (!confirmed) return;

    setActionId(customer._id);
    try {
      const response = await fetch(`/api/admin/customers/${customer._id}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json: ApiEnvelope<unknown> = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Account status could not be changed.");
      }

      await fetchCustomers(filters, page, true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(event: MouseEvent<HTMLButtonElement>, customer: CustomerListRow) {
    event.stopPropagation();
    if (!window.confirm(`Permanently delete ${customer.name}? This action cannot be undone.`)) {
      return;
    }

    setActionId(customer._id);
    try {
      const response = await fetch(`/api/admin/customers/${customer._id}`, {
        method: "DELETE",
      });
      const json: ApiEnvelope<unknown> = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Customer could not be deleted.");
      }

      if (data?.users.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchCustomers(filters, page, true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setActionId(null);
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-24 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1450px] space-y-6">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8 lg:p-10"
        >
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-cyan-200/20 bg-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-44 left-[28%] h-96 w-96 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative grid items-end gap-9 xl:grid-cols-[minmax(0,1fr)_680px]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                  Customer relationship hub
                </p>
              </div>

              <h1 className="mt-6 max-w-xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                Know your customers.
                <span className="block text-cyan-300">Serve them better.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                Manage every customer account, monitor access, and keep their information organized
                from one dependable workspace.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="group mt-7 inline-flex min-h-[52px] items-center gap-3 rounded-2xl bg-white px-6 text-sm font-extrabold text-navy shadow-[0_16px_35px_rgba(0,0,0,0.18)] transition hover:bg-cyan-50"
              >
                <UserPlus className="h-4 w-4 text-primary" />
                Add new customer
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={Users}
                label="All customers"
                value={summary.totalCustomers}
                accent="cyan"
                loading={loading && !data}
              />
              <MetricCard
                icon={UserCheck}
                label="Active accounts"
                value={summary.activeCustomers}
                accent="emerald"
                loading={loading && !data}
              />
              <MetricCard
                icon={Sparkles}
                label="New this month"
                value={summary.newThisMonth}
                accent="blue"
                loading={loading && !data}
              />
              <MetricCard
                icon={UserX}
                label="Suspended"
                value={summary.suspendedCustomers}
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
                  Customer directory
                </p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                  Account management
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Select a customer to view their full account profile.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-[340px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search name, email, or phone..."
                    className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-navy outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void fetchCustomers(filters, page, true)}
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
              aria-label="Filter customer accounts"
              className="mt-5 flex gap-2 overflow-x-auto pb-1"
            >
              {STATUS_OPTIONS.map((option) => {
                const active = filters.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleFilterChange(option.value)}
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
                      {statusCounts[option.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div aria-live="polite">
            {errorMessage ? (
              <ErrorState
                message={errorMessage}
                onRetry={() => void fetchCustomers(filters, page)}
              />
            ) : loading ? (
              <CustomerTableSkeleton />
            ) : !data || data.users.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[920px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-4 py-4">Contact</th>
                        <th className="px-4 py-4">Account status</th>
                        <th className="px-4 py-4">Joined CleanNest</th>
                        <th className="px-6 py-4 text-right">Quick actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {data.users.map((customer, index) => (
                          <CustomerTableRow
                            key={customer._id}
                            customer={customer}
                            index={index}
                            reduceMotion={Boolean(reduceMotion)}
                            busy={actionId === customer._id}
                            onOpen={() => router.push(`/admin/customers/${customer._id}`)}
                            onEdit={(event) => openEditModal(event, customer)}
                            onToggle={(event) => void handleToggleBlock(event, customer)}
                            onDelete={(event) => void handleDelete(event, customer)}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {data.users.map((customer) => (
                    <CustomerMobileCard
                      key={customer._id}
                      customer={customer}
                      busy={actionId === customer._id}
                      onOpen={() => router.push(`/admin/customers/${customer._id}`)}
                      onEdit={(event) => openEditModal(event, customer)}
                      onToggle={(event) => void handleToggleBlock(event, customer)}
                      onDelete={(event) => void handleDelete(event, customer)}
                    />
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
                {data.total} matching accounts
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

      <CustomerFormModal
        open={modalOpen}
        customer={editingCustomer}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </main>
  );
}

interface MetricCardProps {
  icon: typeof Users;
  label: string;
  value: number;
  accent: "cyan" | "emerald" | "blue" | "amber";
  loading: boolean;
}

function MetricCard({ icon: Icon, label, value, accent, loading }: MetricCardProps) {
  const accents = {
    cyan: "bg-cyan-300 text-navy",
    emerald: "bg-emerald-300 text-navy",
    blue: "bg-blue-300 text-navy",
    amber: "bg-amber-300 text-navy",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent]}`}>
        <Icon className="h-4 w-4" />
      </span>
      {loading ? (
        <div className="mt-4 h-7 w-14 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="mt-4 font-heading text-2xl font-black tracking-[-0.04em] text-white">
          {value.toLocaleString()}
        </p>
      )}
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.13em] text-blue-100/55">
        {label}
      </p>
    </div>
  );
}

interface CustomerActions {
  customer: CustomerListRow;
  busy: boolean;
  onOpen: () => void;
  onEdit: (event: MouseEvent<HTMLButtonElement>) => void;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  onDelete: (event: MouseEvent<HTMLButtonElement>) => void;
}

function CustomerTableRow({
  customer,
  index,
  reduceMotion,
  busy,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
}: CustomerActions & { index: number; reduceMotion: boolean }) {
  return (
    <motion.tr
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.025, 0.15) }}
      onClick={onOpen}
      className="group cursor-pointer border-b border-slate-100 last:border-0 hover:bg-primary/[0.025]"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <CustomerAvatar customer={customer} />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold text-navy transition group-hover:text-primary">
              {customer.name}
            </p>
            <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              ID {customer._id.slice(-8)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Mail className="h-3.5 w-3.5 text-primary" />
          {customer.email}
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400">
          <Phone className="h-3.5 w-3.5" />
          {customer.phone || "No phone provided"}
        </p>
      </td>
      <td className="px-4 py-4">
        <AccountStatusBadge status={customer.status} />
      </td>
      <td className="px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          {formatDate(customer.createdAt)}
        </p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <ActionButton label="Edit customer" icon={Pencil} onClick={onEdit} disabled={busy} />
          <ActionButton
            label={customer.status === "suspended" ? "Restore customer" : "Suspend customer"}
            icon={customer.status === "suspended" ? CheckCircle2 : Ban}
            tone="warning"
            onClick={onToggle}
            disabled={busy}
          />
          <ActionButton
            label="Delete customer"
            icon={Trash2}
            tone="danger"
            onClick={onDelete}
            disabled={busy}
          />
          <ChevronRight className="ml-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </td>
    </motion.tr>
  );
}

function CustomerMobileCard({
  customer,
  busy,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
}: CustomerActions) {
  return (
    <article
      onClick={onOpen}
      className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(11,37,69,0.06)]"
    >
      <div className="flex items-start gap-3">
        <CustomerAvatar customer={customer} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold text-navy">{customer.name}</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{customer.email}</p>
        </div>
        <AccountStatusBadge status={customer.status} />
      </div>
      <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-primary" />
          {customer.phone || "No phone provided"}
        </span>
        <span className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          Joined {formatDate(customer.createdAt)}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">
          View profile
        </span>
        <div className="flex gap-1.5">
          <ActionButton label="Edit customer" icon={Pencil} onClick={onEdit} disabled={busy} />
          <ActionButton
            label={customer.status === "suspended" ? "Restore customer" : "Suspend customer"}
            icon={customer.status === "suspended" ? CheckCircle2 : Ban}
            tone="warning"
            onClick={onToggle}
            disabled={busy}
          />
          <ActionButton
            label="Delete customer"
            icon={Trash2}
            tone="danger"
            onClick={onDelete}
            disabled={busy}
          />
        </div>
      </div>
    </article>
  );
}

function CustomerAvatar({ customer }: { customer: CustomerListRow }) {
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#e6f0fd,#d6f7fb)] text-xs font-black text-primary shadow-[inset_0_0_0_1px_rgba(30,111,217,0.08)]">
      {initials(customer.name) || "CU"}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
          customer.status === "active" ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
    </span>
  );
}

function ActionButton({
  label,
  icon: Icon,
  tone = "default",
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Pencil;
  tone?: "default" | "warning" | "danger";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled: boolean;
}) {
  const styles = {
    default: "hover:bg-primary-light hover:text-primary",
    warning: "hover:bg-amber-50 hover:text-amber-600",
    danger: "hover:bg-red-50 hover:text-red-600",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition disabled:cursor-wait disabled:opacity-40 ${styles[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-heading text-lg font-bold text-navy">
        Customer directory unavailable
      </h3>
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
        <Users className="h-7 w-7" />
      </span>
      <h3 className="mt-5 font-heading text-xl font-black text-navy">
        {hasFilters ? "No matching customers" : "No customers yet"}
      </h3>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        {hasFilters
          ? "Try a different name, email, phone number, or account status."
          : "Customer accounts will appear here as soon as they join CleanNest."}
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
