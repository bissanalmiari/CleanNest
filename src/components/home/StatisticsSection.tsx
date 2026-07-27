"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  Home,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";

const statistics = [
  {
    value: 1200,
    decimals: 0,
    suffix: "+",
    label: "Successful Cleanings",
    description: "Homes and workplaces refreshed through dependable CleanNest services.",
    icon: Sparkles,
    progress: 92,
    accentClass: "bg-primary text-white",
    softClass: "bg-primary-light text-primary",
    ringClass: "stroke-primary",
    barClass: "bg-primary",
    glowClass: "bg-primary/15",
    spotlightColor: "rgba(30, 111, 217, 0.14)",
  },
  {
    value: 98,
    decimals: 0,
    suffix: "%",
    label: "Satisfied Customers",
    description: "A customer-focused experience built around care, quality, and convenience.",
    icon: Users,
    progress: 98,
    accentClass: "bg-emerald-500 text-white",
    softClass: "bg-emerald-50 text-emerald-600",
    ringClass: "stroke-emerald-500",
    barClass: "bg-emerald-500",
    glowClass: "bg-emerald-400/15",
    spotlightColor: "rgba(16, 185, 129, 0.14)",
  },
  {
    value: 4.9,
    decimals: 1,
    suffix: "/5",
    label: "Average Rating",
    description: "Excellent feedback for service quality, communication, and professionalism.",
    icon: Star,
    progress: 98,
    accentClass: "bg-amber-500 text-white",
    softClass: "bg-amber-50 text-amber-600",
    ringClass: "stroke-amber-500",
    barClass: "bg-amber-500",
    glowClass: "bg-amber-400/15",
    spotlightColor: "rgba(245, 158, 11, 0.14)",
  },
  {
    value: 4,
    decimals: 0,
    suffix: "",
    label: "Core Cleaning Services",
    description: "Flexible options for regular homes, deep cleaning, moving, and offices.",
    icon: Home,
    progress: 100,
    accentClass: "bg-cyan-500 text-white",
    softClass: "bg-cyan-50 text-cyan-600",
    ringClass: "stroke-cyan-500",
    barClass: "bg-cyan-500",
    glowClass: "bg-cyan-400/15",
    spotlightColor: "rgba(6, 182, 212, 0.14)",
  },
];

const trustMessages = [
  {
    icon: ShieldCheck,
    text: "Secure account-based booking",
  },
  {
    icon: CheckCircle2,
    text: "Transparent pricing",
  },
  {
    icon: Clock3,
    text: "Flexible scheduling",
  },
  {
    icon: Award,
    text: "Quality-focused service",
  },
];

const particles = [
  {
    top: "10%",
    left: "5%",
    size: 6,
    duration: 6,
    delay: 0,
  },
  {
    top: "22%",
    left: "18%",
    size: 9,
    duration: 8,
    delay: 1,
  },
  {
    top: "72%",
    left: "7%",
    size: 7,
    duration: 7,
    delay: 0.5,
  },
  {
    top: "88%",
    left: "27%",
    size: 5,
    duration: 6,
    delay: 1.4,
  },
  {
    top: "12%",
    left: "55%",
    size: 7,
    duration: 7,
    delay: 2,
  },
  {
    top: "78%",
    left: "52%",
    size: 10,
    duration: 9,
    delay: 0.8,
  },
  {
    top: "18%",
    left: "88%",
    size: 6,
    duration: 6,
    delay: 1.6,
  },
  {
    top: "63%",
    left: "94%",
    size: 8,
    duration: 8,
    delay: 0.3,
  },
];

type AnimatedCounterProps = {
  value: number;
  decimals: number;
  suffix: string;
};

function AnimatedCounter({ value, decimals, suffix }: AnimatedCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(counterRef, {
    once: true,
    amount: 0.7,
  });

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const counterAnimation = animate(0, value, {
      duration: 2.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        setDisplayValue(latest);
      },
    });

    return () => {
      counterAnimation.stop();
    };
  }, [isInView, value]);

  const formattedValue =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString("en-US");

  return (
    <span ref={counterRef}>
      {formattedValue}
      {suffix}
    </span>
  );
}

type Statistic = (typeof statistics)[number];

type StatisticCardProps = {
  statistic: Statistic;
  index: number;
};

