"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronDown,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/notifications/NotificationBell";
import type { PublicUser } from "@/types/user";

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

interface NavbarProps {
  user?: PublicUser | null;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CN";
  if (words.length === 1) return words[0]?.slice(0, 2).toUpperCase() ?? "CN";
  return ((words[0]?.charAt(0) ?? "") + (words.at(-1)?.charAt(0) ?? "")).toUpperCase();
}

function getDashboardHref(role: PublicUser["role"]) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "cleaner") return "/cleaner/today";
  return "/dashboard";
}

function getProfileHref(role: PublicUser["role"]) {
  if (role === "admin") return "/admin/profile";
  if (role === "cleaner") return "/cleaner/profile";
  return "/profile";
}

function getRoleLabel(role: PublicUser["role"]) {
  if (role === "admin") return "Administrator";
  if (role === "cleaner") return "Cleaning professional";
  return "Customer";
}

export default function Navbar({ user = null }: NavbarProps) {
  const pathname = usePathname();
  const { logout, loading: logoutLoading } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(() => (user ? getInitials(user.name) : "CN"), [user]);
  const dashboardHref = useMemo(() => (user ? getDashboardHref(user.role) : "/"), [user]);
  const profileHref = useMemo(() => (user ? getProfileHref(user.role) : "/"), [user]);
  const roleLabel = useMemo(() => (user ? getRoleLabel(user.role) : ""), [user]);

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
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

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

  async function handleLogout() {
    if (logoutLoading) {
      return;
    }

    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    await logout();
  }

  const avatar = user ? (
    <span
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-blue-600 to-cyan-500 bg-cover bg-center text-xs font-black text-white shadow-[0_10px_24px_rgba(30,111,217,0.24)]"
      style={
        user.avatarUrl
          ? {
              backgroundImage: 'url("' + user.avatarUrl.replaceAll('"', "%22") + '")',
            }
          : undefined
      }
    >
      {!user.avatarUrl && initials}
      <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
    </span>
  ) : null;

  return (
    <MotionConfig reducedMotion="always">
      <header
        className={`sticky top-0 z-[90] w-full transition-all duration-500 ${
          isScrolled
            ? "border-b border-primary/10 bg-white/90 shadow-[0_12px_45px_rgba(11,37,69,0.10)] backdrop-blur-md"
            : "border-b border-transparent bg-white/75 backdrop-blur-md"
        }`}
      >
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

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {user ? (
              <>
                <NotificationBell />

                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen((current) => !current);
                    }}
                    aria-label="Open profile menu"
                    aria-expanded={isProfileMenuOpen}
                    className="flex min-h-[48px] items-center gap-2 rounded-xl border border-primary/15 bg-white p-1.5 pr-2.5 shadow-sm transition hover:border-primary/30 hover:bg-primary-light"
                  >
                    {avatar}
                    <span className="hidden max-w-28 text-left lg:block">
                      <span className="block truncate text-xs font-extrabold text-navy">
                        {user.name}
                      </span>
                      <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                        {roleLabel}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        className="absolute right-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-2xl border border-primary/10 bg-white p-2 shadow-[0_24px_70px_rgba(11,37,69,0.18)]"
                      >
                        <div className="rounded-xl bg-gradient-to-br from-primary-light to-cyan-50 p-4">
                          <div className="flex items-center gap-3">
                            {avatar}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-navy">
                                {user.name}
                              </p>
                              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          <Link
                            href={profileHref}
                            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-primary-light hover:text-primary"
                          >
                            <UserRound className="h-4 w-4" />
                            My profile
                            <ArrowRight className="ml-auto h-4 w-4" />
                          </Link>
                          <Link
                            href={dashboardHref}
                            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-primary-light hover:text-primary"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                            <ArrowRight className="ml-auto h-4 w-4" />
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            void handleLogout();
                          }}
                          disabled={logoutLoading}
                          className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                        >
                          {logoutLoading ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          {logoutLoading ? "Logging out\u2026" : "Log out"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

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
                href="/book-service"
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

        <AnimatePresence>
          {isMenuOpen && (
            <>
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
                <div className="mx-auto max-h-[calc(100dvh-76px)] max-w-7xl overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-6 lg:px-10">
                  {user && (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-primary-light/60 p-3">
                      {avatar}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-navy">{user.name}</p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <span className="ml-auto rounded-full bg-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-primary">
                        {roleLabel}
                      </span>
                    </div>
                  )}

                  {user && (
                    <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-3">
                      <span className="text-xs font-black text-navy">Account notifications</span>
                      <NotificationBell />
                    </div>
                  )}

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

                  <div className="mt-5 grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-3">
                    {user ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Link
                            href={profileHref}
                            onClick={closeMenu}
                            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 font-semibold text-navy shadow-sm transition-colors hover:bg-primary-light hover:text-primary"
                          >
                            <UserRound className="h-5 w-5 text-primary" />
                            My Profile
                          </Link>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                        >
                          <Link
                            href={dashboardHref}
                            onClick={closeMenu}
                            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-light px-5 py-3 font-bold text-primary transition-colors hover:bg-blue-100"
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                          </Link>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              void handleLogout();
                            }}
                            disabled={logoutLoading}
                            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 font-bold text-red-600 disabled:opacity-60"
                          >
                            {logoutLoading ? (
                              <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                              <LogOut className="h-5 w-5" />
                            )}
                            {logoutLoading ? "Logging out\u2026" : "Log out"}
                          </button>
                        </motion.div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}

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
                      className={user ? "sm:col-span-3" : ""}
                    >
                      <Link
                        href="/book-service"
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
