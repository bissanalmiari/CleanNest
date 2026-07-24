"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Home,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import InlineAddressDialog from "./InlineAddressDialog";

export interface HomeBaseAddress {
  id: string;

  label: string;
  city: string;
  area: string;
  street: string;

  building: string;
  floor: string;
  apartment: string;
  postalCode: string;

  landmark: string;
  accessInstructions: string;
  contactPhone: string;

  fullAddress: string;

  isDefault: boolean;
  isServiceable: boolean;

  serviceAreaId: string;
  serviceAreaLabel: string;
  serviceFee: number;

  maximumConcurrentBookings: number;
}

interface HomeBaseStepProps {
  selectedAddressId: string;

  onSelect: (address: HomeBaseAddress) => void;
}

interface AddressApiResponse {
  success?: boolean;

  data?: {
    addresses?: unknown;
  };

  addresses?: unknown;

  error?: string;
  message?: string;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeAddress(value: unknown): HomeBaseAddress | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  const id = readString(record.id) || readString(record._id);

  if (!id) {
    return null;
  }

  return {
    id,

    label: readString(record.label, "Saved address"),

    city: readString(record.city),

    area: readString(record.area),

    street: readString(record.street),

    building: readString(record.building),

    floor: readString(record.floor),

    apartment: readString(record.apartment),

    postalCode: readString(record.postalCode),

    landmark: readString(record.landmark),

    accessInstructions: readString(record.accessInstructions),

    contactPhone: readString(record.contactPhone),

    fullAddress: readString(record.fullAddress),

    isDefault: record.isDefault === true,

    isServiceable: record.isServiceable === true,

    serviceAreaId: readString(record.serviceAreaId),

    serviceAreaLabel: readString(record.serviceAreaLabel),

    serviceFee: Math.max(0, readNumber(record.serviceFee)),

    maximumConcurrentBookings: Math.max(0, readNumber(record.maximumConcurrentBookings)),
  };
}

function normalizeAddressArray(value: unknown): HomeBaseAddress[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeAddress)
    .filter((address): address is HomeBaseAddress => address !== null);
}

function extractAddresses(payload: AddressApiResponse): HomeBaseAddress[] {
  const nestedAddresses = normalizeAddressArray(payload.data?.addresses);

  if (nestedAddresses.length > 0) {
    return nestedAddresses;
  }

  return normalizeAddressArray(payload.addresses);
}

