"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, DollarSign, ListChecks, Plus, XCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCustomerDashboard } from "@/hooks/useCustomerDashboard";
import { Button } from "@/components/shared/button";
import { Alert } from "@/components/ui/Alert";
import StatCard from "@/components/dashboard/StatCard";
import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { BookingHistory } from "@/components/dashboard/BookingHistory";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function DashboardContent() {
  const { logout, loading: logoutLoading } = useAuth();
  const {
    stats,
    statsLoading,
    upcoming,
    upcomingLoading,
    history,
    historyLoading,
    error,
    setError,
    fetchStats,
    fetchUpcoming,
    fetchHistory,
  } = useCustomerDashboard();

  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] = useState("");

  useEffect(() => {
    fetchStats();
    fetchUpcoming(5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHistory(historyPage, 10, historyStatus || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage, historyStatus]);

  function handleStatusChange(status: string) {
    setHistoryStatus(status);
    setHistoryPage(1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-navy">Dashboard</h1>
          <p className="text-sm text-navy/60">A quick look at your bookings and activity.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/book">
            <Button type="button" size="sm">
              <Plus className="h-4 w-4" /> Book a service
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => logout()} isLoading={logoutLoading}>
            Log out
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="font-semibold">
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Upcoming"
          value={stats?.upcomingBookings ?? 0}
          icon={CalendarClock}
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
          label="Total Bookings"
          value={stats?.totalBookings ?? 0}
          icon={ListChecks}
          accent="primary"
          loading={statsLoading}
        />
        <StatCard
          label="Total Spent"
          value={stats ? formatCurrency(stats.totalSpent) : "—"}
          icon={DollarSign}
          accent="pending"
          loading={statsLoading}
        />
      </div>

      <UpcomingBookings bookings={upcoming} loading={upcomingLoading} />

      <BookingHistory
        bookings={history?.bookings ?? []}
        total={history?.total ?? 0}
        page={history?.page ?? historyPage}
        limit={history?.limit ?? 10}
        status={historyStatus}
        onStatusChange={handleStatusChange}
        onPageChange={setHistoryPage}
        loading={historyLoading}
      />
    </div>
  );
}

export default function CustomerDashboardPage() {
  return <DashboardContent />;
}
