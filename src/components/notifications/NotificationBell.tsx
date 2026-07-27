"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarCheck2,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Navigation,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Star,
  MessageSquareText,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { AppNotification, NotificationListResponse } from "@/types/notification";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const iconByType = {
  assignment_new: CalendarCheck2,
  assignment_accepted: Check,
  assignment_declined: CircleAlert,
  on_my_way: Navigation,
  service_started: Sparkles,
  service_completed: CheckCheck,
  issue_reported: ShieldAlert,
  booking_reminder: Clock3,
  payment_update: ReceiptText,
  review_created: Star,
  contact_message: MessageSquareText,
} as const;

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function NotificationBell({ historyHref }: { historyHref?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationListResponse>({
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=20", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<NotificationListResponse>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load notifications");
      }
      setData(payload.data);
      setError(null);
    } catch (loadError) {
      if (!quiet) {
        setError(loadError instanceof Error ? loadError.message : "Could not load notifications");
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 60000);
    const onFocus = () => void load(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  async function markRead(notification: AppNotification) {
    if (notification.readAt) return;
    setData((current) => ({
      ...current,
      unreadCount: Math.max(0, current.unreadCount - 1),
      notifications: current.notifications.map((item) =>
        item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
      ),
    }));
    await fetch(`/api/notifications/${notification.id}/read`, {
      method: "PATCH",
    }).catch(() => undefined);
  }

  async function markAllRead() {
    setData((current) => ({
      ...current,
      unreadCount: 0,
      notifications: current.notifications.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    }));
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => undefined);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${data.unreadCount ? `, ${data.unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-white text-navy shadow-sm transition hover:border-primary/30 hover:bg-primary-light hover:text-primary"
      >
        <Bell className="h-5 w-5" />
        {data.unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white">
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="fixed inset-x-3 top-[82px] z-[120] overflow-hidden rounded-[24px] border border-primary/10 bg-white shadow-[0_28px_90px_rgba(11,37,69,0.22)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[390px]"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-primary-light to-cyan-50 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-base font-black text-navy">Notifications</p>
                <p className="text-xs font-semibold text-slate-500">
                  {data.unreadCount
                    ? `${data.unreadCount} unread update${data.unreadCount === 1 ? "" : "s"}`
                    : "You’re all caught up"}
                </p>
              </div>
              {data.unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="ml-auto text-xs font-black text-primary hover:text-primary-dark"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(520px,calc(100vh-160px))] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm font-bold text-slate-500">
                  <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  Loading updates…
                </div>
              ) : error ? (
                <div className="px-5 py-10 text-center">
                  <CircleAlert className="mx-auto h-7 w-7 text-rose-500" />
                  <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-3 text-xs font-black text-primary"
                  >
                    Try again
                  </button>
                </div>
              ) : data.notifications.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <Bell className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-500">No notifications yet</p>
                </div>
              ) : (
                data.notifications.map((notification) => {
                  const Icon = iconByType[notification.type as keyof typeof iconByType] ?? Bell;
                  const content = (
                    <div
                      className={`flex gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-primary-light/40 ${
                        notification.readAt ? "bg-white" : "bg-blue-50/60"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-black leading-5 text-navy">
                            {notification.title}
                          </p>
                          {!notification.readAt && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                          {notification.message}
                        </p>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return notification.href ? (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => {
                        void markRead(notification);
                        setOpen(false);
                      }}
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
                })
              )}
            </div>
            {historyHref && data.total > 0 && (
              <Link
                href={historyHref}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center border-t border-slate-100 bg-slate-50 text-xs font-black text-primary transition hover:bg-primary-light"
              >
                View all notifications
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
