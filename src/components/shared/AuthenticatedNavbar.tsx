"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import { useAuth } from "@/hooks/useAuth";

export interface AuthenticatedNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface AuthenticatedNavbarProps {
  role: "customer" | "admin";
  items: AuthenticatedNavigationItem[];
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "CN";
  }

  if (words.length === 1) {
    return words[0]?.slice(0, 2).toUpperCase() ?? "CN";
  }

  return `${words[0]?.charAt(0) ?? ""}${words.at(-1)?.charAt(0) ?? ""}`.toUpperCase();
}

export default function AuthenticatedNavbar({ role, items, user }: AuthenticatedNavbarProps) {
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { logout, loading: logoutLoading } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const initials = useMemo(() => getInitials(user.name), [user.name]);

  const profileHref = role === "admin" ? "/admin/profile" : "/profile";
  const roleLabel = role === "admin" ? "Administrator" : "Customer";

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function isActiveLink(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    if (logoutLoading) {
      return;
    }

    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    await logout();
  }

  const avatar = (
    <span
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-blue-600 to-cyan-500 bg-cover bg-center text-xs font-black text-white shadow-[0_10px_24px_rgba(30,111,217,0.24)]"
      style={
        user.avatarUrl
          ? {
              backgroundImage: `url("${user.avatarUrl.replaceAll('"', "%22")}")`,
            }
          : undefined
      }
    >
      {!user.avatarUrl && initials}
      <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
    </span>
  );

  return (
    <MotionConfig reducedMotion="always">
      <header
        className={`sticky top-0 z-[90] w-full transition-all duration-500 ${
          isScrolled
            ? "border-b border-primary/10 bg-white/90 shadow-[0_12px_45px_rgba(11,37,69,0.10)] backdrop-blur-md"
            : "border-b border-primary/5 bg-white/80 backdrop-blur-md"
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

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        />

        <nav
          aria-label={`${roleLabel} navigation`}
          className="relative mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        >
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <motion.span
              whileHover={{ scale: 1.08, rotate: 4 }}
              whileTap={{ scale: 0.94 }}
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_14px_32px_rgba(30,111,217,0.30)]"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/30"
                animate={{ left: ["-50%", "140%"] }}
                transition={{
                  duration: 2.5,
                  repeat: 0,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />
              <Sparkles className="relative h-6 w-6" />
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

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
            {items.map((item) => {
              const active = isActiveLink(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative whitespace-nowrap rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-colors ${
                    active ? "text-primary" : "text-slate-600 hover:text-primary"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{
                      opacity: active ? 1 : 0,
                      scale: active ? 1 : 0.9,
                    }}
                    className="absolute inset-0 rounded-xl bg-primary-light"
                  />
                  {!active && (
                    <span className="absolute bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-primary transition-all duration-300 group-hover:w-5" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {role === "customer" && (
              <Link
                href="/book-service"
                className="group relative inline-flex min-h-[46px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(30,111,217,0.28)] transition-colors hover:bg-primary-dark"
              >
                <CalendarCheck2 className="relative h-4 w-4" />
                <span className="relative">Book Now</span>
                <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

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
                <span className="hidden max-w-28 text-left 2xl:block">
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
                          <p className="truncate text-sm font-extrabold text-navy">{user.name}</p>
                          <p className="mt-1 truncate text-xs font-medium text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <ProfileLink href={profileHref} icon={UserRound} label="My profile" />
                      <ProfileLink href="/" icon={ExternalLink} label="Visit public homepage" />
                      {role === "admin" && (
                        <ProfileLink
                          href="/admin/services"
                          icon={Settings}
                          label="Manage services"
                        />
                      )}
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
                      {logoutLoading ? "Logging out…" : "Log out"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen((current) => !current);
            }}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-white text-navy shadow-sm transition hover:bg-primary-light hover:text-primary xl:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 top-[76px] z-[-1] bg-navy/25 backdrop-blur-sm xl:hidden"
              />

              <motion.div
                initial={{ opacity: 0, y: -16, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -16, height: 0 }}
                className="absolute inset-x-0 top-full overflow-hidden border-t border-primary/10 bg-white/95 shadow-[0_24px_60px_rgba(11,37,69,0.16)] backdrop-blur-md xl:hidden"
              >
                <div className="mx-auto max-h-[calc(100vh-76px)] max-w-[1500px] overflow-y-auto px-4 py-5 sm:px-6">
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

                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((item, index) => {
                      const Icon = item.icon;
                      const active = isActiveLink(item.href);

                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.035 }}
                        >
                          <Link
                            href={item.href}
                            className={`flex min-h-[50px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? "bg-primary text-white"
                                : "text-slate-700 hover:bg-primary-light hover:text-primary"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                            <ArrowRight className="ml-auto h-4 w-4" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-3">
                    {role === "customer" && (
                      <Link
                        href="/book-service"
                        className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white"
                      >
                        <CalendarCheck2 className="h-5 w-5" />
                        Book Now
                      </Link>
                    )}
                    <Link
                      href={profileHref}
                      className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 font-bold text-primary"
                    >
                      <UserRound className="h-5 w-5" />
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void handleLogout();
                      }}
                      disabled={logoutLoading}
                      className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 font-bold text-red-600 disabled:opacity-60"
                    >
                      {logoutLoading ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <LogOut className="h-5 w-5" />
                      )}
                      Log out
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </MotionConfig>
  );
}

function ProfileLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-primary-light hover:text-primary"
    >
      <Icon className="h-4 w-4" />
      {label}
      <ArrowRight className="ml-auto h-4 w-4" />
    </Link>
  );
}