function StatisticCard({ statistic, index }: StatisticCardProps) {
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
      ${statistic.spotlightColor},
      transparent 70%
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

    rawRotateY.set(normalizedX * 6);
    rawRotateX.set(normalizedY * -6);
  }

  function resetCard() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  const Icon = statistic.icon;

  return (
    <motion.article
      onMouseMove={handleMouseMove}
      onMouseLeave={resetCard}
      initial={{
        opacity: 0,
        y: 70,
        scale: 0.9,
        rotate: index % 2 === 0 ? -2 : 2,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.8,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -12,
        scale: 1.015,
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
      }}
      className="group relative min-h-[400px] overflow-hidden rounded-[2rem] border border-primary/10 bg-white/85 p-6 shadow-[0_20px_60px_rgba(11,37,69,0.10)] backdrop-blur-md sm:p-7"
    >
      {/* Cursor spotlight */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: spotlight,
        }}
      />

      {/* Animated background glow */}
      <motion.div
        aria-hidden="true"
        className={`absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl ${statistic.glowClass}`}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.35, 0.75, 0.35],
        }}
        transition={{
          duration: 5 + index,
          repeat: 0,
          ease: "easeInOut",
        }}
      />

      {/* Moving light shine */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent"
        animate={{
          left: ["-50%", "140%"],
        }}
        transition={{
          duration: 3,
          delay: index * 0.5,
          repeat: 0,
          repeatDelay: 3.5,
          ease: "easeInOut",
        }}
      />

      {/* Background card number */}
      <span className="absolute right-6 top-4 font-heading text-6xl font-extrabold text-primary/[0.045]">
        0{index + 1}
      </span>

      <div className="relative flex h-full flex-col">
        {/* Animated circular visual */}
        <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-dashed border-primary/20"
            animate={{
              rotate: index % 2 === 0 ? 360 : -360,
            }}
            transition={{
              duration: 18 + index * 3,
              repeat: 0,
              ease: "linear",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute inset-3 rounded-full border border-primary/10"
            animate={{
              rotate: index % 2 === 0 ? -360 : 360,
            }}
            transition={{
              duration: 15 + index * 2,
              repeat: 0,
              ease: "linear",
            }}
          />

          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="rgba(30,111,217,0.08)"
              strokeWidth="5"
            />

            <motion.circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className={statistic.ringClass}
              initial={{
                pathLength: 0,
                opacity: 0,
              }}
              whileInView={{
                pathLength: statistic.progress / 100,
                opacity: 1,
              }}
              viewport={{
                once: true,
                amount: 0.6,
              }}
              transition={{
                duration: 2.3,
                delay: 0.3 + index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </svg>

          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, 4, -4, 0],
            }}
            transition={{
              duration: 3 + index * 0.25,
              repeat: 0,
              ease: "easeInOut",
            }}
            whileHover={{
              scale: 1.12,
            }}
            className={`relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] shadow-[0_18px_45px_rgba(11,37,69,0.18)] ${statistic.accentClass}`}
          >
            <Icon
              className={`h-9 w-9 ${statistic.label === "Average Rating" ? "fill-current" : ""}`}
            />
          </motion.div>

          <motion.span
            aria-hidden="true"
            className="absolute right-4 top-5 h-3 w-3 rounded-full bg-primary shadow-[0_0_14px_rgba(30,111,217,0.65)]"
            animate={{
              scale: [0.7, 1.35, 0.7],
              opacity: [0.25, 1, 0.25],
            }}
            transition={{
              duration: 2.2,
              repeat: 0,
              delay: index * 0.3,
            }}
          />

          <motion.span
            aria-hidden="true"
            className="absolute bottom-4 left-5 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.7)]"
            animate={{
              y: [0, -8, 0],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 2.8,
              repeat: 0,
              delay: index * 0.2,
            }}
          />
        </div>

        {/* Counter */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.75,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            delay: 0.4 + index * 0.14,
            type: "spring",
            stiffness: 150,
            damping: 14,
          }}
          className="mt-5 text-center"
        >
          <p className="font-heading text-5xl font-extrabold tracking-tight text-navy">
            <AnimatedCounter
              value={statistic.value}
              decimals={statistic.decimals}
              suffix={statistic.suffix}
            />
          </p>

          <h3 className="mt-3 font-heading text-xl font-bold text-navy">{statistic.label}</h3>

          <p className="mx-auto mt-3 max-w-[270px] text-sm leading-6 text-slate-600">
            {statistic.description}
          </p>
        </motion.div>

        {/* Progress */}
        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>CleanNest progress</span>
            <span>{statistic.progress}%</span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <motion.div
              className={`h-full rounded-full ${statistic.barClass}`}
              initial={{
                width: "0%",
              }}
              whileInView={{
                width: `${statistic.progress}%`,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 1.8,
                delay: 0.55 + index * 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function StatisticsSection() {
  return (
    <MotionConfig reducedMotion="always">
      <section
        id="statistics"
        className="relative isolate overflow-hidden bg-surface-soft py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Light compatible background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(30,111,217,0.16),transparent_30%),radial-gradient(circle_at_87%_78%,rgba(6,182,212,0.13),transparent_28%),linear-gradient(to_bottom,#f5f9fe,#ffffff_48%,#edf6ff)]"
        />

        {/* Moving grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.17]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.11) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "70px 70px"],
          }}
          transition={{
            duration: 18,
            repeat: 0,
            ease: "linear",
          }}
        />

        {/* Large moving glows */}
        <motion.div
          aria-hidden="true"
          className="bg-primary/12 absolute -left-64 top-1/4 h-[42rem] w-[42rem] rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -65, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 14,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-64 bottom-0 h-[44rem] w-[44rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 60, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 16,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        {/* Full-section scanning light */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-full left-0 h-[70rem] w-40 rotate-[22deg] bg-gradient-to-b from-transparent via-primary/[0.055] to-transparent blur-2xl"
          animate={{
            x: [-300, 1800],
          }}
          transition={{
            duration: 8,
            repeat: 0,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />

        {/* Animated particles */}
        <div aria-hidden="true" className="absolute inset-0">
          {particles.map((particle, index) => (
            <motion.span
              key={`${particle.top}-${particle.left}`}
              className="absolute rounded-full bg-primary/45 shadow-[0_0_16px_rgba(30,111,217,0.45)]"
              style={{
                top: particle.top,
                left: particle.left,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                x: [0, index % 2 === 0 ? 18 : -18, 0],
                y: [0, -30, 0],
                opacity: [0.15, 0.8, 0.15],
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

        {/* Decorative rotating circles */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-40 top-[40%] h-80 w-80 rounded-full border border-dashed border-primary/10"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 32,
            repeat: 0,
            ease: "linear",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-44 top-[18%] h-96 w-96 rounded-full border border-dashed border-cyan-400/10"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 38,
            repeat: 0,
            ease: "linear",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Section heading */}
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
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-md"
            >
              <motion.span
                animate={{
                  rotate: [0, 18, -18, 0],
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  duration: 2.4,
                  repeat: 0,
                  repeatDelay: 1,
                }}
              >
                <Award className="h-4 w-4" />
              </motion.span>
              CleanNest by the Numbers
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Results That Reflect
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Trust, Quality, and Care.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Every booking, review, and completed cleaning helps CleanNest build a more dependable
              experience for customers across Lebanon.
            </p>
          </motion.div>

          {/* Statistic cards */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((statistic, index) => (
              <StatisticCard key={statistic.label} statistic={statistic} index={index} />
            ))}
          </div>

          {/* Continuous trust ticker */}
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
            transition={{
              duration: 0.8,
              delay: 0.3,
            }}
            className="relative mt-12 overflow-hidden rounded-2xl border border-primary/10 bg-white/80 py-4 shadow-[0_18px_50px_rgba(11,37,69,0.09)] backdrop-blur-md"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent"
            />

            <motion.div
              className="flex w-max items-center gap-12 px-8"
              animate={{
                x: ["0%", "-50%"],
              }}
              transition={{
                duration: 22,
                repeat: 0,
                ease: "linear",
              }}
            >
              {[...trustMessages, ...trustMessages].map(({ icon: Icon, text }, index) => (
                <div
                  key={`${text}-${index}`}
                  className="flex shrink-0 items-center gap-3 text-sm font-semibold text-slate-700"
                >
                  <motion.span
                    animate={{
                      rotate: [0, 6, -6, 0],
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 3,
                      delay: index * 0.2,
                      repeat: 0,
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.span>

                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{
              opacity: 0,
              y: 70,
              scale: 0.94,
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
            className="relative mt-16 overflow-hidden rounded-[2.25rem] bg-navy px-6 py-11 shadow-[0_30px_90px_rgba(11,37,69,0.27)] sm:px-10 lg:px-14"
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
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Be part of our growing community
                </div>

                <h3 className="mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Your next clean and comfortable space is only a few clicks away.
                </h3>

                <p className="mt-4 max-w-2xl leading-7 text-blue-100/75">
                  Create your account, choose your preferred service, and book a suitable date and
                  time in minutes.
                </p>
              </div>

              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: 0,
                  ease: "easeInOut",
                }}
                whileHover={{
                  scale: 1.05,
                  y: -8,
                }}
                whileTap={{
                  scale: 0.96,
                }}
              >
                <Link
                  href="/book"
                  className="group relative flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
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
                      repeatDelay: 1.4,
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
