"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  HeartHandshake,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import { useReviews } from "@/hooks/useReviews";
import { Alert } from "@/components/ui/Alert";
import type { Review } from "@/types/payment";

const trustItems = [
  {
    icon: ShieldCheck,
    label: "Reliable service",
  },
  {
    icon: Clock3,
    label: "On-time arrival",
  },
  {
    icon: BadgeCheck,
    label: "Quality focused",
  },
  {
    icon: HeartHandshake,
    label: "Customer care",
  },
];

const backgroundParticles = [
  {
    top: "12%",
    left: "6%",
    size: 6,
    duration: 6,
    delay: 0,
  },
  {
    top: "28%",
    left: "92%",
    size: 9,
    duration: 8,
    delay: 1,
  },
  {
    top: "72%",
    left: "5%",
    size: 8,
    duration: 7,
    delay: 0.6,
  },
  {
    top: "86%",
    left: "79%",
    size: 5,
    duration: 6,
    delay: 1.4,
  },
  {
    top: "18%",
    left: "51%",
    size: 7,
    duration: 7,
    delay: 2,
  },
  {
    top: "64%",
    left: "96%",
    size: 6,
    duration: 8,
    delay: 0.3,
  },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.span
          key={index}
          initial={{
            opacity: 0,
            scale: 0,
            rotate: -25,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            delay: index * 0.07,
            type: "spring",
            stiffness: 190,
            damping: 13,
          }}
        >
          <Star className={`h-5 w-5 ${index < rating ? "fill-current" : "text-amber-200"}`} />
        </motion.span>
      ))}
    </div>
  );
}

const AVATAR_PALETTE = [
  "bg-gradient-to-br from-blue-500 to-cyan-500 text-white",
  "bg-gradient-to-br from-violet-500 to-purple-600 text-white",
  "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
  "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "CN";
}

function LiveReviewCard({ review, index }: { review: Review; index: number }) {
  const name = review.customerName?.trim() || "Verified customer";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/90 p-6 shadow-[0_18px_50px_rgba(11,37,69,0.09)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-2 hover:border-primary/20 hover:shadow-[0_28px_70px_rgba(11,37,69,0.16)]"
    >
      <Quote className="absolute right-5 top-5 h-12 w-12 fill-primary/[0.04] text-primary/[0.08]" />

      <div className="relative">
        <RatingStars rating={review.rating} />

        <p className="mt-5 line-clamp-4 min-h-[104px] text-sm leading-7 text-slate-600">
          “{review.comment ?? "Great experience with CleanNest."}”
        </p>

        <div className="mt-6 flex items-center gap-3 border-t border-primary/10 pt-5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-heading text-sm font-extrabold shadow-lg ${AVATAR_PALETTE[index % AVATAR_PALETTE.length]}`}
          >
            {initialsFor(name)}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-heading text-sm font-bold text-navy">{name}</h3>
            <p className="text-xs text-slate-500">
              {new Date(review.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <BadgeCheck className="ml-auto h-5 w-5 shrink-0 text-primary" />
        </div>
      </div>
    </motion.article>
  );
}

export default function ReviewsSection() {
  const { reviews: liveReviews, loading, error, fetchReviews } = useReviews();

  useEffect(() => {
    fetchReviews({ limit: 3 });
  }, [fetchReviews]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="reviews"
        className="relative isolate overflow-hidden bg-white py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(30,111,217,0.15),transparent_29%),radial-gradient(circle_at_90%_76%,rgba(34,211,238,0.13),transparent_27%),linear-gradient(to_bottom,#ffffff,#f5f9fe_48%,#ffffff)]"
        />

        {/* Moving grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.11) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "72px 72px"],
          }}
          transition={{
            duration: 24,
            repeat: 0,
            ease: "linear",
          }}
        />

        {/* Animated glows */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-64 top-1/4 h-[42rem] w-[42rem] rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 110, 0],
            y: [0, -55, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 15,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-64 bottom-0 h-[44rem] w-[44rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{
            x: [0, -90, 0],
            y: [0, 65, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 17,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        {/* Scanning light */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-full left-0 h-[72rem] w-40 rotate-[22deg] bg-gradient-to-b from-transparent via-primary/[0.05] to-transparent blur-2xl"
          animate={{
            x: [-320, 1800],
          }}
          transition={{
            duration: 9,
            repeat: 0,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />

        {/* Background particles */}
        <div aria-hidden="true" className="absolute inset-0">
          {backgroundParticles.map((particle, index) => (
            <motion.span
              key={`${particle.top}-${particle.left}`}
              className="absolute rounded-full bg-primary/40 shadow-[0_0_16px_rgba(30,111,217,0.45)]"
              style={{
                top: particle.top,
                left: particle.left,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                x: [0, index % 2 === 0 ? 20 : -20, 0],
                y: [0, -30, 0],
                opacity: [0.15, 0.85, 0.15],
                scale: [0.7, 1.4, 0.7],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: 0,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Heading */}
          <motion.div
            initial={{
              opacity: 0,
              y: 45,
              filter: "blur(10px)",
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.35,
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
              }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-xl"
            >
              <motion.span
                animate={{
                  rotate: [0, 18, -18, 0],
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: 0,
                  repeatDelay: 1,
                }}
              >
                <HeartHandshake className="h-4 w-4" />
              </motion.span>
              Customer Experiences
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Real Experiences from
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Happy CleanNest Customers.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Discover how convenient booking, dependable service, and thoughtful care helped
              customers enjoy cleaner homes and workplaces.
            </p>
          </motion.div>

          {/* Live reviews */}
          <div className="mt-16">
            {loading && (
              <p className="text-center text-sm font-medium text-slate-500">Loading reviews…</p>
            )}

            {!loading && error && (
              <div className="mx-auto max-w-md">
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            {!loading && !error && liveReviews.length === 0 && (
              <p className="text-center text-sm font-medium text-slate-500">
                No reviews yet — be the first to share your experience!
              </p>
            )}

            {!loading && !error && liveReviews.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {liveReviews.map((review, index) => (
                  <LiveReviewCard key={review.id} review={review} index={index} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-navy">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[2rem] bg-navy px-6 py-9 shadow-[0_28px_80px_rgba(11,37,69,0.24)] sm:px-9 lg:px-12">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/10" />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Experience it yourself
                </div>
                <h3 className="mt-3 max-w-2xl font-heading text-2xl font-black text-white sm:text-3xl">
                  Join customers who trust CleanNest with their spaces.
                </h3>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-blue-100/65">
                  Select your service, choose a convenient time, and enjoy a simpler cleaning
                  experience.
                </p>
              </div>

              <Link
                href="/book-service"
                className="group inline-flex min-h-[54px] shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-7 font-black text-primary shadow-xl transition hover:bg-cyan-50"
              >
                Book Your Cleaning
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
