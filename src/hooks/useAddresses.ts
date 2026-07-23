"use client";

// useAddresses — thin client wrapper around /api/addresses/*. Mirrors the
// shape of useAuth/useProfile (loading, error, setError, a `run` helper).
import { useCallback, useState } from "react";
import type { Address } from "@/types/user";
import type { CreateAddressValues, UpdateAddressValues } from "@/validators/addressValidator";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function callApi<T>(
  url: string,
  init?: { method?: string; body?: unknown }
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Something went wrong. Please try again.");
  }
  return json;
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAddresses = useCallback(
    () =>
      run(async () => {
        const { data } = await callApi<{ addresses: Address[] }>("/api/addresses");
        setAddresses(data?.addresses ?? []);
        return data?.addresses ?? [];
      }),
    [run]
  );

  const addAddress = useCallback(
    (input: CreateAddressValues) =>
      run(async () => {
        const { data } = await callApi<{ address: Address }>("/api/addresses", {
          method: "POST",
          body: input,
        });
        if (data?.address) {
          setAddresses((prev) => upsertDefaultAware(prev, data.address));
        }
        return data?.address ?? null;
      }),
    [run]
  );

  const editAddress = useCallback(
    (id: string, input: UpdateAddressValues) =>
      run(async () => {
        const { data } = await callApi<{ address: Address }>(`/api/addresses/${id}`, {
          method: "PATCH",
          body: input,
        });
        if (data?.address) {
          setAddresses((prev) => upsertDefaultAware(prev, data.address));
        }
        return data?.address ?? null;
      }),
    [run]
  );

  const removeAddress = useCallback(
    (id: string) =>
      run(async () => {
        await callApi<never>(`/api/addresses/${id}`, { method: "DELETE" });
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }),
    [run]
  );

  const setDefault = useCallback(
    (id: string) =>
      run(async () => {
        const { data } = await callApi<{ address: Address }>(`/api/addresses/${id}/default`, {
          method: "PATCH",
        });
        if (data?.address) {
          setAddresses((prev) => upsertDefaultAware(prev, data.address));
        }
        return data?.address ?? null;
      }),
    [run]
  );

  return {
    addresses,
    loading,
    error,
    setError,
    fetchAddresses,
    addAddress,
    editAddress,
    removeAddress,
    setDefault,
  };
}

/** Replaces/inserts `updated` in the list and clears isDefault on every other
 * entry when `updated` is now the default, so the UI never shows two
 * defaults at once while waiting for a full refetch. */
function upsertDefaultAware(list: Address[], updated: Address): Address[] {
  const withoutUpdated = list.filter((a) => a.id !== updated.id);
  const next = updated.isDefault
    ? withoutUpdated.map((a) => ({ ...a, isDefault: false }))
    : withoutUpdated;
  return [...next, updated].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}