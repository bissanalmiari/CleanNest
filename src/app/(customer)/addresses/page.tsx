"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Home,
  LoaderCircle,
  Map,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AddressCard } from "@/components/addresses/AddressCard";
import { useAddresses } from "@/hooks/useAddresses";

import type { Address } from "@/types/user";

function AddressesContent() {
  const prefersReducedMotion = useReducedMotion();

  const { addresses, loading, error, fetchAddresses, removeAddress, setDefault } = useAddresses();

  const [searchQuery, setSearchQuery] = useState("");

  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    if (!addressToDelete) {
      return;
    }

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    deleteCancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setAddressToDelete(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [addressToDelete, isDeleting]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const visibleAddresses = useMemo(() => {
    if (!normalizedSearchQuery) {
      return addresses;
    }

    return addresses.filter((address) => {
      const searchableText = [
        address.label,
        address.street,
        address.area,
        address.city,
        address.building,
        address.floor,
        address.apartment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [addresses, normalizedSearchQuery]);

  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? null,
    [addresses]
  );

  const uniqueCityCount = useMemo(() => {
    return new Set(addresses.map((address) => address.city.trim().toLowerCase()).filter(Boolean))
      .size;
  }, [addresses]);

  const uniqueAreaCount = useMemo(() => {
    return new Set(
      addresses
        .map(
          (address) => `${address.city.trim().toLowerCase()}::${address.area.trim().toLowerCase()}`
        )
        .filter(Boolean)
    ).size;
  }, [addresses]);

  function requestDelete(addressId: string) {
    const selectedAddress = addresses.find((address) => address.id === addressId);

    if (!selectedAddress) {
      return;
    }

    setAddressToDelete(selectedAddress);
  }

  async function confirmDelete() {
    if (!addressToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);

    const result = await removeAddress(addressToDelete.id);

    setIsDeleting(false);

    if (result !== null) {
      setAddressToDelete(null);
    }
  }

  async function handleSetDefault(addressId: string) {
    await setDefault(addressId);
  }

  const showInitialLoading = loading && addresses.length === 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Blueprint background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",

          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-32 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 40, 0],
                scale: [1, 1.14, 1],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-52 top-0 h-[34rem] w-[34rem] rounded-full bg-cyan-300/10 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, 35, 0],

                scale: [1.08, 0.94, 1.08],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto max-w-[1450px]">
        {/* Page heading */}
        <header className="mb-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_15px_35px_rgba(11,37,69,0.2)]">
                <MapPin className="h-5 w-5" />
              </span>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                  Personal home network
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  CleanNest location center
                </p>
              </div>
            </div>

            <h1 className="mt-6 font-heading text-4xl font-black tracking-[-0.045em] text-navy sm:text-5xl">
              Your trusted home bases.
            </h1>

            <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-500">
              Save the places where you book CleanNest services, choose your preferred default
              address, and keep every location organized.
            </p>
          </div>

          <Link
            href="/addresses/new"
            className="group inline-flex min-h-[54px] w-fit items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_16px_38px_rgba(30,111,217,0.28)] transition hover:-translate-y-1 hover:bg-navy"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Add new address
          </Link>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.2rem] bg-navy text-white shadow-[0_35px_100px_rgba(11,37,69,0.22)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(34,211,238,0.22),transparent_32%),radial-gradient(circle_at_8%_100%,rgba(30,111,217,0.4),transparent_38%)]"
          />

          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-60 w-60 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="absolute -right-3 -top-3 h-36 w-36 rounded-full border border-white/10"
          />

          <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                  Address collection
                </span>

                {defaultAddress && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    Default selected
                  </span>
                )}
              </div>

              <h2 className="mt-6 max-w-3xl font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Every cleaning journey starts from the right address.
              </h2>

              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-blue-100/70">
                Keep home, office, and family locations ready for faster booking and easier service
                planning.
              </p>

              {defaultAddress && (
                <div className="mt-7 flex max-w-xl items-start gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-navy">
                    <Star className="h-5 w-5 fill-current" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-200">
                      Current default
                    </p>

                    <p className="mt-2 truncate font-heading text-xl font-black">
                      {defaultAddress.label}
                    </p>

                    <p className="mt-1 text-sm font-medium text-blue-100/65">
                      {defaultAddress.area}, {defaultAddress.city}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Hero map illustration */}
            <div className="relative min-h-[280px] overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",

                  backgroundSize: "34px 34px",
                }}
              />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                    Location map
                  </p>

                  <p className="mt-2 font-heading text-xl font-black">CleanNest network</p>
                </div>

                <Map className="h-6 w-6 text-cyan-300" />
              </div>

              <div className="relative mt-7 h-44">
                <div className="absolute left-[8%] top-[48%] h-1 w-[73%] rotate-[-9deg] rounded-full bg-white/10" />

                <div className="absolute left-[18%] top-[22%] h-[58%] w-1 rotate-[15deg] rounded-full bg-white/10" />

                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: [0, -8, 0],
                        }
                  }
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute left-[14%] top-[30%] flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-navy bg-primary text-white shadow-xl"
                >
                  <Home className="h-5 w-5" />
                </motion.span>

                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: [0, 7, 0],
                        }
                  }
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute right-[16%] top-[12%] flex h-11 w-11 items-center justify-center rounded-2xl border-4 border-navy bg-cyan-300 text-navy shadow-xl"
                >
                  <Building2 className="h-5 w-5" />
                </motion.span>

                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: [1, 1.12, 1],
                        }
                  }
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-[5%] left-[52%] flex h-12 w-12 items-center justify-center rounded-full border-4 border-navy bg-emerald-400 text-navy shadow-xl"
                >
                  <MapPin className="h-5 w-5" />
                </motion.span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AddressStat
            icon={MapPin}
            label="Saved addresses"
            value={String(addresses.length)}
            description="Ready for future bookings"
          />

          <AddressStat
            icon={Star}
            label="Default location"
            value={defaultAddress?.label ?? "Not selected"}
            description={
              defaultAddress
                ? `${defaultAddress.area}, ${defaultAddress.city}`
                : "Choose a preferred location"
            }
          />

          <AddressStat
            icon={Building2}
            label="Cities covered"
            value={String(uniqueCityCount)}
            description="Cities in your address book"
          />

          <AddressStat
            icon={Map}
            label="Saved areas"
            value={String(uniqueAreaCount)}
            description="Unique neighborhoods"
          />
        </section>

        {/* Address collection */}
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-[0_25px_75px_rgba(11,37,69,0.1)] backdrop-blur-xl">
          <div className="border-b border-primary/10 p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Home className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                      Saved locations
                    </p>

                    <h2 className="mt-1 font-heading text-2xl font-black tracking-[-0.03em] text-navy sm:text-3xl">
                      Your address collection
                    </h2>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                  Search, edit, remove, or select the location CleanNest should use by default.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                <div className="relative min-w-0 sm:min-w-[310px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    aria-label="Search saved addresses"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                    }}
                    placeholder="Search addresses..."
                    className="min-h-[52px] w-full rounded-2xl border border-primary/15 bg-[#f8fbfe] py-3 pl-12 pr-11 text-sm font-semibold text-navy outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                      }}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-primary-light hover:text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    void fetchAddresses();
                  }}
                  className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-2xl border border-primary/15 bg-white px-5 text-sm font-extrabold text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-4 rounded-[1.5rem] border border-red-200 bg-red-50 p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </span>

                <div>
                  <p className="font-extrabold text-red-800">Addresses could not be updated</p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-red-600">{error}</p>
                </div>
              </div>
            )}

            {showInitialLoading && <AddressLoadingGrid />}

            {!showInitialLoading && addresses.length === 0 && !error && (
              <EmptyAddressState prefersReducedMotion={Boolean(prefersReducedMotion)} />
            )}

            {!showInitialLoading && addresses.length > 0 && visibleAddresses.length === 0 && (
              <div className="rounded-[1.8rem] border border-dashed border-primary/20 bg-primary-light/30 px-6 py-14 text-center">
                <Search className="mx-auto h-10 w-10 text-primary/40" />

                <h3 className="mt-5 font-heading text-2xl font-black text-navy">
                  No matching address
                </h3>

                <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-7 text-slate-500">
                  No saved location matches “{searchQuery}”.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-navy"
                >
                  Clear search
                </button>
              </div>
            )}

            {!showInitialLoading && visibleAddresses.length > 0 && (
              <div className="grid gap-5">
                <AnimatePresence>
                  {visibleAddresses.map((address, index) => (
                    <motion.div
                      key={address.id}
                      layout
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
                      exit={
                        prefersReducedMotion
                          ? undefined
                          : {
                              opacity: 0,

                              scale: 0.97,

                              y: -10,
                            }
                      }
                      transition={{
                        delay: index * 0.04,

                        duration: 0.35,
                      }}
                    >
                      <AddressCard
                        address={address}
                        busy={loading || isDeleting}
                        onDelete={requestDelete}
                        onSetDefault={handleSetDefault}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* Security note */}
        <section className="mt-7 flex flex-col gap-5 rounded-[1.8rem] border border-emerald-100 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>

            <div>
              <p className="font-heading text-xl font-black text-emerald-900">
                Your locations stay private
              </p>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-emerald-700">
                Saved addresses are available only to your account and are used to prepare and
                deliver your CleanNest bookings.
              </p>
            </div>
          </div>

          <Link
            href="/book-service"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700"
          >
            Book a service
            <MapPin className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {addressToDelete && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy/65 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
            aria-describedby="delete-address-description"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDeleting) {
                setAddressToDelete(null);
              }
            }}
          >
            <motion.div
              initial={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: 0,
                      scale: 0.94,
                      y: 25,
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: 0,
                      scale: 0.96,
                      y: 15,
                    }
              }
              transition={{
                duration: 0.25,
              }}
              className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_35px_100px_rgba(11,37,69,0.3)]"
            >
              <div className="bg-red-500 p-7 text-white">
                <div className="flex items-start justify-between gap-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                    <Trash2 className="h-7 w-7" />
                  </span>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setAddressToDelete(null);
                    }}
                    aria-label="Close delete confirmation"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-red-100">
                  Permanent action
                </p>

                <h2 id="delete-address-title" className="mt-2 font-heading text-3xl font-black">
                  Remove this address?
                </h2>
              </div>

              <div className="p-7">
                <div className="rounded-[1.4rem] border border-red-100 bg-red-50 p-5">
                  <p className="font-heading text-xl font-black text-navy">
                    {addressToDelete.label}
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {addressToDelete.street}, {addressToDelete.area}, {addressToDelete.city}
                  </p>
                </div>

                <p
                  id="delete-address-description"
                  className="mt-5 text-sm font-medium leading-7 text-slate-500"
                >
                  This saved address will no longer appear in your address collection. Existing
                  booking records are not changed.
                </p>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    ref={deleteCancelButtonRef}
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setAddressToDelete(null);
                    }}
                    className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-primary/15 bg-white px-6 text-sm font-extrabold text-slate-600 transition hover:border-primary/35 hover:text-primary disabled:opacity-50"
                  >
                    Keep address
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      void confirmDelete();
                    }}
                    className="inline-flex min-h-[50px] min-w-[175px] items-center justify-center gap-3 rounded-2xl bg-red-500 px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(239,68,68,0.24)] transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Removing…
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-5 w-5" />
                        Remove address
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function AddressesPage() {
  return <AddressesContent />;
}

