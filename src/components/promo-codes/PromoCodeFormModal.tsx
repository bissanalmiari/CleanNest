// src/components/promo-codes/PromoCodeFormModal.tsx
// Shared modal used for both creating and editing a promo code.

"use client";

import { useState } from "react";
import { X, Loader2, Percent, DollarSign } from "lucide-react";

export interface PromoCodeFormData {
  _id?: string;
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  expiryDate: string; // ISO date string
  maximumUses: number;
  isActive: boolean;
}

interface PromoCodeFormModalProps {
  mode: "create" | "edit";
  initialData?: PromoCodeFormData;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  expiryDate: string; // yyyy-mm-dd for the <input type="date">
  maximumUses: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  expiryDate: "",
  maximumUses: "",
  isActive: true,
};

function toFormState(data?: PromoCodeFormData): FormState {
  if (!data) return EMPTY_FORM;
  return {
    code: data.code,
    discountType: data.discountType,
    discountValue: String(data.discountValue),
    expiryDate: data.expiryDate.slice(0, 10),
    maximumUses: String(data.maximumUses),
    isActive: data.isActive,
  };
}

export default function PromoCodeFormModal({
  mode,
  initialData,
  onClose,
  onSuccess,
}: PromoCodeFormModalProps) {
  const [form, setForm] = useState<FormState>(toFormState(initialData));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!form.code.trim()) nextErrors.code = "Code is required";

    const value = Number(form.discountValue);
    if (!form.discountValue || Number.isNaN(value)) {
      nextErrors.discountValue = "Enter a discount value";
    } else if (form.discountType === "percentage" && (value < 1 || value > 100)) {
      nextErrors.discountValue = "Percentage must be between 1 and 100";
    } else if (form.discountType === "fixed_amount" && value <= 0) {
      nextErrors.discountValue = "Amount must be greater than 0";
    }

    if (!form.expiryDate) {
      nextErrors.expiryDate = "Expiry date is required";
    } else if (new Date(form.expiryDate).getTime() <= Date.now()) {
      nextErrors.expiryDate = "Expiry date must be in the future";
    }

    const uses = Number(form.maximumUses);
    if (!form.maximumUses || !Number.isInteger(uses) || uses <= 0) {
      nextErrors.maximumUses = "Enter a whole number greater than 0";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      expiryDate: new Date(form.expiryDate).toISOString(),
      maximumUses: Number(form.maximumUses),
      isActive: form.isActive,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/promo-codes"
          : `/api/admin/promo-codes/${initialData?._id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: { success: boolean; error?: string } = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to save promo code");
      }

      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save promo code"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/[0.06] px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            {mode === "create" ? "Create Promo Code" : "Edit Promo Code"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy/40 transition-colors hover:bg-surface-soft hover:text-navy"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {submitError && (
            <div className="rounded-xl border border-status-cancelled/20 bg-status-cancelled/5 px-3.5 py-2.5 text-sm font-medium text-status-cancelled">
              {submitError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Code
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 font-mono text-sm tracking-wider text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="SUMMER20"
            />
            {errors.code && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.code}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, discountType: "percentage" })}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  form.discountType === "percentage"
                    ? "border-primary/40 bg-primary-light text-primary"
                    : "border-navy/10 bg-surface-soft/60 text-navy/50 hover:text-navy"
                }`}
              >
                <Percent size={14} /> Percentage
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, discountType: "fixed_amount" })}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  form.discountType === "fixed_amount"
                    ? "border-primary/40 bg-primary-light text-primary"
                    : "border-navy/10 bg-surface-soft/60 text-navy/50 hover:text-navy"
                }`}
              >
                <DollarSign size={14} /> Fixed Amount
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                {form.discountType === "percentage" ? "Value (%)" : "Value ($)"}
              </label>
              <input
                type="number"
                min="0"
                step={form.discountType === "percentage" ? "1" : "0.01"}
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder={form.discountType === "percentage" ? "20" : "15"}
              />
              {errors.discountValue && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">
                  {errors.discountValue}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Max Uses
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.maximumUses}
                onChange={(e) =>
                  setForm({ ...form, maximumUses: e.target.value })
                }
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="50"
              />
              {errors.maximumUses && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">
                  {errors.maximumUses}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            {errors.expiryDate && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.expiryDate}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-navy/20 text-primary focus:ring-primary/30"
            />
            Active
          </label>

          <div className="flex justify-end gap-3 border-t border-navy/[0.06] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy/60 transition-colors hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(30,111,217,0.25)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving
                ? "Saving..."
                : mode === "create"
                ? "Create Code"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
