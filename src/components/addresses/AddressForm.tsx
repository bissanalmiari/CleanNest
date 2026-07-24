"use client";

import { useEffect, useMemo, type ComponentType, type ReactNode } from "react";

import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Home,
  Layers3,
  LoaderCircle,
  Map,
  MapPin,
  Navigation,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Warehouse,
} from "lucide-react";

import { useForm, type FieldError } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import type { z } from "zod";

import { createAddressSchema, type CreateAddressValues } from "@/validators/addressValidator";

import type { Address } from "@/types/user";

/*
 * The schema input allows isDefault to be omitted.
 * The schema output applies default(false), making it a Boolean.
 */
type AddressFormInput = z.input<typeof createAddressSchema>;

interface AddressFormProps {
  /**
   * Pass an existing address when editing.
   * Leave undefined when creating a new address.
   */
  address?: Address;

  onSubmit: (values: CreateAddressValues) => Promise<unknown>;

  loading: boolean;
  error: string | null;
  submitLabel: string;
}

interface AddressFieldProps {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  htmlFor: string;

  optional?: boolean;
  error?: FieldError;

  description?: string;
  children: ReactNode;
}

interface AddressSuggestion {
  label: string;

  icon: ComponentType<{
    className?: string;
  }>;
}

const ADDRESS_LABEL_SUGGESTIONS: AddressSuggestion[] = [
  {
    label: "Home",
    icon: Home,
  },
  {
    label: "Office",
    icon: Building2,
  },
  {
    label: "Parents' house",
    icon: Warehouse,
  },
  {
    label: "Apartment",
    icon: Layers3,
  },
];

