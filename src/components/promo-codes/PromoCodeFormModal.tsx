"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Loader2,
  Percent,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

export interface PromoCodeFormData {
  _id?: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  startDate?: string;
  expiryDate: string;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number | null;
  maximumUses: number;
  perCustomerLimit?: number;
  applicableServiceIds?: Array<string | { _id?: string; name?: string }>;
  isActive: boolean;
}

interface Props {
  mode: "create" | "edit";
  initialData?: PromoCodeFormData;
  onClose: () => void;
  onSuccess: () => void;
}

interface ServiceOption {
  _id: string;
  name: string;
}

interface FormState {
  code: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  startDate: string;
  expiryDate: string;
  minimumBookingAmount: string;
  maximumDiscountAmount: string;
  maximumUses: string;
  perCustomerLimit: string;
  applicableServiceIds: string[];
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function localDateValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function serviceId(value: string | { _id?: string }) {
  return typeof value === "string" ? value : (value._id ?? "");
}

function initialState(data?: PromoCodeFormData): FormState {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    code: data?.code ?? "",
    description: data?.description ?? "",
    discountType: data?.discountType ?? "percentage",
    discountValue: data?.discountValue !== undefined ? String(data.discountValue) : "",
    startDate: localDateValue(data?.startDate) || localDateValue(today.toISOString()),
    expiryDate: localDateValue(data?.expiryDate) || localDateValue(nextMonth.toISOString()),
    minimumBookingAmount: String(data?.minimumBookingAmount ?? 0),
    maximumDiscountAmount:
      data?.maximumDiscountAmount != null ? String(data.maximumDiscountAmount) : "",
    maximumUses: String(data?.maximumUses ?? 100),
    perCustomerLimit: String(data?.perCustomerLimit ?? 1),
    applicableServiceIds: data?.applicableServiceIds?.map(serviceId).filter(Boolean) ?? [],
    isActive: data?.isActive ?? true,
  };
}

