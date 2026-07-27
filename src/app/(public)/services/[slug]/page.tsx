import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Star,
} from "lucide-react";

import FloatingBookingOrb from "@/components/home/FloatingBookingOrb";
import Footer from "@/components/home/Footer";
import ServiceCoverImage from "@/components/services/ServiceCoverImage";
import { getServiceBySlug } from "@/services/serviceService";
import { listReviews } from "@/services/reviewService";

export const dynamic = "force-dynamic";

type ServiceDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getService = cache((slug: string) => getServiceBySlug(slug));

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return `${hours}h ${minutes}m`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}

export async function generateMetadata({ params }: ServiceDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    return {
      title: "Service Not Found | CleanNest",
    };
  }

  return {
    title: `${service.name} | CleanNest`,
    description: service.shortDescription,
    openGraph: service.imageUrl
      ? {
          images: [
            {
              url: service.imageUrl,
              alt: `${service.name} by CleanNest`,
            },
          ],
        }
      : undefined,
  };
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  const reviewResult = await listReviews(
    {
      serviceId: service.id,
      page: 1,
      limit: 3,
    },
    false
  ).catch(() => ({
    reviews: [],
    total: 0,
    page: 1,
    limit: 3,
  }));

  return (
    <>
      <main className="overflow-hidden bg-[#f6f9fd]">
        <section className="relative isolate overflow-hidden bg-[linear-gradient(125deg,#061a33_0%,#0b315d_52%,#1474ce_100%)] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-48 h-[34rem] w-[34rem] rounded-full border border-cyan-200/15 bg-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-64 left-[28%] h-[36rem] w-[36rem] rounded-full bg-primary/30 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-10 lg:pb-28">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 font-semibold text-blue-100/65 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                All services
              </Link>
              <span className="text-blue-100/30">/</span>
              <span className="font-semibold text-cyan-200">{service.name}</span>
            </nav>

            <div className="mt-12 grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.95fr)]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                  {service.category}
                </div>

                <h1 className="mt-6 max-w-4xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  {service.name}
                </h1>

                <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-blue-100/70 sm:text-lg">
                  {service.shortDescription}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-bold text-blue-50">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    About {formatDuration(service.durationMinutes)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Trusted cleaning team
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-cyan-300/10 blur-2xl" />
                {service.imageUrl ? (
                  <div className="relative min-h-[430px] overflow-hidden rounded-[2.25rem] border border-white/15 bg-navy shadow-[0_32px_90px_rgba(0,0,0,0.25)]">
                    <ServiceCoverImage
                      src={service.imageUrl}
                      alt={`${service.name} by CleanNest`}
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      priority
                      className="transition duration-700 hover:scale-[1.02]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                          Professional service care
                        </p>
                        <p className="mt-2 font-heading text-xl font-black text-white">
                          Prepared for your space
                        </p>
                      </div>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-navy shadow-lg">
                        <Sparkles className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative min-h-[390px] overflow-hidden rounded-[2.25rem] border border-white/15 bg-[radial-gradient(circle_at_75%_20%,rgba(103,232,249,0.22),transparent_25%),linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] p-7 shadow-[0_32px_90px_rgba(0,0,0,0.25)] backdrop-blur sm:p-9">
                    <div
                      aria-hidden="true"
                      className="absolute -bottom-20 -right-14 h-60 w-60 rounded-full border-[34px] border-white/[0.06]"
                    />

                    <div className="relative flex h-full min-h-[320px] flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-navy shadow-[0_18px_40px_rgba(34,211,238,0.28)]">
                          <SprayCan className="h-8 w-8" />
                        </span>
                        <span className="rounded-full border border-white/10 bg-navy/25 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-100">
                          CleanNest signature care
                        </span>
                      </div>

                      <div className="my-8 grid grid-cols-3 gap-3">
                        {[
                          { icon: Home, label: "Your space" },
                          { icon: Sparkles, label: "Deep care" },
                          { icon: CheckCircle2, label: "Quality check" },
                        ].map(({ icon: Icon, label }, index) => (
                          <div
                            key={label}
                            className="relative rounded-2xl border border-white/10 bg-navy/25 p-4"
                          >
                            <span className="mb-4 block text-[9px] font-black text-cyan-300/55">
                              0{index + 1}
                            </span>
                            <Icon className="h-5 w-5 text-cyan-300" />
                            <p className="mt-3 text-[11px] font-extrabold text-blue-50">{label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                        <p className="text-xs font-bold text-emerald-100">
                          Available to schedule with flexible time slots
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-9 max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white shadow-[0_24px_70px_rgba(11,37,69,0.13)] sm:grid-cols-3">
            <SummaryItem
              icon={Star}
              eyebrow="Starting price"
              value={formatPrice(service.price)}
              note="Final price is confirmed before booking"
            />
            <SummaryItem
              icon={Clock3}
              eyebrow="Estimated duration"
              value={formatDuration(service.durationMinutes)}
              note="May vary with property size"
            />
            <SummaryItem
              icon={BadgeCheck}
              eyebrow="Service standard"
              value="Quality checked"
              note="Managed from booking to completion"
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-10 lg:py-24">
          <div className="space-y-10">
            <article className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-[0_18px_55px_rgba(11,37,69,0.07)] sm:p-9">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                Service overview
              </p>
              <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.035em] text-navy">
                A clean you can feel
              </h2>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
                {service.description}
              </p>
            </article>

            <article className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-[0_18px_55px_rgba(11,37,69,0.07)] sm:p-9">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-600">
                    What is included
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-black tracking-[-0.035em] text-navy">
                    Every detail, clearly covered
                  </h2>
                </div>
              </div>

              {service.features.length > 0 ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {service.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex min-h-[72px] items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                      <span className="text-sm font-semibold leading-6 text-slate-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-slate-600">
                  The exact checklist will be confirmed before your visit.
                </p>
              )}
            </article>

            <article className="rounded-[2rem] bg-[linear-gradient(135deg,#eaf4ff_0%,#ffffff_55%,#eafcfb_100%)] p-6 sm:p-9">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                How it works
              </p>
              <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.035em] text-navy">
                From booking to a refreshed space
              </h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Build your booking",
                    copy: "Choose your home, preferred date, and any useful extras.",
                  },
                  {
                    number: "02",
                    title: "We prepare the visit",
                    copy: "Your service details and timing are organized in one place.",
                  },
                  {
                    number: "03",
                    title: "Enjoy the result",
                    copy: "Your cleaner completes the checklist and closes the visit.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-2xl border border-primary/10 bg-white/80 p-5"
                  >
                    <span className="font-mono text-xs font-black text-primary">{step.number}</span>
                    <h3 className="mt-4 font-heading text-lg font-black text-navy">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.copy}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-[0_24px_70px_rgba(11,37,69,0.13)]">
              <div className="bg-[linear-gradient(135deg,#0b2545,#1268b9)] p-6 text-white">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                  Ready when you are
                </p>
                <h2 className="mt-3 font-heading text-2xl font-black">Book {service.name}</h2>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-100/60">Starting from</p>
                    <p className="mt-1 font-heading text-4xl font-black">
                      {formatPrice(service.price)}
                    </p>
                  </div>
                  <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-blue-100">
                    {formatDuration(service.durationMinutes)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-4 text-sm font-semibold text-slate-600">
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    Secure account and booking
                  </li>
                  <li className="flex items-center gap-3">
                    <CalendarCheck2 className="h-5 w-5 text-primary" />
                    Flexible scheduling options
                  </li>
                  <li className="flex items-center gap-3">
                    <BadgeCheck className="h-5 w-5 text-cyan-600" />
                    Clear service checklist
                  </li>
                </ul>

                <Link
                  href={`/book-service?service=${encodeURIComponent(service.slug)}`}
                  className="group mt-7 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-extrabold text-white shadow-[0_16px_35px_rgba(30,111,217,0.28)] transition hover:bg-primary-dark"
                >
                  Book this service
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/services"
                  className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-primary/10 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-primary/25 hover:bg-primary-light hover:text-primary"
                >
                  Compare other services
                </Link>

                <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
                  You will review the final price and visit details before confirming.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {reviewResult.reviews.length > 0 && (
          <section className="border-t border-primary/10 bg-[#f6f9fd] py-20">
            <div className="mx-auto max-w-5xl px-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                    Verified customer feedback
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.035em] text-navy">
                    What customers say about this service
                  </h2>
                </div>
                <Link
                  href="/customer-reviews"
                  className="text-sm font-extrabold text-primary transition hover:text-primary-dark"
                >
                  View all reviews
                </Link>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {reviewResult.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[1.5rem] border border-primary/10 bg-white p-5 shadow-[0_14px_40px_rgba(11,37,69,0.07)]"
                  >
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < review.rating ? "fill-current" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 line-clamp-4 text-sm font-semibold leading-6 text-slate-600">
                      {review.comment || "A positive CleanNest service experience."}
                    </p>
                    {review.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {review.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-emerald-700">
                      <BadgeCheck className="h-4 w-4" />
                      {review.customerName ?? "Verified customer"} · Verified booking
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-heading text-3xl font-black tracking-[-0.035em] text-navy sm:text-4xl">
              A simpler route to a cleaner space
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Choose your service, schedule your visit, and keep every detail organized through your
              CleanNest account.
            </p>
            <Link
              href={`/book-service?service=${encodeURIComponent(service.slug)}`}
              className="group mt-7 inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-navy px-7 py-3 font-extrabold text-white shadow-[0_16px_35px_rgba(11,37,69,0.22)] transition hover:bg-primary"
            >
              Start your booking
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingBookingOrb />
    </>
  );
}

function SummaryItem({
  icon: Icon,
  eyebrow,
  value,
  note,
}: {
  icon: typeof Star;
  eyebrow: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-primary/10 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:p-6 sm:last:border-r-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
          {eyebrow}
        </p>
        <p className="mt-1 font-heading text-lg font-black text-navy">{value}</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{note}</p>
      </div>
    </div>
  );
}