function createDefaultValues(address?: Address): AddressFormInput {
  return {
    label: address?.label ?? "",
    city: address?.city ?? "",
    area: address?.area ?? "",
    street: address?.street ?? "",

    building: address?.building ?? "",

    floor: address?.floor ?? "",

    apartment: address?.apartment ?? "",

    isDefault: address?.isDefault ?? false,
  };
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createPreviewAddress({
  street,
  building,
  floor,
  apartment,
  area,
  city,
}: {
  street: string;
  building: string;
  floor: string;
  apartment: string;
  area: string;
  city: string;
}): string[] {
  const buildingDetails = [
    building ? `Building ${building}` : "",

    floor ? `Floor ${floor}` : "",

    apartment ? `Apartment ${apartment}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    street || "Street will appear here",

    buildingDetails || "Building details are optional",

    [area, city].filter(Boolean).join(", ") || "Area and city will appear here",
  ];
}

export function AddressForm({ address, onSubmit, loading, error, submitLabel }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,

    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<AddressFormInput, unknown, CreateAddressValues>({
    resolver: zodResolver(createAddressSchema),

    mode: "onChange",

    defaultValues: createDefaultValues(address),
  });

  useEffect(() => {
    reset(createDefaultValues(address));
  }, [address, reset]);

  const watchedLabel = watch("label") ?? "";

  const watchedCity = watch("city") ?? "";

  const watchedArea = watch("area") ?? "";

  const watchedStreet = watch("street") ?? "";

  const watchedBuilding = watch("building") ?? "";

  const watchedFloor = watch("floor") ?? "";

  const watchedApartment = watch("apartment") ?? "";

  const watchedIsDefault = watch("isDefault") ?? false;

  const previewLines = useMemo(
    () =>
      createPreviewAddress({
        street: cleanText(watchedStreet),

        building: cleanText(watchedBuilding),

        floor: cleanText(watchedFloor),

        apartment: cleanText(watchedApartment),

        area: cleanText(watchedArea),

        city: cleanText(watchedCity),
      }),
    [watchedApartment, watchedArea, watchedBuilding, watchedCity, watchedFloor, watchedStreet]
  );

  const completedRequiredFields = useMemo(() => {
    return [watchedLabel, watchedCity, watchedArea, watchedStreet].filter(
      (value) => cleanText(value).length > 0
    ).length;
  }, [watchedArea, watchedCity, watchedLabel, watchedStreet]);

  const completionPercentage = Math.round((completedRequiredFields / 4) * 100);

  const busy = loading || isSubmitting;

  async function handleAddressSubmit(values: CreateAddressValues) {
    await onSubmit({
      ...values,

      label: values.label.trim(),

      city: values.city.trim(),

      area: values.area.trim(),

      street: values.street.trim(),

      building: values.building?.trim() ?? "",

      floor: values.floor?.trim() ?? "",

      apartment: values.apartment?.trim() ?? "",

      isDefault: Boolean(values.isDefault),
    });
  }

  function handleReset() {
    reset(createDefaultValues(address));
  }

  function selectLabelSuggestion(label: string) {
    setValue("label", label, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-7" noValidate>
      {/* API error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-4 rounded-[1.5rem] border border-red-200 bg-red-50 p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </span>

          <div>
            <p className="font-extrabold text-red-800">Address could not be saved</p>

            <p className="mt-2 text-sm font-semibold leading-6 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Introduction */}
      <section className="relative overflow-hidden rounded-[1.8rem] border border-primary/10 bg-gradient-to-br from-primary-light/80 via-white to-cyan-50 p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_14px_30px_rgba(11,37,69,0.2)]">
              <MapPin className="h-6 w-6" />
            </span>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-primary">
                Location setup
              </p>

              <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                {address ? "Refine this home base" : "Create a new home base"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Add accurate location details so your future CleanNest bookings begin at the right
                destination.
              </p>
            </div>
          </div>

          <div className="min-w-[170px] rounded-2xl border border-primary/10 bg-white/85 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
                Required details
              </p>

              <p className="text-sm font-extrabold text-primary">{completionPercentage}%</p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-light">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-400">
              {completedRequiredFields} of 4 completed
            </p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Form sections */}
        <div className="space-y-7">
          {/* Address identity */}
          <section className="rounded-[1.8rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-7">
            <SectionHeading
              icon={Tag}
              eyebrow="Address identity"
              title="Give this place a name"
              description="Choose a clear label that will be easy to recognize during booking."
            />

            <div className="mt-7">
              <AddressField
                icon={Tag}
                label="Address label"
                htmlFor="address-label"
                error={errors.label}
                description="Examples: Home, Office, Parents' house."
              >
                <input
                  id="address-label"
                  type="text"
                  autoComplete="off"
                  disabled={busy}
                  placeholder="Enter a recognizable label"
                  {...register("label")}
                  className={fieldClass(Boolean(errors.label))}
                />
              </AddressField>

              <div className="mt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
                  Quick suggestions
                </p>

                <div className="mt-3 flex flex-wrap gap-2.5">
                  {ADDRESS_LABEL_SUGGESTIONS.map(({ label, icon: Icon }) => {
                    const isSelected = watchedLabel.trim().toLowerCase() === label.toLowerCase();

                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          selectLabelSuggestion(label);
                        }}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(30,111,217,0.2)]"
                            : "border-primary/10 bg-white text-slate-600 hover:border-primary/30 hover:bg-primary-light hover:text-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />

                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Main location */}
          <section className="rounded-[1.8rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-7">
            <SectionHeading
              icon={Map}
              eyebrow="Main location"
              title="Where is this address?"
              description="Enter the city, area, and street exactly as they should appear."
            />

            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <AddressField
                icon={Building2}
                label="City"
                htmlFor="address-city"
                error={errors.city}
              >
                <input
                  id="address-city"
                  type="text"
                  autoComplete="address-level2"
                  disabled={busy}
                  placeholder="For example, Beirut"
                  {...register("city")}
                  className={fieldClass(Boolean(errors.city))}
                />
              </AddressField>

              <AddressField icon={MapPin} label="Area" htmlFor="address-area" error={errors.area}>
                <input
                  id="address-area"
                  type="text"
                  autoComplete="address-level3"
                  disabled={busy}
                  placeholder="Neighborhood or district"
                  {...register("area")}
                  className={fieldClass(Boolean(errors.area))}
                />
              </AddressField>

              <div className="lg:col-span-2">
                <AddressField
                  icon={Navigation}
                  label="Street"
                  htmlFor="address-street"
                  error={errors.street}
                  description="Include the street name and any useful road details."
                >
                  <input
                    id="address-street"
                    type="text"
                    autoComplete="street-address"
                    disabled={busy}
                    placeholder="Street name and number"
                    {...register("street")}
                    className={fieldClass(Boolean(errors.street))}
                  />
                </AddressField>
              </div>
            </div>
          </section>

          {/* Building information */}
          <section className="rounded-[1.8rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-7">
            <SectionHeading
              icon={Layers3}
              eyebrow="Building details"
              title="Help the team find the entrance"
              description="These details are optional, but they make arrival faster and easier."
            />

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <AddressField
                icon={Building2}
                label="Building"
                htmlFor="address-building"
                optional
                error={errors.building}
              >
                <input
                  id="address-building"
                  type="text"
                  autoComplete="off"
                  disabled={busy}
                  placeholder="Building name"
                  {...register("building")}
                  className={fieldClass(Boolean(errors.building))}
                />
              </AddressField>

              <AddressField
                icon={Layers3}
                label="Floor"
                htmlFor="address-floor"
                optional
                error={errors.floor}
              >
                <input
                  id="address-floor"
                  type="text"
                  autoComplete="off"
                  disabled={busy}
                  placeholder="For example, 3"
                  {...register("floor")}
                  className={fieldClass(Boolean(errors.floor))}
                />
              </AddressField>

              <AddressField
                icon={Home}
                label="Apartment"
                htmlFor="address-apartment"
                optional
                error={errors.apartment}
              >
                <input
                  id="address-apartment"
                  type="text"
                  autoComplete="off"
                  disabled={busy}
                  placeholder="For example, 12B"
                  {...register("apartment")}
                  className={fieldClass(Boolean(errors.apartment))}
                />
              </AddressField>
            </div>
          </section>

          {/* Default address */}
          <section
            className={`rounded-[1.8rem] border p-5 transition sm:p-7 ${
              watchedIsDefault
                ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-primary-light/30 shadow-[0_16px_40px_rgba(245,158,11,0.09)]"
                : "border-primary/10 bg-white"
            }`}
          >
            <label
              htmlFor="address-default"
              className="flex cursor-pointer flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                    watchedIsDefault ? "bg-amber-400 text-navy" : "bg-primary-light text-primary"
                  }`}
                >
                  <Star className={`h-5 w-5 ${watchedIsDefault ? "fill-current" : ""}`} />
                </span>

                <div>
                  <p className="font-heading text-xl font-black text-navy">
                    Make this my default address
                  </p>

                  <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                    CleanNest will preselect this location when you start a future booking.
                  </p>
                </div>
              </div>

              <span className="relative inline-flex shrink-0">
                <input
                  id="address-default"
                  type="checkbox"
                  disabled={busy}
                  {...register("isDefault")}
                  className="peer sr-only"
                />

                <span className="h-8 w-14 rounded-full bg-slate-200 transition peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />

                <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-transparent shadow-sm transition-all peer-checked:translate-x-6 peer-checked:text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
              </span>
            </label>
          </section>
        </div>

        {/* Live preview */}
        <aside className="space-y-6 xl:sticky xl:top-6">
          <section className="relative overflow-hidden rounded-[2rem] bg-navy text-white shadow-[0_24px_70px_rgba(11,37,69,0.22)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_90%_5%,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_5%_100%,rgba(30,111,217,0.38),transparent_38%)]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",

                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                  <MapPin className="h-6 w-6" />
                </span>

                {watchedIsDefault && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.11em] text-amber-200">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Default
                  </span>
                )}
              </div>

              <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                Live address preview
              </p>

              <h3 className="mt-3 break-words font-heading text-3xl font-black tracking-[-0.035em]">
                {watchedLabel.trim() || "New home base"}
              </h3>

              <div className="mt-7 space-y-4">
                <PreviewLine icon={Navigation} value={previewLines[0] ?? ""} />

                <PreviewLine
                  icon={Layers3}
                  value={previewLines[1] ?? ""}
                  muted={!watchedBuilding && !watchedFloor && !watchedApartment}
                />

                <PreviewLine
                  icon={Map}
                  value={previewLines[2] ?? ""}
                  muted={!watchedArea && !watchedCity}
                />
              </div>

              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                <p className="text-xs font-semibold leading-6 text-blue-100/70">
                  This location will be stored securely in your CleanNest account.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-[0_18px_50px_rgba(11,37,69,0.08)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </span>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                  Address checklist
                </p>

                <p className="mt-1 font-heading text-lg font-black text-navy">Ready to save</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <ChecklistItem label="Address label" complete={Boolean(watchedLabel.trim())} />

              <ChecklistItem label="City" complete={Boolean(watchedCity.trim())} />

              <ChecklistItem label="Area" complete={Boolean(watchedArea.trim())} />

              <ChecklistItem label="Street" complete={Boolean(watchedStreet.trim())} />
            </div>
          </section>
        </aside>
      </div>

      {/* Form actions */}
      <section className="flex flex-col gap-5 rounded-[1.8rem] border border-primary/10 bg-white p-5 shadow-[0_18px_50px_rgba(11,37,69,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </span>

          <div>
            <p className="font-heading text-lg font-black text-navy">
              {address ? "Save your updates" : "Add this home base"}
            </p>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Required fields must be completed before the address can be saved.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={busy || !isDirty}
            onClick={handleReset}
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-primary/15 bg-white px-6 text-sm font-extrabold text-slate-600 transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset changes
          </button>

          <button
            type="submit"
            disabled={busy || !isValid || (!isDirty && Boolean(address))}
            className="inline-flex min-h-[52px] min-w-[190px] items-center justify-center gap-3 rounded-2xl bg-primary px-7 text-sm font-extrabold text-white shadow-[0_15px_34px_rgba(30,111,217,0.26)] transition hover:-translate-y-0.5 hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Saving address…
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />

                {submitLabel}
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}

