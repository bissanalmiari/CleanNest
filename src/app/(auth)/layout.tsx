"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Home,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  motion,
  MotionConfig,
} from "motion/react";

type AuthLayoutProps = {
  children: ReactNode;
};

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "Trusted professionals",
    description:
      "Carefully managed cleaning services.",
  },
  {
    icon: CalendarCheck2,
    title: "Simple scheduling",
    description:
      "Choose the service and time that suits you.",
  },
  {
    icon: ShieldCheck,
    title: "Secure accounts",
    description:
      "Protected authentication and email verification.",
  },
];

const floatingParticles = [
  {
    top: "10%",
    left: "8%",
    size: 7,
    duration: 6,
    delay: 0,
  },
  {
    top: "18%",
    left: "86%",
    size: 10,
    duration: 8,
    delay: 1,
  },
  {
    top: "65%",
    left: "6%",
    size: 8,
    duration: 7,
    delay: 0.5,
  },
  {
    top: "82%",
    left: "80%",
    size: 6,
    duration: 6,
    delay: 1.4,
  },
  {
    top: "48%",
    left: "93%",
    size: 7,
    duration: 8,
    delay: 2,
  },
];

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative isolate min-h-screen overflow-x-hidden bg-surface-soft font-body">
        {/* Page background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(30,111,217,0.15),transparent_30%),radial-gradient(circle_at_88%_82%,rgba(34,211,238,0.12),transparent_28%),linear-gradient(to_bottom_right,#ffffff,#f5f9fe,#edf6ff)]"
        />

        {/* Animated grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.12) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
          animate={{
            backgroundPosition: [
              "0px 0px",
              "72px 72px",
            ],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Background glows */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-64 top-16 h-[42rem] w-[42rem] rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -45, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -bottom-72 -right-64 h-[46rem] w-[46rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{
            x: [0, -90, 0],
            y: [0, 55, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating background particles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {floatingParticles.map(
            (particle, index) => (
              <motion.span
                key={`${particle.top}-${particle.left}`}
                className="absolute rounded-full bg-primary/40 shadow-[0_0_18px_rgba(30,111,217,0.45)]"
                style={{
                  top: particle.top,
                  left: particle.left,
                  width: particle.size,
                  height: particle.size,
                }}
                animate={{
                  x: [
                    0,
                    index % 2 === 0
                      ? 22
                      : -22,
                    0,
                  ],
                  y: [0, -28, 0],
                  opacity: [
                    0.15,
                    0.85,
                    0.15,
                  ],
                  scale: [0.7, 1.4, 0.7],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ),
          )}
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-[1500px] items-center px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-primary/10 bg-white/75 shadow-[0_35px_110px_rgba(11,37,69,0.16)] backdrop-blur-xl lg:min-h-[760px] lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left visual panel */}
            <motion.section
              initial={{
                opacity: 0,
                x: -60,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative hidden overflow-hidden bg-gradient-to-br from-[#071a33] via-navy to-primary-dark p-10 text-white lg:flex lg:flex-col xl:p-14"
            >
              {/* Left panel glows */}
              <motion.div
                aria-hidden="true"
                className="absolute -left-32 -top-36 h-96 w-96 rounded-full bg-primary/45 blur-3xl"
                animate={{
                  x: [0, 55, 0],
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl"
                animate={{
                  y: [0, -50, 0],
                  scale: [1.2, 1, 1.2],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Moving light beam */}
              <motion.div
                aria-hidden="true"
                className="absolute -top-full left-1/4 h-[55rem] w-32 rotate-[22deg] bg-gradient-to-b from-transparent via-white/[0.08] to-transparent blur-xl"
                animate={{
                  x: [-350, 950],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />

              {/* Large rotating decoration */}
              <motion.div
                aria-hidden="true"
                className="absolute right-[-170px] top-[18%] h-[420px] w-[420px] rounded-full border border-dashed border-white/10"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 34,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Brand and heading */}
              <div className="relative z-10">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-3"
                >
                  <motion.span
                    whileHover={{
                      scale: 1.08,
                      rotate: 4,
                    }}
                    whileTap={{
                      scale: 0.95,
                    }}
                    className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-primary shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
                  >
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-primary/10"
                      animate={{
                        left: [
                          "-50%",
                          "140%",
                        ],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        repeatDelay: 1.8,
                      }}
                    />

                    <Sparkles className="relative h-7 w-7" />
                  </motion.span>

                  <span>
                    <span className="block font-heading text-2xl font-extrabold">
                      CleanNest
                    </span>

                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">
                      Cleaning made simple
                    </span>
                  </span>
                </Link>

                <div className="mt-16 max-w-xl">
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-200 backdrop-blur-xl"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    A simpler cleaning experience
                  </motion.div>

                  <h1 className="mt-7 font-heading text-4xl font-extrabold leading-[1.12] xl:text-5xl">
                    A cleaner space starts with a

                    <span className="mt-2 block bg-gradient-to-r from-blue-200 via-white to-cyan-200 bg-clip-text text-transparent">
                      secure CleanNest account.
                    </span>
                  </h1>

                  <p className="mt-6 max-w-lg text-base leading-8 text-blue-100/70">
                    Sign in or create your account to
                    manage cleaning services,
                    schedules, addresses, and bookings
                    in one convenient place.
                  </p>
                </div>
              </div>

              {/* Animated center illustration */}
              <div className="relative z-10 my-10 flex flex-1 items-center justify-center">
                <div className="relative flex h-64 w-64 items-center justify-center">
                  {/* Outer rotating ring */}
                  <motion.div
                    aria-hidden="true"
                    className="absolute h-64 w-64 rounded-full border border-dashed border-blue-200/20"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 24,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Inner rotating ring */}
                  <motion.div
                    aria-hidden="true"
                    className="absolute h-48 w-48 rounded-full border border-dashed border-cyan-200/20"
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 18,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Pulsing glow behind the logo */}
                  <motion.div
                    aria-hidden="true"
                    className="absolute h-40 w-40 rounded-full bg-primary/40 blur-2xl"
                    animate={{
                      scale: [
                        0.85,
                        1.3,
                        0.85,
                      ],
                      opacity: [
                        0.45,
                        0.85,
                        0.45,
                      ],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Main animated CleanNest symbol */}
                  <motion.div
                    animate={{
                      y: [0, -12, 0],
                      rotate: [
                        0,
                        3,
                        -3,
                        0,
                      ],
                    }}
                    whileHover={{
                      scale: 1.08,
                      rotate: 5,
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative flex h-32 w-32 items-center justify-center overflow-visible rounded-[2.2rem] bg-white p-5 text-primary shadow-[0_30px_70px_rgba(0,0,0,0.28)]"
                  >
                    {/* Inner logo glow */}
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-3 rounded-[1.7rem] bg-primary/20 blur-xl"
                      animate={{
                        scale: [
                          0.8,
                          1.2,
                          0.8,
                        ],
                        opacity: [
                          0.25,
                          0.7,
                          0.25,
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Moving shine */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/70 blur-sm"
                      animate={{
                        left: [
                          "-50%",
                          "145%",
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Animated house icon */}
                    <motion.div
                      className="relative flex h-full w-full items-center justify-center text-primary"
                      animate={{
                        scale: [
                          1,
                          1.08,
                          1,
                        ],
                        rotate: [
                          0,
                          -3,
                          3,
                          0,
                        ],
                      }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Home
                        className="h-16 w-16"
                        strokeWidth={2.3}
                        aria-hidden="true"
                      />
                    </motion.div>

                    {/* Green verified badge */}
                    <motion.span
                      className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl"
                      animate={{
                        scale: [
                          1,
                          1.2,
                          1,
                        ],
                        rotate: [
                          0,
                          8,
                          -8,
                          0,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.span>
                  </motion.div>

                  {/* Floating shield */}
                  <motion.div
                    className="absolute left-0 top-5 rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-200 shadow-xl backdrop-blur-xl"
                    animate={{
                      y: [0, -10, 0],
                      rotate: [
                        0,
                        -4,
                        4,
                        0,
                      ],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ShieldCheck className="h-6 w-6" />
                  </motion.div>

                  {/* Floating clock */}
                  <motion.div
                    className="absolute bottom-5 right-0 rounded-2xl border border-white/10 bg-white/10 p-3 text-blue-200 shadow-xl backdrop-blur-xl"
                    animate={{
                      y: [0, 10, 0],
                      rotate: [
                        0,
                        4,
                        -4,
                        0,
                      ],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Clock3 className="h-6 w-6" />
                  </motion.div>
                </div>
              </div>

              {/* Trust features */}
              <div className="relative z-10 grid gap-3 xl:grid-cols-3">
                {trustFeatures.map(
                  (
                    {
                      icon: Icon,
                      title,
                      description,
                    },
                    index,
                  ) => (
                    <motion.div
                      key={title}
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay:
                          0.4 +
                          index * 0.12,
                      }}
                      whileHover={{
                        y: -5,
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </span>

                      <h2 className="mt-3 font-heading text-sm font-bold">
                        {title}
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-blue-100/55">
                        {description}
                      </p>
                    </motion.div>
                  ),
                )}
              </div>
            </motion.section>

            {/* Right authentication panel */}
            <motion.section
              initial={{
                opacity: 0,
                x: 60,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.9,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex min-h-[650px] flex-col bg-white/75 px-5 py-6 backdrop-blur-xl sm:px-9 sm:py-8 lg:px-12 xl:px-16"
            >
              {/* Right panel glow */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
                animate={{
                  x: [0, -35, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Top navigation */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

                  Back to home
                </Link>

                {/* Mobile brand */}
                <Link
                  href="/"
                  className="flex items-center gap-2 lg:hidden"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
                    <Sparkles className="h-5 w-5" />
                  </span>

                  <span className="font-heading text-lg font-extrabold text-navy">
                    CleanNest
                  </span>
                </Link>
              </div>

              {/* Auth page content */}
              <div className="relative z-10 flex flex-1 items-center justify-center py-10">
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 30,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="w-full max-w-[520px]"
                >
                  {/* Security banner */}
                  <div className="mb-7 flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary-light/60 px-4 py-3">
                    <motion.span
                      animate={{
                        rotate: [
                          0,
                          8,
                          -8,
                          0,
                        ],
                        scale: [
                          1,
                          1.08,
                          1,
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </motion.span>

                    <div>
                      <p className="text-sm font-bold text-navy">
                        Secure CleanNest access
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Your information is protected
                        during authentication.
                      </p>
                    </div>
                  </div>

                  {/* Individual auth page */}
                  <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_22px_70px_rgba(11,37,69,0.10)] sm:p-8">
                    {children}
                  </div>
                </motion.div>
              </div>

              {/* Bottom bar */}
              <div className="relative z-10 flex flex-col items-center justify-between gap-3 border-t border-primary/10 pt-5 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
                <p>
                  © 2026 CleanNest. All rights reserved.
                </p>

                <div className="flex items-center gap-2 font-medium text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />

                  Secure authentication
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </MotionConfig>
  );
}