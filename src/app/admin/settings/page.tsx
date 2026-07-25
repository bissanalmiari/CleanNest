"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Ban,
  BellRing,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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

interface ValidationErrors {
  businessName?: string;
  supportEmail?: string;
  bookingLeadTimeHours?: string;
  cancellationWindowHours?: string;
}

const EDITABLE_KEYS: Array<keyof Omit<SettingsData, "updatedAt">> = [
  "businessName",
  "supportEmail",
  "supportPhone",
  "businessAddress",
  "bookingLeadTimeHours",
  "cancellationWindowHours",
  "maintenanceMode",
  "emailNotificationsEnabled",
  "smsNotificationsEnabled",
];

const NAV_ITEMS = [
  { href: "#business", label: "Business identity", icon: Building2 },
  { href: "#booking", label: "Booking policy", icon: CalendarClock },
  { href: "#notifications", label: "Notifications", icon: BellRing },
  { href: "#platform", label: "Platform controls", icon: ShieldAlert },
];

function editableSnapshot(settings: SettingsData | null) {
  if (!settings) return null;
  return EDITABLE_KEYS.reduce<Record<string, unknown>>((snapshot, key) => {
    snapshot[key] = settings[key] ?? "";
    return snapshot;
  }, {});
}

function validate(settings: SettingsData | null): ValidationErrors {
  if (!settings) return {};
  const errors: ValidationErrors = {};

  if (!settings.businessName.trim()) {
    errors.businessName = "Business name is required.";
  } else if (settings.businessName.trim().length > 120) {
    errors.businessName = "Business name cannot exceed 120 characters.";
  }

  if (!/^\S+@\S+\.\S+$/.test(settings.supportEmail.trim())) {
    errors.supportEmail = "Enter a valid support email address.";
  }

  if (
    !Number.isInteger(settings.bookingLeadTimeHours) ||
    settings.bookingLeadTimeHours < 0 ||
    settings.bookingLeadTimeHours > 168
  ) {
    errors.bookingLeadTimeHours =
      "Booking notice must be a whole number from 0 to 168.";
  }

  if (
    !Number.isInteger(settings.cancellationWindowHours) ||
    settings.cancellationWindowHours < 0 ||
    settings.cancellationWindowHours > 168
  ) {
    errors.cancellationWindowHours =
      "Cancellation window must be a whole number from 0 to 168.";
  }

  return errors;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Beirut",
  }).format(date);
}

