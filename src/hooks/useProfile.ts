"use client";

// useProfile — thin client wrapper around /api/profile/*. Mirrors useAuth's
// shape (loading, error, setError, a `run` helper) so profile pages feel
// consistent with the auth pages.
import { useCallback, useState } from "react";
import type { PublicUser, UpdateProfileInput } from "@/types/user";
import type { UpdateProfileValues, ChangePasswordValues } from "@/validators/userValidator";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function callApi<T>(
  url: string,
  init?: { method?: string; body?: unknown; isFormData?: boolean }
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.isFormData ? undefined : { "Content-Type": "application/json" },
    body: init?.isFormData
      ? (init.body as FormData)
      : init?.body !== undefined
        ? JSON.stringify(init.body)
        : undefined,
  });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Something went wrong. Please try again.");
  }
  return json;
}

export function useProfile() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
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

  const fetchProfile = useCallback(
    () =>
      run(async () => {
        const { data } = await callApi<{ user: PublicUser }>("/api/profile");
        setUser(data?.user ?? null);
        return data?.user ?? null;
      }),
    [run]
  );

  const updateProfile = useCallback(
    (input: UpdateProfileValues | UpdateProfileInput) =>
      run(async () => {
        const { data } = await callApi<{ user: PublicUser }>("/api/profile", {
          method: "PUT",
          body: input,
        });
        setUser(data?.user ?? null);
        return data?.user ?? null;
      }),
    [run]
  );

  const changePassword = useCallback(
    (input: ChangePasswordValues) =>
      run(async () => {
        await callApi<never>("/api/profile/password", { method: "PUT", body: input });
      }),
    [run]
  );

  const uploadAvatar = useCallback(
    (file: File) =>
      run(async () => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await callApi<{ user: PublicUser }>("/api/profile/avatar", {
          method: "POST",
          body: formData,
          isFormData: true,
        });
        setUser(data?.user ?? null);
        return data?.user ?? null;
      }),
    [run]
  );

  return {
    user,
    loading,
    error,
    setError,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
}
