// src/app/(admin)/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  Star,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import BookingReportsTable from "@/components/dashboard/BookingReportsTable";
import type {
  DashboardStats,
  RevenueStats,
  RevenueRange,
} from "@/services/dashboardService";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface BookingReportsData {
  bookings: any[];
  total: number;
  page: number;
  limit: number;
}

interface ReportFiltersState {
  from: string;
  to: string;
  status: string;
}

const EMPTY_FILTERS: ReportFiltersState = { from: "", to: "", status: "" };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [revenueRange, setRevenueRange] = useState<RevenueRange>("week");
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [reportFilters, setReportFilters] =
    useState<ReportFiltersState>(EMPTY_FILTERS);
  const [reportPage, setReportPage] = useState(1);
  const [reports, setReports] = useState<BookingReportsData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard?section=stats");
      const json: ApiEnvelope<DashboardStats> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load stats");
      setStats(json.data ?? null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async (range: RevenueRange) => {
    setRevenueLoading(true);
    try {
      const res = await fetch(
        `/api/admin/dashboard?section=revenue&range=${range}`
      );
      const json: ApiEnvelope<RevenueStats> = await res.json();
      if (!json.success)
        throw new Error(json.error ?? "Failed to load revenue");
      setRevenue(json.data ?? null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load revenue"
      );
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const fetchReports = useCallback(
    async (filters: ReportFiltersState, page: number) => {
      setReportsLoading(true);
      try {
        const params = new URLSearchParams({ section: "reports", page: String(page) });
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.status) params.set("status", filters.status);

        const res = await fetch(`/api/admin/dashboard?${params.toString()}`);
        const json: ApiEnvelope<BookingReportsData> = await res.json();
        if (!json.success)
          throw new Error(json.error ?? "Failed to load reports");
        setReports(json.data ?? null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load reports"
        );
      } finally {
        setReportsLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRevenue(revenueRange);
  }, [revenueRange, fetchRevenue]);

  useEffect(() => {
    fetchReports(reportFilters, reportPage);
  }, [reportFilters, reportPage, fetchReports]);

  const handleFiltersChange = (next: ReportFiltersState) => {
    setReportFilters(next);
    setReportPage(1); // reset pagination whenever filters change
  };

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Overview of bookings, revenue, and customer activity.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-card bg-status-cancelled/10 px-4 py-3 text-sm text-status-cancelled">
            {errorMessage}
          </div>
        )}

        {/* Statistics cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Today's Bookings"
            value={stats?.todaysBookings ?? 0}
            icon={CalendarDays}
            accent="primary"
            loading={statsLoading}
          />
          <StatCard
            label="Upcoming"
            value={stats?.upcomingBookings ?? 0}
            icon={Clock3}
            accent="inProgress"
            loading={statsLoading}
          />
          <StatCard
            label="Completed"
            value={stats?.completedBookings ?? 0}
            icon={CheckCircle2}
            accent="confirmed"
            loading={statsLoading}
          />
          <StatCard
            label="Cancelled"
            value={stats?.cancelledBookings ?? 0}
            icon={XCircle}
            accent="cancelled"
            loading={statsLoading}
          />
          <StatCard
            label="Total Customers"
            value={stats?.totalCustomers ?? 0}
            icon={Users}
            accent="primary"
            loading={statsLoading}
          />
          <StatCard
            label="Avg. Rating"
            value={stats ? `${stats.averageRating.toFixed(1)} ★` : "—"}
            icon={Star}
            accent="pending"
            loading={statsLoading}
          />
        </div>

        {/* Revenue summary + chart */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-card bg-surface p-5 shadow-card lg:col-span-1">
            <h3 className="font-heading text-lg font-semibold text-navy">
              Revenue Summary
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-navy/50">Total Revenue</p>
                {revenueLoading ? (
                  <div className="mt-1 h-7 w-24 animate-pulse rounded bg-navy/10" />
                ) : (
                  <p className="font-heading text-xl font-semibold text-navy">
                    ${revenue?.totalRevenue.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-navy/50">Average Booking Value</p>
                {revenueLoading ? (
                  <div className="mt-1 h-7 w-24 animate-pulse rounded bg-navy/10" />
                ) : (
                  <p className="font-heading text-xl font-semibold text-navy">
                    ${revenue?.averageBookingValue.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <RevenueChart
              data={revenue?.series ?? []}
              range={revenueRange}
              onRangeChange={setRevenueRange}
              loading={revenueLoading}
            />
          </div>
        </div>

        {/* Booking reports table */}
        <BookingReportsTable
          bookings={reports?.bookings ?? []}
          total={reports?.total ?? 0}
          page={reports?.page ?? reportPage}
          limit={reports?.limit ?? 20}
          filters={reportFilters}
          onFiltersChange={handleFiltersChange}
          onPageChange={setReportPage}
          loading={reportsLoading}
        />
      </div>
    </div>
  );
}
