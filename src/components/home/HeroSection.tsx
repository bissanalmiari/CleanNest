"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const headingWords = [
  { text: "Book", highlighted: false },
  { text: "Trusted", highlighted: true },
  { text: "Cleaning", highlighted: true },
  { text: "Services", highlighted: false },
  { text: "in", highlighted: false },
  { text: "Minutes.", highlighted: false },
];

const benefits = [
  {
    icon: ShieldCheck,
    text: "Trusted professionals",
  },
  {
    icon: Leaf,
    text: "Eco-friendly products",
  },
  {
    icon: Clock3,
    text: "Flexible scheduling",
  },
];

const floatingParticles = [
  { top: "8%", left: "5%", size: 6, delay: 0, duration: 5 },
  { top: "18%", left: "18%", size: 10, delay: 1, duration: 7 },
  { top: "38%", left: "7%", size: 5, delay: 2, duration: 6 },
  { top: "72%", left: "12%", size: 8, delay: 0.5, duration: 8 },
  { top: "85%", left: "28%", size: 5, delay: 1.8, duration: 5 },
  { top: "14%", left: "47%", size: 7, delay: 1.2, duration: 7 },
  { top: "77%", left: "45%", size: 10, delay: 0.4, duration: 6 },
  { top: "8%", left: "72%", size: 5, delay: 2.2, duration: 8 },
  { top: "25%", left: "91%", size: 8, delay: 0.7, duration: 6 },
  { top: "61%", left: "93%", size: 6, delay: 1.6, duration: 7 },
  { top: "89%", left: "84%", size: 9, delay: 2.4, duration: 8 },
];

