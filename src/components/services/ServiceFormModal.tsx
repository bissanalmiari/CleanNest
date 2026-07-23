// src/components/services/ServiceFormModal.tsx
// Shared modal used for both creating and editing a service. A single
// component keeps the two flows visually and behaviorally identical.

"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export interface ServiceFormData {
  _id?: string;
  name: string;
  category: string;
  basePrice: number;
  baseDurationMinutes: number;
  isActive: boolean;
}

interface ServiceFormModalProps {
  mode: "create" | "edit";
  initialData?: ServiceFormData;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  category: string;
  basePrice: string;
  baseDurationMinutes: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  basePrice: "",
  baseDurationMinutes: "",
  isActive: true,
};

function toFormState(data?: ServiceFormData): FormState {
  if (!data) return EMPTY_FORM;
  return {
    name: data.name,
    category: data.category,
    basePrice: String(data.basePrice),
    baseDurationMinutes: String(data.baseDurationMinutes),
    isActive: data.isActive,
  };
}

export default function ServiceFormModal({
  mode,
  initialData,
  onClose,
  onSuccess,
}: ServiceFormModalProps) {
  const [form, setForm] = useState<FormState>(toFormState(initialData));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";

    const price = Number(form.basePrice);
    if (!form.basePrice || Number.isNaN(price) || price <= 0) {
      nextErrors.basePrice = "Enter a price greater than 0";
    }

    const duration = Number(form.baseDurationMinutes);
    if (
      !form.baseDurationMinutes ||
      Number.isNaN(duration) ||
      duration <= 0
    ) {
      nextErrors.baseDurationMinutes = "Enter a duration greater than 0";
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
      name: form.name.trim(),
      category: form.category.trim(),
      basePrice: Number(form.basePrice),
      baseDurationMinutes: Number(form.baseDurationMinutes),
      isActive: form.isActive,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/services"
          : `/api/admin/services/${initialData?._id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: { success: boolean; error?: string } = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to save service");
      }

      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save service"
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
            {mode === "create" ? "Add Service" : "Edit Service"}
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
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Standard Home Cleaning"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Residential"
            />
            {errors.category && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.category}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Base Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(e) =>
                  setForm({ ...form, basePrice: e.target.value })
                }
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="80"
              />
              {errors.basePrice && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">
                  {errors.basePrice}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Duration (min)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={form.baseDurationMinutes}
                onChange={(e) =>
                  setForm({ ...form, baseDurationMinutes: e.target.value })
                }
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="120"
              />
              {errors.baseDurationMinutes && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">
                  {errors.baseDurationMinutes}
                </p>
              )}
            </div>
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
            Active (visible to customers)
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
              {saving ? "Saving..." : mode === "create" ? "Add Service" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
