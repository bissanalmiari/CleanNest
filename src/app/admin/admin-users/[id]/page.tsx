// src/app/(admin)/admin-users/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CalendarCheck,
  ShieldBan,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { RoleBadge, AccountStatusBadge } from "@/components/users/UserBadges";

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UserDetailData {
  user: UserDetail;
  bookingCount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json: ApiEnvelope<UserDetailData> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to load user");
      }
      setData(json.data ?? null);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load user"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleBlock = async () => {
    if (!data) return;
    const action = data.user.status === "suspended" ? "unblock" : "block";

    const confirmed = window.confirm(
      action === "block"
        ? `Block ${data.user.name}? They will no longer be able to sign in.`
        : `Unblock ${data.user.name}? They will regain access immediately.`
    );
    if (!confirmed) return;

    setBlockActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json: ApiEnvelope<unknown> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to update account status");
      }
      await fetchDetail();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update account status"
      );
    } finally {
      setBlockActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;

    const confirmed = window.confirm(
      `Permanently delete ${data.user.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const json: ApiEnvelope<unknown> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to delete user");
      }
      router.push("/admin-users");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete user"
      );
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-5 w-32 animate-pulse rounded-full bg-navy/[0.06]" />
          <div className="h-40 animate-pulse rounded-card bg-navy/[0.04]" />
          <div className="h-32 animate-pulse rounded-card bg-navy/[0.04]" />
        </div>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="min-h-screen bg-surface p-6 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, bookingCount } = data;
  const isSuspended = user.status === "suspended";

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/admin-users")}
          className="flex items-center gap-1.5 text-sm font-medium text-navy/50 transition-colors hover:text-primary"
        >
          <ArrowLeft size={15} />
          Back to users
        </button>

        {errorMessage && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {errorMessage}
          </div>
        )}

        <div className="overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-card">
          <div className="h-16 bg-gradient-to-r from-primary to-primary-dark" />
          <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
            <span className="-mt-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-primary-light text-2xl font-bold text-primary shadow-md">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1 pt-2">
              <h1 className="font-heading text-xl font-semibold tracking-tight text-navy">
                {user.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                <AccountStatusBadge status={user.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-navy/[0.06] bg-navy/[0.06] shadow-card sm:grid-cols-2">
          <div className="bg-surface p-5">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
              <Mail size={13} /> Email
            </h3>
            <p className="mt-1.5 font-medium text-navy">{user.email}</p>
          </div>
          <div className="bg-surface p-5">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
              <Phone size={13} /> Phone
            </h3>
            <p className="mt-1.5 font-medium text-navy">{user.phone ?? "—"}</p>
          </div>
          <div className="bg-surface p-5">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
              <Calendar size={13} /> Joined
            </h3>
            <p className="mt-1.5 font-medium text-navy">
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="bg-surface p-5">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy/40">
              <CalendarCheck size={13} /> Bookings
            </h3>
            <p className="mt-1.5 font-heading text-2xl font-bold text-navy">
              {bookingCount}
            </p>
          </div>
        </div>

        <div className="rounded-card border border-navy/[0.06] bg-surface p-6 shadow-card">
          <h3 className="font-heading text-base font-semibold text-navy">
            Account Actions
          </h3>
          <p className="mt-1 text-sm text-navy/50">
            Temporarily restrict this account&apos;s access.
          </p>

          <button
            type="button"
            disabled={blockActionLoading}
            onClick={handleToggleBlock}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 sm:w-auto ${
              isSuspended
                ? "bg-status-confirmed text-white shadow-[0_4px_12px_rgba(22,163,74,0.25)] hover:brightness-105"
                : "bg-status-pending text-white shadow-[0_4px_12px_rgba(217,119,6,0.25)] hover:brightness-105"
            }`}
          >
            {isSuspended ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
            {blockActionLoading
              ? "Updating..."
              : isSuspended
              ? "Unblock User"
              : "Block User"}
          </button>
        </div>

        <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/[0.03] p-6">
          <h3 className="flex items-center gap-1.5 font-heading text-base font-semibold text-status-cancelled">
            <AlertTriangle size={16} /> Danger Zone
          </h3>
          <p className="mt-1 text-sm text-navy/50">
            Deleting a user is permanent and cannot be undone.
          </p>

          <button
            type="button"
            disabled={deleteLoading}
            onClick={handleDelete}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-status-cancelled/30 bg-surface px-4 py-2.5 text-sm font-semibold text-status-cancelled transition-colors hover:bg-status-cancelled hover:text-white disabled:opacity-40 sm:w-auto"
          >
            <Trash2 size={16} />
            {deleteLoading ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
}