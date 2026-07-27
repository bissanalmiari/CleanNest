"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  UserRound,
  X,
} from "lucide-react";

import type { ContactMessage } from "@/types/communication";
import type { ContactMessageStatus } from "@/types/enums";

const PAGE_SIZE = 12;

interface ContactMessageList {
  messages: ContactMessage[];
  total: number;
  page: number;
  totalPages: number;
  summary: Record<"all" | ContactMessageStatus, number>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const statusDetails: Record<
  ContactMessageStatus,
  { label: string; className: string; icon: typeof Inbox }
> = {
  new: {
    label: "New",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Inbox,
  },
  in_progress: {
    label: "In progress",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  resolved: {
    label: "Resolved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
};

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Something went wrong. Please try again.");
  }
  return payload.data;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  const detail = statusDetails[status];
  const Icon = detail.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${detail.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {detail.label}
    </span>
  );
}

function MessageModal({
  message,
  busy,
  onClose,
  onStatusChange,
}: {
  message: ContactMessage;
  busy: boolean;
  onClose: () => void;
  onStatusChange: (status: ContactMessageStatus) => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/50 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-message-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-navy/10 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <StatusBadge status={message.status} />
            <h2
              id="contact-message-title"
              className="mt-2 break-words font-heading text-xl font-black text-navy sm:text-2xl"
            >
              {message.subject}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-navy/50 transition hover:bg-navy/5 hover:text-navy"
            aria-label="Close message"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <ContactDetail icon={UserRound} label="From" value={message.name} />
            <ContactDetail
              icon={Mail}
              label="Email"
              value={message.email}
              href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
            />
            <ContactDetail
              icon={Phone}
              label="Phone"
              value={message.phone || "Not provided"}
              href={message.phone ? `tel:${message.phone}` : undefined}
            />
            <ContactDetail icon={Clock3} label="Received" value={formatDate(message.createdAt)} />
          </div>

          <div className="rounded-2xl border border-navy/[0.08] bg-surface-soft p-4 sm:p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
              Customer message
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium leading-7 text-navy/75">
              {message.message}
            </p>
          </div>

          <div>
            <label
              htmlFor="contact-message-status"
              className="text-xs font-extrabold uppercase tracking-[0.14em] text-navy/50"
            >
              Update status
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                id="contact-message-status"
                value={message.status}
                disabled={busy}
                onChange={(event) =>
                  void onStatusChange(event.target.value as ContactMessageStatus)
                }
                className="min-h-11 flex-1 rounded-xl border border-navy/10 bg-white px-3 text-sm font-semibold text-navy outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
              >
                <option value="new">New</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:brightness-105"
              >
                <Mail className="h-4 w-4" />
                Reply by email
              </a>
            </div>
            {busy && (
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-navy/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving status…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactDetail({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-navy/40">
          {label}
        </span>
        <span className="block break-words text-sm font-bold text-navy">{value}</span>
      </span>
    </>
  );

  const className =
    "flex min-w-0 items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white p-3";
  return href ? (
    <a href={href} className={`${className} transition hover:border-primary/25 hover:bg-primary/5`}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [summary, setSummary] = useState<ContactMessageList["summary"]>({
    all: 0,
    new: 0,
    in_progress: 0,
    resolved: 0,
  });
  const [status, setStatus] = useState<"all" | ContactMessageStatus>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status !== "all") params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const data = await readApi<ContactMessageList>(
        await fetch(`/api/admin/contact-messages?${params.toString()}`)
      );
      setMessages(data.messages);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function updateStatus(nextStatus: ContactMessageStatus) {
    if (!selected || selected.status === nextStatus) return;
    setBusy(true);
    setError(null);
    try {
      const data = await readApi<{ message: ContactMessage }>(
        await fetch(`/api/admin/contact-messages/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        })
      );
      setSelected(data.message);
      setMessages((current) =>
        current.map((message) => (message.id === data.message.id ? data.message : message))
      );
      await loadMessages();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update status.");
    } finally {
      setBusy(false);
    }
  }

  const filters: Array<{ value: "all" | ContactMessageStatus; label: string }> = [
    { value: "all", label: "All messages" },
    { value: "new", label: "New" },
    { value: "in_progress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
  ];

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(125deg,#071f3d,#0b4163)] p-6 text-white shadow-[0_28px_75px_rgba(11,37,69,0.2)] sm:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-cyan-300/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-navy">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">
                Customer support inbox
              </p>
              <h1 className="mt-2 font-heading text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Contact messages
              </h1>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-blue-100/70 sm:text-base">
                Review enquiries submitted from the homepage, reply to customers, and track every
                request through resolution.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {filters.map((filter) => (
                <div key={filter.value} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-2xl font-black">{summary[filter.value]}</p>
                  <p className="text-xs font-bold text-blue-100/65">{filter.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-navy/[0.06] bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, subject, or message…"
                className="min-h-11 w-full rounded-xl border border-navy/10 bg-surface-soft pl-10 pr-4 text-sm text-navy outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatus(filter.value);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    status === filter.value
                      ? "bg-primary text-white"
                      : "bg-surface-soft text-navy/60 hover:text-navy"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-[1.5rem] border border-navy/[0.06] bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-navy/15 bg-white p-6 text-center">
            <Inbox className="h-10 w-10 text-navy/25" />
            <h2 className="mt-4 font-heading text-xl font-black text-navy">No messages found</h2>
            <p className="mt-2 text-sm text-navy/50">
              New homepage contact requests will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {messages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setSelected(message)}
                className="group min-w-0 rounded-[1.4rem] border border-navy/[0.07] bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <StatusBadge status={message.status} />
                  <time className="text-right text-[11px] font-semibold text-navy/40">
                    {formatDate(message.createdAt)}
                  </time>
                </div>
                <h2 className="mt-4 line-clamp-2 break-words font-heading text-lg font-black text-navy">
                  {message.subject}
                </h2>
                <p className="mt-2 line-clamp-3 break-words text-sm font-medium leading-6 text-navy/55">
                  {message.message}
                </p>
                <div className="mt-5 border-t border-navy/[0.06] pt-4">
                  <p className="truncate text-sm font-bold text-navy">{message.name}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-primary">
                    {message.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <nav className="flex items-center justify-center gap-3" aria-label="Messages pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-navy/60">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/10 bg-white text-navy disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>

      {selected && (
        <MessageModal
          message={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
