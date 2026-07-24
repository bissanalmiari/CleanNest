// src/app/admin/cleaners/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserCog,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { AccountStatusBadge } from "@/components/users/UserBadges";
import CleanerFormModal, {
  type CleanerFormValues,
  type CleanerRow,
} from "@/components/cleaners/CleanerFormModal";

interface CleanerListRow extends CleanerRow {
  status: string;
  avatarUrl?: string;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CleanerListData {
  users: CleanerListRow[];
  total: number;
  page: number;
  limit: number;
}

interface FiltersState {
  status: string;
  search: string;
}

const EMPTY_FILTERS: FiltersState = { status: "", search: "" };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const ROW_ACCENT: Record<string, string> = {
  active: "border-l-status-confirmed",
  suspended: "border-l-status-cancelled",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminCleanersPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CleanerListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState<CleanerRow | null>(null);

  const fetchCleaners = useCallback(
    async (currentFilters: FiltersState, currentPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(currentPage) });
        if (currentFilters.status) params.set("status", currentFilters.status);
        if (currentFilters.search) params.set("search", currentFilters.search);

        const res = await fetch(`/api/admin/cleaners?${params.toString()}`);
        const json: ApiEnvelope<CleanerListData> = await res.json();

        if (!json.success) {
          throw new Error(json.error ?? "Failed to load cleaners");
        }
        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load cleaners"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCleaners(filters, page);
  }, [filters, page, fetchCleaners]);

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

  const refresh = () => fetchCleaners(filters, page);

  const openAddModal = () => {
    setEditingCleaner(null);
    setModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, cleaner: CleanerListRow) => {
    e.stopPropagation();
    setEditingCleaner(cleaner);
    setModalOpen(true);
  };

  const handleFormSubmit = async (values: CleanerFormValues) => {
    const isEdit = editingCleaner !== null;
    const url = isEdit
      ? `/api/admin/cleaners/${editingCleaner!._id}`
      : "/api/admin/cleaners";
    const method = isEdit ? "PATCH" : "POST";

    const body = isEdit
      ? { name: values.name, email: values.email, phone: values.phone || null }
      : {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          password: values.password,
        };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: ApiEnvelope<unknown> = await res.json();

    if (!json.success) {
      throw new Error(json.error ?? "Something went wrong");
    }

    setModalOpen(false);
    setEditingCleaner(null);
    refresh();
  };

  const handleToggleBlock = async (e: React.MouseEvent, cleaner: CleanerListRow) => {
    e.stopPropagation();
    const action = cleaner.status === "suspended" ? "unblock" : "block";
    const confirmMsg =
      action === "block"
        ? `Block ${cleaner.name}? They won't be able to sign in.`
        : `Unblock ${cleaner.name}?`;
    if (!window.confirm(confirmMsg)) return;

    const res = await fetch(`/api/admin/cleaners/${cleaner._id}/block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json: ApiEnvelope<unknown> = await res.json();

    if (!json.success) {
      alert(json.error ?? "Something went wrong");
      return;
    }
    refresh();
  };

  const handleDelete = async (e: React.MouseEvent, cleaner: CleanerListRow) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete ${cleaner.name} permanently? This cannot be undone.`
      )
    )
      return;

    const res = await fetch(`/api/admin/cleaners/${cleaner._id}`, {
      method: "DELETE",
    });
    const json: ApiEnvelope<unknown> = await res.json();

    if (!json.success) {
      alert(json.error ?? "Something went wrong");
      return;
    }
    refresh();
  };

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_6px_16px_rgba(30,111,217,0.35)]">
            <UserCog size={21} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy">
              Cleaners
            </h1>
            <p className="mt-0.5 text-sm text-navy/55">
              View, add, edit, and manage cleaner accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            <UserPlus size={16} /> Add Cleaner
          </button>

          {data && !loading && (
            <span className="flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface px-3.5 py-1.5 text-sm font-semibold text-navy shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {data.total} {data.total === 1 ? "cleaner" : "cleaners"}
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-card border border-navy/[0.06] bg-surface p-3.5 shadow-card">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35"
              strokeWidth={2.25}
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 py-2.5 pl-10 pr-3 text-sm text-navy placeholder:text-navy/35 transition-all focus:border-primary/40 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="h-8 w-px bg-navy/10" />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm font-medium text-navy transition-colors focus:border-primary/40 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy/[0.06] bg-surface-soft/50 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                  <th className="py-3.5 pl-6 pr-3">
                    <span className="flex items-center gap-1.5">
                      <UserCog size={13} /> Name
                    </span>
                  </th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} /> Email
                    </span>
                  </th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} /> Phone
                    </span>
                  </th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> Joined
                    </span>
                  </th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-navy/[0.05] last:border-0">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-4 w-full animate-pulse rounded-full bg-navy/[0.06]" />
                      </td>
                    </tr>
                  ))
                ) : !data || data.users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft">
                          <UserCog size={24} className="text-navy/25" strokeWidth={1.75} />
                        </span>
                        <span className="text-sm font-medium text-navy/40">
                          No cleaners match these filters
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.users.map((cleaner) => (
                    <tr
                      key={cleaner._id}
                      onClick={() => router.push(`/admin/cleaners/${cleaner._id}`)}
                      className={`group cursor-pointer border-b border-l-[3px] border-navy/[0.05] last:border-b-0 transition-colors hover:bg-surface-soft/60 ${
                        ROW_ACCENT[cleaner.status] ?? "border-l-transparent"
                      }`}
                    >
                      <td className="py-3.5 pl-6 pr-3">
                        <span className="flex items-center gap-3 font-semibold text-navy">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-[11px] font-bold text-primary ring-2 ring-status-inProgress/30">
                            {initials(cleaner.name)}
                          </span>
                          <span className="transition-colors group-hover:text-primary">
                            {cleaner.name}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-navy/60">{cleaner.email}</td>
                      <td className="px-3 py-3.5 text-navy/50">
                        {cleaner.phone ?? "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <AccountStatusBadge status={cleaner.status} />
                      </td>
                      <td className="px-3 py-3.5 text-navy/45">
                        {new Date(cleaner.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 pl-3 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit"
                            onClick={(e) => openEditModal(e, cleaner)}
                            className="rounded-lg p-1.5 text-navy/40 transition-colors hover:bg-primary-light hover:text-primary"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            title={cleaner.status === "suspended" ? "Unblock" : "Block"}
                            onClick={(e) => handleToggleBlock(e, cleaner)}
                            className="rounded-lg p-1.5 text-navy/40 transition-colors hover:bg-status-pending/10 hover:text-status-pending"
                          >
                            {cleaner.status === "suspended" ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <Ban size={15} />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={(e) => handleDelete(e, cleaner)}
                            className="rounded-lg p-1.5 text-navy/40 transition-colors hover:bg-status-cancelled/10 hover:text-status-cancelled"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-navy/[0.06] bg-surface-soft/40 px-6 py-3.5 text-sm">
              <span className="text-navy/50">
                Page <span className="font-semibold text-navy">{data.page}</span>{" "}
                of {totalPages} · {data.total} cleaners
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 rounded-full border border-navy/10 bg-surface px-3 py-1.5 font-medium text-navy transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-30 disabled:hover:border-navy/10 disabled:hover:text-navy"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-full border border-navy/10 bg-surface px-3 py-1.5 font-medium text-navy transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-30 disabled:hover:border-navy/10 disabled:hover:text-navy"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CleanerFormModal
        open={modalOpen}
        cleaner={editingCleaner}
        onClose={() => {
          setModalOpen(false);
          setEditingCleaner(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
