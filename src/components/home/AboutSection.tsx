"use client";

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
import { motion, MotionConfig } from "motion/react";

const values = [
  {
    icon: ShieldCheck,
    title: "Trusted Professionals",
    description:
      "Reliable cleaning professionals selected to provide safe, respectful, and dependable service.",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly Care",
    description:
      "Responsible cleaning methods designed to protect your home, family, and environment.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    description:
      "Every service is designed around your comfort, schedule, and expectations.",
  },
];

const promises = [
  "Easy online booking in only a few steps",
  "Flexible appointments that fit your schedule",
  "Clear pricing with no unexpected charges",
  "Professional cleaning services across Lebanon",
];

const statistics = [
  {
    value: "1,200+",
    label: "Successful Cleanings",
  },
  {
    value: "98%",
    label: "Satisfied Customers",
  },
  {
    value: "4.9/5",
    label: "Average Rating",
  },
];

export default function AboutSection() {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="about"
        className="relative isolate overflow-hidden bg-white py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Background gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(30,111,217,0.10),transparent_27%),radial-gradient(circle_at_88%_78%,rgba(96,165,250,0.12),transparent_28%)]"
        />

        {/* Animated background glows */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-40 top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.18, 1],
            x: [0, 35, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-52 bottom-10 h-[32rem] w-[32rem] rounded-full bg-blue-300/15 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Dotted background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(30,111,217,0.18) 1.2px, transparent 1.2px)",
            backgroundSize: "34px 34px",
            maskImage:
              "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Section heading */}
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
              amount: 0.3,
            }}
            transition={{
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto mb-16 max-w-3xl text-center"
          >
            <motion.div
              whileHover={{
                scale: 1.04,
              }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/70 px-4 py-2 text-sm font-semibold text-primary"
            >
              <motion.span
                animate={{
                  rotate: [0, 12, -12, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>

              About CleanNest
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              More Than Cleaning.
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                We Care for Your Home.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              CleanNest makes professional cleaning simple, reliable, and
              accessible. Enjoy cleaner spaces without complicated booking or
              unclear pricing.
            </p>
          </motion.div>

          {/* Main content */}
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Image column */}
            <motion.div
              initial={{
                opacity: 0,
                x: -70,
                rotate: -3,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
                rotate: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative mx-auto w-full max-w-[590px]"
            >
              {/* Rotating border */}
              <motion.div
                aria-hidden="true"
                className="absolute -inset-5 rounded-[2.7rem] border border-dashed border-primary/25"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 35,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Blue background card */}
              <motion.div
                aria-hidden="true"
                className="absolute -bottom-7 -left-7 h-full w-full rounded-[2.5rem] bg-primary-light"
                animate={{
                  rotate: [-2, 1, -2],
                  scale: [1, 1.015, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Main image */}
              <motion.div
                whileHover={{
                  y: -8,
                  rotate: 0.5,
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 18,
                }}
                className="group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-8 border-white bg-white shadow-[0_30px_80px_rgba(11,37,69,0.20)]"
              >
                <Image
                  src="/images/about-cleaning.jpg"
                  alt="Professional cleaners providing reliable home cleaning services"
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-cover object-center transition-transform duration-1000 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/5 to-transparent" />

                {/* Image shine */}
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  animate={{
                    x: ["-120%", "120%"],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />

                {/* Mission card */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.4,
                  }}
                  className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/15 p-5 text-white shadow-xl backdrop-blur-xl"
                >
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
                </motion.div>
              </motion.div>

              {/* Quality badge */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.6,
                  rotate: -10,
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
                  delay: 0.6,
                  type: "spring",
                  stiffness: 150,
                }}
                animate={{
                  y: [0, -9, 0],
                }}
                className="absolute -right-2 top-[12%] rounded-2xl border border-white bg-white/95 p-4 shadow-[0_18px_45px_rgba(11,37,69,0.16)] backdrop-blur-xl sm:-right-10"
              >
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
              </motion.div>

              {/* Customer badge */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: -40,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: 0.8,
                  duration: 0.7,
                }}
                animate={{
                  y: [0, 9, 0],
                }}
                className="absolute -left-2 bottom-[17%] rounded-2xl border border-white bg-white/95 p-4 shadow-[0_18px_45px_rgba(11,37,69,0.16)] backdrop-blur-xl sm:-left-10"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Users className="h-6 w-6" />
                  </span>

                  <div>
                    <p className="font-heading text-lg font-bold text-navy">
                      Customer Focused
                    </p>

                    <p className="text-xs text-slate-500">
                      Your comfort matters
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Text column */}
            <motion.div
              initial={{
                opacity: 0,
                x: 70,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">
                A cleaner home without the stress
              </p>

              <h3 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
                Professional cleaning built around your needs.
              </h3>

              <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                CleanNest connects customers with dependable cleaning services
                through one simple platform. From choosing a service to
                selecting a convenient appointment, every step is designed to
                be fast and clear.
              </p>

              <p className="mt-4 text-base leading-8 text-slate-600">
                Whether you need regular home cleaning, deep cleaning, or help
                for a special occasion, our goal is to provide consistent
                quality and a smooth customer experience.
              </p>

              {/* Promises */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{
                  once: true,
                  amount: 0.3,
                }}
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.12,
                      delayChildren: 0.25,
                    },
                  },
                }}
                className="mt-8 grid gap-4 sm:grid-cols-2"
              >
                {promises.map((promise) => (
                  <motion.div
                    key={promise}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 20,
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                    whileHover={{
                      x: 5,
                    }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>

                    <span className="text-sm font-medium leading-6 text-slate-700">
                      {promise}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Value cards */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.14,
                      delayChildren: 0.2,
                    },
                  },
                }}
                className="mt-10 space-y-4"
              >
                {values.map(({ icon: Icon, title, description }) => (
                  <motion.article
                    key={title}
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: 35,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                      },
                    }}
                    whileHover={{
                      x: 8,
                      scale: 1.01,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 18,
                    }}
                    className="group flex gap-4 rounded-2xl border border-primary/10 bg-surface-soft/80 p-4 transition-shadow hover:shadow-card"
                  >
                    <motion.span
                      whileHover={{
                        rotate: 8,
                        scale: 1.1,
                      }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"
                    >
                      <Icon className="h-6 w-6" />
                    </motion.span>

                    <div>
                      <h4 className="font-heading text-lg font-bold text-navy">
                        {title}
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {description}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </motion.div>

              {/* About button */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.45,
                }}
                className="mt-9"
              >
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
                    href="/about"
                    className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-primary px-7 py-4 font-semibold text-white shadow-[0_15px_35px_rgba(30,111,217,0.28)] transition-shadow hover:shadow-[0_20px_45px_rgba(30,111,217,0.40)]"
                  >
                    Discover Our Story

                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Statistics bar */}
          <motion.div
            initial={{
              opacity: 0,
              y: 60,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mt-24 overflow-hidden rounded-[2rem] bg-navy px-6 py-9 shadow-[0_25px_70px_rgba(11,37,69,0.22)] sm:px-10 lg:px-14"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-primary/30 blur-3xl"
              animate={{
                scale: [1, 1.25, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              aria-hidden="true"
              className="absolute -bottom-24 -right-12 h-60 w-60 rounded-full bg-blue-400/20 blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {statistics.map((statistic, index) => (
                <motion.div
                  key={statistic.label}
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
                    delay: 0.18 * index,
                    type: "spring",
                    stiffness: 140,
                  }}
                  whileHover={{
                    y: -5,
                  }}
                  className="px-5 py-7 text-center"
                >
                  <p className="font-heading text-4xl font-extrabold text-white lg:text-5xl">
                    {statistic.value}
                  </p>

                  <p className="mt-2 text-sm font-medium text-blue-100">
                    {statistic.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}