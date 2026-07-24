"use client";

import Link from "next/link";

import {
  Briefcase,
  Building2,
  CheckCircle2,
  Home,
  Layers,
  MapPin,
  Navigation,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";

import type { Address } from "@/types/user";

interface AddressCardProps {
  address: Address;

  onDelete: (id: string) => void;

  onSetDefault: (id: string) => void;

  busy: boolean;
}

type AddressIcon = typeof Home | typeof Briefcase | typeof Building2;

interface AddressPresentation {
  icon: AddressIcon;
  category: string;
}

function getAddressPresentation(label: string): AddressPresentation {
  const normalizedLabel = label.trim().toLowerCase();

  if (
    normalizedLabel.includes("office") ||
    normalizedLabel.includes("work") ||
    normalizedLabel.includes("business")
  ) {
    return {
      icon: Briefcase,
      category: "Work location",
    };
  }

  if (
    normalizedLabel.includes("home") ||
    normalizedLabel.includes("house") ||
    normalizedLabel.includes("apartment")
  ) {
    return {
      icon: Home,
      category: "Residential location",
    };
  }

  return {
    icon: Building2,
    category: "Saved location",
  };
}

function buildStreetDetails(address: Address): string {
  return [
    address.building ? `Building ${address.building}` : "",

    address.floor ? `Floor ${address.floor}` : "",

    address.apartment ? `Apartment ${address.apartment}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function buildFullAddress(address: Address): string {
  return [address.street, buildStreetDetails(address), `${address.area}, ${address.city}`]
    .filter(Boolean)
    .join(", ");
}

export function AddressCard({ address, onDelete, onSetDefault, busy }: AddressCardProps) {
  const presentation = getAddressPresentation(address.label);

  const AddressIcon = presentation.icon;

  const streetDetails = buildStreetDetails(address);

  const fullAddress = buildFullAddress(address);

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.8rem] border transition duration-300 ${
        address.isDefault
          ? "border-primary/30 bg-gradient-to-br from-primary-light/75 via-white to-cyan-50 shadow-[0_22px_55px_rgba(30,111,217,0.13)]"
          : "border-primary/10 bg-white shadow-[0_14px_40px_rgba(11,37,69,0.07)] hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_65px_rgba(11,37,69,0.12)]"
      }`}
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl transition duration-500 group-hover:scale-110 ${
          address.isDefault ? "bg-primary/15" : "bg-primary/7"
        }`}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-24 w-40 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.16) 1px, transparent 1px)",

          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          {/* Address information */}
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <div
              className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-16 sm:w-16 ${
                address.isDefault
                  ? "bg-primary text-white shadow-[0_14px_30px_rgba(30,111,217,0.24)]"
                  : "bg-primary-light text-primary"
              }`}
            >
              <AddressIcon className="h-6 w-6" />

              {address.isDefault && (
                <span className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-emerald-400 text-navy shadow-md">
                  <Star className="h-3.5 w-3.5 fill-current" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="break-words font-heading text-xl font-black tracking-[-0.025em] text-navy sm:text-2xl">
                  {address.label}
                </h3>

                {address.isDefault && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Default
                  </span>
                )}
              </div>

              <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">
                {presentation.category}
              </p>

              <div className="mt-5 space-y-3">
                <AddressInformationLine icon={Navigation} label="Street" value={address.street} />

                {streetDetails && (
                  <AddressInformationLine
                    icon={Layers}
                    label="Building details"
                    value={streetDetails}
                  />
                )}

                <AddressInformationLine
                  icon={MapPin}
                  label="Area"
                  value={`${address.area}, ${address.city}`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-primary/10 pt-5 xl:max-w-[310px] xl:justify-end xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            {!address.isDefault && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onSetDefault(address.id);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-extrabold text-amber-700 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-50"
              >
                <Star className="h-4 w-4" />
                Set default
              </button>
            )}

            {busy ? (
              <span
                aria-disabled="true"
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-primary/10 bg-slate-100 px-4 text-xs font-extrabold text-slate-400"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </span>
            ) : (
              <Link
                href={`/addresses/${encodeURIComponent(address.id)}/edit`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 text-xs font-extrabold text-primary transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-light"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onDelete(address.id);
              }}
              aria-label={`Delete ${address.label}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-100 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-4 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>

            <div>
              <p className="text-xs font-extrabold text-navy">Saved securely</p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Available for your future CleanNest bookings
              </p>
            </div>
          </div>

          <p
            className="max-w-full truncate rounded-xl bg-surface-soft px-4 py-2 text-xs font-semibold text-slate-500 sm:max-w-[360px]"
            title={fullAddress}
          >
            {fullAddress}
          </p>
        </div>
      </div>
    </article>
  );
}

interface AddressInformationLineProps {
  icon: typeof MapPin;
  label: string;
  value: string;
}

function AddressInformationLine({ icon: Icon, label, value }: AddressInformationLineProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-600">{value}</p>
      </div>
    </div>
  );
}
