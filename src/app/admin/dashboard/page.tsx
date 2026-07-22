// src/app/(admin)/dashboard/page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Variants,
} from "motion/react";

import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import BookingReportsTable from "@/components/dashboard/BookingReportsTable";

import type {
  DashboardStats,
  RevenueRange,
  RevenueStats,
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

const EMPTY_FILTERS: ReportFiltersState = {
  from: "",
  to: "",
  status: "",
};

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminDashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] =
    useState(true);

  const [revenueRange, setRevenueRange] =
    useState<RevenueRange>("week");
  const [revenue, setRevenue] =
    useState<RevenueStats | null>(null);
  const [revenueLoading, setRevenueLoading] =
    useState(true);

  const [reportFilters, setReportFilters] =
    useState<ReportFiltersState>(
      EMPTY_FILTERS,
    );
  const [reportPage, setReportPage] =
    useState(1);
  const [reports, setReports] =
    useState<BookingReportsData | null>(
      null,
    );
  const [reportsLoading, setReportsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const response = await fetch(
        "/api/admin/dashboard?section=stats",
        {
          cache: "no-store",
        },
      );

      const json: ApiEnvelope<DashboardStats> =
        await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.error ??
            "Failed to load dashboard statistics",
        );
      }

      setStats(json.data ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard statistics",
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(
    async (range: RevenueRange) => {
      setRevenueLoading(true);

      try {
        const response = await fetch(
          `/api/admin/dashboard?section=revenue&range=${range}`,
          {
            cache: "no-store",
          },
        );

        const json: ApiEnvelope<RevenueStats> =
          await response.json();

        if (!response.ok || !json.success) {
          throw new Error(
            json.error ??
              "Failed to load revenue information",
          );
        }

        setRevenue(json.data ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load revenue information",
        );
      } finally {
        setRevenueLoading(false);
      }
    },
    [],
  );

  const fetchReports = useCallback(
    async (
      filters: ReportFiltersState,
      page: number,
    ) => {
      setReportsLoading(true);

      try {
        const params = new URLSearchParams({
          section: "reports",
          page: String(page),
        });

        if (filters.from) {
          params.set("from", filters.from);
        }

        if (filters.to) {
          params.set("to", filters.to);
        }

        if (filters.status) {
          params.set(
            "status",
            filters.status,
          );
        }

        const response = await fetch(
          `/api/admin/dashboard?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const json: ApiEnvelope<BookingReportsData> =
          await response.json();

        if (!response.ok || !json.success) {
          throw new Error(
            json.error ??
              "Failed to load booking reports",
          );
        }

        setReports(json.data ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load booking reports",
        );
      } finally {
        setReportsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchRevenue(revenueRange);
  }, [revenueRange, fetchRevenue]);

  useEffect(() => {
    void fetchReports(
      reportFilters,
      reportPage,
    );
  }, [
    reportFilters,
    reportPage,
    fetchReports,
  ]);

  function handleFiltersChange(
    nextFilters: ReportFiltersState,
  ) {
    setReportFilters(nextFilters);
    setReportPage(1);
  }

  function handleRefreshDashboard() {
    setErrorMessage(null);

    void Promise.all([
      fetchStats(),
      fetchRevenue(revenueRange),
      fetchReports(
        reportFilters,
        reportPage,
      ),
    ]);
  }

  const dashboardRefreshing =
    statsLoading ||
    revenueLoading ||
    reportsLoading;

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface-soft">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_5%,rgba(30,111,217,0.12),transparent_25%),radial-gradient(circle_at_95%_20%,rgba(34,211,238,0.10),transparent_24%),linear-gradient(to_bottom,#f8fbff,#f5f9fe)]" />

        <motion.div
          className="absolute -left-48 top-28 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 70, 0],
            y: [0, -35, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute -right-52 top-[40%] h-[30rem] w-[30rem] rounded-full bg-cyan-300/10 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 45, 0],
            scale: [1.15, 1, 1.15],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.1) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
          animate={{
            backgroundPosition: [
              "0px 0px",
              "72px 72px",
            ],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto max-w-[1450px] space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        {/* Dashboard header */}
        <motion.section
          variants={sectionVariants}
          className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#071a33] via-navy to-primary-dark px-6 py-7 text-white shadow-[0_24px_70px_rgba(11,37,69,0.20)] sm:px-8 sm:py-8"
        >
          <motion.div
            aria-hidden="true"
            className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary/50 blur-3xl"
            animate={{
              scale: [1, 1.25, 1],
              x: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute -bottom-36 left-[35%] h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
            animate={{
              y: [0, -35, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute -top-48 left-0 h-[38rem] w-20 rotate-[24deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-xl"
            animate={{
              x: [-150, 1450],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-cyan-100 backdrop-blur-xl"
              >
                <Activity className="h-4 w-4" />
                Live business overview
              </motion.div>

              <div className="mt-5 flex items-start gap-4">
                <motion.span
                  whileHover={{
                    scale: 1.08,
                    rotate: 5,
                  }}
                  className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-200 shadow-lg backdrop-blur-xl sm:flex"
                >
                  <ShieldCheck className="h-7 w-7" />
                </motion.span>

                <div>
                  <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Admin Dashboard
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-100/65 sm:text-base">
                    Monitor bookings, revenue,
                    customers, ratings, and business
                    performance from one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-semibold text-blue-100 backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>

                System active
              </div>

              <motion.button
                type="button"
                onClick={
                  handleRefreshDashboard
                }
                disabled={dashboardRefreshing}
                whileHover={
                  dashboardRefreshing
                    ? undefined
                    : {
                        y: -3,
                        scale: 1.02,
                      }
                }
                whileTap={
                  dashboardRefreshing
                    ? undefined
                    : {
                        scale: 0.97,
                      }
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-navy shadow-lg transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  className={`h-4 w-4 text-primary ${
                    dashboardRefreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {dashboardRefreshing
                  ? "Refreshing..."
                  : "Refresh data"}
              </motion.button>
            </div>
          </div>

          {/* Header highlights */}
          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: CalendarDays,
                title: "Booking control",
                text: "Track current activity",
              },
              {
                icon: DollarSign,
                title: "Revenue insights",
                text: "Review financial results",
              },
              {
                icon: Users,
                title: "Customer overview",
                text: "Monitor account growth",
              },
            ].map(
              (
                {
                  icon: Icon,
                  title,
                  text,
                },
                index,
              ) => (
                <motion.div
                  key={title}
                  initial={{
                    opacity: 0,
                    y: 14,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      0.35 +
                      index * 0.1,
                  }}
                  whileHover={{
                    y: -4,
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-xl"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-sm font-bold">
                      {title}
                    </p>

                    <p className="mt-0.5 text-xs text-blue-100/55">
                      {text}
                    </p>
                  </div>
                </motion.div>
              ),
            )}
          </div>
        </motion.section>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -14,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -14,
                height: 0,
              }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="flex-1">
                  <p className="font-bold">
                    Dashboard error
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-red-600/80">
                    {errorMessage}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage(null)
                  }
                  aria-label="Dismiss error"
                  className="rounded-lg p-1 transition-colors hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics section */}
        <motion.section
          variants={sectionVariants}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-4 w-4" />
                Key statistics
              </div>

              <h2 className="mt-2 font-heading text-xl font-bold text-navy">
                Business at a glance
              </h2>
            </div>

            <p className="text-xs text-navy/50">
              Updated from live dashboard data
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <motion.div
              whileHover={{
                y: -7,
                scale: 1.015,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <StatCard
                label="Today's Bookings"
                value={
                  stats?.todaysBookings ?? 0
                }
                icon={CalendarDays}
                accent="primary"
                loading={statsLoading}
              />
            </motion.div>

            <motion.div
              whileHover={{
                y: -7,
                scale: 1.015,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <StatCard
                label="Upcoming"
                value={
                  stats?.upcomingBookings ?? 0
                }
                icon={Clock3}
                accent="inProgress"
                loading={statsLoading}
              />
            </motion.div>

            <motion.div
              whileHover={{
                y: -7,
                scale: 1.015,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <StatCard
                label="Completed"
                value={
                  stats?.completedBookings ?? 0
                }
                icon={CheckCircle2}
                accent="confirmed"
                loading={statsLoading}
              />
            </motion.div>

            <motion.div
              whileHover={{
                y: -7,
                scale: 1.015,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <StatCard
                label="Cancelled"
                value={
                  stats?.cancelledBookings ?? 0
                }
                icon={XCircle}
                accent="cancelled"
                loading={statsLoading}
              />
            </motion.div>

            <motion.div
              whileHover={{
                y: -7,
                scale: 1.015,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <StatCard
                label="Total Customers"
                value={
                  stats?.totalCustomers ?? 0
                }
                icon={Users}
                accent="primary"
                loading={statsLoading}
              />
            </motion.div>

            <motion.div
              whileHover={{
                y: -7,
                scale: 1.015,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <StatCard
                label="Average Rating"
                value={
                  stats
                    ? `${stats.averageRating.toFixed(
                        1,
                      )} ★`
                    : "—"
                }
                icon={Star}
                accent="pending"
                loading={statsLoading}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Revenue section */}
        <motion.section
          variants={sectionVariants}
          className="space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <BarChart3 className="h-4 w-4" />
              Revenue performance
            </div>

            <h2 className="mt-2 font-heading text-xl font-bold text-navy">
              Financial overview
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.75fr_2.25fr]">
            {/* Revenue summary */}
            <motion.div
              whileHover={{
                y: -5,
              }}
              transition={{
                duration: 0.3,
              }}
              className="relative overflow-hidden rounded-[1.6rem] border border-primary/10 bg-white p-5 shadow-[0_18px_50px_rgba(11,37,69,0.08)] sm:p-6"
            >
              <motion.div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl"
                animate={{
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      Revenue summary
                    </p>

                    <h3 className="mt-2 font-heading text-lg font-bold text-navy">
                      Current performance
                    </h3>
                  </div>

                  <motion.span
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary"
                  >
                    <TrendingUp className="h-6 w-6" />
                  </motion.span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-primary/10 bg-surface-soft p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-navy/50">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Total revenue
                    </div>

                    {revenueLoading ? (
                      <div className="mt-3 h-9 w-36 animate-pulse rounded-lg bg-navy/10" />
                    ) : (
                      <motion.p
                        key={
                          revenue?.totalRevenue ??
                          0
                        }
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="mt-2 font-heading text-3xl font-extrabold text-navy"
                      >
                        {formatCurrency(
                          revenue?.totalRevenue ??
                            0,
                        )}
                      </motion.p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-surface-soft p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-navy/50">
                      <Activity className="h-4 w-4 text-primary" />
                      Average booking value
                    </div>

                    {revenueLoading ? (
                      <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-navy/10" />
                    ) : (
                      <motion.p
                        key={
                          revenue?.averageBookingValue ??
                          0
                        }
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="mt-2 font-heading text-2xl font-bold text-navy"
                      >
                        {formatCurrency(
                          revenue?.averageBookingValue ??
                            0,
                        )}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

                  <p className="text-xs font-medium leading-5 text-emerald-700">
                    Revenue is calculated from
                    completed paid bookings.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Revenue chart */}
            <motion.div
              whileHover={{
                y: -4,
              }}
              transition={{
                duration: 0.3,
              }}
              className="overflow-hidden rounded-[1.6rem]"
            >
              <RevenueChart
                data={revenue?.series ?? []}
                range={revenueRange}
                onRangeChange={
                  setRevenueRange
                }
                loading={revenueLoading}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Booking reports */}
        <motion.section
          variants={sectionVariants}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <CalendarDays className="h-4 w-4" />
                Booking reports
              </div>

              <h2 className="mt-2 font-heading text-xl font-bold text-navy">
                Review booking activity
              </h2>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-2 text-xs font-semibold text-navy/55 shadow-sm">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-light px-1.5 font-bold text-primary">
                {reports?.total ?? 0}
              </span>

              Total records
            </div>
          </div>

          <motion.div
            whileHover={{
              y: -3,
            }}
            transition={{
              duration: 0.3,
            }}
            className="overflow-hidden rounded-[1.6rem] border border-primary/10 bg-white shadow-[0_18px_55px_rgba(11,37,69,0.08)]"
          >
            <BookingReportsTable
              bookings={
                reports?.bookings ?? []
              }
              total={reports?.total ?? 0}
              page={
                reports?.page ?? reportPage
              }
              limit={reports?.limit ?? 20}
              filters={reportFilters}
              onFiltersChange={
                handleFiltersChange
              }
              onPageChange={setReportPage}
              loading={reportsLoading}
            />
          </motion.div>
        </motion.section>
      </motion.div>
    </main>
  );
}