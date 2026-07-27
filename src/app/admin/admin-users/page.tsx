"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AccountStatusBadge, RoleBadge } from "@/components/users/UserBadges";

type UserRole = "" | "customer" | "cleaner" | "admin";
type UserStatus = "" | "active" | "pending_verification" | "suspended";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Exclude<UserRole, "">;
  status: Exclude<UserStatus, "">;
  avatarUrl?: string;
  createdAt: string;
}

interface UserSummary {
  totalUsers: number;
  admins: number;
  customers: number;
  cleaners: number;
  active: number;
  suspended: number;
  pendingVerification: number;
  newThisMonth: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UserListData {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
  summary: UserSummary;
}

interface FiltersState {
  role: UserRole;
  status: UserStatus;
  search: string;
}

const EMPTY_FILTERS: FiltersState = { role: "", status: "", search: "" };
const EMPTY_SUMMARY: UserSummary = {
  totalUsers: 0,
  admins: 0,
  customers: 0,
  cleaners: 0,
  active: 0,
  suspended: 0,
  pendingVerification: 0,
  newThisMonth: 0,
};

const ROLE_OPTIONS: Array<{
  value: UserRole;
  label: string;
  icon: typeof Users;
}> = [
  { value: "", label: "All accounts", icon: Users },
  { value: "admin", label: "Administrators", icon: ShieldCheck },
  { value: "customer", label: "Customers", icon: UserRound },
  { value: "cleaner", label: "Cleaners", icon: Sparkles },
];

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: "", label: "Every account status" },
  { value: "active", label: "Active accounts" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "suspended", label: "Suspended accounts" },
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