function SettingsSkeleton() {
  return (
    <main className="min-h-screen bg-[#f3f7fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] animate-pulse space-y-6">
        <div className="h-[330px] rounded-[2.25rem] bg-navy/10" />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-72 rounded-[2rem] bg-white" />
          <div className="space-y-6">
            <div className="h-[390px] rounded-[2rem] bg-white" />
            <div className="h-[330px] rounded-[2rem] bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminSettingsPage() {
  const reduceMotion = useReducedMotion();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [baseline, setBaseline] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      });
      const json: ApiEnvelope<{ settings: SettingsData }> =
        await response.json();

      if (!response.ok || !json.success || !json.data?.settings) {
        throw new Error(json.error ?? "Settings could not be loaded.");
      }

      setSettings(json.data.settings);
      setBaseline(json.data.settings);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Settings could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const validationErrors = useMemo(() => validate(settings), [settings]);
  const isValid = Object.keys(validationErrors).length === 0;
  const isDirty = useMemo(
    () =>
      JSON.stringify(editableSnapshot(settings)) !==
      JSON.stringify(editableSnapshot(baseline)),
    [baseline, settings],
  );

  useEffect(() => {
    if (!isDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  function patch(fields: Partial<SettingsData>) {
    setSettings((current) => (current ? { ...current, ...fields } : current));
    setSaved(false);
  }

  function resetChanges() {
    if (!baseline) return;
    setSettings(baseline);
    setError(null);
  }

  async function handleSave() {
    if (!settings || !isValid || !isDirty) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: settings.businessName.trim(),
          supportEmail: settings.supportEmail.trim(),
          supportPhone: settings.supportPhone?.trim() ?? "",
          businessAddress: settings.businessAddress?.trim() ?? "",
          bookingLeadTimeHours: settings.bookingLeadTimeHours,
          cancellationWindowHours: settings.cancellationWindowHours,
          maintenanceMode: settings.maintenanceMode,
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          smsNotificationsEnabled: settings.smsNotificationsEnabled,
        }),
      });
      const json: ApiEnvelope<{ settings: SettingsData }> =
        await response.json();

      if (!response.ok || !json.success || !json.data?.settings) {
        throw new Error(json.error ?? "Settings could not be saved.");
      }

      setSettings(json.data.settings);
      setBaseline(json.data.settings);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SettingsSkeleton />;

  if (!settings) {
    return (
      <main className="min-h-screen bg-[#f3f7fc] px-4 py-12 sm:px-6">
        <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-black text-navy">
            Settings unavailable
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {error ?? "The platform settings could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-5 text-xs font-extrabold text-white transition hover:bg-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const enabledChannels =
    Number(settings.emailNotificationsEnabled) +
    Number(settings.smsNotificationsEnabled);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 pb-32 sm:px-6 lg:px-8 lg:py-8 lg:pb-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -right-40 top-24 h-[480px] w-[480px] rounded-full bg-cyan-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-[1400px] space-y-6">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8 lg:p-10"
        >
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-cyan-200/20 bg-cyan-300/10" />
          <div className="absolute -bottom-44 left-[28%] h-96 w-96 rounded-full bg-primary/25 blur-3xl" />

          <div className="relative grid items-end gap-9 xl:grid-cols-[minmax(0,1fr)_680px]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                <SettingsIcon className="h-3.5 w-3.5 text-cyan-300" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                  Platform control center
                </p>
              </div>
              <h1 className="mt-6 max-w-xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                Configure with clarity.
                <span className="block text-cyan-300">
                  Operate with confidence.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                Manage your business identity, booking policies, customer
                communications, and platform availability.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4 text-xs font-bold text-blue-100/65">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Administrator protected
                </span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>Last saved {formatUpdatedAt(settings.updatedAt)}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ControlMetric
                icon={Globe2}
                label="Platform"
                value={settings.maintenanceMode ? "Paused" : "Live"}
                note={
                  settings.maintenanceMode
                    ? "Maintenance enabled"
                    : "Accepting bookings"
                }
                accent={settings.maintenanceMode ? "amber" : "emerald"}
              />
              <ControlMetric
                icon={Clock3}
                label="Booking notice"
                value={`${settings.bookingLeadTimeHours}h`}
                note="Minimum lead time"
                accent="cyan"
              />
              <ControlMetric
                icon={TimerReset}
                label="Cancellation"
                value={`${settings.cancellationWindowHours}h`}
                note="Free-change window"
                accent="blue"
              />
              <ControlMetric
                icon={BellRing}
                label="Channels"
                value={`${enabledChannels}/2`}
                note="Notifications enabled"
                accent="violet"
              />
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24">
            <nav className="rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_16px_45px_rgba(11,37,69,0.07)]">
              <p className="px-3 pb-3 pt-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Configuration
              </p>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-primary-light hover:text-primary"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-white group-hover:text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {item.label}
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </a>
                );
              })}
            </nav>

            <div
              className={`rounded-[1.75rem] border p-5 shadow-[0_16px_45px_rgba(11,37,69,0.07)] ${
                settings.maintenanceMode
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-100 bg-emerald-50/70"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white ${
                  settings.maintenanceMode
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {settings.maintenanceMode ? (
                  <Wrench className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </span>
              <p className="mt-4 font-heading text-sm font-bold text-navy">
                {settings.maintenanceMode
                  ? "Maintenance scheduled"
                  : "Platform operational"}
              </p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                {settings.maintenanceMode
                  ? "New customer bookings are configured to be temporarily unavailable."
                  : "The platform is configured to accept new customer bookings."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing || isDirty}
              title={
                isDirty
                  ? "Reset or save your changes before refreshing"
                  : "Reload settings"
              }
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-navy shadow-sm transition hover:border-primary/30 hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw
                className={`h-4 w-4 text-primary ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh configuration
            </button>
          </aside>

          <div className="space-y-6">
            <SettingsSection
              id="business"
              eyebrow="Public identity"
              title="Business information"
              description="These details identify CleanNest and provide customers with reliable support contacts."
              icon={Building2}
              tone="blue"
            >
              <div className="grid gap-5">
                <Field
                  label="Business name"
                  description="The public name used across the CleanNest experience."
                  icon={Building2}
                  error={validationErrors.businessName}
                >
                  <input
                    className={inputClass(Boolean(validationErrors.businessName))}
                    value={settings.businessName}
                    maxLength={120}
                    onChange={(event) =>
                      patch({ businessName: event.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Support email"
                    description="Primary address for customer assistance."
                    icon={Mail}
                    error={validationErrors.supportEmail}
                  >
                    <input
                      type="email"
                      className={inputClass(Boolean(validationErrors.supportEmail))}
                      value={settings.supportEmail}
                      onChange={(event) =>
                        patch({ supportEmail: event.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label="Support phone"
                    description="Optional phone number customers can use."
                    icon={Phone}
                  >
                    <input
                      type="tel"
                      maxLength={30}
                      className={inputClass(false)}
                      value={settings.supportPhone ?? ""}
                      onChange={(event) =>
                        patch({ supportPhone: event.target.value })
                      }
                      placeholder="+961 ..."
                    />
                  </Field>
                </div>

                <Field
                  label="Business address"
                  description="Operational or registered business location."
                  icon={MapPin}
                >
                  <textarea
                    rows={3}
                    maxLength={300}
                    className={`${inputClass(false)} resize-none`}
                    value={settings.businessAddress ?? ""}
                    onChange={(event) =>
                      patch({ businessAddress: event.target.value })
                    }
                    placeholder="Street, area, city, country"
                  />
                </Field>
              </div>
            </SettingsSection>

            <SettingsSection
              id="booking"
              eyebrow="Scheduling policy"
              title="Booking rules"
              description="Define how far ahead customers must book and how close to service they may cancel."
              icon={CalendarClock}
              tone="violet"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Minimum booking notice"
                  description="Hours required between booking and arrival."
                  icon={Clock3}
                  error={validationErrors.bookingLeadTimeHours}
                >
                  <NumberWithUnit
                    value={settings.bookingLeadTimeHours}
                    unit="hours"
                    error={Boolean(validationErrors.bookingLeadTimeHours)}
                    onChange={(value) =>
                      patch({ bookingLeadTimeHours: value })
                    }
                  />
                </Field>
                <Field
                  label="Free cancellation window"
                  description="Hours before service when free cancellation closes."
                  icon={Ban}
                  error={validationErrors.cancellationWindowHours}
                >
                  <NumberWithUnit
                    value={settings.cancellationWindowHours}
                    unit="hours"
                    error={Boolean(validationErrors.cancellationWindowHours)}
                    onChange={(value) =>
                      patch({ cancellationWindowHours: value })
                    }
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PolicyPreview
                  icon={CalendarClock}
                  label="Earliest booking"
                  value={
                    settings.bookingLeadTimeHours === 0
                      ? "Immediately"
                      : `${settings.bookingLeadTimeHours} hours ahead`
                  }
                />
                <PolicyPreview
                  icon={TimerReset}
                  label="Cancellation cutoff"
                  value={
                    settings.cancellationWindowHours === 0
                      ? "No free window"
                      : `${settings.cancellationWindowHours} hours before`
                  }
                />
              </div>
            </SettingsSection>

            <SettingsSection
              id="notifications"
              eyebrow="Customer communication"
              title="Notification channels"
              description="Choose which communication channels the platform is configured to use."
              icon={BellRing}
              tone="emerald"
            >
              <div className="space-y-3">
                <ToggleCard
                  icon={Mail}
                  title="Email notifications"
                  description="Booking confirmations, schedule reminders, and payment receipts."
                  checked={settings.emailNotificationsEnabled}
                  onChange={(value) =>
                    patch({ emailNotificationsEnabled: value })
                  }
                  tone="blue"
                />
                <ToggleCard
                  icon={MessageCircle}
                  title="SMS notifications"
                  description="Short appointment reminders delivered to customer phone numbers."
                  checked={settings.smsNotificationsEnabled}
                  onChange={(value) =>
                    patch({ smsNotificationsEnabled: value })
                  }
                  tone="emerald"
                />
              </div>

              {enabledChannels === 0 && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="text-xs font-medium leading-5 text-amber-800">
                    Both notification channels are disabled. Customers may not
                    receive automated booking updates.
                  </p>
                </div>
              )}
            </SettingsSection>

            <SettingsSection
              id="platform"
              eyebrow="Availability control"
              title="Platform operations"
              description="Use maintenance mode when booking operations must be temporarily paused."
              icon={ShieldAlert}
              tone="amber"
            >
              <ToggleCard
                icon={Wrench}
                title="Maintenance mode"
                description="Configure the platform to temporarily stop accepting new customer bookings."
                checked={settings.maintenanceMode}
                onChange={(value) => patch({ maintenanceMode: value })}
                tone="amber"
                prominent
              />

              {settings.maintenanceMode && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-700">
                        Booking availability will be paused
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-red-600/80">
                        Save these changes only when you intend to place the
                        booking experience into maintenance mode.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </SettingsSection>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_-16px_45px_rgba(11,37,69,0.08)] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isDirty
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isDirty ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
            <div>
              <p className="text-xs font-extrabold text-navy">
                {isDirty ? "Unsaved configuration changes" : "Configuration saved"}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                {isDirty
                  ? isValid
                    ? "Review and save when ready."
                    : "Resolve validation errors before saving."
                  : `Last updated ${formatUpdatedAt(settings.updatedAt)}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetChanges}
              disabled={!isDirty || saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!isDirty || !isValid || saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-extrabold text-white shadow-[0_12px_25px_rgba(30,111,217,0.22)] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            className="fixed right-5 top-24 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_18px_50px_rgba(11,37,69,0.18)]"
            role="status"
          >
            <CheckCircle2 className="h-5 w-5" />
            Settings saved successfully
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function inputClass(hasError: boolean) {
  return `min-h-12 w-full rounded-xl border bg-slate-50 px-4 text-sm font-medium text-navy outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-primary/40 focus:ring-primary/10"
  }`;
}

function ControlMetric({
  icon: Icon,
  label,
  value,
  note,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
  accent: "emerald" | "amber" | "cyan" | "blue" | "violet";
}) {
  const accents = {
    emerald: "bg-emerald-300 text-navy",
    amber: "bg-amber-300 text-navy",
    cyan: "bg-cyan-300 text-navy",
    blue: "bg-blue-300 text-navy",
    violet: "bg-violet-300 text-navy",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 truncate font-heading text-xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.13em] text-blue-100/55">
        {label}
      </p>
      <p className="mt-1 text-[9px] font-bold text-blue-100/40">{note}</p>
    </div>
  );
}

function SettingsSection({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  tone,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: "blue" | "violet" | "emerald" | "amber";
  children: ReactNode;
}) {
  const tones = {
    blue: "bg-primary-light text-primary",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_rgba(11,37,69,0.08)] sm:p-7"
    >
      <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 font-heading text-xl font-black tracking-[-0.025em] text-navy">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs font-medium leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  description,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-extrabold text-navy">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </span>
      <span className="mb-2 mt-1 block text-[10px] font-medium leading-4 text-slate-400">
        {description}
      </span>
      {children}
      {error && (
        <span className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </label>
  );
}

function NumberWithUnit({
  value,
  unit,
  error,
  onChange,
}: {
  value: number;
  unit: string;
  error: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        max={168}
        step={1}
        className={`${inputClass(error)} pr-20`}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
        {unit}
      </span>
    </div>
  );
}

function PolicyPreview({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-xs font-bold text-navy">{value}</p>
      </div>
    </div>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  tone,
  prominent = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  tone: "blue" | "emerald" | "amber";
  prominent?: boolean;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition sm:p-5 ${
        checked
          ? prominent
            ? "border-amber-200 bg-amber-50/40"
            : "border-primary/15 bg-primary/[0.02]"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-navy">{title}</p>
          <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-slate-500">
            {description}
          </p>
          <span
            className={`mt-2 inline-flex rounded-lg px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${
              checked
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {checked ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-4 focus:ring-primary/15 ${
        checked ? "bg-primary" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_2px_7px_rgba(11,37,69,0.22)] transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
