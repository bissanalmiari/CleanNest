// src/components/services/ServiceFormModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export interface ServiceFormData {
  _id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  durationMinutes: number;
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
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: string;
  durationMinutes: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "",
  price: "",
  durationMinutes: "",
  isActive: true,
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFormState(data?: ServiceFormData): FormState {
  if (!data) return EMPTY_FORM;
  return {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription,
    description: data.description,
    category: data.category,
    price: String(data.price),
    durationMinutes: String(data.durationMinutes),
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
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.slug.trim()) {
      nextErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      nextErrors.slug = "Use lowercase letters, numbers, and hyphens only";
    }
    if (!form.shortDescription.trim()) {
      nextErrors.shortDescription = "Short description is required";
    } else if (form.shortDescription.trim().length > 180) {
      nextErrors.shortDescription = "Short description cannot exceed 180 characters";
    }
    if (!form.description.trim()) {
      nextErrors.description = "Description is required";
    }
    if (!form.category.trim()) nextErrors.category = "Category is required";

    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price <= 0) {
      nextErrors.price = "Enter a price greater than 0";
    }

    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes || Number.isNaN(duration) || duration < 30) {
      nextErrors.durationMinutes = "Duration must be at least 30 minutes";
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
      slug: form.slug.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
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
      const json: { success: boolean; error?: string; issues?: Record<string, string> } =
        await res.json();

      if (!json.success) {
        if (json.issues) {
          setErrors(json.issues as FieldErrors);
        }
        throw new Error(json.error ?? "Failed to save service");
      }

      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-2xl my-8">
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
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
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Standard Home Cleaning"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="standard-home-cleaning"
            />
            {errors.slug && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.slug}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Short Description
            </label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              maxLength={180}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Reliable, thorough home cleaning"
            />
            {errors.shortDescription && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.shortDescription}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              maxLength={3000}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Full details of what's included in this service..."
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.description}
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
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="80"
              />
              {errors.price && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Duration (min)
              </label>
              <input
                type="number"
                min="30"
                step="5"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="120"
              />
              {errors.durationMinutes && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">
                  {errors.durationMinutes}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
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