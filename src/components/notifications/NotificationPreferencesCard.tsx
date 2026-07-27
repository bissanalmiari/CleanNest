"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  MailCheck,
  Save,
  UserRoundCheck,
} from "lucide-react";

import type { NotificationPreferences } from "@/types/notification";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const rows = [
  {
    key: "bookingUpdates",
    label: "Booking updates",
    description: "Approvals, cancellations, check-ins and status changes.",
    icon: CalendarClock,
  },
  {
    key: "assignmentUpdates",
    label: "Assignment updates",
    description: "New cleaner work and assignment responses.",
    icon: UserRoundCheck,
  },
  {
    key: "reminders",
    label: "Appointment reminders",
    description: "A reminder before a scheduled cleaning.",
    icon: BellRing,
  },
  {
    key: "serviceReports",
    label: "Completion reports",
    description: "Finished-service reports and review requests.",
    icon: ClipboardCheck,
  },
] as const;

export default function NotificationPreferencesCard() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/notifications/preferences", {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiEnvelope<NotificationPreferences>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Could not load preferences");
        }
        if (active) setPreferences(payload.data);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load preferences",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!preferences) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const payload = (await response.json()) as ApiEnvelope<NotificationPreferences>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Preferences could not be saved");
      }
      setPreferences(payload.data);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Preferences could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !preferences) {
    return (
      <div className="flex min-h-56 items-center justify-center gap-3 rounded-[2rem] border border-white bg-white/90 text-sm font-bold text-slate-500 shadow-sm">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        Loading notification preferences…
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-[0_25px_75px_rgba(11,37,69,0.1)] backdrop-blur-md">
      <div className="flex flex-col gap-5 bg-gradient-to-r from-[#082744] to-[#0d5b70] p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
          <MailCheck className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
            Communication preferences
          </p>
          <h2 className="mt-1 font-heading text-2xl font-black">
            Choose your email alerts
          </h2>
          <p className="mt-2 text-sm text-blue-100/70">
            In-app safety and account notifications remain available in your
            notification bell.
          </p>
        </div>
        <Toggle
          checked={preferences.emailEnabled}
          label="All optional email alerts"
          onChange={(checked) => {
            setSaved(false);
            setPreferences((current) =>
              current ? { ...current, emailEnabled: checked } : current,
            );
          }}
          dark
        />
      </div>

      <div className="p-5 sm:p-8">
        {error && (
          <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}
        <div className="grid gap-3">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.key}
                className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center ${
                  preferences.emailEnabled
                    ? "border-slate-200 bg-slate-50/70"
                    : "border-slate-100 bg-slate-50 opacity-55"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-navy">{row.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {row.description}
                  </p>
                </div>
                <Toggle
                  checked={preferences[row.key]}
                  disabled={!preferences.emailEnabled}
                  label={row.label}
                  onChange={(checked) => {
                    setSaved(false);
                    setPreferences((current) =>
                      current ? { ...current, [row.key]: checked } : current,
                    );
                  }}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-55"
        >
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : saved ? "Preferences saved" : "Save preferences"}
        </button>
      </div>
    </section>
  );
}

function Toggle({
  checked,
  label,
  onChange,
  disabled = false,
  dark = false,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed ${
        checked ? "bg-emerald-500" : dark ? "bg-white/20" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}
