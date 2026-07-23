// src/app/(admin)/admin-services/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  Tag,
  Clock,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import ServiceFormModal, {
  type ServiceFormData,
} from "@/components/services/ServiceFormModal";

interface ServiceRow {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  baseDurationMinutes: number;
  isActive: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ServiceListData {
  services: ServiceRow[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingService, setEditingService] = useState<ServiceFormData | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);

      const res = await fetch(`/api/admin/services?${params.toString()}`);
      const json: ApiEnvelope<ServiceListData> = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to load services");
      }
      setServices(json.data?.services ?? []);
      setTotal(json.data?.total ?? 0);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load services"
      );
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Debounce the search box.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const categories = Array.from(new Set(services.map((s) => s.category)));

  const handleDelete = async (service: ServiceRow) => {
    const confirmed = window.confirm(
      `Delete "${service.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(service._id);
    try {
      const res = await fetch(`/api/admin/services/${service._id}`, {
        method: "DELETE",
      });
      const json: ApiEnvelope<unknown> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to delete service");
      }
      await fetchServices();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete service"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_6px_16px_rgba(30,111,217,0.35)]">
            <Sparkles size={21} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy">
              Manage Services
            </h1>
            <p className="mt-0.5 text-sm text-navy/55">
              Add, edit, or remove the cleaning services customers can book.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalMode("create");
              setEditingService(undefined);
            }}
            className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(30,111,217,0.25)] transition-all hover:brightness-105"
          >
            <Plus size={16} />
            Add Service
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {errorMessage}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-navy/[0.06] bg-surface p-3.5 shadow-card">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35"
              strokeWidth={2.25}
            />
            <input
              type="text"
              placeholder="Search services..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 py-2.5 pl-10 pr-3 text-sm text-navy placeholder:text-navy/35 transition-all focus:border-primary/40 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {categories.length > 1 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm font-medium text-navy focus:border-primary/40 focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {!loading && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface px-3.5 py-1.5 text-sm font-semibold text-navy">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {total} {total === 1 ? "service" : "services"}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy/[0.06] bg-surface-soft/50 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                  <th className="py-3.5 pl-6 pr-3">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} /> Name
                    </span>
                  </th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} /> Category
                    </span>
                  </th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={13} /> Price
                    </span>
                  </th>
                  <th className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> Duration
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
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft">
                          <Sparkles size={24} className="text-navy/25" strokeWidth={1.75} />
                        </span>
                        <span className="text-sm font-medium text-navy/40">
                          No services yet — add your first one
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr
                      key={service._id}
                      className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-surface-soft/60"
                    >
                      <td className="py-3.5 pl-6 pr-3 font-semibold text-navy">
                        {service.name}
                      </td>
                      <td className="px-3 py-3.5 text-navy/60">
                        {service.category}
                      </td>
                      <td className="px-3 py-3.5 font-medium text-navy">
                        ${service.basePrice.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 text-navy/60">
                        {service.baseDurationMinutes} min
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            service.isActive
                              ? "bg-status-confirmed/10 text-status-confirmed ring-status-confirmed/15"
                              : "bg-navy/5 text-navy/50 ring-navy/10"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              service.isActive ? "bg-status-confirmed" : "bg-navy/40"
                            }`}
                          />
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModalMode("edit");
                              setEditingService(service);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-primary-light hover:text-primary"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === service._id}
                            onClick={() => handleDelete(service)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-status-cancelled/10 hover:text-status-cancelled disabled:opacity-40"
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
        </div>
      </div>

      {modalMode && (
        <ServiceFormModal
          mode={modalMode}
          initialData={editingService}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            setModalMode(null);
            fetchServices();
          }}
        />
      )}
    </div>
  );
}
