"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, LoaderCircle, MapPin, Pencil } from "lucide-react";

import { useAddresses } from "@/hooks/useAddresses";
import { AddressForm } from "@/components/addresses/AddressForm";

import type { CreateAddressValues, UpdateAddressValues } from "@/validators/addressValidator";

function EditAddressContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addresses, fetchAddresses, editAddress, loading, error } = useAddresses();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    void fetchAddresses().then(() => {
      if (isActive) {
        setHasLoaded(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, [fetchAddresses]);

  const address = useMemo(
    () => addresses.find((item) => item.id === params.id) ?? null,
    [addresses, params.id]
  );

  const showLoading = !hasLoaded || (loading && !address);
  const showNotFound = hasLoaded && !loading && !error && !address;

  async function handleSubmit(values: CreateAddressValues) {
    const updated = await editAddress(params.id, values as UpdateAddressValues);
    if (updated) {
      router.push("/addresses");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-28 h-[30rem] w-[30rem] rounded-full bg-cyan-300/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1450px]">
        <Link
          href="/addresses"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 text-sm font-extrabold text-primary shadow-sm transition hover:border-primary/25 hover:bg-primary-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to addresses
        </Link>

        <header className="mb-7 mt-6 flex flex-col gap-5 rounded-[2rem] bg-navy p-6 text-white shadow-[0_28px_80px_rgba(11,37,69,0.2)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
              <Pencil className="h-7 w-7" />
            </span>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                Saved location details
              </p>
              <h1 className="mt-2 font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Edit address
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-blue-100/70">
                Keep this home base accurate so arrivals and future bookings stay effortless.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-extrabold text-cyan-200">
            <MapPin className="h-4 w-4" />
            {address?.label ?? "Loading location"}
          </span>
        </header>

        {showLoading && (
          <section
            aria-live="polite"
            className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-primary/10 bg-white"
          >
            <div className="px-6 text-center">
              <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h2 className="mt-5 font-heading text-2xl font-black text-navy">Loading address</h2>
              <p className="mt-3 text-sm font-medium text-slate-500">
                Getting the latest saved details.
              </p>
            </div>
          </section>
        )}

        {showNotFound && (
          <section
            role="alert"
            className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center"
          >
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-5 font-heading text-2xl font-black text-red-800">
              Address not found
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-red-600">
              This address may have been removed. Return to your saved locations and choose another
              one.
            </p>
            <Link
              href="/addresses"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-extrabold text-white transition hover:bg-red-700"
            >
              View saved addresses
            </Link>
          </section>
        )}

        {hasLoaded && error && !address && (
          <section
            role="alert"
            className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center"
          >
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-5 font-heading text-2xl font-black text-red-800">
              Address could not be loaded
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-red-600">
              {error}
            </p>
          </section>
        )}

        {address && (
          <AddressForm
            address={address}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitLabel="Save changes"
          />
        )}
      </div>
    </main>
  );
}

export default function EditAddressPage() {
  return <EditAddressContent />;
}
