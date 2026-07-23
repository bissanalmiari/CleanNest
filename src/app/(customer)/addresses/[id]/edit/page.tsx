"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { AddressForm } from "@/components/addresses/AddressForm";
import { Alert } from "@/components/ui/Alert";
import type { CreateAddressValues, UpdateAddressValues } from "@/validators/addressValidator";
import type { Address } from "@/types/user";

function EditAddressContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addresses, fetchAddresses, editAddress, loading, error } = useAddresses();
  const [notFound, setNotFound] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (addresses.length === 0) return;
    const found = addresses.find((a) => a.id === params.id);
    setAddress(found ?? null);
    setNotFound(!found);
  }, [addresses, params.id]);

  async function handleSubmit(values: CreateAddressValues) {
    const updated = await editAddress(params.id, values as UpdateAddressValues);
    if (updated) router.push("/addresses");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <Link href="/addresses" className="text-sm font-medium text-primary hover:underline">
          ← Back to addresses
        </Link>
        <h1 className="mt-2 font-heading text-xl font-semibold text-navy">Edit address</h1>
      </div>

      {notFound && <Alert variant="error">This address wasn&apos;t found.</Alert>}

      {address && (
        <div className="rounded-card bg-surface p-6 shadow-card">
          <AddressForm
            address={address}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitLabel="Save changes"
          />
        </div>
      )}
    </div>
  );
}

export default function EditAddressPage() {
  return (
    <RequireAuth allowedRoles={["customer"]}>
      <EditAddressContent />
    </RequireAuth>
  );
}