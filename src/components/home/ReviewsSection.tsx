"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

const reviews = [
  {
    id: 1,
    name: "Maya Haddad",
    initials: "MH",
    location: "Beirut",
    service: "Regular Home Cleaning",
    rating: 5,
    date: "2 weeks ago",
    quote:
      "The booking process was incredibly simple, and the cleaning team arrived exactly on time. My apartment felt fresh, organized, and completely renewed.",
    avatarClass:
      "bg-gradient-to-br from-blue-500 to-cyan-500 text-white",
  },
  {
    id: 2,
    name: "Karim Nassar",
    initials: "KN",
    location: "Jounieh",
    service: "Deep Cleaning",
    rating: 5,
    date: "3 weeks ago",
    quote:
      "I booked a deep cleaning before hosting my family. The attention to detail was impressive, especially in the kitchen and bathrooms.",
    avatarClass:
      "bg-gradient-to-br from-violet-500 to-purple-600 text-white",
  },
  {
    id: 3,
    name: "Lina Saad",
    initials: "LS",
    location: "Baabda",
    service: "Move-In Cleaning",
    rating: 5,
    date: "1 month ago",
    quote:
      "CleanNest made moving into my new home much easier. Every room was ready before the furniture arrived, and the entire experience was stress-free.",
    avatarClass:
      "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
  },
  {
    id: 4,
    name: "Rami Khoury",
    initials: "RK",
    location: "Tripoli",
    service: "Office Cleaning",
    rating: 5,
    date: "1 month ago",
    quote:
      "Our workspace looks cleaner and more professional. The flexible scheduling made it easy to arrange everything without interrupting our working hours.",
    avatarClass:
      "bg-gradient-to-br from-orange-500 to-amber-500 text-white",
  },
  {
    id: 5,
    name: "Sara Daher",
    initials: "SD",
    location: "Zahle",
    service: "Regular Home Cleaning",
    rating: 5,
    date: "5 weeks ago",
    quote:
      "Clear pricing, great communication, and excellent results. I especially appreciated being able to manage my booking directly from my account.",
    avatarClass:
      "bg-gradient-to-br from-pink-500 to-rose-500 text-white",
  },
  {
    id: 6,
    name: "Omar Mansour",
    initials: "OM",
    location: "Sidon",
    service: "Deep Cleaning",
    rating: 5,
    date: "2 months ago",
    quote:
      "The service was professional from start to finish. The team handled the difficult areas carefully and left the home looking fantastic.",
    avatarClass:
      "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
  },
];

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

type Review = (typeof reviews)[number];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1 text-amber-400"
      aria-label={`${rating} out of 5 stars`}
    >
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
          <Star
            className={`h-5 w-5 ${
              index < rating ? "fill-current" : "text-amber-200"
            }`}
          />
        </motion.span>
      ))}
    </div>
  );
}