export default function PromoCodeFormModal({ mode, initialData, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(initialData));
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadServices() {
      try {
        const response = await fetch("/api/admin/services?isActive=true&limit=100", {
          cache: "no-store",
        });
        const json = (await response.json()) as {
          success?: boolean;
          data?: { services?: ServiceOption[] };
        };
        if (!cancelled) {
          setServices(json.data?.services ?? []);
        }
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    }
    void loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  const allServicesSelected =
    services.length > 0 && form.applicableServiceIds.length === services.length;

  const preview = useMemo(() => {
    const value = Number(form.discountValue || 0);
    return form.discountType === "percentage" ? `${value || 0}% OFF` : `$${value.toFixed(2)} OFF`;
  }, [form.discountType, form.discountValue]);

  function patch(values: Partial<FormState>) {
    setForm((current) => ({ ...current, ...values }));
  }

  function validate() {
    const next: FieldErrors = {};
    if (!/^[A-Z0-9_-]{3,30}$/.test(form.code.trim())) {
      next.code = "Use 3–30 letters, numbers, hyphens, or underscores.";
    }
    const discount = Number(form.discountValue);
    if (
      !Number.isFinite(discount) ||
      discount <= 0 ||
      (form.discountType === "percentage" && discount > 100)
    ) {
      next.discountValue =
        form.discountType === "percentage"
          ? "Enter a percentage between 0.01 and 100."
          : "Enter an amount greater than zero.";
    }
    if (!form.startDate) next.startDate = "Choose a start date.";
    if (!form.expiryDate) next.expiryDate = "Choose an expiry date.";
    if (
      form.startDate &&
      form.expiryDate &&
      new Date(form.expiryDate) <= new Date(form.startDate)
    ) {
      next.expiryDate = "Expiry must be later than the start date.";
    }
    if (Number(form.minimumBookingAmount) < 0) {
      next.minimumBookingAmount = "Minimum spend cannot be negative.";
    }
    if (
      form.discountType === "percentage" &&
      form.maximumDiscountAmount &&
      Number(form.maximumDiscountAmount) <= 0
    ) {
      next.maximumDiscountAmount = "The cap must be greater than zero.";
    }
    if (!Number.isInteger(Number(form.maximumUses)) || Number(form.maximumUses) < 1) {
      next.maximumUses = "Enter at least one use.";
    }
    if (!Number.isInteger(Number(form.perCustomerLimit)) || Number(form.perCustomerLimit) < 1) {
      next.perCustomerLimit = "Enter at least one use per customer.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startDate: new Date(`${form.startDate}T00:00:00`).toISOString(),
        expiryDate: new Date(`${form.expiryDate}T23:59:59`).toISOString(),
        minimumBookingAmount: Number(form.minimumBookingAmount || 0),
        maximumDiscountAmount:
          form.discountType === "percentage" && form.maximumDiscountAmount
            ? Number(form.maximumDiscountAmount)
            : null,
        maximumUses: Number(form.maximumUses),
        perCustomerLimit: Number(form.perCustomerLimit),
        applicableServiceIds: form.applicableServiceIds,
        isActive: form.isActive,
      };
      const response = await fetch(
        mode === "create" ? "/api/admin/promo-codes" : `/api/admin/promo-codes/${initialData?._id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Unable to save this campaign.");
      }
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save this campaign.");
    } finally {
      setSaving(false);
    }
  }

  function toggleService(id: string) {
    patch({
      applicableServiceIds: form.applicableServiceIds.includes(id)
        ? form.applicableServiceIds.filter((item) => item !== id)
        : [...form.applicableServiceIds, id],
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-navy/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Create promo campaign" : "Edit promo campaign"}
    >
      <div className="flex min-h-full items-center justify-center py-6">
        <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-[0_35px_100px_rgba(3,22,45,0.35)]">
          <div className="relative overflow-hidden bg-[linear-gradient(125deg,#071d38,#0c3b6d)] px-6 py-6 text-white sm:px-8">
            <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full border border-cyan-300/20 bg-cyan-300/10" />
            <div className="relative flex items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-navy">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    Campaign studio
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-black">
                    {mode === "create" ? "Create a promo campaign" : "Refine this campaign"}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-blue-100/65">
                    Configure eligibility, limits, dates, and the customer offer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={submit} className="grid lg:grid-cols-[1fr_280px]">
            <div className="space-y-7 p-6 sm:p-8">
              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {submitError}
                </div>
              )}

              <Section title="Campaign identity" icon={Sparkles}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Promo code" error={errors.code}>
                    <input
                      value={form.code}
                      maxLength={30}
                      onChange={(event) =>
                        patch({
                          code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                        })
                      }
                      placeholder="WELCOME20"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Campaign description">
                    <input
                      value={form.description}
                      maxLength={300}
                      onChange={(event) => patch({ description: event.target.value })}
                      placeholder="20% off a first deep clean"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Customer offer" icon={Percent}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Discount type">
                    <select
                      value={form.discountType}
                      onChange={(event) =>
                        patch({
                          discountType: event.target.value as FormState["discountType"],
                          maximumDiscountAmount:
                            event.target.value === "fixed_amount" ? "" : form.maximumDiscountAmount,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed amount</option>
                    </select>
                  </Field>
                  <Field label="Discount value" error={errors.discountValue}>
                    <NumberInput
                      value={form.discountValue}
                      onChange={(discountValue) => patch({ discountValue })}
                      prefix={form.discountType === "percentage" ? "%" : "$"}
                    />
                  </Field>
                  <Field label="Minimum subtotal" error={errors.minimumBookingAmount}>
                    <NumberInput
                      value={form.minimumBookingAmount}
                      onChange={(minimumBookingAmount) => patch({ minimumBookingAmount })}
                      prefix="$"
                    />
                  </Field>
                  <Field
                    label="Maximum discount"
                    error={errors.maximumDiscountAmount}
                    hint={form.discountType === "fixed_amount" ? "Percentage only" : "Optional cap"}
                  >
                    <NumberInput
                      value={form.maximumDiscountAmount}
                      onChange={(maximumDiscountAmount) => patch({ maximumDiscountAmount })}
                      prefix="$"
                      disabled={form.discountType === "fixed_amount"}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Schedule and limits" icon={CalendarDays}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Starts" error={errors.startDate}>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) => patch({ startDate: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Expires" error={errors.expiryDate}>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(event) => patch({ expiryDate: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Total uses" error={errors.maximumUses}>
                    <NumberInput
                      value={form.maximumUses}
                      onChange={(maximumUses) => patch({ maximumUses })}
                    />
                  </Field>
                  <Field label="Uses per customer" error={errors.perCustomerLimit}>
                    <NumberInput
                      value={form.perCustomerLimit}
                      onChange={(perCustomerLimit) => patch({ perCustomerLimit })}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Eligible services" icon={ShieldCheck}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-500">
                    No selection means the code works for every service.
                  </p>
                  {services.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          applicableServiceIds: allServicesSelected
                            ? []
                            : services.map((service) => service._id),
                        })
                      }
                      className="text-xs font-black text-primary"
                    >
                      {allServicesSelected ? "Clear all" : "Select all"}
                    </button>
                  )}
                </div>
                {servicesLoading ? (
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map((service) => {
                      const selected = form.applicableServiceIds.includes(service._id);
                      return (
                        <button
                          key={service._id}
                          type="button"
                          onClick={() => toggleService(service._id)}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
                            selected
                              ? "border-primary/30 bg-primary-light text-primary"
                              : "border-slate-200 text-slate-600 hover:border-primary/20"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md ${
                              selected ? "bg-primary text-white" : "bg-slate-100"
                            }`}
                          >
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          {service.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Section>
            </div>

            <aside className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0">
              <div className="sticky top-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Live preview
                </p>
                <div className="mt-4 overflow-hidden rounded-2xl bg-navy text-white shadow-xl">
                  <div className="border-b border-white/10 p-5">
                    <p className="font-mono text-xl font-black tracking-[0.12em] text-cyan-300">
                      {form.code || "YOURCODE"}
                    </p>
                    <p className="mt-2 text-sm font-medium text-blue-100/60">
                      {form.description || "A special CleanNest campaign"}
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="font-heading text-3xl font-black">{preview}</p>
                    <p className="mt-2 text-xs font-bold text-blue-100/55">
                      {form.applicableServiceIds.length
                        ? `${form.applicableServiceIds.length} selected services`
                        : "All cleaning services"}
                    </p>
                  </div>
                </div>

                <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <span>
                    <span className="block text-sm font-black text-navy">Campaign active</span>
                    <span className="mt-1 block text-xs font-medium text-slate-400">
                      Customers can apply it during its date window.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => patch({ isActive: event.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 text-primary"
                  />
                </label>

                <div className="mt-6 grid gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white shadow-lg transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Ticket className="h-4 w-4" />
                    )}
                    {saving
                      ? "Saving campaign"
                      : mode === "create"
                        ? "Launch campaign"
                        : "Save campaign"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-xl text-sm font-bold text-slate-500 transition hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-navy outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-navy">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
        {hint && <span className="normal-case tracking-normal text-slate-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-bold text-red-500">{error}</span>}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: "$" | "%";
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min="0"
        step="0.01"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${prefix ? "pl-8" : ""} disabled:bg-slate-100 disabled:text-slate-400`}
      />
    </div>
  );
}
