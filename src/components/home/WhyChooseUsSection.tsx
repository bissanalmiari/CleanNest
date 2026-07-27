"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Headphones,
  Leaf,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { motion, MotionConfig, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

function SpotlightCard({ children, className = "", delay = 0 }: SpotlightCardProps) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  const smoothX = useSpring(pointerX, {
    stiffness: 180,
    damping: 24,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 180,
    damping: 24,
  });

  const rotateX = useSpring(rawRotateX, {
    stiffness: 180,
    damping: 22,
  });

  const rotateY = useSpring(rawRotateY, {
    stiffness: 180,
    damping: 22,
  });

  const spotlight = useMotionTemplate`
    radial-gradient(
      420px circle at ${smoothX}px ${smoothY}px,
      rgba(30, 111, 217, 0.14),
      transparent 68%
    )
  `;

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    pointerX.set(x);
    pointerY.set(y);

    const normalizedX = x / bounds.width - 0.5;
    const normalizedY = y / bounds.height - 0.5;

    rawRotateY.set(normalizedX * 5);
    rawRotateX.set(normalizedY * -5);
  }

  function resetCard() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    <motion.article
      onMouseMove={handleMouseMove}
      onMouseLeave={resetCard}
      initial={{
        opacity: 0,
        y: 55,
        scale: 0.95,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.75,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -8,
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
      }}
      className={`group relative overflow-hidden rounded-[2rem] border border-primary/10 bg-white/80 shadow-[0_18px_50px_rgba(11,37,69,0.09)] backdrop-blur-md transition-shadow duration-500 hover:shadow-[0_35px_90px_rgba(11,37,69,0.17)] ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: spotlight,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/70"
      />

      {children}
    </motion.article>
  );
}

const bookingSteps = [
  {
    number: "01",
    label: "Choose a service",
  },
  {
    number: "02",
    label: "Select date and time",
  },
  {
    number: "03",
    label: "Confirm your booking",
  },
];

const trustPoints = [
  "Secure account-based booking",
  "Clear prices before confirmation",
  "Support throughout the process",
];

export default function WhyChooseUsSection() {
  return (
    <MotionConfig reducedMotion="always">
      <section
        id="why-choose-us"
        className="relative isolate overflow-hidden bg-surface-soft py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Main background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(30,111,217,0.15),transparent_27%),radial-gradient(circle_at_88%_75%,rgba(34,211,238,0.13),transparent_25%),linear-gradient(to_bottom,#f5f9fe,#ffffff_48%,#eef6ff)]"
        />

        {/* Animated grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "64px 64px"],
          }}
          transition={{
            duration: 22,
            repeat: 0,
            ease: "linear",
          }}
        />

        {/* Animated background glows */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-52 top-1/4 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 80, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 13,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-56 bottom-0 h-[38rem] w-[38rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{
            x: [0, -65, 0],
            y: [0, 45, 0],
            scale: [1.15, 1, 1.15],
          }}
          transition={{
            duration: 15,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        {/* Floating decorations */}
        <motion.div
          aria-hidden="true"
          className="absolute left-[6%] top-[13%] text-primary/30"
          animate={{
            y: [0, -22, 0],
            rotate: [0, 18, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 5,
            repeat: 0,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="h-8 w-8" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="absolute bottom-[14%] right-[5%] text-cyan-500/25"
          animate={{
            y: [0, 22, 0],
            rotate: [0, -25, 0],
          }}
          transition={{
            duration: 6,
            repeat: 0,
            ease: "easeInOut",
          }}
        >
          <Star className="h-10 w-10 fill-current" />
        </motion.div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Section heading */}
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.35,
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
              }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-md"
            >
              <motion.span
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: 0,
                  repeatDelay: 1,
                }}
              >
                <BadgeCheck className="h-4 w-4" />
              </motion.span>
              Why Choose CleanNest
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Everything You Need for a
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Better Cleaning Experience.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              From easy booking to dependable service, every CleanNest feature is designed to give
              you more confidence, convenience, and control.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="mt-16 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Trusted professionals */}
            <SpotlightCard delay={0.05} className="min-h-[390px] p-7 md:col-span-2 lg:col-span-2">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl transition-transform duration-700 group-hover:scale-125" />

              <div className="relative grid h-full items-center gap-10 md:grid-cols-[1fr_0.9fr]">
                <div>
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-sm">
                    <ShieldCheck className="h-7 w-7" />
                  </span>

                  <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                    Trust at every step
                  </p>

                  <h3 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
                    Reliable professionals who respect your home.
                  </h3>

                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                    CleanNest focuses on dependable service, clear communication, and a professional
                    experience from the moment you book until the cleaning is complete.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {["Reliable", "Professional", "Customer focused"].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trust visual */}
                <div className="relative mx-auto flex h-64 w-full max-w-[310px] items-center justify-center">
                  <motion.div
                    aria-hidden="true"
                    className="absolute h-52 w-52 rounded-full border border-dashed border-primary/30"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 24,
                      repeat: 0,
                      ease: "linear",
                    }}
                  />

                  <motion.div
                    aria-hidden="true"
                    className="absolute h-40 w-40 rounded-full bg-primary/10"
                    animate={{
                      scale: [1, 1.12, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  />

                  <motion.div
                    whileHover={{
                      scale: 1.08,
                      rotate: 3,
                    }}
                    className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary text-white shadow-[0_25px_60px_rgba(30,111,217,0.35)]"
                  >
                    <ShieldCheck className="h-14 w-14" />

                    <motion.span
                      className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
                      animate={{
                        scale: [1, 1.18, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: 0,
                      }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="absolute left-0 top-5 rounded-2xl border border-white bg-white/95 p-3 shadow-card"
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />

                      <span className="text-xs font-bold text-navy">Trusted team</span>
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute bottom-6 right-0 rounded-2xl border border-white bg-white/95 p-3 shadow-card"
                    animate={{
                      y: [0, 9, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>

                    <p className="mt-1 text-xs font-bold text-navy">Excellent service</p>
                  </motion.div>
                </div>
              </div>
            </SpotlightCard>

            {/* Transparent pricing */}
            <SpotlightCard delay={0.12} className="min-h-[390px] p-7">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />

              <div className="relative flex h-full flex-col">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CircleDollarSign className="h-7 w-7" />
                </span>

                <h3 className="mt-6 font-heading text-2xl font-bold text-navy">
                  Transparent Pricing
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Review the complete price before confirming your cleaning.
                </p>

                <motion.div
                  whileHover={{
                    y: -5,
                    rotate: -1,
                  }}
                  className="relative mt-7 rounded-2xl border border-dashed border-slate-200 bg-white p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Home cleaning</span>

                    <span className="font-bold text-navy">$35</span>
                  </div>

                  <div className="my-4 border-t border-dashed border-slate-200" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy">Total</span>

                    <motion.span
                      className="font-heading text-2xl font-extrabold text-emerald-600"
                      animate={{
                        scale: [1, 1.06, 1],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: 0,
                      }}
                    >
                      $35
                    </motion.span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    No hidden charges
                  </div>
                </motion.div>
              </div>
            </SpotlightCard>

            {/* Flexible scheduling */}
            <SpotlightCard delay={0.18} className="min-h-[360px] p-7">
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />

              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <CalendarClock className="h-7 w-7" />
                </span>

                <h3 className="mt-6 font-heading text-2xl font-bold text-navy">
                  Flexible Scheduling
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Pick a date and time that fits naturally into your routine.
                </p>

                <div className="mt-7 rounded-2xl border border-primary/10 bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-navy">Available times</span>

                    <Clock3 className="h-4 w-4 text-violet-500" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["9:00", "11:00", "2:00"].map((time, index) => (
                      <motion.div
                        key={time}
                        animate={
                          index === 1
                            ? {
                                scale: [1, 1.05, 1],
                              }
                            : undefined
                        }
                        transition={{
                          duration: 2,
                          repeat: 0,
                        }}
                        className={`rounded-xl px-2 py-3 text-center text-xs font-bold ${
                          index === 1
                            ? "bg-violet-600 text-white shadow-lg"
                            : "bg-violet-50 text-violet-700"
                        }`}
                      >
                        {time}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Eco-friendly */}
            <SpotlightCard delay={0.24} className="min-h-[360px] p-7">
              <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-green-400/15 blur-3xl" />

              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <Leaf className="h-7 w-7" />
                </span>

                <h3 className="mt-6 font-heading text-2xl font-bold text-navy">
                  Eco-Friendly Care
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Responsible cleaning choices for your home and environment.
                </p>

                <div className="relative mt-8 flex h-32 items-center justify-center">
                  <motion.div
                    className="absolute h-28 w-28 rounded-full border border-dashed border-green-300"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 16,
                      repeat: 0,
                      ease: "linear",
                    }}
                  />

                  <motion.div
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_18px_45px_rgba(34,197,94,0.3)]"
                    animate={{
                      y: [0, -7, 0],
                      rotate: [0, 4, -4, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  >
                    <Leaf className="h-10 w-10" />
                  </motion.div>

                  <span className="absolute left-2 top-4 rounded-full bg-white px-3 py-2 text-xs font-bold text-green-700 shadow-card">
                    Fresh
                  </span>

                  <span className="absolute bottom-2 right-0 rounded-full bg-white px-3 py-2 text-xs font-bold text-green-700 shadow-card">
                    Responsible
                  </span>
                </div>
              </div>
            </SpotlightCard>

            {/* Quality commitment */}
            <SpotlightCard delay={0.3} className="min-h-[360px] p-7">
              <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />

              <div className="relative flex h-full flex-col">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <BadgeCheck className="h-7 w-7" />
                </span>

                <h3 className="mt-6 font-heading text-2xl font-bold text-navy">
                  Quality Commitment
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  A professional and consistent experience is always our goal.
                </p>

                <div className="mt-auto pt-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">
                      Customer satisfaction
                    </span>

                    <span className="font-heading text-xl font-extrabold text-amber-600">98%</span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-amber-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      initial={{
                        width: "0%",
                      }}
                      whileInView={{
                        width: "98%",
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 1.4,
                        delay: 0.4,
                      }}
                    />
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-5 w-5 fill-current" />
                      ))}
                    </div>

                    <span className="text-sm font-bold text-navy">4.9 average rating</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Easy booking — full final row */}
            <SpotlightCard delay={0.36} className="min-h-[360px] p-7 md:col-span-2 lg:col-span-3">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

              <div className="relative grid h-full items-center gap-10 lg:grid-cols-[0.75fr_1.25fr]">
                <div>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                    <MousePointerClick className="h-7 w-7" />
                  </span>

                  <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
                    Fast and simple
                  </p>

                  <h3 className="mt-3 font-heading text-3xl font-extrabold text-navy sm:text-4xl">
                    Book your cleaning in three easy steps.
                  </h3>

                  <p className="mt-4 max-w-xl leading-7 text-slate-600">
                    No complicated calls or long forms. CleanNest guides you through every step,
                    from service selection to final confirmation.
                  </p>
                </div>

                {/* Booking flow */}
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute left-5 top-7 h-[calc(100%-3.5rem)] w-px bg-gradient-to-b from-primary via-cyan-400 to-green-400 lg:left-7"
                  />

                  <div className="space-y-4">
                    {bookingSteps.map((step, index) => (
                      <motion.div
                        key={step.number}
                        initial={{
                          opacity: 0,
                          x: 30,
                        }}
                        whileInView={{
                          opacity: 1,
                          x: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          delay: 0.35 + index * 0.15,
                        }}
                        whileHover={{
                          x: 6,
                        }}
                        className="relative flex items-center gap-4 rounded-2xl border border-primary/10 bg-white p-4 shadow-card sm:p-5"
                      >
                        <motion.span
                          animate={
                            index === 1
                              ? {
                                  scale: [1, 1.12, 1],
                                }
                              : undefined
                          }
                          transition={{
                            duration: 2,
                            repeat: 0,
                          }}
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold sm:h-12 sm:w-12 ${
                            index === 0
                              ? "bg-primary text-white"
                              : index === 1
                                ? "bg-cyan-500 text-white"
                                : "bg-green-500 text-white"
                          }`}
                        >
                          {step.number}
                        </motion.span>

                        <span className="font-semibold text-navy sm:text-lg">{step.label}</span>

                        <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Trust ticker */}
          <motion.div
            initial={{
              opacity: 0,
              y: 35,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="relative mt-12 overflow-hidden rounded-2xl border border-primary/10 bg-white/70 py-4 shadow-card backdrop-blur-md"
          >
            <motion.div
              className="flex w-max items-center gap-10 px-6"
              animate={{
                x: ["0%", "-50%"],
              }}
              transition={{
                duration: 24,
                repeat: 0,
                ease: "linear",
              }}
            >
              {[...trustPoints, ...trustPoints].map((point, index) => (
                <div
                  key={`${point}-${index}`}
                  className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  {index % 3 === 0 ? (
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  ) : index % 3 === 1 ? (
                    <Zap className="h-5 w-5 text-cyan-500" />
                  ) : (
                    <Headphones className="h-5 w-5 text-violet-500" />
                  )}

                  {point}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{
              opacity: 0,
              y: 70,
              scale: 0.96,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{
              once: true,
              amount: 0.25,
            }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mt-16 overflow-hidden rounded-[2.25rem] bg-navy px-6 py-11 shadow-[0_30px_90px_rgba(11,37,69,0.28)] sm:px-10 lg:px-14 lg:py-14"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 7,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <motion.div
              aria-hidden="true"
              className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
              }}
              transition={{
                duration: 8,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <motion.div
              aria-hidden="true"
              className="absolute -top-full left-1/3 h-[40rem] w-28 rotate-[25deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-xl"
              animate={{
                x: [-250, 850],
              }}
              transition={{
                duration: 5,
                repeat: 0,
                repeatDelay: 2,
                ease: "easeInOut",
              }}
            />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-blue-200">
                  <Sparkles className="h-4 w-4" />
                  Ready for a cleaner home?
                </div>

                <h3 className="mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Book your service today and let CleanNest take care of the rest.
                </h3>

                <p className="mt-4 max-w-2xl leading-7 text-blue-100">
                  Choose your cleaning service, preferred schedule, and property details in only a
                  few minutes.
                </p>
              </div>

              <motion.div
                whileHover={{
                  y: -6,
                  scale: 1.04,
                }}
                whileTap={{
                  scale: 0.97,
                }}
              >
                <Link
                  href="/book"
                  className="group relative flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-primary/10"
                    animate={{
                      left: ["-50%", "140%"],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: 0,
                      repeatDelay: 1.5,
                    }}
                  />

                  <span className="relative">Book Your Cleaning</span>

                  <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