function DirectorySkeleton() {
  return (
    <div className="space-y-2 p-3" aria-label="Loading account directory">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[minmax(240px,1.2fr)_minmax(220px,1fr)_130px_150px_120px] items-center gap-5 rounded-2xl px-4 py-4"
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
          <div className="h-6 w-24 rounded-full bg-slate-100" />
          <div className="h-4 w-20 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (currentFilters: FiltersState, currentPage: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "14",
        });
        if (currentFilters.role) params.set("role", currentFilters.role);
        if (currentFilters.status) params.set("status", currentFilters.status);
        if (currentFilters.search) params.set("search", currentFilters.search);

        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<UserListData> = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Account directory could not be loaded.");
        }

        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Account directory could not be loaded."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchUsers(filters, page);
  }, [fetchUsers, filters, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = searchInput.trim();
      setPage(1);
      setFilters((current) => (current.search === search ? current : { ...current, search }));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const summary = useMemo(() => data?.summary ?? EMPTY_SUMMARY, [data]);
  const roleCounts = useMemo(
    () => ({
      "": summary.totalUsers,
      admin: summary.admins,
      customer: summary.customers,
      cleaner: summary.cleaners,
    }),
    [summary]
  );
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasFilters = Boolean(filters.role || filters.status || filters.search);

  function updateFilters(patch: Partial<FiltersState>) {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setSearchInput("");
    setPage(1);
    setFilters(EMPTY_FILTERS);
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
      <div className="pointer-events-none absolute -right-40 top-24 h-[480px] w-[480px] rounded-full bg-violet-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-[1450px] space-y-6">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#4c3a9e_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8 lg:p-10"
        >
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-violet-200/20 bg-violet-300/10" />
          <div className="absolute -bottom-44 left-[28%] h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl" />

          <div className="relative grid items-end gap-9 xl:grid-cols-[minmax(0,1fr)_680px]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                <ShieldEllipsis className="h-3.5 w-3.5 text-violet-200" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-100">
                  Identity and access control
                </p>
              </div>
              <h1 className="mt-6 max-w-xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                Every account.
                <span className="block text-violet-200">One secure directory.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                Review platform identities, understand access state, and manage customers, cleaners,
                and administrators responsibly.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4 text-xs font-bold text-blue-100/65">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Role-protected controls
                </span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>Self-protection enforced</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AccessMetric
                icon={UsersRound}
                label="All identities"
                value={summary.totalUsers}
                note="Platform accounts"
                accent="cyan"
                loading={loading && !data}
              />
              <AccessMetric
                icon={ShieldCheck}
                label="Administrators"
                value={summary.admins}
                note="Privileged access"
                accent="violet"
                loading={loading && !data}
              />
              <AccessMetric
                icon={UserCheck}
                label="Active accounts"
                value={summary.active}
                note="Access permitted"
                accent="emerald"
                loading={loading && !data}
              />
              <AccessMetric
                icon={Sparkles}
                label="New this month"
                value={summary.newThisMonth}
                note={`${summary.pendingVerification} pending verification`}
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
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-600">
                  Platform directory
                </p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                  User and access management
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Select an identity to inspect its profile and security state.
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
                    className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-navy outline-none transition placeholder:text-slate-400 focus:border-violet-400/50 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void fetchUsers(filters, page, true)}
                  disabled={refreshing}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-xs font-extrabold text-navy transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-violet-600 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Filter accounts by role"
              className="mt-5 flex gap-2 overflow-x-auto pb-1"
            >
              {ROLE_OPTIONS.map((option) => {
                const active = filters.role === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => updateFilters({ role: option.value })}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-navy text-white shadow-[0_10px_24px_rgba(11,37,69,0.18)]"
                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        active ? "bg-white/15 text-violet-100" : "bg-white text-slate-400"
                      }`}
                    >
                      {roleCounts[option.value]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilters({
                    status: event.target.value as UserStatus,
                  })
                }
                className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-navy outline-none focus:border-violet-400/50 focus:ring-4 focus:ring-violet-100 sm:min-w-[240px]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
                  {summary.active} active
                </span>
                <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-700">
                  {summary.pendingVerification} pending
                </span>
                <span className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600">
                  {summary.suspended} suspended
                </span>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-extrabold text-slate-400 transition hover:text-violet-700 sm:ml-auto"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div aria-live="polite">
            {errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void fetchUsers(filters, page)} />
            ) : loading ? (
              <DirectorySkeleton />
            ) : !data || data.users.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[980px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-4 py-4">Contact</th>
                        <th className="px-4 py-4">Platform role</th>
                        <th className="px-4 py-4">Access status</th>
                        <th className="px-4 py-4">Created</th>
                        <th className="px-6 py-4 text-right">Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {data.users.map((user, index) => (
                          <UserTableRow
                            key={user._id}
                            user={user}
                            index={index}
                            reduceMotion={Boolean(reduceMotion)}
                            onOpen={() => router.push(`/admin/admin-users/${user._id}`)}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {data.users.map((user) => (
                    <UserMobileCard
                      key={user._id}
                      user={user}
                      onOpen={() => router.push(`/admin/admin-users/${user._id}`)}
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
                {data.total} matching identities
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-navy transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-extrabold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AccessMetric({
  icon: Icon,
  label,
  value,
  note,
  accent,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  note: string;
  accent: "cyan" | "violet" | "emerald" | "amber";
  loading: boolean;
}) {
  const accents = {
    cyan: "bg-cyan-300 text-navy",
    violet: "bg-violet-300 text-navy",
    emerald: "bg-emerald-300 text-navy",
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
      <p className="mt-1 text-[9px] font-bold text-blue-100/40">{note}</p>
    </div>
  );
}

function UserAvatar({ user }: { user: UserRow }) {
  const colors = {
    admin: "from-violet-100 to-blue-100 text-violet-700",
    customer: "from-blue-100 to-cyan-100 text-primary",
    cleaner: "from-emerald-100 to-cyan-100 text-emerald-700",
  };

  return (
    <span
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xs font-black ${colors[user.role]}`}
    >
      {initials(user.name) || "US"}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
          user.status === "active"
            ? "bg-emerald-400"
            : user.status === "suspended"
              ? "bg-red-400"
              : "bg-amber-400"
        }`}
      />
    </span>
  );
}

function UserTableRow({
  user,
  index,
  reduceMotion,
  onOpen,
}: {
  user: UserRow;
  index: number;
  reduceMotion: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.tr
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.025, 0.15) }}
      onClick={onOpen}
      className="group cursor-pointer border-b border-slate-100 last:border-0 hover:bg-violet-50/30"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold text-navy transition group-hover:text-violet-700">
              {user.name}
            </p>
            <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              ID {user._id.slice(-8)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Mail className="h-3.5 w-3.5 text-violet-600" />
          {user.email}
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400">
          <Phone className="h-3.5 w-3.5" />
          {user.phone || "No phone provided"}
        </p>
      </td>
      <td className="px-4 py-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-4">
        <AccountStatusBadge status={user.status} />
      </td>
      <td className="px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
          {formatDate(user.createdAt)}
        </p>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-violet-600">
          Inspect
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </td>
    </motion.tr>
  );
}

function UserMobileCard({ user, onOpen }: { user: UserRow; onOpen: () => void }) {
  return (
    <article
      onClick={onOpen}
      className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(11,37,69,0.06)]"
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold text-navy">{user.name}</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{user.email}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-violet-500" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge role={user.role} />
        <AccountStatusBadge status={user.status} />
      </div>
      <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-violet-600" />
          {user.phone || "No phone provided"}
        </span>
        <span className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
          Joined {formatDate(user.createdAt)}
        </span>
      </div>
    </article>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-heading text-lg font-bold text-navy">
        Identity directory unavailable
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-5 text-xs font-extrabold text-white transition hover:bg-violet-700"
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
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-[0_14px_35px_rgba(11,37,69,0.08)]">
        <UserCog className="h-7 w-7" />
      </span>
      <h3 className="mt-5 font-heading text-xl font-black text-navy">
        {hasFilters ? "No matching identities" : "No platform users yet"}
      </h3>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        {hasFilters
          ? "Try another role, account status, name, email, or phone number."
          : "Registered platform identities will appear in this directory."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-navy px-5 py-3 text-xs font-extrabold text-white transition hover:bg-violet-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
