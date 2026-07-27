"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  MessageSquareQuote,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import { useReviews } from "@/hooks/useReviews";
import { Alert } from "@/components/ui/Alert";
import Footer from "@/components/home/Footer";
import FloatingBookingOrb from "@/components/home/FloatingBookingOrb";
import type { Review } from "@/types/payment";

const PAGE_SIZE = 8;

const avatarStyles = [
  "from-blue-600 to-cyan-500",
  "from-violet-600 to-fuchsia-500",
  "from-emerald-600 to-teal-400",
  "from-amber-500 to-orange-500",
];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "CN";
}

export default function PublicReviewsPage() {
  const { reviews, total, loading, error, fetchReviews } = useReviews();
  const [page, setPage] = useState(1);
  const reviewsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    void fetchReviews({ page, limit: PAGE_SIZE });
  }, [fetchReviews, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageAverage = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  function changePage(nextPage: number) {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      reviewsHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="overflow-hidden bg-[#f7faff]">
        <section className="relative isolate overflow-hidden bg-navy text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(30,111,217,0.55),transparent_30%),radial-gradient(circle_at_88%_82%,rgba(34,211,238,0.24),transparent_28%),linear-gradient(135deg,#071a33_0%,#0b2545_52%,#123b6f_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:72px_72px]"
          />
          <div
            aria-hidden="true"
            className="absolute -left-32 top-20 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-cyan-200/10"
          />

          <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:px-10 lg:pb-32">
            <Link
              href="/#reviews"
              className="group inline-flex items-center gap-2 text-sm font-bold text-blue-100/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to home
            </Link>

            <div className="mt-12 grid items-end gap-12 lg:grid-cols-[1fr_0.72fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200 backdrop-blur-md">
                  <HeartHandshake className="h-4 w-4" />
                  Customer stories
                </div>
                <h1 className="mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  The clean feels better
                  <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-white bg-clip-text text-transparent">
                    when it comes with trust.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100/70 sm:text-lg">
                  Honest feedback from people who welcomed CleanNest into their homes and workplaces
                  across Lebanon.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.12 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
              >
                <Quote className="absolute -right-2 -top-3 h-28 w-28 fill-white/[0.03] text-white/[0.05]" />
                <div className="relative flex items-end justify-between gap-6">
                  <div>
                    <p className="text-sm font-bold text-blue-100/60">Shared experiences</p>
                    <p className="mt-2 font-heading text-5xl font-extrabold text-white">
                      {loading && total === 0 ? "—" : total}
                    </p>
                    <p className="mt-1 text-sm text-blue-100/60">
                      customer review{total === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-navy shadow-[0_14px_35px_rgba(251,191,36,0.25)]">
                    <Star className="h-8 w-8 fill-current" />
                  </div>
                </div>
                <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                    <BadgeCheck className="h-5 w-5 text-cyan-300" />
                    Verified
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                    Transparent
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-10 pb-24 sm:-mt-12 sm:pb-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-3 rounded-[1.75rem] border border-primary/10 bg-white p-3 shadow-[0_24px_70px_rgba(11,37,69,0.12)] sm:grid-cols-3 sm:p-4">
              <TrustItem
                icon={BadgeCheck}
                title="Verified bookings"
                text="Feedback is tied to a completed service."
              />
              <TrustItem
                icon={MessageSquareQuote}
                title="Real experiences"
                text="Read the details customers chose to share."
              />
              <TrustItem
                icon={Camera}
                title="Before & after"
                text="Look for photo stories on selected reviews."
              />
            </div>

            <div className="mt-20 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-4 w-4" />
                  In their own words
                </p>
                <h2
                  ref={reviewsHeadingRef}
                  tabIndex={-1}
                  className="mt-3 scroll-mt-28 font-heading text-3xl font-extrabold tracking-tight text-navy outline-none sm:text-4xl"
                >
                  What customers are saying
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Browse recent feedback about CleanNest services, teams, and results.
                </p>
              </div>

              {pageAverage !== null && (
                <div className="inline-flex shrink-0 items-center gap-3 self-start rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:self-auto">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-white">
                    <Star className="h-5 w-5 fill-current" />
                  </span>
                  <span>
                    <span className="block font-heading text-lg font-extrabold text-navy">
                      {pageAverage.toFixed(1)} / 5
                    </span>
                    <span className="block text-[11px] font-semibold text-slate-500">
                      On this page
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-10">
              {error && (
                <div className="mx-auto max-w-2xl">
                  <Alert variant="error">{error}</Alert>
                </div>
              )}

              {loading && reviews.length === 0 && (
                <div className="grid gap-6 md:grid-cols-2" aria-label="Loading reviews">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <ReviewSkeleton key={index} />
                  ))}
                </div>
              )}

              {!loading && !error && reviews.length === 0 && (
                <div className="rounded-[2rem] border border-dashed border-primary/25 bg-white px-6 py-16 text-center shadow-card">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
                    <MessageSquareQuote className="h-8 w-8" />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-bold text-navy">
                    The first story could be yours
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Reviews will appear here after customers complete a cleaning and share their
                    experience.
                  </p>
                  <Link
                    href="/book-service"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark"
                  >
                    Book a cleaning
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {reviews.length > 0 && (
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`grid gap-6 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}
                  aria-busy={loading}
                >
                  {reviews.map((review, index) => (
                    <PublicReviewCard key={review.id} review={review} index={index} />
                  ))}
                </motion.div>
              )}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Reviews pagination"
                className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white p-3 shadow-card sm:flex-row"
              >
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => changePage(Math.max(1, page - 1))}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-navy transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    const isVisible =
                      totalPages <= 5 ||
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      Math.abs(pageNumber - page) <= 1;
                    if (!isVisible) {
                      const showEllipsis = pageNumber === 2 || pageNumber === totalPages - 1;
                      return showEllipsis ? (
                        <span key={pageNumber} className="px-1 text-slate-400" aria-hidden="true">
                          …
                        </span>
                      ) : null;
                    }
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        disabled={loading}
                        aria-label={`Go to reviews page ${pageNumber}`}
                        aria-current={pageNumber === page ? "page" : undefined}
                        onClick={() => changePage(pageNumber)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold transition ${
                          pageNumber === page
                            ? "bg-primary text-white shadow-[0_8px_22px_rgba(30,111,217,0.28)]"
                            : "text-slate-500 hover:bg-primary-light hover:text-primary"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => changePage(Math.min(totalPages, page + 1))}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-navy transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}

            <section className="relative mt-20 overflow-hidden rounded-[2.25rem] bg-navy px-6 py-10 text-white shadow-[0_30px_80px_rgba(11,37,69,0.22)] sm:px-10 lg:px-14 lg:py-12">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.2),transparent_27%),linear-gradient(120deg,transparent,rgba(30,111,217,0.22))]"
              />
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 sm:flex">
                    <CalendarCheck2 className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                      Ready when you are
                    </p>
                    <h2 className="mt-2 max-w-2xl font-heading text-2xl font-extrabold sm:text-3xl">
                      Your cleaner, more comfortable space starts here.
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100/65">
                      Choose the service that fits your space and book a convenient time in just a
                      few minutes.
                    </p>
                  </div>
                </div>
                <Link
                  href="/book"
                  className="group inline-flex min-h-[54px] shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-7 font-extrabold text-primary shadow-xl transition hover:bg-cyan-50"
                >
                  Book your cleaning
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </section>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingBookingOrb />
    </MotionConfig>
  );
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof BadgeCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-primary-light/60">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-heading text-sm font-bold text-navy">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function PublicReviewCard({ review, index }: { review: Review; index: number }) {
  const name = review.customerName?.trim() || "Verified customer";
  const hasGallery = review.beforeImages.length > 0 || review.afterImages.length > 0;
  const pairCount = Math.max(review.beforeImages.length, review.afterImages.length);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-6 shadow-[0_14px_40px_rgba(11,37,69,0.07)] transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_22px_55px_rgba(11,37,69,0.12)] sm:p-7">
      <Quote className="absolute right-5 top-5 h-14 w-14 fill-primary/[0.035] text-primary/[0.06]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarStyles[index % avatarStyles.length]} font-heading text-sm font-extrabold text-white shadow-lg`}
          >
            {initialsFor(name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-sm font-bold text-navy">{name}</h3>
            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
              {review.serviceName || "CleanNest service"}
            </p>
          </div>
        </div>
        {review.isVerified && (
          <span
            title="Review from a completed CleanNest booking"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
          >
            <BadgeCheck className="h-5 w-5" />
            <span className="sr-only">Verified booking</span>
          </span>
        )}
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-4">
        <div
          className="flex items-center gap-1 text-amber-400"
          role="img"
          aria-label={`Rated ${review.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }).map((_, starIndex) => (
            <Star
              key={starIndex}
              className={`h-4 w-4 ${
                starIndex < review.rating ? "fill-current" : "fill-slate-100 text-slate-200"
              }`}
            />
          ))}
        </div>
        <time dateTime={review.createdAt} className="text-xs font-semibold text-slate-400">
          {new Date(review.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>

      <p className="relative mt-5 flex-1 text-[15px] leading-7 text-slate-600">
        “{review.comment || "A smooth, reliable cleaning experience with CleanNest."}”
      </p>

      {review.tags.length > 0 && (
        <div className="relative mt-5 flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-[11px] font-bold text-primary"
            >
              <CheckCircle2 className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {hasGallery && (
        <div className="relative mt-6 border-t border-primary/10 pt-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-navy">
            <Camera className="h-4 w-4 text-primary" />
            Customer photos
          </div>
          <div className="space-y-3">
            {Array.from({ length: pairCount }).map((_, pairIndex) => (
              <div key={pairIndex} className="grid grid-cols-2 gap-3">
                <ReviewPhoto label="Before" url={review.beforeImages[pairIndex]} />
                <ReviewPhoto label="After" url={review.afterImages[pairIndex]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {review.adminReply && (
        <div className="relative mt-5 rounded-2xl border border-primary/10 bg-primary-light/70 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-primary">
            <Sparkles className="h-4 w-4" />
            CleanNest replied
          </div>
          <p className="mt-2 text-sm leading-6 text-navy/70">{review.adminReply}</p>
        </div>
      )}
    </article>
  );
}

function ReviewPhoto({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-50 text-xs font-semibold text-slate-300">
        No {label.toLowerCase()} photo
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
      <Image
        src={url}
        alt={`${label} cleaning result`}
        fill
        sizes="(max-width: 768px) 45vw, 260px"
        className="object-cover transition duration-500 hover:scale-105"
      />
      <span
        className={`absolute bottom-2 left-2 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg ${
          label === "After" ? "bg-emerald-500" : "bg-navy/80"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="animate-pulse rounded-[1.75rem] border border-primary/5 bg-white p-7 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-100" />
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-100" />
          <div className="h-2.5 w-20 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 h-3 w-28 rounded bg-slate-100" />
      <div className="mt-6 space-y-3">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-11/12 rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}