export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, {
    stiffness: 90,
    damping: 18,
    mass: 0.5,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 90,
    damping: 18,
    mass: 0.5,
  });

  const imageRotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const imageRotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);

  const orbX = useTransform(smoothX, [-0.5, 0.5], [-35, 35]);
  const orbY = useTransform(smoothY, [-0.5, 0.5], [-25, 25]);

  function handlePointerMove(event: MouseEvent<HTMLElement>) {
    if (prefersReducedMotion) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    const normalizedX =
      (event.clientX - bounds.left) / bounds.width - 0.5;

    const normalizedY =
      (event.clientY - bounds.top) / bounds.height - 0.5;

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
      className="relative isolate min-h-[90vh] overflow-hidden bg-surface-soft font-body"
    >
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,111,217,0.17),transparent_32%),radial-gradient(circle_at_85%_28%,rgba(96,165,250,0.20),transparent_30%),linear-gradient(to_bottom_right,#ffffff,#f5f9fe_55%,#e6f0fd)]"
      />

      {/* Moving grid */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.10) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        animate={
          prefersReducedMotion
            ? undefined
            : {
                backgroundPosition: ["0px 0px", "56px 56px"],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Interactive left glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
        style={{
          x: orbX,
          y: orbY,
        }}
      />

      {/* Animated right glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -right-44 bottom-0 h-[32rem] w-[32rem] rounded-full bg-blue-300/25 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [1, 1.2, 1],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles */}
      <div aria-hidden="true" className="absolute inset-0">
        {floatingParticles.map((particle, index) => (
          <motion.span
            key={`${particle.top}-${particle.left}`}
            className="absolute rounded-full bg-primary/40 shadow-[0_0_18px_rgba(30,111,217,0.5)]"
            style={{
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
            }}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    y: [0, -24, 0],
                    x: [0, index % 2 === 0 ? 12 : -12, 0],
                    opacity: [0.2, 0.9, 0.2],
                    scale: [0.8, 1.35, 0.8],
                  }
            }
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative mx-auto grid min-h-[90vh] max-w-7xl items-center gap-12 px-5 pb-12 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-14 lg:pt-24">
        {/* Left side */}
        <div className="relative z-10 max-w-3xl">
          {/* Top badge */}
          <motion.div
            initial={{
              opacity: 0,
              y: -22,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.7,
              type: "spring",
              stiffness: 120,
            }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-xl"
          >
            <motion.span
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1],
                    }
              }
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>

            Clean homes. Happy lives.
          </motion.div>

          {/* Heading */}
          <h1 className="max-w-4xl font-heading text-5xl font-extrabold leading-[1.03] tracking-[-0.045em] text-navy sm:text-6xl lg:text-6xl xl:text-7xl">
            {headingWords.map((word, index) => (
              <motion.span
                key={`${word.text}-${index}`}
                initial={{
                  opacity: 0,
                  y: 55,
                  filter: "blur(12px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.13 * index,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`mr-[0.2em] inline-block ${
                  word.highlighted
                    ? "bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent"
                    : ""
                }`}
              >
                {word.text}
              </motion.span>
            ))}
          </h1>

          {/* Description */}
          <motion.p
            initial={{
              opacity: 0,
              y: 28,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.85,
            }}
            className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg lg:text-xl"
          >
            Book reliable and professional cleaning services throughout
            Lebanon. Choose your service, select a suitable time, and let
            CleanNest take care of everything.
          </motion.p>

          {/* Benefits */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 1,
                },
              },
            }}
            className="mt-6 flex flex-wrap gap-x-6 gap-y-3"
          >
            {benefits.map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                variants={{
                  hidden: {
                    opacity: 0,
                    x: -20,
                  },
                  visible: {
                    opacity: 1,
                    x: 0,
                  },
                }}
                className="flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Icon className="h-4 w-4" />
                </span>

                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{
              opacity: 0,
              y: 28,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 1.2,
            }}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.025,
                    }
              }
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="/book"
                className="group relative flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-primary px-7 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(30,111,217,0.30)] transition-shadow hover:shadow-[0_20px_50px_rgba(30,111,217,0.45)]"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          left: ["-40%", "130%"],
                        }
                  }
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 1.5,
                    ease: "easeInOut",
                  }}
                />

                <CalendarCheck2 className="relative h-5 w-5" />

                <span className="relative">Book a Cleaning</span>

                <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.025,
                    }
              }
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="#services"
                className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-primary/20 bg-white/80 px-7 py-4 font-semibold text-navy shadow-card backdrop-blur-xl transition-colors hover:border-primary/40 hover:bg-white"
              >
                Explore Services

                <ArrowRight className="h-5 w-5 text-primary" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 1.45,
            }}
            className="mt-8 flex flex-wrap items-center gap-5 border-t border-primary/10 pt-5"
          >
            <div className="flex -space-x-3">
              {["BK", "BS", "AM", "CN"].map((initials, index) => (
                <motion.div
                  key={initials}
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay: 1.55 + index * 0.1,
                    type: "spring",
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary-light text-xs font-bold text-primary shadow-sm"
                >
                  {initials}
                </motion.div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-4 w-4 fill-current"
                  />
                ))}
              </div>

              <p className="mt-1 text-sm font-medium text-slate-600">
                Trusted by customers across Lebanon
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right image section */}
        <motion.div
          initial={{
            opacity: 0,
            x: 70,
            scale: 0.88,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          transition={{
            duration: 1,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 mx-auto w-full max-w-[560px]"
        >
          {/* Decorative rings */}
          <motion.div
            aria-hidden="true"
            className="absolute -inset-8 rounded-[3.2rem] border border-dashed border-primary/25"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    rotate: 360,
                  }
            }
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[2.8rem] border border-primary/15"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    rotate: -360,
                  }
            }
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Main image card */}
          <motion.div
            style={{
              rotateX: imageRotateX,
              rotateY: imageRotateY,
              transformPerspective: 1200,
            }}
            className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/70 bg-white p-2 shadow-[0_30px_90px_rgba(11,37,69,0.20)]"
          >
            <div className="relative h-full overflow-hidden rounded-[2.05rem]">
              <Image
                src="/images/hero-cleaning.png"
                alt="Professional CleanNest cleaner working in a modern home"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-cover object-right transition-transform duration-1000 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/5 to-transparent" />

              {/* Image shine */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        x: ["-120%", "120%"],
                      }
                }
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />

              {/* Availability card */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 35,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 1.15,
                  duration: 0.7,
                }}
                className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/15 p-4 text-white shadow-xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-100">
                      Next available
                    </p>

                    <p className="mt-1 font-heading text-xl font-bold">
                      Today at 9:00 AM
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary">
                    <CalendarCheck2 className="h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Eco-friendly card */}
          <motion.div
            initial={{
              opacity: 0,
              x: -45,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 1.3,
              duration: 0.6,
            }}
            whileHover={{
              scale: 1.05,
              rotate: -2,
            }}
            className="absolute -left-2 top-[17%] rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(11,37,69,0.16)] backdrop-blur-xl sm:-left-12"
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
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Leaf className="h-6 w-6" />
              </span>

              <div>
                <p className="font-semibold text-navy">Eco-friendly</p>
                <p className="text-xs text-slate-500">Safe products</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Rating card */}
          <motion.div
            initial={{
              opacity: 0,
              x: 45,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 1.5,
              duration: 0.6,
            }}
            whileHover={{
              scale: 1.05,
              rotate: 2,
            }}
            className="absolute -right-2 top-[9%] rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(11,37,69,0.16)] backdrop-blur-xl sm:-right-10"
          >
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: [0, 7, 0],
                    }
              }
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Star className="h-6 w-6 fill-current" />
              </span>

              <div>
                <p className="font-semibold text-navy">4.9 / 5</p>
                <p className="text-xs text-slate-500">Customer rating</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Completed bookings card */}
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 1.7,
              duration: 0.6,
            }}
            whileHover={{
              scale: 1.04,
            }}
            className="absolute -bottom-6 right-4 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(11,37,69,0.18)] backdrop-blur-xl sm:right-10"
          >
            <div className="flex items-center gap-3">
              <motion.span
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: [1, 1.15, 1],
                      }
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary"
              >
                <CheckCircle2 className="h-6 w-6" />
              </motion.span>

              <div>
                <p className="font-heading text-lg font-bold text-navy">
                  1,200+
                </p>

                <p className="text-xs text-slate-500">
                  Successful cleanings
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#about"
        aria-label="Scroll to the About section"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 2,
        }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70 lg:flex"
      >
        Scroll

        <span className="relative h-10 w-6 rounded-full border-2 border-primary/30">
          <motion.span
            className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    y: [0, 17, 0],
                    opacity: [0, 1, 0],
                  }
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
          />
        </span>
      </motion.a>
    </section>
  );
}