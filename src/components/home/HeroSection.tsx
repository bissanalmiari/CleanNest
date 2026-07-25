"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  CookingPot,
  Home,
  Leaf,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

interface CleaningRoom {
  name: string;
  detail: string;
  icon: LucideIcon;
  className: string;
  accentClassName: string;
}

interface CleaningStage {
  title: string;
  shortTitle: string;
  description: string;
}

interface CleanerMarkerPosition {
  left: string;
  top: string;
}

const cleaningRooms: CleaningRoom[] = [
  {
    name: "Living room",
    detail: "Dusting and surface care",
    icon: Home,
    className:
      "col-start-1 row-start-1 rounded-[2rem_1rem_1rem_1rem]",
    accentClassName:
      "from-blue-500/20 via-primary/10 to-transparent",
  },
  {
    name: "Kitchen",
    detail: "Counters and cooking area",
    icon: CookingPot,
    className:
      "col-start-2 row-start-1 rounded-[1rem_2rem_1rem_1rem]",
    accentClassName:
      "from-cyan-500/20 via-blue-400/10 to-transparent",
  },
  {
    name: "Bedroom",
    detail: "Fresh and organized",
    icon: BedDouble,
    className:
      "col-start-1 row-start-2 rounded-[1rem_1rem_1rem_2rem]",
    accentClassName:
      "from-indigo-500/20 via-primary/10 to-transparent",
  },
  {
    name: "Bathroom",
    detail: "Sanitized and polished",
    icon: Bath,
    className:
      "col-start-2 row-start-2 rounded-[1rem_1rem_2rem_1rem]",
    accentClassName:
      "from-emerald-400/20 via-cyan-400/10 to-transparent",
  },
];

const cleaningStages: CleaningStage[] = [
  {
    title: "Refreshing the living room",
    shortTitle: "Living room",
    description:
      "The cleaning route begins with the main shared space.",
  },
  {
    title: "Detailing the kitchen",
    shortTitle: "Kitchen",
    description:
      "High-use surfaces receive focused cleaning and care.",
  },
  {
    title: "Resetting the bedroom",
    shortTitle: "Bedroom",
    description:
      "The private space is refreshed and neatly organized.",
  },
  {
    title: "Finishing the bathroom",
    shortTitle: "Bathroom",
    description:
      "The final zone is sanitized before the quality check.",
  },
];

const cleanerMarkerPositions: CleanerMarkerPosition[] = [
  {
    left: "16%",
    top: "24%",
  },
  {
    left: "76%",
    top: "26%",
  },
  {
    left: "20%",
    top: "69%",
  },
  {
    left: "76%",
    top: "68%",
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    text: "Account-protected booking",
  },
  {
    icon: Leaf,
    text: "Eco-conscious options",
  },
  {
    icon: Clock3,
    text: "Flexible scheduling",
  },
];

const backgroundCoordinates = [
  {
    top: "12%",
    left: "7%",
    size: 7,
    duration: 6,
    delay: 0,
  },
  {
    top: "29%",
    left: "3%",
    size: 4,
    duration: 8,
    delay: 1.2,
  },
  {
    top: "73%",
    left: "9%",
    size: 8,
    duration: 7,
    delay: 0.5,
  },
  {
    top: "88%",
    left: "35%",
    size: 5,
    duration: 6,
    delay: 1.8,
  },
  {
    top: "8%",
    left: "63%",
    size: 6,
    duration: 8,
    delay: 0.9,
  },
  {
    top: "18%",
    left: "91%",
    size: 8,
    duration: 7,
    delay: 1.6,
  },
  {
    top: "78%",
    left: "94%",
    size: 5,
    duration: 6,
    delay: 2,
  },
];

