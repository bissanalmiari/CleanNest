// src/components/cleaners/CleanerFormModal.tsx
// Shared Add/Edit modal for a cleaner. When `cleaner` is null, it's in
// "Add" mode (email + password required). When `cleaner` is provided,
// it's in "Edit" mode (password field hidden — editing doesn't touch it).

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X, UserPlus, Save } from "lucide-react";

export interface CleanerFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CleanerRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface CleanerFormModalProps {
  open: boolean;
  cleaner: CleanerRow | null; // null => "Add" mode
  onClose: () => void;
  onSubmit: (values: CleanerFormValues) => Promise<void>;
}

const EMPTY_VALUES: CleanerFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function CleanerFormModal({
  open,
  cleaner,
  onClose,
  onSubmit,
}: CleanerFormModalProps) {
  const isEditMode = cleaner !== null;

  const [values, setValues] = useState<CleanerFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
    setValues(
      cleaner
        ? {
            name: cleaner.name,
            email: cleaner.email,
            phone: cleaner.phone ?? "",
            password: "",
          }
        : EMPTY_VALUES
    );
  }, [open, cleaner]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-navy/[0.06] bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-navy/[0.06] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white">
              {isEditMode ? <Save size={16} /> : <UserPlus size={16} />}
            </span>
            <h2 className="font-heading text-lg font-semibold text-navy">
              {isEditMode ? "Edit Cleaner" : "Add Cleaner"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-navy/40 transition-colors hover:bg-surface-soft hover:text-navy"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {errorMessage && (
            <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-3.5 py-2.5 text-sm font-medium text-status-cancelled">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Full name
            </label>
            <input
              required
              type="text"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Email
            </label>
            <input
              required
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Phone
            </label>
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Password
              </label>
              <input
                required
                type="password"
                minLength={8}
                value={values.password}
                onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              <p className="mt-1 text-xs text-navy/40">At least 8 characters.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy/60 transition-colors hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEditMode ? "Save changes" : "Add cleaner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
