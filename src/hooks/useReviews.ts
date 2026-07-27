"use client";

// useReviews — thin client wrapper around /api/reviews/*. Mirrors
// useProfile's shape (loading, error, a `run` helper) for consistency.
import { useCallback, useState } from "react";
import type { Review } from "@/types/payment";
import type { CreateReviewValues, UpdateReviewValues } from "@/validators/reviewValidator";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
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

interface ListReviewsResult {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
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

  /** filters: { bookingId?, customerId?, cleanerId?, page?, limit? } */
  const fetchReviews = useCallback(
    (filters: Record<string, string | number | undefined> = {}) =>
      run(async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.set(key, String(value));
        });
        const { data } = await callApi<ListReviewsResult>(`/api/reviews?${params.toString()}`);
        setReviews(data?.reviews ?? []);
        setTotal(data?.total ?? 0);
        return data ?? null;
      }),
    [run]
  );

  const createReview = useCallback(
    (input: CreateReviewValues) =>
      run(async () => {
        const { data } = await callApi<{ review: Review }>("/api/reviews", {
          method: "POST",
          body: input,
        });
        if (data?.review) setReviews((prev) => [data.review, ...prev]);
        return data?.review ?? null;
      }),
    [run]
  );

  const updateReview = useCallback(
    (reviewId: string, input: UpdateReviewValues) =>
      run(async () => {
        const { data } = await callApi<{ review: Review }>(`/api/reviews/${reviewId}`, {
          method: "PATCH",
          body: input,
        });
        if (data?.review) {
          setReviews((prev) => prev.map((r) => (r.id === reviewId ? data.review : r)));
        }
        return data?.review ?? null;
      }),
    [run]
  );

  const deleteReview = useCallback(
    (reviewId: string) =>
      run(async () => {
        await callApi<{ deleted: boolean }>(`/api/reviews/${reviewId}`, { method: "DELETE" });
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }),
    [run]
  );

  /** Uploads one before/after photo and returns its public URL. */
  const uploadReviewImage = useCallback(
    (bookingId: string, slot: "before" | "after", file: File) =>
      run(async () => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bookingId", bookingId);
        formData.append("slot", slot);
        const { data } = await callApi<{ url: string; slot: string }>("/api/reviews/upload-image", {
          method: "POST",
          body: formData,
          isFormData: true,
        });
        return data?.url ?? null;
      }),
    [run]
  );

  return {
    reviews,
    total,
    loading,
    error,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    uploadReviewImage,
  };
}
