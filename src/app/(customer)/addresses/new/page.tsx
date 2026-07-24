"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";

import { useAddresses } from "@/hooks/useAddresses";
import { AddressForm } from "@/components/addresses/AddressForm";

import type { CreateAddressValues } from "@/validators/addressValidator";

function NewAddressContent() {
  const router = useRouter();
  const { addAddress, loading, error } = useAddresses();

  async function handleSubmit(values: CreateAddressValues) {
    const created = await addAddress(values);
    if (created) {
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
        className="pointer-events-none absolute -left-44 top-32 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"
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
              <MapPin className="h-7 w-7" />
            </span>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                New saved location
              </p>
              <h1 className="mt-2 font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Add an address
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-blue-100/70">
                Save this location once, then select it quickly whenever you book a CleanNest
                service.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-extrabold text-emerald-200">
            <Sparkles className="h-4 w-4" />
            Secure address setup
          </span>
        </header>

        <AddressForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          submitLabel="Save address"
        />
      </div>
    </main>
  );
}

export default function NewAddressPage() {
  return <NewAddressContent />;
}
