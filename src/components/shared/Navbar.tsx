"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  LogIn,
  Menu,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

const navigationLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About",
    href: "/#about",
  },
  {
    label: "Why CleanNest",
    href: "/#why-choose-us",
  },
  {
    label: "Services",
    href: "/services",
  },
  {
    label: "Reviews",
    href: "/#reviews",
  },
  {
    label: "FAQ",
    href: "/#faq",
  },
  {
    label: "Contact",
    href: "/#contact",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function isActiveLink(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href.startsWith("/#")) {
      return false;
    }

    return pathname.startsWith(href);
  }

  return (
    <MotionConfig reducedMotion="always">
      <header
        className={`sticky top-0 z-[90] w-full transition-all duration-500 ${
          isScrolled
            ? "border-b border-primary/10 bg-white/90 shadow-[0_12px_45px_rgba(11,37,69,0.10)] backdrop-blur-md"
            : "border-b border-transparent bg-white/75 backdrop-blur-md"
        }`}
      >
        {/* Animated top line */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-primary via-cyan-400 to-primary"
          animate={{
            scaleX: [0.35, 1, 0.35],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        {/* Background glow */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <nav
          aria-label="Main navigation"
          className="relative mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"
        >
          {/* Logo */}
          <Link href="/" onClick={closeMenu} className="group flex shrink-0 items-center gap-3">
            <motion.span
              whileHover={{
                scale: 1.08,
                rotate: 4,
              }}
              whileTap={{
                scale: 0.94,
              }}
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_14px_32px_rgba(30,111,217,0.30)]"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/30"
                animate={{
                  left: ["-50%", "140%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: 0,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />

              <Sparkles className="relative h-6 w-6" />

              <motion.span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-100"
                animate={{
                  scale: [0.7, 1.4, 0.7],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: 0,
                }}
              />
            </motion.span>

            <span>
              <span className="block font-heading text-xl font-extrabold leading-none text-navy sm:text-2xl">
                CleanNest
              </span>

              <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.19em] text-primary sm:block">
                Cleaning made simple
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-0.5 xl:flex">
            {navigationLinks.map((link) => {
              const isActive = isActiveLink(link.href);

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`group relative rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? "text-primary" : "text-slate-600 hover:text-primary"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>

                  <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scale: isActive ? 1 : 0.9,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="absolute inset-0 rounded-xl bg-primary-light"
                  />

                  {!isActive && (
                    <span className="absolute bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-primary transition-all duration-300 group-hover:w-5" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop authentication and booking actions */}
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {/* Sign In */}
            <motion.div
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="/login"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-navy shadow-sm transition-all hover:border-primary/30 hover:bg-primary-light hover:text-primary"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </motion.div>

            {/* Sign Up */}
            <motion.div
              whileHover={{
                y: -2,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >
              <Link
                href="/signup"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-light px-3.5 py-2.5 text-sm font-bold text-primary transition-all hover:border-primary/35 hover:bg-blue-100"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </motion.div>

            {/* Book Now */}
            <motion.div
              whileHover={{
                y: -3,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.96,
              }}
            >
              <Link
                href="/book"
                className="group relative inline-flex min-h-[46px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(30,111,217,0.28)] transition-colors hover:bg-primary-dark"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/20"
                  animate={{
                    left: ["-50%", "140%"],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: 0,
                    repeatDelay: 1.6,
                  }}
                />

                <CalendarCheck2 className="relative h-4 w-4" />

                <span className="relative">Book Now</span>

                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile and tablet menu button */}
          <motion.button
            type="button"
            onClick={() => {
              setIsMenuOpen((currentValue) => !currentValue);
            }}
            whileTap={{
              scale: 0.92,
            }}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-white text-navy shadow-sm transition-colors hover:bg-primary-light hover:text-primary xl:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMenuOpen ? (
                <motion.span
                  key="close-menu-icon"
                  initial={{
                    opacity: 0,
                    rotate: -90,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    rotate: 90,
                    scale: 0.7,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="open-menu-icon"
                  initial={{
                    opacity: 0,
                    rotate: 90,
                    scale: 0.7,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    rotate: -90,
                    scale: 0.7,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </nav>

        {/* Mobile and tablet navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Background overlay */}
              <motion.button
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenu}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="fixed inset-0 top-[76px] z-[-1] bg-navy/25 backdrop-blur-sm xl:hidden"
              />

              {/* Menu panel */}
              <motion.div
                id="mobile-navigation"
                initial={{
                  opacity: 0,
                  y: -20,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                  height: 0,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-x-0 top-full overflow-hidden border-t border-primary/10 bg-white/95 shadow-[0_24px_60px_rgba(11,37,69,0.16)] backdrop-blur-md xl:hidden"
              >
                <div className="mx-auto max-h-[calc(100vh-76px)] max-w-7xl overflow-y-auto px-5 py-6 sm:px-8 lg:px-10">
                  {/* Navigation links */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {navigationLinks.map((link, index) => {
                      const isActive = isActiveLink(link.href);

                      return (
                        <motion.div
                          key={link.label}
                          initial={{
                            opacity: 0,
                            x: -20,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            delay: index * 0.045,
                          }}
                        >
                          <Link
                            href={link.href}
                            onClick={closeMenu}
                            className={`flex min-h-[50px] items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                              isActive
                                ? "bg-primary-light text-primary"
                                : "text-slate-700 hover:bg-primary-light hover:text-primary"
                            }`}
                          >
                            {link.label}

                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Authentication and booking buttons */}
                  <div className="mt-5 grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-3">
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.2,
                      }}
                    >
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 font-semibold text-navy shadow-sm transition-colors hover:bg-primary-light hover:text-primary"
                      >
                        <LogIn className="h-5 w-5 text-primary" />
                        Sign In
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.25,
                      }}
                    >
                      <Link
                        href="/signup"
                        onClick={closeMenu}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-light px-5 py-3 font-bold text-primary transition-colors hover:bg-blue-100"
                      >
                        <UserPlus className="h-5 w-5" />
                        Sign Up
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.3,
                      }}
                    >
                      <Link
                        href="/book"
                        onClick={closeMenu}
                        className="group relative flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-[0_15px_35px_rgba(30,111,217,0.28)]"
                      >
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/20"
                          animate={{
                            left: ["-50%", "140%"],
                          }}
                          transition={{
                            duration: 2.4,
                            repeat: 0,
                            repeatDelay: 1.6,
                          }}
                        />

                        <CalendarCheck2 className="relative h-5 w-5" />

                        <span className="relative">Book Now</span>

                        <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </motion.div>
                  </div>

                  {/* Security message */}
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.35,
                    }}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Secure and convenient booking
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </MotionConfig>
  );
}