interface AddressStatProps {
  icon: typeof MapPin;
  label: string;
  value: string;
  description: string;
}

function AddressStat({ icon: Icon, label, value, description }: AddressStatProps) {
  return (
    <div className="rounded-[1.7rem] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(11,37,69,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" />
        </span>

        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
      </div>

      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate font-heading text-2xl font-black text-navy" title={value}>
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{description}</p>
    </div>
  );
}

function AddressLoadingGrid() {
  return (
    <div className="grid gap-5">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.7rem] border border-slate-100 bg-[#f8fbfe] p-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-200" />

            <div className="flex-1">
              <div className="h-5 w-40 rounded-full bg-slate-200" />

              <div className="mt-4 h-3 w-3/4 rounded-full bg-slate-100" />

              <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-24 rounded-xl bg-slate-100" />

              <div className="h-10 w-16 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyAddressState({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-primary/25 bg-primary-light/30 px-6 py-14 text-center sm:px-10">
      <div
        aria-hidden="true"
        className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <motion.span
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, -8, 0],

                rotate: [0, 3, 0, -3, 0],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-navy text-cyan-300 shadow-[0_20px_50px_rgba(11,37,69,0.2)]"
      >
        <MapPin className="h-9 w-9" />
      </motion.span>

      <h3 className="relative mt-7 font-heading text-3xl font-black tracking-[-0.04em] text-navy">
        Create your first home base
      </h3>

      <p className="relative mx-auto mt-4 max-w-xl text-base font-medium leading-8 text-slate-500">
        Save an address once and use it whenever you schedule a future CleanNest service.
      </p>

      <Link
        href="/addresses/new"
        className="relative mt-7 inline-flex min-h-[52px] items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(30,111,217,0.24)] transition hover:-translate-y-1 hover:bg-navy"
      >
        <Plus className="h-5 w-5" />
        Add your first address
      </Link>
    </div>
  );
}