function roomStateClasses(
  roomIndex: number,
  activeStage: number,
) {
  const isActive =
    roomIndex === activeStage;

  const isComplete =
    roomIndex < activeStage;

  if (isActive) {
    return {
      room:
        "border-primary/50 bg-white shadow-[0_22px_55px_rgba(30,111,217,0.20)] ring-4 ring-primary/10",
      icon: "bg-primary text-white",
      status:
        "border-primary/15 bg-primary-light text-primary",
    };
  }

  if (isComplete) {
    return {
      room:
        "border-emerald-200 bg-emerald-50/80 shadow-[0_16px_40px_rgba(16,185,129,0.10)]",
      icon: "bg-emerald-500 text-white",
      status:
        "border-emerald-200 bg-white text-emerald-600",
    };
  }

  return {
    room:
      "border-slate-200/80 bg-white/70 shadow-[0_14px_35px_rgba(11,37,69,0.07)]",
    icon: "bg-slate-100 text-slate-400",
    status:
      "border-slate-200 bg-white/80 text-slate-400",
  };
}

export default function HeroSection() {
  const prefersReducedMotion =
    useReducedMotion();

  const [activeStage, setActiveStage] =
    useState(0);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothPointerX = useSpring(
    pointerX,
    {
      stiffness: 90,
      damping: 20,
      mass: 0.55,
    },
  );

  const smoothPointerY = useSpring(
    pointerY,
    {
      stiffness: 90,
      damping: 20,
      mass: 0.55,
    },
  );

  const plannerRotateX = useTransform(
    smoothPointerY,
    [-0.5, 0.5],
    [5, -5],
  );

  const plannerRotateY = useTransform(
    smoothPointerX,
    [-0.5, 0.5],
    [-6, 6],
  );

  const leftGlowX = useTransform(
    smoothPointerX,
    [-0.5, 0.5],
    [-35, 35],
  );

  const leftGlowY = useTransform(
    smoothPointerY,
    [-0.5, 0.5],
    [-25, 25],
  );

  const routeProgress =
    ((activeStage + 1) /
      cleaningStages.length) *
    100;

  const currentCleaningStage =
    cleaningStages[activeStage] ??
    cleaningStages[0]!;

  const currentMarkerPosition =
    cleanerMarkerPositions[activeStage] ??
    cleanerMarkerPositions[0]!;

  useEffect(() => {
    if (prefersReducedMotion) {
      setActiveStage(
        cleaningStages.length - 1,
      );

      return;
    }

    const interval =
      window.setInterval(() => {
        setActiveStage(
          (currentStage) =>
            (currentStage + 1) %
            cleaningStages.length,
        );
      }, 2600);

    return () => {
      window.clearInterval(interval);
    };
  }, [prefersReducedMotion]);

  function handlePointerMove(
    event: MouseEvent<HTMLElement>,
  ) {
    if (prefersReducedMotion) {
      return;
    }

    const bounds =
      event.currentTarget.getBoundingClientRect();

    const normalizedX =
      (event.clientX - bounds.left) /
        bounds.width -
      0.5;

    const normalizedY =
      (event.clientY - bounds.top) /
        bounds.height -
      0.5;

    pointerX.set(normalizedX);
    pointerY.set(normalizedY);
  }

  function resetPointerPosition() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <section
      id="home"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointerPosition}
      className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-[#f4f8fd] font-body"
    >
      {/* Main background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(30,111,217,0.18),transparent_26%),radial-gradient(circle_at_100%_75%,rgba(34,211,238,0.14),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f5f9fe_48%,#edf6ff_100%)]"
      />

      {/* Architectural grid */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.09) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
        animate={
          prefersReducedMotion
            ? undefined
            : {
                backgroundPosition: [
                  "0px 0px",
                  "72px 72px",
                ],
              }
        }
        transition={{
          duration: 24,
          repeat: 0,
          ease: "linear",
        }}
      />

      {/* Background word */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 bottom-[-5rem] hidden select-none font-heading text-[17rem] font-black leading-none tracking-[-0.08em] text-primary/[0.025] xl:block"
      >
        CLEAN
      </div>

      {/* Pointer-controlled glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -left-56 top-12 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-3xl"
        style={{
          x: leftGlowX,
          y: leftGlowY,
        }}
      />

      {/* Right glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -right-52 bottom-[-10rem] h-[40rem] w-[40rem] rounded-full bg-cyan-300/15 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [1, 1.22, 1],
                x: [0, -55, 0],
                y: [0, -35, 0],
              }
        }
        transition={{
          duration: 13,
          repeat: 0,
          ease: "easeInOut",
        }}
      />

      {/* Floating points */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {backgroundCoordinates.map(
          (coordinate, index) => (
            <motion.span
              key={`${coordinate.top}-${coordinate.left}`}
              className="absolute rounded-full bg-primary/40 shadow-[0_0_18px_rgba(30,111,217,0.45)]"
              style={{
                top: coordinate.top,
                left: coordinate.left,
                width: coordinate.size,
                height: coordinate.size,
              }}
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: [0, -22, 0],
                      x: [
                        0,
                        index % 2 === 0
                          ? 14
                          : -14,
                        0,
                      ],
                      opacity: [
                        0.15,
                        0.8,
                        0.15,
                      ],
                      scale: [
                        0.75,
                        1.35,
                        0.75,
                      ],
                    }
              }
              transition={{
                duration:
                  coordinate.duration,
                delay: coordinate.delay,
                repeat: 0,
                ease: "easeInOut",
              }}
            />
          ),
        )}
      </div>

      {/* Vertical reference */}
      <div className="absolute left-5 top-1/2 z-10 hidden -translate-y-1/2 xl:block">
        <div className="flex items-center gap-4 [writing-mode:vertical-rl]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-primary/50">
            CleanNest route system
          </span>

          <span className="h-20 w-px bg-gradient-to-b from-primary/10 via-primary/50 to-primary/10" />

          <span className="font-heading text-xs font-bold text-navy/35">
            001
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-[1450px] items-center gap-12 px-5 pb-14 pt-24 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:pb-16 lg:pt-28 xl:gap-16">
        {/* Left content */}
        <div className="relative z-10 max-w-2xl">
          {/* Location */}
          <motion.div
            initial={{
              opacity: 0,
              x: -25,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="flex items-center gap-3"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-white text-primary shadow-card">
              <MapPin className="h-5 w-5" />

              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-xl border border-primary/30"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: [
                          1,
                          1.45,
                          1.45,
                        ],
                        opacity: [
                          0.6,
                          0,
                          0,
                        ],
                      }
                }
                transition={{
                  duration: 2.2,
                  repeat: 0,
                  ease: "easeOut",
                }}
              />
            </span>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary">
                Cleaning across Lebanon
              </p>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Your home becomes the cleaning plan.
              </p>
            </div>
          </motion.div>

          {/* Heading */}
          <h1 className="mt-8 font-heading text-[3.25rem] font-black leading-[0.95] tracking-[-0.055em] text-navy sm:text-6xl lg:text-[4.35rem] xl:text-[5rem]">
            <motion.span
              initial={{
                opacity: 0,
                y: 45,
                filter: "blur(12px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.8,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="block"
            >
              Every home
            </motion.span>

            <motion.span
              initial={{
                opacity: 0,
                y: 45,
                filter: "blur(12px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.8,
                delay: 0.12,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="mt-1 block"
            >
              has a{" "}
              <span className="relative inline-block text-primary">
                clean route.

                <motion.span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-transparent opacity-35"
                  initial={{
                    scaleX: 0,
                    transformOrigin: "left",
                  }}
                  animate={{
                    scaleX: 1,
                  }}
                  transition={{
                    duration: 0.9,
                    delay: 0.75,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                />
              </span>
            </motion.span>

            <motion.span
              initial={{
                opacity: 0,
                y: 45,
                filter: "blur(12px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.8,
                delay: 0.24,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="mt-1 block text-[0.56em] font-bold leading-tight tracking-[-0.035em] text-slate-400"
            >
              We make it simple.
            </motion.span>
          </h1>

          {/* Description */}
          <motion.p
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.48,
            }}
            className="mt-8 max-w-xl text-base leading-8 text-slate-600 sm:text-lg"
          >
            Select a service and preferred time.
            CleanNest organizes the rest into one
            clear journey—from booking to a freshly
            cleaned space.
          </motion.p>

          {/* Process */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.62,
            }}
            className="mt-7 flex flex-wrap items-center gap-2"
          >
            {[
              "Choose",
              "Schedule",
              "Relax",
              "Return clean",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2"
              >
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    index === 3
                      ? "bg-navy text-white"
                      : "border border-primary/10 bg-white/80 text-primary shadow-sm"
                  }`}
                >
                  {step}
                </span>

                {index < 3 && (
                  <ArrowRight className="h-3.5 w-3.5 text-primary/35" />
                )}
              </div>
            ))}
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.78,
            }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.02,
                    }
              }
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="/book"
                className="group relative flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-navy px-7 py-4 font-bold text-white shadow-[0_18px_45px_rgba(11,37,69,0.28)] transition-shadow hover:shadow-[0_22px_55px_rgba(11,37,69,0.38)]"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/3 w-1/4 skew-x-[-20deg] bg-white/20"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          left: [
                            "-35%",
                            "135%",
                          ],
                        }
                  }
                  transition={{
                    duration: 2.3,
                    repeat: 0,
                    repeatDelay: 1.8,
                    ease: "easeInOut",
                  }}
                />

                <CalendarCheck2 className="relative h-5 w-5 text-cyan-300" />

                <span className="relative">
                  Build My Cleaning
                </span>

                <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: -4,
                    }
              }
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="#services"
                className="group flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-primary/15 bg-white/75 px-7 py-4 font-bold text-navy shadow-card backdrop-blur-md transition-all hover:border-primary/35 hover:bg-white"
              >
                Explore Services

                <Navigation className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust items */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.95,
            }}
            className="mt-9 grid max-w-xl gap-3 border-t border-primary/10 pt-6 sm:grid-cols-3"
          >
            {trustItems.map(
              ({ icon: Icon, text }, index) => (
                <motion.div
                  key={text}
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
                      1.05 +
                      index * 0.1,
                  }}
                  className="flex items-center gap-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="text-xs font-semibold leading-5 text-slate-500">
                    {text}
                  </span>
                </motion.div>
              ),
            )}
          </motion.div>
        </div>

        {/* Apartment planner */}
        <motion.div
          initial={{
            opacity: 0,
            x: 65,
            scale: 0.92,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          transition={{
            duration: 1,
            delay: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 mx-auto w-full max-w-[760px]"
        >
          {/* Reference label */}
          <div className="mb-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />

              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-primary/60">
                Clean route preview
              </p>
            </div>

            <p className="font-mono text-[10px] font-bold text-slate-400">
              CN / HOME / 04
            </p>
          </div>

          {/* Outer rotating border */}
          <motion.div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[3rem] border border-dashed border-primary/15"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    rotate: 360,
                  }
            }
            transition={{
              duration: 45,
              repeat: 0,
              ease: "linear",
            }}
          />

          <motion.div
            style={{
              rotateX: plannerRotateX,
              rotateY: plannerRotateY,
              transformPerspective: 1400,
            }}
            className="relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/75 p-3 shadow-[0_35px_100px_rgba(11,37,69,0.18)] backdrop-blur-md sm:p-4"
          >
            {/* Planner header */}
            <div className="flex flex-col gap-4 rounded-[1.8rem] border border-primary/10 bg-navy px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          rotate: [
                            0,
                            8,
                            -8,
                            0,
                          ],
                        }
                  }
                  transition={{
                    duration: 3,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-300"
                >
                  <Sparkles className="h-5 w-5" />
                </motion.span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/65">
                    CleanNest route builder
                  </p>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={
                        currentCleaningStage.title
                      }
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                      }}
                      className="mt-1 font-heading text-base font-bold sm:text-lg"
                    >
                      {
                        currentCleaningStage.title
                      }
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-100">
                <span className="relative flex h-2.5 w-2.5">
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : {
                            scale: [
                              1,
                              1.9,
                              1,
                            ],
                            opacity: [
                              0.8,
                              0,
                              0.8,
                            ],
                          }
                    }
                    transition={{
                      duration: 2,
                      repeat: 0,
                    }}
                  />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>

                Route active
              </div>
            </div>

            {/* Floor plan */}
            <div className="relative mt-3 aspect-[620/430] overflow-hidden rounded-[1.8rem] border border-primary/10 bg-[#eef5fc] p-3 sm:p-4">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(30,111,217,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.08) 1px, transparent 1px)",
                  backgroundSize:
                    "26px 26px",
                }}
              />

              <span className="absolute left-5 top-4 font-mono text-[9px] font-bold text-primary/35">
                A-01
              </span>

              <span className="absolute right-5 top-4 font-mono text-[9px] font-bold text-primary/35">
                A-02
              </span>

              <span className="absolute bottom-4 left-5 font-mono text-[9px] font-bold text-primary/35">
                B-01
              </span>

              <span className="absolute bottom-4 right-5 font-mono text-[9px] font-bold text-primary/35">
                B-02
              </span>

              {/* Cleaning path */}
              <svg
                aria-hidden="true"
                viewBox="0 0 620 430"
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              >
                <path
                  d="M115 122 C190 72 275 84 354 116 C430 148 516 105 521 165 C527 227 441 243 362 279 C282 315 207 355 119 308"
                  fill="none"
                  stroke="rgba(30,111,217,0.12)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                <motion.path
                  d="M115 122 C190 72 275 84 354 116 C430 148 516 105 521 165 C527 227 441 243 362 279 C282 315 207 355 119 308"
                  fill="none"
                  stroke="url(#cleanRouteGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength:
                      prefersReducedMotion
                        ? 1
                        : [
                            0.05,
                            0.35,
                            0.62,
                            1,
                          ],
                    opacity: 1,
                  }}
                  transition={{
                    duration: 8,
                    repeat:
                      prefersReducedMotion
                        ? 0
                        : 0,
                    ease: "easeInOut",
                  }}
                />

                <defs>
                  <linearGradient
                    id="cleanRouteGradient"
                    x1="0"
                    y1="0"
                    x2="620"
                    y2="430"
                  >
                    <stop
                      offset="0%"
                      stopColor="#1E6FD9"
                    />

                    <stop
                      offset="55%"
                      stopColor="#22D3EE"
                    />

                    <stop
                      offset="100%"
                      stopColor="#10B981"
                    />
                  </linearGradient>
                </defs>
              </svg>

              {/* Rooms */}
              <div className="relative z-10 grid h-full grid-cols-[1.12fr_0.88fr] grid-rows-2 gap-2.5 sm:gap-3">
                {cleaningRooms.map(
                  (room, roomIndex) => {
                    const Icon = room.icon;

                    const state =
                      roomStateClasses(
                        roomIndex,
                        activeStage,
                      );

                    const isActive =
                      roomIndex ===
                      activeStage;

                    const isComplete =
                      roomIndex <
                      activeStage;

                    return (
                      <motion.button
                        key={room.name}
                        type="button"
                        onClick={() =>
                          setActiveStage(
                            roomIndex,
                          )
                        }
                        layout
                        whileHover={{
                          y: -3,
                          scale: 1.01,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        className={`group relative overflow-hidden border p-3 text-left transition-colors sm:p-4 ${room.className} ${state.room}`}
                        aria-label={`Preview ${room.name} cleaning stage`}
                      >
                        <motion.div
                          aria-hidden="true"
                          className={`absolute inset-0 bg-gradient-to-br ${room.accentClassName}`}
                          animate={
                            isActive &&
                            !prefersReducedMotion
                              ? {
                                  opacity: [
                                    0.35,
                                    0.8,
                                    0.35,
                                  ],
                                }
                              : {
                                  opacity:
                                    isComplete
                                      ? 0.45
                                      : 0.2,
                                }
                          }
                          transition={{
                            duration: 2.4,
                            repeat:
                              isActive &&
                              !prefersReducedMotion
                                ? 0
                                : 0,
                          }}
                        />

                        {isActive && (
                          <div
                            aria-hidden="true"
                            className="absolute inset-0"
                          >
                            {Array.from({
                              length: 5,
                            }).map(
                              (
                                _,
                                particleIndex,
                              ) => (
                                <motion.span
                                  key={
                                    particleIndex
                                  }
                                  className="absolute h-1.5 w-1.5 rounded-full bg-primary/45"
                                  style={{
                                    left: `${
                                      20 +
                                      particleIndex *
                                        14
                                    }%`,
                                    top: `${
                                      68 -
                                      (particleIndex %
                                        2) *
                                        30
                                    }%`,
                                  }}
                                  animate={
                                    prefersReducedMotion
                                      ? undefined
                                      : {
                                          y: [
                                            0,
                                            -18,
                                            0,
                                          ],
                                          opacity: [
                                            0,
                                            0.8,
                                            0,
                                          ],
                                          scale: [
                                            0.6,
                                            1.3,
                                            0.6,
                                          ],
                                        }
                                  }
                                  transition={{
                                    duration:
                                      2.2 +
                                      particleIndex *
                                        0.25,
                                    delay:
                                      particleIndex *
                                      0.18,
                                    repeat:
                                      0,
                                    ease: "easeInOut",
                                  }}
                                />
                              ),
                            )}
                          </div>
                        )}

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <motion.span
                              animate={
                                isActive &&
                                !prefersReducedMotion
                                  ? {
                                      rotate: [
                                        0,
                                        4,
                                        -4,
                                        0,
                                      ],
                                      scale: [
                                        1,
                                        1.08,
                                        1,
                                      ],
                                    }
                                  : undefined
                              }
                              transition={{
                                duration: 2.5,
                                repeat:
                                  0,
                                ease: "easeInOut",
                              }}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11 ${state.icon}`}
                            >
                              {isComplete ? (
                                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </motion.span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ${state.status}`}
                            >
                              {isComplete
                                ? "Clean"
                                : isActive
                                  ? "In progress"
                                  : "Waiting"}
                            </span>
                          </div>

                          <div className="mt-auto">
                            <p className="font-heading text-xs font-bold text-navy sm:text-sm">
                              {room.name}
                            </p>

                            <p className="mt-1 hidden text-[10px] leading-4 text-slate-500 sm:block">
                              {room.detail}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  },
                )}
              </div>

              {/* Cleaner marker */}
              <motion.div
                aria-hidden="true"
                className="absolute z-30 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-[0_10px_30px_rgba(30,111,217,0.4)]"
                animate={{
                  left:
                    currentMarkerPosition.left,
                  top:
                    currentMarkerPosition.top,
                }}
                transition={{
                  type: "spring",
                  stiffness: 90,
                  damping: 16,
                }}
              >
                <Sparkles className="h-4 w-4" />

                <motion.span
                  className="absolute inset-[-7px] rounded-full border border-primary/30"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: [
                            0.8,
                            1.4,
                            0.8,
                          ],
                          opacity: [
                            0.8,
                            0,
                            0.8,
                          ],
                        }
                  }
                  transition={{
                    duration: 1.8,
                    repeat: 0,
                  }}
                />
              </motion.div>
            </div>

            {/* Current stage */}
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="rounded-[1.5rem] border border-primary/10 bg-white px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Navigation className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      Current route stage
                    </p>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStage}
                        initial={{
                          opacity: 0,
                          x: 12,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: -12,
                        }}
                      >
                        <p
                          aria-live="polite"
                          className="mt-1 text-sm font-bold text-navy"
                        >
                          {
                            currentCleaningStage.shortTitle
                          }
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          {
                            currentCleaningStage.description
                          }
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex min-w-[145px] items-center gap-3 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />

                <div>
                  <p className="font-heading text-lg font-extrabold text-emerald-700">
                    {activeStage + 1}/4
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600/70">
                    Zones routed
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-3 rounded-[1.5rem] border border-primary/10 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold text-navy">
                  Cleaning journey
                </p>

                <p className="font-mono text-[10px] font-bold text-primary">
                  {Math.round(
                    routeProgress,
                  )}
                  %
                </p>
              </div>

              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-primary-light">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-400"
                  animate={{
                    width: `${routeProgress}%`,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                />

                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          left: [
                            "-20%",
                            "110%",
                          ],
                        }
                  }
                  transition={{
                    duration: 2.2,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {cleaningStages.map(
                  (stage, index) => (
                    <button
                      key={
                        stage.shortTitle
                      }
                      type="button"
                      onClick={() =>
                        setActiveStage(index)
                      }
                      className="group flex min-w-0 flex-col items-center gap-2"
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-extrabold transition-all ${
                          index ===
                          activeStage
                            ? "border-primary bg-primary text-white shadow-md"
                            : index <
                                activeStage
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-primary/15 bg-white text-primary/50 group-hover:border-primary/35"
                        }`}
                      >
                        {index <
                        activeStage ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          index + 1
                        )}
                      </span>

                      <span
                        className={`truncate text-[9px] font-bold sm:text-[10px] ${
                          index ===
                          activeStage
                            ? "text-primary"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.shortTitle}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          </motion.div>

          {/* Booking card */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              rotate: 4,
            }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: -2,
            }}
            transition={{
              duration: 0.7,
              delay: 1,
            }}
            whileHover={{
              rotate: 0,
              y: -5,
            }}
            className="absolute -bottom-7 -left-3 z-30 hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_20px_55px_rgba(11,37,69,0.18)] backdrop-blur-md sm:block xl:-left-10"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-cyan-300">
                <CalendarCheck2 className="h-5 w-5" />
              </span>

              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary">
                  One simple booking
                </p>

                <p className="mt-1 text-xs font-bold text-navy">
                  4 spaces · 1 clean route
                </p>
              </div>
            </div>
          </motion.div>

          {/* Eco card */}
          <motion.div
            initial={{
              opacity: 0,
              x: 25,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 1.15,
            }}
            className="absolute -right-3 top-[18%] z-30 hidden sm:block xl:-right-8"
          >
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: [0, -7, 0],
                    }
              }
              transition={{
                duration: 3,
                repeat: 0,
                ease: "easeInOut",
              }}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/95 p-3 shadow-[0_18px_45px_rgba(16,185,129,0.15)] backdrop-blur-md"
            >
              <div className="flex items-center gap-2.5">
                <Leaf className="h-5 w-5 text-emerald-600" />

                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Eco option
                  </p>

                  <p className="text-[9px] text-emerald-600/70">
                    Available at booking
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 hidden h-12 items-center border-t border-primary/10 bg-white/35 px-8 backdrop-blur-lg lg:flex">
        <div className="mx-auto flex w-full max-w-[1450px] items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary/50">
              Route state
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[10px] font-semibold text-slate-500">
              Booking system ready
            </span>
          </div>

          <motion.a
            href="#about"
            className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary"
            whileHover={{
              y: 2,
            }}
          >
            Discover CleanNest

            <motion.span
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: [0, 5, 0],
                    }
              }
              transition={{
                duration: 1.6,
                repeat: 0,
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </motion.span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}