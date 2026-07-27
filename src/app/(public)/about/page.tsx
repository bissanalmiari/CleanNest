import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "About Us | CleanNest",
  description:
    "Learn about CleanNest's mission, values, and the team behind Lebanon's simplest way to book professional home cleaning.",
};

const values = [
  {
    icon: ShieldCheck,
    title: "Trusted Professionals",
    description:
      "Every cleaner on CleanNest is vetted before they ever step into your home, so you can relax knowing who's coming.",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly Care",
    description:
      "We favor cleaning methods and products that are gentle on your home, your family, and the environment.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    description:
      "From booking to the last wipe-down, every part of the experience is designed around your comfort and schedule.",
  },
];

const timeline = [
  {
    year: "The idea",
    title: "A simpler way to book a clean",
    description:
      "CleanNest started from a simple frustration: booking a trustworthy cleaner shouldn't mean endless phone calls and unclear pricing.",
  },
  {
    year: "The build",
    title: "A platform people actually enjoy using",
    description:
      "We built CleanNest around transparent pricing, flexible scheduling, and a booking flow that takes minutes, not days.",
  },
  {
    year: "Today",
    title: "Growing across Lebanon, one clean home at a time",
    description:
      "We're proud to connect households with dependable cleaning professionals, backed by real customer support when it matters.",
  },
];

const statistics = [
  { value: "1,200+", label: "Successful Cleanings" },
  { value: "98%", label: "Satisfied Customers" },
  { value: "4.9/5", label: "Average Rating" },
];

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white font-body">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] px-5 py-24 text-white sm:px-8 sm:py-28 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full border border-cyan-200/20 bg-cyan-300/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-primary/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-cyan-100">
            <Sparkles className="h-4 w-4" />
            About CleanNest
          </div>

          <h1 className="mt-6 font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            More than cleaning.
            <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">
              We care for your home.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-blue-100/80 sm:text-lg">
            CleanNest connects households across Lebanon with dependable
            cleaning professionals through one simple, transparent platform —
            no phone tag, no surprise pricing.
          </p>
        </div>
      </section>

      {/* Story + image */}
      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -bottom-6 -left-6 h-full w-full rounded-[2.5rem] bg-primary-light" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-8 border-white bg-white shadow-[0_30px_80px_rgba(11,37,69,0.20)]">
              <Image
                src="/images/about-cleaning.jpg"
                alt="Professional cleaners providing reliable home cleaning services"
                fill
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/5 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/15 p-5 text-white shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
                    <Target className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                      Our Mission
                    </p>
                    <p className="mt-1 font-heading text-lg font-bold leading-snug">
                      Make every home feel fresh, healthy, and comfortable.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-[10%] hidden rounded-2xl border border-white bg-white/95 p-4 shadow-[0_18px_45px_rgba(11,37,69,0.16)] backdrop-blur-md sm:-right-8 sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Award className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-heading text-lg font-bold text-navy">
                    Quality First
                  </p>
                  <p className="text-xs text-slate-500">
                    Service you can trust
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">
              Our story
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              Built to make booking a cleaner effortless.
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              CleanNest started with a simple observation: finding a
              trustworthy cleaner shouldn&apos;t require endless phone calls,
              vague quotes, or crossed fingers. So we built a platform where
              you can compare services, see clear pricing upfront, and book
              in just a few minutes.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Today, CleanNest connects customers across Lebanon with vetted
              cleaning professionals for everything from a quick standard
              clean to a full deep clean before a big event — all backed by
              real support if anything needs adjusting.
            </p>

            <div className="mt-8">
              <Link
                href="/book-service"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-primary px-7 py-4 font-semibold text-white shadow-[0_15px_35px_rgba(30,111,217,0.28)] transition-shadow hover:shadow-[0_20px_45px_rgba(30,111,217,0.40)]"
              >
                Book your first clean
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface-soft px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">
              What we stand for
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              The values behind every booking
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[1.75rem] border border-primary/10 bg-white p-7 shadow-card transition-shadow hover:shadow-[0_20px_50px_rgba(11,37,69,0.10)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-bold text-navy">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">
              Our journey
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              How CleanNest came together
            </h2>
          </div>

          <div className="mt-14 space-y-6">
            {timeline.map((step) => (
              <div
                key={step.title}
                className="flex gap-5 rounded-[1.5rem] border border-primary/10 bg-surface-soft/70 p-6"
              >
                <span className="flex h-11 w-24 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-extrabold uppercase tracking-wide text-primary">
                  {step.year}
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-20 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-navy px-6 py-10 shadow-[0_25px_70px_rgba(11,37,69,0.22)] sm:px-10 lg:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-12 h-60 w-60 rounded-full bg-blue-400/20 blur-3xl"
          />

          <div className="relative grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {statistics.map((statistic) => (
              <div key={statistic.label} className="px-5 py-7 text-center">
                <p className="font-heading text-4xl font-extrabold text-white lg:text-5xl">
                  {statistic.value}
                </p>
                <p className="mt-2 text-sm font-medium text-blue-100">
                  {statistic.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-primary/10 bg-primary-light/50 p-10 text-center sm:p-14">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <Users className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-heading text-2xl font-extrabold text-navy sm:text-3xl">
            Ready to see the difference?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Join thousands of happy customers who trust CleanNest for a
            cleaner, healthier home.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book-service"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(30,111,217,0.25)] transition-shadow hover:shadow-[0_16px_35px_rgba(30,111,217,0.35)]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Book a service
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/20 bg-white px-6 text-sm font-extrabold text-navy transition-colors hover:bg-primary-light"
            >
              Browse services
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
