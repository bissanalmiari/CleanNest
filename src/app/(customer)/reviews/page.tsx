"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { useProfile } from "@/hooks/useProfile";

const reviewBenefits = [
  {
    icon: BadgeCheck,
    title: "Verified experiences",
    text: "Every review is connected to one of your completed bookings.",
  },
  {
    icon: Clock3,
    title: "Seven-day editing",
    text: "Fine-tune your review while your service experience is still fresh.",
  },
  {
    icon: ShieldCheck,
    title: "Private feedback",
    text: "Send a note that only the CleanNest support team can read.",
  },
];

export default function CustomerReviewsPage() {
  const { user, loading, error, fetchProfile } = useProfile();

  useEffect(() => {
    void fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-surface-soft p-4 sm:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-72 rounded-[2rem] bg-navy/10" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">
          {error || "We could not load your review profile. Please refresh and try again."}
        </div>
      </div>
    );
  }

  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="min-h-screen overflow-hidden bg-surface-soft pb-16">
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(30,111,217,0.58),transparent_32%),radial-gradient(circle_at_90%_75%,rgba(34,211,238,0.2),transparent_30%),linear-gradient(130deg,#071a33_0%,#0b2545_55%,#123b6f_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[52px] border-white/[0.04]"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-16 lg:px-10">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.17em] text-cyan-200 backdrop-blur">
                <MessageSquareHeart className="h-4 w-4" />
                Your experience matters
              </span>
              <h1 className="mt-6 font-heading text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Your reviews,
                <span className="block bg-gradient-to-r from-cyan-200 via-blue-200 to-white bg-clip-text text-transparent">
                  all in one place.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-blue-100/70 sm:text-lg">
                Hi {firstName}. Revisit the feedback you shared, update recent reviews, and see
                responses from the CleanNest team.
              </p>
            </div>

            <Link
              href="/bookings"
              className="group inline-flex min-h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-white px-6 font-extrabold text-primary shadow-xl transition hover:bg-cyan-50 sm:w-auto"
            >
              Review a completed booking
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-8 lg:px-10">
        <section className="grid gap-3 rounded-[1.75rem] border border-primary/10 bg-white p-3 shadow-[0_24px_70px_rgba(11,37,69,0.12)] sm:grid-cols-3 sm:p-4">
          {reviewBenefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="flex min-w-0 items-start gap-3 rounded-2xl p-4 transition hover:bg-primary-light/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-sm font-extrabold text-navy">{benefit.title}</h2>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    {benefit.text}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-end gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_24px_rgba(30,111,217,0.25)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                Review history
              </p>
              <h2 className="mt-1 font-heading text-2xl font-black text-navy sm:text-3xl">
                Feedback you have shared
              </h2>
            </div>
          </div>

          <ReviewsSection customerId={user.id} currentUserId={user.id} />
        </section>
      </div>
    </div>
  );
}