function formatCurrency(value: number): string {
  if (value <= 0) {
    return "No area fee";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function HomeBaseStep({ selectedAddressId, onSelect }: HomeBaseStepProps) {
  const prefersReducedMotion = useReducedMotion();

  const [addresses, setAddresses] = useState<HomeBaseAddress[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [unavailableAddressId, setUnavailableAddressId] = useState<string | null>(null);

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  const loadAddresses = useCallback(async (showLoading = true): Promise<HomeBaseAddress[]> => {
    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await fetch("/api/customer/booking-addresses", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const responseText = await response.text();

      let payload: AddressApiResponse = {};

      if (responseText.trim()) {
        try {
          payload = JSON.parse(responseText) as AddressApiResponse;
        } catch {
          throw new Error(
            response.status === 404
              ? "The booking-addresses API route was not found."
              : "The address server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Unable to load your saved addresses.");
      }

      const nextAddresses = extractAddresses(payload);
      setAddresses(nextAddresses);
      return nextAddresses;
    } catch (error) {
      setAddresses([]);

      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load your saved addresses."
      );
      return [];
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const selectedAddress = useMemo(
    () =>
      addresses.find((address) => address.id === selectedAddressId && address.isServiceable) ??
      null,
    [addresses, selectedAddressId]
  );

  const serviceableCount = useMemo(
    () => addresses.filter((address) => address.isServiceable).length,
    [addresses]
  );

  const handleAddressCreated = useCallback(
    async (addressId: string) => {
      const refreshedAddresses = await loadAddresses(false);
      const createdAddress = refreshedAddresses.find((address) => address.id === addressId) ?? null;

      if (!createdAddress) {
        throw new Error("The new address was saved but could not be reloaded.");
      }

      if (!createdAddress.isServiceable) {
        throw new Error("The new address was saved but its service area is not available.");
      }

      onSelect(createdAddress);
      setUnavailableAddressId(null);
      setIsAddressDialogOpen(false);
    },
    [loadAddresses, onSelect]
  );

  if (isLoading) {
    return (
      <div className="mt-8 flex min-h-[350px] items-center justify-center rounded-[1.8rem] border border-primary/10 bg-white">
        <div className="px-6 text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />

          <h3 className="mt-5 font-heading text-2xl font-black text-navy">
            Locating your saved homes
          </h3>

          <p className="mt-3 text-base font-medium text-slate-500">
            Checking your addresses against active CleanNest service areas.
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mt-8 rounded-[1.8rem] border border-red-200 bg-red-50 p-7 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

        <h3 className="mt-5 font-heading text-2xl font-black text-red-800">
          Addresses could not be loaded
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={() => {
            void loadAddresses();
          }}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-red-600 px-6 text-sm font-extrabold text-white transition hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <>
        <div className="mt-8 rounded-[1.8rem] border border-amber-200 bg-amber-50 p-7 text-center">
          <MapPin className="mx-auto h-10 w-10 text-amber-600" />

          <h3 className="mt-5 font-heading text-2xl font-black text-amber-900">
            No saved addresses yet
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-amber-700">
            Add an address here and keep every booking choice you already made.
          </p>

          <button
            type="button"
            onClick={() => {
              setIsAddressDialogOpen(true);
            }}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-navy px-6 text-sm font-extrabold text-white transition hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            Create address here
          </button>
        </div>

        <InlineAddressDialog
          open={isAddressDialogOpen}
          onClose={() => {
            setIsAddressDialogOpen(false);
          }}
          onCreated={handleAddressCreated}
        />
      </>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-5 rounded-[1.6rem] border border-primary/10 bg-primary-light/35 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300">
            <Navigation className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
              Saved destinations
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black text-navy">
              Choose where CleanNest should arrive
            </h3>

            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Only addresses inside an active CleanNest service area can be selected.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-primary/15 bg-white px-4 py-2 text-xs font-extrabold text-primary">
            {serviceableCount} serviceable
          </span>

          <Link
            href="/addresses"
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Manage addresses
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsAddressDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(30,111,217,0.2)] transition hover:bg-navy"
          >
            <Plus className="h-4 w-4" />
            Add address here
          </button>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              Home base directory
            </p>

            <h3 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-navy">
              Select one saved address
            </h3>
          </div>

          <p className="max-w-md text-base font-medium leading-7 text-slate-500 md:text-right">
            The service-area fee appears in your booking total immediately after selection.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-5">
          {addresses.map((address, index) => {
            const isSelected = address.id === selectedAddressId;
            const isUnavailableActive = unavailableAddressId === address.id;

            return (
              <motion.button
                key={address.id}
                type="button"
                onClick={() => {
                  if (!address.isServiceable) {
                    setUnavailableAddressId(address.id);
                    return;
                  }

                  setUnavailableAddressId(null);
                  onSelect(address);
                }}
                initial={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: 0,
                        y: 18,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.06, 0.3),
                }}
                whileHover={
                  prefersReducedMotion || !address.isServiceable
                    ? undefined
                    : {
                        y: -4,
                      }
                }
                whileTap={
                  !address.isServiceable
                    ? undefined
                    : {
                        scale: 0.985,
                      }
                }
                aria-pressed={isSelected}
                aria-describedby={
                  isUnavailableActive ? `unavailable-address-${address.id}` : undefined
                }
                className={`relative min-h-[370px] overflow-hidden rounded-[1.7rem] border p-6 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/70 shadow-[0_22px_55px_rgba(30,111,217,0.16)]"
                    : address.isServiceable
                      ? "border-slate-200 bg-white shadow-[0_12px_35px_rgba(11,37,69,0.06)] hover:border-primary/35"
                      : "cursor-pointer border-red-200 bg-red-50/60 opacity-80 hover:border-red-400"
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`absolute -right-16 -top-16 h-48 w-48 rounded-full ${
                    isSelected
                      ? "bg-primary/10"
                      : address.isServiceable
                        ? "bg-slate-50"
                        : "bg-red-100/60"
                  }`}
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                        isSelected
                          ? "bg-primary text-white shadow-[0_12px_28px_rgba(30,111,217,0.28)]"
                          : address.isServiceable
                            ? "bg-primary-light text-primary"
                            : "bg-red-100 text-red-500"
                      }`}
                    >
                      {address.label.toLowerCase().includes("home") ? (
                        <Home className="h-6 w-6" />
                      ) : (
                        <Building2 className="h-6 w-6" />
                      )}
                    </span>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : address.isServiceable
                            ? "border-slate-200 bg-white text-transparent"
                            : "border-red-200 bg-red-100 text-red-500"
                      }`}
                    >
                      {address.isServiceable ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-300">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] ${
                          address.isServiceable
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {address.isServiceable ? "Service available" : "Outside service area"}
                      </span>
                    </div>

                    <h4 className="mt-5 font-heading text-2xl font-black text-navy">
                      {address.label}
                    </h4>

                    <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                      {address.fullAddress}
                    </p>
                  </div>

                  {address.landmark && (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-surface-soft p-4">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {address.landmark}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto grid grid-cols-1 gap-3 border-t border-primary/10 pt-6 sm:grid-cols-2">
                    <div className="rounded-2xl bg-surface-soft p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                        Service area
                      </p>

                      <p className="mt-2 text-sm font-extrabold leading-6 text-navy">
                        {address.serviceAreaLabel}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-surface-soft p-4">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-primary" />

                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                          Area fee
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-extrabold text-navy">
                        {address.isServiceable ? formatCurrency(address.serviceFee) : "Unavailable"}
                      </p>
                    </div>
                  </div>

                  {isUnavailableActive && (
                    <div
                      id={`unavailable-address-${address.id}`}
                      role="alert"
                      className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm font-semibold leading-6 text-red-700"
                    >
                      This address does not match an active CleanNest service area. Edit it from
                      Manage addresses above, or add another saved address.
                    </div>
                  )}

                  {address.contactPhone && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Phone className="h-4 w-4 text-primary" />

                      {address.contactPhone}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {selectedAddress && (
        <motion.section
          initial={
            prefersReducedMotion
              ? undefined
              : {
                  opacity: 0,
                  y: 12,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="grid gap-5 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </span>

            <div>
              <p className="text-lg font-extrabold text-emerald-900">Home base selected</p>

              <p className="mt-2 text-base font-semibold leading-7 text-emerald-700">
                {selectedAddress.label} · {selectedAddress.serviceAreaLabel} ·{" "}
                {formatCurrency(selectedAddress.serviceFee)}
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />

            <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
              Address ready
            </span>
          </div>
        </motion.section>
      )}

      <InlineAddressDialog
        open={isAddressDialogOpen}
        onClose={() => {
          setIsAddressDialogOpen(false);
        }}
        onCreated={handleAddressCreated}
      />
    </div>
  );
}
