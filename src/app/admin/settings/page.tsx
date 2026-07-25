"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Ban,
  BellRing,
  MessageCircle,
  ShieldAlert,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";

interface SettingsData {
  businessName: string;
  supportEmail: string;
  supportPhone?: string;
  businessAddress?: string;
  bookingLeadTimeHours: number;
  cancellationWindowHours: number;
  maintenanceMode: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  updatedAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-navy/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-navy">
        <Icon size={14} className="text-navy/40" />
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/35 transition-all focus:border-primary/40 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const json: ApiEnvelope<{ settings: SettingsData }> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load settings");
      setSettings(json.data?.settings ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patch(fields: Partial<SettingsData>) {
    setSettings((current) => (current ? { ...current, ...fields } : current));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: settings.businessName,
          supportEmail: settings.supportEmail,
          supportPhone: settings.supportPhone,
          businessAddress: settings.businessAddress,
          bookingLeadTimeHours: settings.bookingLeadTimeHours,
          cancellationWindowHours: settings.cancellationWindowHours,
          maintenanceMode: settings.maintenanceMode,
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          smsNotificationsEnabled: settings.smsNotificationsEnabled,
        }),
      });
      const json: ApiEnvelope<{ settings: SettingsData }> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to save settings");
      setSettings(json.data?.settings ?? settings);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-navy/30" size={26} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_6px_16px_rgba(30,111,217,0.35)]">
            <SettingsIcon size={21} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy">
              Settings
            </h1>
            <p className="mt-0.5 text-sm text-navy/55">
              Business info, booking rules, and notifications for the whole platform.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {error}
          </div>
        )}

        {/* Business info */}
        <section className="space-y-4 rounded-card border border-navy/[0.06] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="font-heading text-base font-bold text-navy">Business Information</h2>

          <Field label="Business name" icon={Building2}>
            <input
              className={inputClass}
              value={settings.businessName}
              onChange={(e) => patch({ businessName: e.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email" icon={Mail}>
              <input
                type="email"
                className={inputClass}
                value={settings.supportEmail}
                onChange={(e) => patch({ supportEmail: e.target.value })}
              />
            </Field>
            <Field label="Support phone" icon={Phone}>
              <input
                className={inputClass}
                value={settings.supportPhone ?? ""}
                onChange={(e) => patch({ supportPhone: e.target.value })}
                placeholder="+961 ..."
              />
            </Field>
          </div>

          <Field label="Business address" icon={MapPin}>
            <input
              className={inputClass}
              value={settings.businessAddress ?? ""}
              onChange={(e) => patch({ businessAddress: e.target.value })}
              placeholder="Street, city, country"
            />
          </Field>
        </section>

        {/* Booking rules */}
        <section className="space-y-4 rounded-card border border-navy/[0.06] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="font-heading text-base font-bold text-navy">Booking Rules</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum booking notice (hours)" icon={Clock}>
              <input
                type="number"
                min={0}
                max={168}
                className={inputClass}
                value={settings.bookingLeadTimeHours}
                onChange={(e) =>
                  patch({ bookingLeadTimeHours: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Free cancellation window (hours)" icon={Ban}>
              <input
                type="number"
                min={0}
                max={168}
                className={inputClass}
                value={settings.cancellationWindowHours}
                onChange={(e) =>
                  patch({ cancellationWindowHours: Number(e.target.value) })
                }
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-navy/[0.06] bg-surface-soft/50 p-3.5">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={16} className="text-status-cancelled" />
              <div>
                <p className="text-sm font-semibold text-navy">Maintenance mode</p>
                <p className="text-xs text-navy/50">
                  Temporarily disables new bookings from customers.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.maintenanceMode}
              onChange={(v) => patch({ maintenanceMode: v })}
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4 rounded-card border border-navy/[0.06] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="font-heading text-base font-bold text-navy">Notifications</h2>

          <div className="flex items-center justify-between rounded-xl border border-navy/[0.06] bg-surface-soft/50 p-3.5">
            <div className="flex items-center gap-2.5">
              <BellRing size={16} className="text-navy/40" />
              <div>
                <p className="text-sm font-semibold text-navy">Email notifications</p>
                <p className="text-xs text-navy/50">
                  Booking confirmations, reminders, and receipts.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.emailNotificationsEnabled}
              onChange={(v) => patch({ emailNotificationsEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-navy/[0.06] bg-surface-soft/50 p-3.5">
            <div className="flex items-center gap-2.5">
              <MessageCircle size={16} className="text-navy/40" />
              <div>
                <p className="text-sm font-semibold text-navy">SMS notifications</p>
                <p className="text-xs text-navy/50">
                  Text reminders for upcoming appointments.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.smsNotificationsEnabled}
              onChange={(v) => patch({ smsNotificationsEnabled: v })}
            />
          </div>
        </section>

        {/* Save bar */}
        <div className="flex items-center justify-end gap-3 pb-4">
          {savedAt && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={16} />
              Saved
            </span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(30,111,217,0.25)] transition-all hover:brightness-105 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