interface SectionHeadingProps {
  icon: ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
  description: string;
}

function SectionHeading({ icon: Icon, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>

        <h3 className="mt-2 font-heading text-xl font-black tracking-[-0.02em] text-navy">
          {title}
        </h3>

        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function AddressField({
  icon: Icon,
  label,
  htmlFor,
  optional = false,
  error,
  description,
  children,
}: AddressFieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-2 text-sm font-extrabold text-navy"
        >
          <Icon className="h-4 w-4 text-primary" />

          {label}
        </label>

        {optional && (
          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Optional
          </span>
        )}
      </div>

      {children}

      {description && !error?.message && (
        <p className="mt-2 text-xs font-medium leading-5 text-slate-400">{description}</p>
      )}

      {error?.message && (
        <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          {error.message}
        </p>
      )}
    </div>
  );
}

function fieldClass(hasError: boolean): string {
  return [
    "min-h-[54px] w-full rounded-2xl border bg-white px-4 text-sm font-semibold text-navy outline-none transition",
    "placeholder:text-slate-400",
    "focus:ring-4",
    "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70",

    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-primary/15 focus:border-primary focus:ring-primary/10",
  ].join(" ");
}

interface PreviewLineProps {
  icon: ComponentType<{
    className?: string;
  }>;

  value: string;
  muted?: boolean;
}

function PreviewLine({ icon: Icon, value, muted = false }: PreviewLineProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
        <Icon className="h-4 w-4" />
      </span>

      <p
        className={`pt-1 text-sm font-semibold leading-6 ${
          muted ? "text-blue-100/35" : "text-blue-100/80"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ChecklistItem({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        complete ? "border-emerald-100 bg-emerald-50" : "border-slate-100 bg-slate-50"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          complete ? "bg-emerald-500 text-white" : "bg-white text-slate-300"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>

      <span className={`text-sm font-bold ${complete ? "text-emerald-700" : "text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}
