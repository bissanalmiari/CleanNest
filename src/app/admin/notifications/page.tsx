"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarCheck2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MailCheck,
  MessageSquareText,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Star,
} from "lucide-react";
import type { AppNotification, NotificationListResponse } from "@/types/notification";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const PAGE_SIZE = 15;

const iconByType = {
  booking_created: CalendarCheck2,
  booking_confirmed: CalendarCheck2,
  cleaner_assigned: CalendarCheck2,
  assignment_new: CalendarCheck2,
  assignment_accepted: CheckCheck,
  assignment_declined: CircleAlert,
  on_my_way: Sparkles,
  service_started: Sparkles,
  issue_reported: ShieldAlert,
  service_completed: CheckCheck,
  booking_reminder: Clock3,
  booking_cancelled: CircleAlert,
  booking_rescheduled: CalendarCheck2,
  payment_update: ReceiptText,
  review_created: Star,
  contact_message: MessageSquareText,
  system: Bell,
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminNotificationsPage() {
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=${PAGE_SIZE}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<NotificationListResponse>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load notifications");
      }
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(notification: AppNotification) {
    if (notification.readAt) return;
    setData((current) =>
      current
        ? {
            ...current,
            unreadCount: Math.max(0, current.unreadCount - 1),
            notifications: current.notifications.map((item) =>
              item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
            ),
          }
        : current
    );
    await fetch(`/api/notifications/${notification.id}/read`, {
      method: "PATCH",
    }).catch(() => undefined);
  }

  async function markAllRead() {
    setData((current) =>
      current
        ? {
            ...current,
            unreadCount: 0,
            notifications: current.notifications.map((item) => ({
              ...item,
              readAt: item.readAt ?? new Date().toISOString(),
            })),
          }
        : current
    );
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => undefined);
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[#f4f8fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] bg-navy p-6 text-white shadow-[0_28px_75px_rgba(11,37,69,0.2)] sm:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.2),transparent_30%),linear-gradient(120deg,transparent,rgba(30,111,217,0.25))]"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                <Bell className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.17em] text-cyan-300">
                  Admin activity
                </p>
                <h1 className="mt-2 font-heading text-3xl font-black sm:text-4xl">
                  Notification history
                </h1>
                <p className="mt-3 text-sm font-semibold text-blue-100/65">
                  Review operational updates across bookings, payments, cleaners, and customers.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-black transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {Boolean(data?.unreadCount) && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-primary"
                >
                  <MailCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6 text-sm font-bold text-blue-100/70">
            <span>{data?.total ?? 0} total notifications</span>
            <span aria-hidden="true">•</span>
            <span>{data?.unreadCount ?? 0} unread</span>
          </div>
        </header>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            <CircleAlert className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white shadow-[0_18px_55px_rgba(11,37,69,0.08)]">
          {loading && !data ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-bold text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              Loading notifications…
            </div>
          ) : data?.notifications.length ? (
            <div className={loading ? "opacity-60" : ""} aria-busy={loading}>
              {data.notifications.map((notification) => {
                const Icon = iconByType[notification.type as keyof typeof iconByType] ?? Bell;
                const content = (
                  <div
                    className={`flex gap-4 border-b border-slate-100 p-5 transition hover:bg-primary-light/35 sm:p-6 ${
                      notification.readAt ? "bg-white" : "bg-blue-50/60"
                    }`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-2">
                          <h2 className="font-heading text-base font-black text-navy">
                            {notification.title}
                          </h2>
                          {!notification.readAt && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <time className="shrink-0 text-xs font-bold text-slate-400">
                          {formatDate(notification.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                );
                return notification.href ? (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => void markRead(notification)}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void markRead(notification)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-20 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 font-heading text-xl font-black text-navy">
                No notifications yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                New operational updates will appear here.
              </p>
            </div>
          )}
        </section>

        {data && data.totalPages > 1 && (
          <nav
            aria-label="Notification pages"
            className="mt-6 flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-3 shadow-sm"
          >
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black text-navy transition hover:bg-primary-light disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-xs font-black text-slate-500">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages || loading}
              onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black text-navy transition hover:bg-primary-light disabled:opacity-35"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
