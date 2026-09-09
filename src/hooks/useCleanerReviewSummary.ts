"use client";

// useCleanerReviewSummary — thin client wrapper around
// /api/cleaner/:id/summary. Mirrors useReviews's shape (loading, error) for
// consistency.
import { useCallback, useState } from "react";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CleanerReviewSummary {
  aiSummary: string;
  summaryGeneratedAt: string | null;
  reviewCount: number;
  isFallback: boolean;
}

export function useCleanerReviewSummary() {
  const [summary, setSummary] = useState<CleanerReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (cleanerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cleaner/${cleanerId}/summary`, {
        cache: "no-store",
      });
      const json: ApiEnvelope<CleanerReviewSummary> = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Review summary could not be loaded.");
      }
      setSummary(json.data);
      return json.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review summary could not be loaded.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, error, fetchSummary };
}
