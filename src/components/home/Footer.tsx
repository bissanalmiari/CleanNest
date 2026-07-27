"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Facebook,
  Home,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

const quickLinks = [
  {
    label: "About CleanNest",
    href: "#about",
  },
  {
    label: "Why Choose Us",
    href: "#why-choose-us",
  },
  {
    label: "Our Services",
    href: "#services",
  },
  {
    label: "Customer Reviews",
    href: "#reviews",
  },
  {
    label: "Frequently Asked Questions",
    href: "#faq",
  },
  {
    label: "Contact Us",
    href: "#contact",
  },
];

const customerLinks = [
  {
    label: "Book a Cleaning",
    href: "/book-service",
  },
  {
    label: "View All Services",
    href: "/services",
  },
  {
    label: "Create an Account",
    href: "/register",
  },
  {
    label: "Sign In",
    href: "/login",
  },
  {
    label: "My Bookings",
    href: "/customer/bookings",
  },
  {
    label: "Saved Addresses",
    href: "/customer/addresses",
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    icon: Linkedin,
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    text: "Secure booking",
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
    icon: Sparkles,
    text: "Quality cleaning",
  },
];

const particles = [
  {
    top: "12%",
    left: "5%",
    size: 6,
    duration: 6,
    delay: 0,
  },
  {
    top: "30%",
    left: "92%",
    size: 9,
    duration: 8,
    delay: 1,
  },
  {
    top: "72%",
    left: "7%",
    size: 8,
    duration: 7,
    delay: 0.6,
  },
  {
    top: "82%",
    left: "78%",
    size: 5,
    duration: 6,
    delay: 1.4,
  },
  {
    top: "18%",
    left: "52%",
    size: 7,
    duration: 7,
    delay: 2,
  },
  {
    top: "58%",
    left: "96%",
    size: 6,
    duration: 8,
    delay: 0.3,
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterError, setNewsletterError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setNewsletterError("Please enter your email address.");
      setIsSubscribed(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNewsletterError("Please enter a valid email address.");
      setIsSubscribed(false);
      return;
    }

    setNewsletterError("");
    setIsSubmitting(true);

    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        resolve();
      }, 900);
    });

    setIsSubmitting(false);
    setIsSubscribed(true);
    setEmail("");
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <MotionConfig reducedMotion="always">
      <footer id="footer" className="relative isolate overflow-hidden bg-navy font-body text-white">
        {/* Main background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_16%,rgba(30,111,217,0.4),transparent_29%),radial-gradient(circle_at_90%_80%,rgba(6,182,212,0.22),transparent_28%),linear-gradient(135deg,#06162c_0%,#0b2545_50%,#123b6f_100%)]"
        />

        {/* Moving grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
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

        {/* Large animated glows */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-64 top-0 h-[42rem] w-[42rem] rounded-full bg-primary/25 blur-3xl"
          animate={{
            x: [0, 110, 0],
            y: [0, -45, 0],
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
          className="absolute -bottom-72 -right-64 h-[46rem] w-[46rem] rounded-full bg-cyan-400/15 blur-3xl"
          animate={{
            x: [0, -90, 0],
            y: [0, 55, 0],
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
          className="absolute -top-full left-0 h-[70rem] w-40 rotate-[22deg] bg-gradient-to-b from-transparent via-white/[0.07] to-transparent blur-2xl"
          animate={{
            x: [-320, 1900],
          }}
          transition={{
            duration: 9,
            repeat: 0,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles */}
        <div aria-hidden="true" className="absolute inset-0">
          {particles.map((particle, index) => (
            <motion.span
              key={`${particle.top}-${particle.left}`}
              className="absolute rounded-full bg-blue-200 shadow-[0_0_18px_rgba(191,219,254,0.8)]"
              style={{
                top: particle.top,
                left: particle.left,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                x: [0, index % 2 === 0 ? 20 : -20, 0],
                y: [0, -28, 0],
                opacity: [0.15, 0.9, 0.15],
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

        {/* Rotating decorations */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-44 top-[36%] h-80 w-80 rounded-full border border-dashed border-blue-200/10"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 34,
            repeat: 0,
            ease: "linear",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-48 top-[16%] h-96 w-96 rounded-full border border-dashed border-cyan-300/10"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 40,
            repeat: 0,
            ease: "linear",
          }}
        />

        {/* Newsletter panel */}
        <div className="relative mx-auto max-w-7xl px-5 pt-20 sm:px-8 lg:px-10 lg:pt-24">
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
            className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.08] px-6 py-9 shadow-[0_30px_90px_rgba(0,0,0,0.25)] backdrop-blur-md sm:px-9 lg:px-12 lg:py-11"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-primary/45 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, 45, 0],
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
                y: [0, -35, 0],
              }}
              transition={{
                duration: 8,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Stay connected
                </div>

                <h2 className="mt-4 max-w-2xl font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Receive CleanNest updates and helpful cleaning tips.
                </h2>

                <p className="mt-4 max-w-xl leading-7 text-blue-100/75">
                  Subscribe for service updates, seasonal cleaning ideas, and important booking
                  information.
                </p>
              </div>

              <div>
                <form onSubmit={handleNewsletterSubmit} noValidate className="relative">
                  <div
                    className={`flex flex-col gap-3 rounded-2xl border bg-[#071a33]/60 p-2 backdrop-blur-md sm:flex-row ${
                      newsletterError ? "border-red-300/50" : "border-white/10"
                    }`}
                  >
                    <div className="relative flex-1">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-200" />

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setNewsletterError("");
                          setIsSubscribed(false);
                        }}
                        placeholder="Enter your email address"
                        aria-label="Email address"
                        aria-invalid={Boolean(newsletterError)}
                        className="min-h-[54px] w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 pl-12 text-sm text-white outline-none transition-all placeholder:text-blue-100/50 focus:border-cyan-300/40 focus:bg-white/[0.13] focus:ring-4 focus:ring-cyan-300/10"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={
                        isSubmitting
                          ? undefined
                          : {
                              y: -3,
                              scale: 1.02,
                            }
                      }
                      whileTap={
                        isSubmitting
                          ? undefined
                          : {
                              scale: 0.97,
                            }
                      }
                      className="group relative inline-flex min-h-[54px] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-[0_16px_40px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {!isSubmitting && (
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
                      )}

                      <span className="relative">
                        {isSubmitting ? "Subscribing..." : "Subscribe"}
                      </span>

                      {!isSubmitting && (
                        <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      )}
                    </motion.button>
                  </div>

                  <AnimatePresence initial={false}>
                    {newsletterError && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          y: -5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                        }}
                        className="mt-2 text-xs font-medium text-red-200"
                      >
                        {newsletterError}
                      </motion.p>
                    )}

                    {isSubscribed && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 10,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                        }}
                        className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-300"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Thank you for subscribing.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                <p className="mt-3 text-xs leading-5 text-blue-100/50">
                  The newsletter form is ready to connect to your backend subscription endpoint.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer content */}
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
            {/* Brand column */}
            <motion.div
              initial={{
                opacity: 0,
                x: -45,
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
                duration: 0.8,
              }}
            >
              <Link href="/" className="group inline-flex items-center gap-3">
                <motion.span
                  whileHover={{
                    scale: 1.08,
                    rotate: 4,
                  }}
                  className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-cyan-500 text-white shadow-[0_18px_45px_rgba(30,111,217,0.35)]"
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/25"
                    animate={{
                      left: ["-50%", "140%"],
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: 0,
                      repeatDelay: 1.8,
                    }}
                  />

                  <Home className="relative h-7 w-7" />
                </motion.span>

                <span>
                  <span className="block font-heading text-2xl font-extrabold text-white">
                    CleanNest
                  </span>

                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Cleaning made simple
                  </span>
                </span>
              </Link>

              <p className="mt-6 max-w-sm leading-7 text-blue-100/70">
                Book trusted cleaning services in minutes. CleanNest provides a simpler way to
                manage home and office cleaning across Lebanon.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    whileHover={{
                      y: -5,
                      scale: 1.08,
                      rotate: 3,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-blue-100 shadow-lg backdrop-blur-md transition-colors hover:bg-white/[0.14] hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>

              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3">
                <motion.span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: 0,
                  }}
                />

                <span className="text-sm font-semibold text-emerald-100">
                  Booking services available
                </span>
              </div>
            </motion.div>

            {/* Quick links */}
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
                amount: 0.2,
              }}
              transition={{
                duration: 0.75,
                delay: 0.1,
              }}
            >
              <h3 className="font-heading text-lg font-bold text-white">Quick Links</h3>

              <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-cyan-400" />

              <ul className="mt-6 space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-blue-100/65 transition-colors hover:text-white"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-cyan-300 transition-transform duration-300 group-hover:translate-x-1" />

                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Customer links */}
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
                amount: 0.2,
              }}
              transition={{
                duration: 0.75,
                delay: 0.2,
              }}
            >
              <h3 className="font-heading text-lg font-bold text-white">Customer Area</h3>

              <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-cyan-400" />

              <ul className="mt-6 space-y-3">
                {customerLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-blue-100/65 transition-colors hover:text-white"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-cyan-300 transition-transform duration-300 group-hover:translate-x-1" />

                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact details */}
            <motion.div
              initial={{
                opacity: 0,
                x: 45,
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
                duration: 0.8,
                delay: 0.3,
              }}
            >
              <h3 className="font-heading text-lg font-bold text-white">Contact Details</h3>

              <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-cyan-400" />

              <div className="mt-6 space-y-4">
                <a
                  href="mailto:cleannest.project@gmail.com"
                  className="group flex items-start gap-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-cyan-300 transition-colors group-hover:bg-white/[0.14]">
                    <Mail className="h-5 w-5" />
                  </span>

                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/60">
                      Email
                    </span>

                    <span className="mt-1 block break-all text-sm font-semibold text-blue-50">
                      cleannest.project@gmail.com
                    </span>
                  </span>
                </a>

                <a href="tel:+9611234567" className="group flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-emerald-300 transition-colors group-hover:bg-white/[0.14]">
                    <Phone className="h-5 w-5" />
                  </span>

                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/60">
                      Phone
                    </span>

                    <span className="mt-1 block text-sm font-semibold text-blue-50">
                      +961 1 234 567
                    </span>
                  </span>
                </a>

                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-violet-300">
                    <MapPin className="h-5 w-5" />
                  </span>

                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/60">
                      Location
                    </span>

                    <span className="mt-1 block text-sm font-semibold text-blue-50">
                      Beirut, Lebanon
                    </span>
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-amber-300">
                    <Clock3 className="h-5 w-5" />
                  </span>

                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/60">
                      Working hours
                    </span>

                    <span className="mt-1 block text-sm font-semibold leading-6 text-blue-50">
                      Monday – Saturday
                      <br />
                      8:00 AM – 7:00 PM
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust strip */}
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
              delay: 0.25,
            }}
            className="relative mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] py-4 backdrop-blur-md"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0b2545] to-transparent"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0b2545] to-transparent"
            />

            <motion.div
              className="flex w-max items-center gap-12 px-8"
              animate={{
                x: ["0%", "-50%"],
              }}
              transition={{
                duration: 20,
                repeat: 0,
                ease: "linear",
              }}
            >
              {[...trustItems, ...trustItems].map(({ icon: Icon, text }, index) => (
                <div
                  key={`${text}-${index}`}
                  className="flex shrink-0 items-center gap-3 text-sm font-semibold text-blue-100"
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
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-300"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.span>

                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Booking banner */}
          <motion.div
            initial={{
              opacity: 0,
              y: 45,
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
            }}
            className="relative mt-10 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border border-blue-300/15 bg-primary/15 px-6 py-6 text-center backdrop-blur-md md:flex-row md:text-left"
          >
            <motion.div
              aria-hidden="true"
              className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-primary/30 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 6,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <div className="relative flex flex-col items-center gap-4 sm:flex-row md:items-center">
              <motion.span
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 4, -4, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: 0,
                  ease: "easeInOut",
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-lg"
              >
                <CalendarCheck2 className="h-6 w-6" />
              </motion.span>

              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Ready for a cleaner and more comfortable space?
                </h3>

                <p className="mt-1 text-sm text-blue-100/65">
                  Choose your service and complete your booking in only a few minutes.
                </p>
              </div>
            </div>

            <motion.div
              className="relative"
              whileHover={{
                y: -4,
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="/book-service"
                className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-[0_16px_38px_rgba(0,0,0,0.2)]"
              >
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-6 text-center sm:px-8 md:flex-row md:text-left lg:px-10">
            <p className="text-sm text-blue-100/55">
              © {currentYear} CleanNest. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
              <Link href="/privacy" className="text-blue-100/55 transition-colors hover:text-white">
                Privacy Policy
              </Link>

              <Link href="/terms" className="text-blue-100/55 transition-colors hover:text-white">
                Terms of Service
              </Link>

              <Link
                href="/cancellation-policy"
                className="text-blue-100/55 transition-colors hover:text-white"
              >
                Cancellation Policy
              </Link>
            </div>

            <motion.button
              type="button"
              onClick={scrollToTop}
              whileHover={{
                y: -4,
                scale: 1.08,
              }}
              whileTap={{
                scale: 0.92,
              }}
              aria-label="Scroll back to the top"
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white shadow-lg backdrop-blur-md transition-colors hover:bg-primary"
            >
              <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </motion.button>
          </div>
        </div>
      </footer>
    </MotionConfig>
  );
}
