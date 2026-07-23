"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  KeyRound,
  Layers3,
  ShieldCheck,
  Sofa,
  Sparkles,
  Star,
} from "lucide-react";
import {
  motion,
  MotionConfig,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  spotlightColor?: string;
};

function SpotlightCard({
  children,
  className = "",
  delay = 0,
  spotlightColor = "rgba(30, 111, 217, 0.14)",
}: SpotlightCardProps) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  const smoothX = useSpring(pointerX, {
    stiffness: 170,
    damping: 24,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 170,
    damping: 24,
  });

  const rotateX = useSpring(rawRotateX, {
    stiffness: 170,
    damping: 22,
  });

  const rotateY = useSpring(rawRotateY, {
    stiffness: 170,
    damping: 22,
  });

  const spotlight = useMotionTemplate`
    radial-gradient(
      460px circle at ${smoothX}px ${smoothY}px,
      ${spotlightColor},
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

    rawRotateY.set(normalizedX * 4);
    rawRotateX.set(normalizedY * -4);
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
      className={`group relative overflow-hidden rounded-[2rem] border border-primary/10 bg-white/85 shadow-[0_18px_55px_rgba(11,37,69,0.10)] backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_35px_90px_rgba(11,37,69,0.17)] ${className}`}
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
        className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/80"
      />

      {children}
    </motion.article>
  );
}

const homeTasks = [
  {
    icon: Sofa,
    label: "Living spaces",
  },
  {
    icon: BedDouble,
    label: "Bedrooms",
  },
  {
    icon: Bath,
    label: "Bathrooms",
  },
];

const deepCleaningTasks = [
  "Detailed surface cleaning",
  "Kitchen and bathroom focus",
  "Hard-to-reach areas",
];

const moveCleaningTasks = [
  {
    label: "Empty property cleaning",
    completed: true,
  },
  {
    label: "Inside cabinets",
    completed: true,
  },
  {
    label: "Final property inspection",
    completed: false,
  },
];

const officeFeatures = [
  "Desks and workspaces",
  "Meeting rooms",
  "Common areas",
  "Flexible business hours",
];

export default function ServicesPreviewSection() {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="services"
        className="relative isolate overflow-hidden bg-surface-soft py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Compatible light background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,rgba(30,111,217,0.16),transparent_28%),radial-gradient(circle_at_90%_82%,rgba(34,211,238,0.12),transparent_27%),linear-gradient(to_bottom,#f5f9fe,#ffffff_48%,#eaf3ff)]"
        />

        {/* Moving grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.17]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.11) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "68px 68px"],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Animated background glows */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-56 top-1/4 h-[38rem] w-[38rem] rounded-full bg-primary/12 blur-3xl"
          animate={{
            x: [0, 90, 0],
            y: [0, -45, 0],
            scale: [1, 1.18, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-56 bottom-0 h-[40rem] w-[40rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{
            x: [0, -75, 0],
            y: [0, 50, 0],
            scale: [1.15, 1, 1.15],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating decorations */}
        <motion.div
          aria-hidden="true"
          className="absolute left-[6%] top-[12%] text-primary/30"
          animate={{
            y: [0, -22, 0],
            rotate: [0, 18, 0],
            scale: [1, 1.22, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="h-9 w-9" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="absolute bottom-[13%] right-[6%] text-cyan-500/25"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Star className="h-10 w-10 fill-current" />
        </motion.div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Heading */}
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
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-xl"
            >
              <motion.span
                animate={{
                  rotate: [0, 16, -16, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <Layers3 className="h-4 w-4" />
              </motion.span>

              Explore Our Services
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              The Right Cleaning Service
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                for Every Space.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Choose the service that matches your home, move, or workplace.
              CleanNest gives you clear details, flexible booking, and
              professional results.
            </p>
          </motion.div>

          {/* Services grid */}
          <div className="mt-16 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Featured home cleaning card */}
            <motion.article
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
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                y: -8,
              }}
              className="group relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-navy via-[#123b6f] to-primary-dark p-7 shadow-[0_30px_80px_rgba(11,37,69,0.26)] md:col-span-2 lg:col-span-2"
            >
              <motion.div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
                animate={{
                  scale: [1.15, 1, 1.15],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute -top-full left-1/4 h-[38rem] w-24 rotate-[24deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-xl"
                animate={{
                  x: [-220, 800],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />

              <div className="relative grid h-full items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur-xl">
                      <Home className="h-7 w-7" />
                    </span>

                    <span className="rounded-full border border-blue-200/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                      Most Popular
                    </span>
                  </div>

                  <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                    Everyday freshness
                  </p>

                  <h3 className="mt-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">
                    Regular Home Cleaning
                  </h3>

                  <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/80">
                    Keep your home consistently fresh and comfortable with
                    routine cleaning designed around the spaces you use most.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-50">
                      <Clock3 className="h-4 w-4 text-cyan-300" />
                      From 2 hours
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-50">
                      <ShieldCheck className="h-4 w-4 text-green-300" />
                      Trusted service
                    </span>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <motion.div
                      whileHover={{
                        y: -4,
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                    >
                      <Link
                        href="/book?service=regular-home-cleaning"
                        className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-primary shadow-[0_16px_38px_rgba(0,0,0,0.2)]"
                      >
                        Book This Service

                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </motion.div>

                    <Link
                      href="/services/regular-home-cleaning"
                      className="text-sm font-semibold text-blue-100 transition-colors hover:text-white"
                    >
                      View details
                    </Link>
                  </div>
                </div>

                {/* Home cleaning preview */}
                <div className="relative mx-auto w-full max-w-[340px]">
                  <motion.div
                    aria-hidden="true"
                    className="absolute -inset-5 rounded-[2rem] border border-dashed border-blue-200/25"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <div className="relative space-y-3 rounded-[1.75rem] border border-white/10 bg-white/10 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                          Cleaning plan
                        </p>

                        <p className="mt-1 font-heading text-lg font-bold text-white">
                          Complete Home
                        </p>
                      </div>

                      <motion.span
                        animate={{
                          scale: [1, 1.14, 1],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-400/15 text-green-300"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </motion.span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {homeTasks.map(({ icon: Icon, label }, index) => (
                        <motion.div
                          key={label}
                          initial={{
                            opacity: 0,
                            x: 25,
                          }}
                          whileInView={{
                            opacity: 1,
                            x: 0,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            delay: 0.35 + index * 0.12,
                          }}
                          whileHover={{
                            x: 5,
                          }}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.08] p-3"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">
                            <Icon className="h-4 w-4" />
                          </span>

                          <span className="text-sm font-semibold text-white">
                            {label}
                          </span>

                          <CheckCircle2 className="ml-auto h-4 w-4 text-green-300" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Deep cleaning */}
            <SpotlightCard
              delay={0.12}
              spotlightColor="rgba(139, 92, 246, 0.15)"
              className="min-h-[430px] p-7"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />

              <div className="relative flex h-full flex-col">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm">
                  <Sparkles className="h-7 w-7" />
                </span>

                <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
                  Detailed care
                </p>

                <h3 className="mt-3 font-heading text-2xl font-bold text-navy">
                  Deep Cleaning
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  An intensive clean for spaces that need extra attention and
                  more detailed care.
                </p>

                <div className="mt-7 space-y-3">
                  {deepCleaningTasks.map((task, index) => (
                    <motion.div
                      key={task}
                      initial={{
                        opacity: 0,
                        x: 20,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: 0.3 + index * 0.12,
                      }}
                      whileHover={{
                        x: 5,
                      }}
                      className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>

                      <span className="text-sm font-medium leading-6 text-slate-700">
                        {task}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto pt-7">
                  <div className="flex items-center justify-between border-t border-primary/10 pt-5">
                    <div>
                      <p className="text-xs text-slate-500">Starting from</p>

                      <p className="mt-1 font-heading text-2xl font-extrabold text-navy">
                        $55
                      </p>
                    </div>

                    <motion.div
                      whileHover={{
                        scale: 1.08,
                        rotate: -3,
                      }}
                      whileTap={{
                        scale: 0.96,
                      }}
                    >
                      <Link
                        href="/book?service=deep-cleaning"
                        aria-label="Book deep cleaning"
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Move cleaning */}
            <SpotlightCard
              delay={0.18}
              spotlightColor="rgba(16, 185, 129, 0.15)"
              className="min-h-[400px] p-7"
            >
              <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />

              <div className="relative flex h-full flex-col">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
                  <KeyRound className="h-7 w-7" />
                </span>

                <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
                  A fresh beginning
                </p>

                <h3 className="mt-3 font-heading text-2xl font-bold text-navy">
                  Move-In / Move-Out
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Prepare an empty property for its next chapter with focused,
                  detailed cleaning.
                </p>

                <div className="mt-7 space-y-3">
                  {moveCleaningTasks.map((task, index) => (
                    <motion.div
                      key={task.label}
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: 0.28 + index * 0.12,
                      }}
                      className="flex items-center gap-3"
                    >
                      <motion.span
                        animate={
                          task.completed
                            ? {
                              scale: [1, 1.12, 1],
                            }
                            : undefined
                        }
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${task.completed
                            ? "bg-emerald-100 text-emerald-600"
                            : "border border-slate-200 bg-white text-slate-500"
                          }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <CalendarDays className="h-4 w-4" />
                        )}
                      </motion.span>

                      <span className="text-sm font-medium text-slate-700">
                        {task.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto pt-7">
                  <Link
                    href="/services/move-in-move-out"
                    className="group inline-flex items-center gap-2 text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    Explore service

                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </SpotlightCard>

            {/* Office cleaning */}
            <SpotlightCard
              delay={0.24}
              spotlightColor="rgba(6, 182, 212, 0.15)"
              className="min-h-[400px] p-7 md:col-span-2 lg:col-span-2"
            >
              <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

              <div className="relative grid h-full items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 shadow-sm">
                    <Building2 className="h-7 w-7" />
                  </span>

                  <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
                    Professional workspaces
                  </p>

                  <h3 className="mt-3 font-heading text-3xl font-extrabold text-navy">
                    Office Cleaning
                  </h3>

                  <p className="mt-5 max-w-xl leading-7 text-slate-600">
                    Create a cleaner, more comfortable workplace for your team,
                    visitors, and daily operations.
                  </p>

                  <div className="mt-7">
                    <motion.div
                      whileHover={{
                        y: -4,
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                      className="inline-block"
                    >
                      <Link
                        href="/book?service=office-cleaning"
                        className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-[0_15px_35px_rgba(6,182,212,0.25)] transition-colors hover:bg-cyan-500"
                      >
                        Book Office Cleaning

                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </motion.div>
                  </div>
                </div>

                {/* Office preview */}
                <div className="rounded-[1.75rem] border border-primary/10 bg-white p-5 shadow-[0_22px_55px_rgba(11,37,69,0.10)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        Workspace plan
                      </p>

                      <p className="mt-1 font-heading text-lg font-bold text-navy">
                        Weekly Office Care
                      </p>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600">
                      Active
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {officeFeatures.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{
                          opacity: 0,
                          scale: 0.9,
                        }}
                        whileInView={{
                          opacity: 1,
                          scale: 1,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          delay: 0.3 + index * 0.1,
                        }}
                        whileHover={{
                          y: -3,
                        }}
                        className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3"
                      >
                        <CheckCircle2 className="h-4 w-4 text-cyan-600" />

                        <p className="mt-2 text-sm font-semibold leading-5 text-navy">
                          {feature}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-primary-light px-4 py-3">
                    <span className="text-sm font-medium text-navy">
                      Flexible schedule
                    </span>

                    <Clock3 className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Bottom navigation panel */}
          <motion.div
            initial={{
              opacity: 0,
              y: 55,
              scale: 0.97,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mt-16 overflow-hidden rounded-[2rem] bg-navy px-6 py-10 shadow-[0_28px_80px_rgba(11,37,69,0.25)] sm:px-10 lg:px-14"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-primary/35 blur-3xl"
              animate={{
                scale: [1, 1.25, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              aria-hidden="true"
              className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              aria-hidden="true"
              className="absolute -top-full left-1/3 h-[38rem] w-24 rotate-[24deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-xl"
              animate={{
                x: [-220, 850],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut",
              }}
            />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                  <Sparkles className="h-4 w-4" />
                  More ways to clean
                </div>

                <h3 className="mt-3 font-heading text-2xl font-extrabold text-white sm:text-3xl">
                  Find the perfect service for your property.
                </h3>

                <p className="mt-3 max-w-2xl leading-7 text-blue-100/75">
                  Compare services, included tasks, estimated duration, and
                  pricing before making your choice.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.div
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                >
                  <Link
                    href="/services"
                    className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/15"
                  >
                    View All Services

                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                >
                  <Link
                    href="/book"
                    className="group relative inline-flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3.5 font-bold text-primary shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                  >
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-primary/10"
                      animate={{
                        left: ["-50%", "140%"],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                      }}
                    />

                    <span className="relative">Start Booking</span>

                    <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}