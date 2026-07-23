"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { AddressCard } from "@/components/addresses/AddressCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

function AddressesContent() {
  const { addresses, loading, error, fetchAddresses, removeAddress, setDefault } =
    useAddresses();

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this address? This can't be undone.")) return;
    await removeAddress(id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-navy">Saved Addresses</h1>
          <p className="text-sm text-navy/60">Manage the addresses you book cleanings at.</p>
        </div>
        <Link href="/addresses/new">
          <Button type="button">
            <Plus className="h-4 w-4" /> Add address
          </Button>
        </Link>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading && addresses.length === 0 && (
        <p className="text-sm text-navy/60">Loading addresses...</p>
      )}

      {!loading && addresses.length === 0 && !error && (
        <div className="rounded-card border border-dashed border-navy/15 bg-surface-soft p-8 text-center">
          <p className="text-sm text-navy/60">
            You haven&apos;t saved any addresses yet.
          </p>
          <Link href="/addresses/new" className="mt-3 inline-block">
            <Button type="button" variant="secondary" size="sm">
              Add your first address
            </Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            busy={loading}
            onDelete={handleDelete}
            onSetDefault={setDefault}
          />
        ))}
      </div>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <RequireAuth allowedRoles={["customer"]}>
      <AddressesContent />
    </RequireAuth>
  );
}