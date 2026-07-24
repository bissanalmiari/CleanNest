"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Building2, Home, LoaderCircle, MapPin, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { createAddressSchema, type CreateAddressValues } from "@/validators/addressValidator";

type AddressFormInput = z.input<typeof createAddressSchema>;

interface InlineAddressDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (addressId: string) => Promise<void>;
}

interface CreateAddressResponse {
  success?: boolean;
  data?: {
    address?: {
      id?: string;
    };
  };
  error?: string;
  message?: string;
}

const defaultValues: AddressFormInput = {
  label: "",
  city: "",
  area: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  isDefault: false,
};

export default function InlineAddressDialog({
  open,
  onClose,
  onCreated,
}: InlineAddressDialogProps) {
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AddressFormInput, unknown, CreateAddressValues>({
    resolver: zodResolver(createAddressSchema),
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    labelInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const labelRegistration = register("label");

  async function submitAddress(values: CreateAddressValues) {
    setApiError(null);

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const responseText = await response.text();
      const payload = responseText ? (JSON.parse(responseText) as CreateAddressResponse) : {};

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? payload.message ?? "The address could not be saved.");
      }

      const addressId = payload.data?.address?.id;

      if (!addressId) {
        throw new Error("The saved address did not return a valid ID.");
      }

      await onCreated(addressId);
      reset(defaultValues);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "The address could not be saved.");
    }
  }

  function closeDialog() {
    if (isSubmitting) {
      return;
    }

    setApiError(null);
    reset(defaultValues);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-navy/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inline-address-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
    >
      <div className="my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_35px_100px_rgba(11,37,69,0.35)]">
        <header className="flex items-start justify-between gap-5 bg-navy p-6 text-white sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
              <MapPin className="h-6 w-6" />
            </span>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                Stay in your booking
              </p>
              <h2
                id="inline-address-title"
                className="mt-2 font-heading text-2xl font-black sm:text-3xl"
              >
                Add a new address
              </h2>
              <p className="mt-2 text-sm font-medium text-blue-100/70">
                Your current booking choices will remain exactly as they are.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={closeDialog}
            aria-label="Close address form"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit(submitAddress)}
          className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6 sm:p-7"
          noValidate
        >
          {apiError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              {apiError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <AddressInput
              label="Address label"
              error={errors.label?.message}
              className="sm:col-span-2"
            >
              <div className="relative">
                <Home className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <input
                  {...labelRegistration}
                  ref={(element) => {
                    labelRegistration.ref(element);
                    labelInputRef.current = element;
                  }}
                  type="text"
                  disabled={isSubmitting}
                  placeholder="Home, Office, or another name"
                  className={inputClass(Boolean(errors.label), true)}
                />
              </div>
            </AddressInput>

            <AddressInput label="City" error={errors.city?.message}>
              <input
                {...register("city")}
                type="text"
                autoComplete="address-level2"
                disabled={isSubmitting}
                placeholder="For example, Tripoli"
                className={inputClass(Boolean(errors.city))}
              />
            </AddressInput>

            <AddressInput label="Area" error={errors.area?.message}>
              <input
                {...register("area")}
                type="text"
                autoComplete="address-level3"
                disabled={isSubmitting}
                placeholder="Neighborhood or district"
                className={inputClass(Boolean(errors.area))}
              />
            </AddressInput>

            <AddressInput label="Street" error={errors.street?.message} className="sm:col-span-2">
              <input
                {...register("street")}
                type="text"
                autoComplete="street-address"
                disabled={isSubmitting}
                placeholder="Street name and number"
                className={inputClass(Boolean(errors.street))}
              />
            </AddressInput>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary/10" />
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
              <Building2 className="h-4 w-4" />
              Optional building details
            </span>
            <div className="h-px flex-1 bg-primary/10" />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <AddressInput label="Building" error={errors.building?.message}>
              <input
                {...register("building")}
                type="text"
                disabled={isSubmitting}
                placeholder="Building"
                className={inputClass(Boolean(errors.building))}
              />
            </AddressInput>

            <AddressInput label="Floor" error={errors.floor?.message}>
              <input
                {...register("floor")}
                type="text"
                disabled={isSubmitting}
                placeholder="Floor"
                className={inputClass(Boolean(errors.floor))}
              />
            </AddressInput>

            <AddressInput label="Apartment" error={errors.apartment?.message}>
              <input
                {...register("apartment")}
                type="text"
                disabled={isSubmitting}
                placeholder="Apartment"
                className={inputClass(Boolean(errors.apartment))}
              />
            </AddressInput>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-primary/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={closeDialog}
              className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-primary/15 px-6 text-sm font-extrabold text-slate-600 transition hover:border-primary/35 hover:text-primary disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex min-h-[50px] min-w-[190px] items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(30,111,217,0.25)] transition hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Saving address…
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Save and select
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddressInput({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-extrabold text-navy">{label}</span>
      {children}
      {error && (
        <span className="mt-2 flex items-start gap-2 text-xs font-semibold text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

function inputClass(hasError: boolean, withIcon = false) {
  return [
    "min-h-[52px] w-full rounded-2xl border bg-[#f8fbfe] px-4 text-sm font-semibold text-navy outline-none transition",
    withIcon ? "pl-11" : "",
    "placeholder:text-slate-400 focus:bg-white focus:ring-4",
    "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-primary/15 focus:border-primary focus:ring-primary/10",
  ]
    .filter(Boolean)
    .join(" ");
}