function MarqueeReviewCard({ review }: { review: Review }) {
  return (
    <article className="group relative w-[310px] shrink-0 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/90 p-6 shadow-[0_18px_50px_rgba(11,37,69,0.09)] backdrop-blur-md transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-2 hover:border-primary/20 hover:shadow-[0_28px_70px_rgba(11,37,69,0.16)] sm:w-[355px]">
      <motion.div
        aria-hidden="true"
        className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.7, 0.35],
        }}
        transition={{
          duration: 5,
          repeat: 0,
          ease: "easeInOut",
        }}
      />

      <Quote className="absolute right-5 top-5 h-12 w-12 fill-primary/[0.04] text-primary/[0.08]" />

      <div className="relative">
        <RatingStars rating={review.rating} />

        <p className="mt-5 line-clamp-4 min-h-[104px] text-sm leading-7 text-slate-600">
          “{review.quote}”
        </p>

        <div className="mt-6 border-t border-primary/10 pt-5">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                scale: 1.1,
                rotate: 4,
              }}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-heading text-sm font-extrabold shadow-lg ${review.avatarClass}`}
            >
              {review.initials}
            </motion.div>

            <div className="min-w-0">
              <h3 className="truncate font-heading text-sm font-bold text-navy">
                {review.name}
              </h3>

              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />

                <span className="truncate">
                  {review.location}, Lebanon
                </span>
              </div>
            </div>

            <BadgeCheck className="ml-auto h-5 w-5 shrink-0 text-primary" />
          </div>

          <span className="mt-4 inline-flex rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary">
            {review.service}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFeaturedPaused, setIsFeaturedPaused] = useState(false);

  const activeReview = reviews[activeIndex]!;

  useEffect(() => {
    if (isFeaturedPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        return (currentIndex + 1) % reviews.length;
      });
    }, 5500);

    return () => {
      window.clearInterval(interval);
    };
  }, [isFeaturedPaused]);

  function showPreviousReview() {
    setActiveIndex((currentIndex) => {
      return currentIndex === 0
        ? reviews.length - 1
        : currentIndex - 1;
    });
  }

  function showNextReview() {
    setActiveIndex((currentIndex) => {
      return (currentIndex + 1) % reviews.length;
    });
  }

  return (
    <MotionConfig reducedMotion="always">
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
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-md"
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
              Discover how convenient booking, dependable service, and
              thoughtful care helped customers enjoy cleaner homes and
              workplaces.
            </p>
          </motion.div>

          {/* Featured review */}
          <motion.div
            initial={{
              opacity: 0,
              y: 70,
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
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            onMouseEnter={() => {
              setIsFeaturedPaused(true);
            }}
            onMouseLeave={() => {
              setIsFeaturedPaused(false);
            }}
            className="relative mt-16 overflow-hidden rounded-[2.25rem] border border-primary/10 bg-white/85 p-6 shadow-[0_30px_90px_rgba(11,37,69,0.13)] backdrop-blur-md sm:p-9 lg:p-12"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, 45, 0],
              }}
              transition={{
                duration: 8,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <motion.div
              aria-hidden="true"
              className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                y: [0, -35, 0],
              }}
              transition={{
                duration: 9,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <Quote className="absolute right-8 top-7 h-28 w-28 fill-primary/[0.025] text-primary/[0.055] sm:h-36 sm:w-36" />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="min-h-[390px]" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReview.id}
                    initial={{
                      opacity: 0,
                      x: 45,
                      filter: "blur(8px)",
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      x: -45,
                      filter: "blur(8px)",
                    }}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <RatingStars rating={activeReview.rating} />

                    <blockquote className="mt-7 max-w-3xl font-heading text-2xl font-bold leading-[1.55] text-navy sm:text-3xl lg:text-[2rem]">
                      “{activeReview.quote}”
                    </blockquote>

                    <div className="mt-9 flex flex-col gap-5 border-t border-primary/10 pt-7 sm:flex-row sm:items-center">
                      <motion.div
                        whileHover={{
                          scale: 1.08,
                          rotate: 4,
                        }}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] font-heading text-lg font-extrabold shadow-[0_15px_35px_rgba(11,37,69,0.18)] ${activeReview.avatarClass}`}
                      >
                        {activeReview.initials}
                      </motion.div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-lg font-bold text-navy">
                            {activeReview.name}
                          </h3>

                          <BadgeCheck className="h-5 w-5 text-primary" />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-primary" />
                            {activeReview.location}, Lebanon
                          </span>

                          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                          <span>{activeReview.date}</span>
                        </div>
                      </div>

                      <span className="inline-flex w-fit rounded-full bg-primary-light px-4 py-2 text-xs font-bold text-primary sm:ml-auto">
                        {activeReview.service}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Featured review controls */}
                <div className="mt-9 flex flex-wrap items-center justify-between gap-5">
                  <div className="flex items-center gap-2">
                    {reviews.map((review, index) => (
                      <button
                        key={review.id}
                        type="button"
                        onClick={() => {
                          setActiveIndex(index);
                        }}
                        aria-label={`Show review from ${review.name}`}
                        className="relative flex h-4 items-center"
                      >
                        <motion.span
                          animate={{
                            width: activeIndex === index ? 34 : 10,
                            backgroundColor:
                              activeIndex === index
                                ? "#1E6FD9"
                                : "#BFDBFE",
                          }}
                          transition={{
                            duration: 0.3,
                          }}
                          className="block h-2 rounded-full"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={showPreviousReview}
                      whileHover={{
                        scale: 1.08,
                        x: -2,
                      }}
                      whileTap={{
                        scale: 0.92,
                      }}
                      aria-label="Show previous review"
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-white text-primary shadow-card transition-colors hover:bg-primary-light"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={showNextReview}
                      whileHover={{
                        scale: 1.08,
                        x: 2,
                      }}
                      whileTap={{
                        scale: 0.92,
                      }}
                      aria-label="Show next review"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-[0_15px_35px_rgba(30,111,217,0.28)] transition-colors hover:bg-primary-dark"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Rating visual */}
              <div className="relative mx-auto flex min-h-[390px] w-full max-w-[420px] items-center justify-center">
                <motion.div
                  aria-hidden="true"
                  className="absolute h-[330px] w-[330px] rounded-full border border-dashed border-primary/20"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 28,
                    repeat: 0,
                    ease: "linear",
                  }}
                />

                <motion.div
                  aria-hidden="true"
                  className="absolute h-[270px] w-[270px] rounded-full border border-dashed border-cyan-400/20"
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 22,
                    repeat: 0,
                    ease: "linear",
                  }}
                />

                <motion.div
                  aria-hidden="true"
                  className="absolute h-56 w-56 rounded-full bg-primary/12 blur-3xl"
                  animate={{
                    scale: [0.9, 1.25, 0.9],
                    opacity: [0.4, 0.75, 0.4],
                  }}
                  transition={{
                    duration: 4,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                  className="relative flex h-52 w-52 flex-col items-center justify-center rounded-[3rem] bg-gradient-to-br from-navy via-[#123b6f] to-primary text-white shadow-[0_30px_80px_rgba(11,37,69,0.3)]"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 8, -8, 0],
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: 0,
                    }}
                  >
                    <Star className="h-14 w-14 fill-amber-400 text-amber-400" />
                  </motion.div>

                  <p className="mt-4 font-heading text-5xl font-extrabold">
                    4.9
                  </p>

                  <p className="mt-1 text-sm font-semibold text-blue-100">
                    Average rating
                  </p>

                  <motion.span
                    aria-hidden="true"
                    className="absolute right-5 top-5"
                    animate={{
                      rotate: 360,
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 4,
                      repeat: 0,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-cyan-300" />
                  </motion.span>
                </motion.div>

                {trustItems.map(({ icon: Icon, label }, index) => {
                  const positions = [
                    "left-0 top-10",
                    "right-0 top-16",
                    "bottom-12 left-1",
                    "bottom-6 right-1",
                  ];

                  return (
                    <motion.div
                      key={label}
                      className={`absolute rounded-2xl border border-primary/10 bg-white/95 px-3 py-2.5 shadow-card backdrop-blur-md ${positions[index]}`}
                      animate={{
                        y:
                          index % 2 === 0
                            ? [0, -9, 0]
                            : [0, 9, 0],
                      }}
                      transition={{
                        duration: 3.5 + index * 0.4,
                        delay: index * 0.25,
                        repeat: 0,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                          <Icon className="h-4 w-4" />
                        </span>

                        <span className="hidden text-xs font-bold text-navy sm:block">
                          {label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Automatically moving reviews */}
        <div className="relative mt-16 overflow-hidden py-8">
          {/* Left fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-white via-white/90 to-transparent sm:w-32"
          />

          {/* Right fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-white via-white/90 to-transparent sm:w-32"
          />

          <div className="reviews-auto-track">
            {/* First complete set */}
            <div className="reviews-auto-group">
              {reviews.map((review) => (
                <MarqueeReviewCard
                  key={`first-${review.id}`}
                  review={review}
                />
              ))}
            </div>

            {/* Second identical set */}
            <div className="reviews-auto-group" aria-hidden="true">
              {reviews.map((review) => (
                <MarqueeReviewCard
                  key={`second-${review.id}`}
                  review={review}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 65,
              scale: 0.95,
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
            className="relative mt-12 overflow-hidden rounded-[2.25rem] bg-navy px-6 py-11 shadow-[0_30px_90px_rgba(11,37,69,0.27)] sm:px-10 lg:px-14"
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
                x: [-250, 900],
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
                  Experience it yourself
                </div>

                <h3 className="mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Join customers who trust CleanNest with their spaces.
                </h3>

                <p className="mt-4 max-w-2xl leading-7 text-blue-100/75">
                  Select your service, schedule a convenient time, and enjoy a
                  simpler cleaning experience.
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

        {/* Marquee animation */}
        <style jsx global>{`
          .reviews-auto-track {
            display: flex;
            width: max-content;
            will-change: transform;
            animation-name: cleanNestReviewsScroll;
            animation-duration: 32s;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          .reviews-auto-group {
            display: flex;
            flex-shrink: 0;
            gap: 1.25rem;
            padding-right: 1.25rem;
          }

          @keyframes cleanNestReviewsScroll {
            from {
              transform: translate3d(0, 0, 0);
            }

            to {
              transform: translate3d(-50%, 0, 0);
            }
          }
        `}</style>
      </section>
    </MotionConfig>
  );
}