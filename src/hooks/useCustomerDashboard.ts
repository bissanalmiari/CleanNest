"use client";

// useCustomerDashboard — thin client wrapper around /api/customer/dashboard.
// Mirrors the shape of useAddresses/useAuth (loading, error, a `run` helper),
// and mirrors how the admin dashboard page talks to /api/admin/dashboard.
import { useCallback, useState } from "react";

export interface CustomerDashboardStats {
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalBookings: number;
  totalSpent: number;
}

interface PopulatedRef {
  _id?: string;
  name?: string;
  price?: number;
  durationMinutes?: number;
  label?: string;
  city?: string;
  area?: string;
  street?: string;
}

export interface DashboardBooking {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  serviceId?: PopulatedRef | string;
  addressId?: PopulatedRef | string;
}

export interface BookingHistoryData {
  bookings: DashboardBooking[];
  total: number;
  page: number;
  limit: number;
}

interface CustomerDashboardOverview {
  stats: CustomerDashboardStats;
  upcoming: DashboardBooking[];
  history: BookingHistoryData;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callApi<T>(url: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { cache: "no-store" });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Something went wrong. Please try again.");
  }
  return json;
}

export function useCustomerDashboard() {
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [upcoming, setUpcoming] = useState<DashboardBooking[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  const [history, setHistory] = useState<BookingHistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setStatsLoading(true);
    setUpcomingLoading(true);
    setHistoryLoading(true);
    setStatsError(null);
    setUpcomingError(null);
    setHistoryError(null);

    try {
      const { data } = await callApi<CustomerDashboardOverview>(
        "/api/customer/dashboard?section=overview&upcomingLimit=5&historyPage=1&historyLimit=10",
      );

      setStats(data?.stats ?? null);
      setUpcoming(data?.upcoming ?? []);
      setHistory(data?.history ?? null);
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : "Failed to load the dashboard",
      );
    } finally {
      setStatsLoading(false);
      setUpcomingLoading(false);
      setHistoryLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const { data } = await callApi<CustomerDashboardStats>(
        "/api/customer/dashboard?section=stats"
      );
      setStats(data ?? null);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUpcoming = useCallback(async (limit = 5) => {
    setUpcomingLoading(true);
    setUpcomingError(null);
    try {
      const { data } = await callApi<{ bookings: DashboardBooking[] }>(
        `/api/customer/dashboard?section=upcoming&limit=${limit}`
      );
      setUpcoming(data?.bookings ?? []);
    } catch (err) {
      setUpcomingError(
        err instanceof Error ? err.message : "Failed to load upcoming bookings"
      );
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1, limit = 10, status?: string) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const params = new URLSearchParams({
        section: "history",
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);

      const { data } = await callApi<BookingHistoryData>(
        `/api/customer/dashboard?${params.toString()}`
      );
      setHistory(data ?? null);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Failed to load booking history"
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return {
    stats,
    statsLoading,
    upcoming,
    upcomingLoading,
    history,
    historyLoading,
    statsError,
    setStatsError,
    upcomingError,
    setUpcomingError,
    historyError,
    setHistoryError,
    fetchOverview,
    fetchStats,
    fetchUpcoming,
    fetchHistory,
  };
}
