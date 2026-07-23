"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { AddressForm } from "@/components/addresses/AddressForm";
import type { CreateAddressValues } from "@/validators/addressValidator";

function NewAddressContent() {
  const router = useRouter();
  const { addAddress, loading, error } = useAddresses();

  async function handleSubmit(values: CreateAddressValues) {
    const created = await addAddress(values);
    if (created) router.push("/addresses");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <Link href="/addresses" className="text-sm font-medium text-primary hover:underline">
          ← Back to addresses
        </Link>
        <h1 className="mt-2 font-heading text-xl font-semibold text-navy">Add address</h1>
        <p className="text-sm text-navy/60">Save a new address to book cleanings at.</p>
      </div>

      <div className="rounded-card bg-surface p-6 shadow-card">
        <AddressForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          submitLabel="Save address"
        />
      </div>
    </div>
  );
}

export default function NewAddressPage() {
  return (
    <RequireAuth allowedRoles={["customer"]}>
      <NewAddressContent />
    </RequireAuth>
  );
}