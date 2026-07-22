"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";

export interface DashboardNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface DashboardSidebarUser {
  name: string;
  email?: string;
}

interface DashboardSidebarProps {
  role: "admin" | "customer";
  items: DashboardNavigationItem[];
  user?: DashboardSidebarUser;

  collapsed: boolean;
  mobileOpen: boolean;

  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;

  onLogout?: () => void | Promise<void>;
  logoutLoading?: boolean;
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstWord = words.at(0);
  const lastWord = words.at(-1);

  if (!firstWord) {
    return "CN";
  }

  if (!lastWord || words.length === 1) {
    return firstWord
      .slice(0, 2)
      .toUpperCase();
  }

  const firstInitial =
    firstWord.charAt(0);
  const lastInitial =
    lastWord.charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export default function DashboardSidebar({
  role,
  items,
  user,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onOpenMobile,
  onCloseMobile,
  onLogout,
  logoutLoading = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const roleTitle =
    role === "admin"
      ? "Administrator"
      : "Customer";

  const roleDescription =
    role === "admin"
      ? "Management workspace"
      : "Cleaning account";

  const fallbackUser =
    role === "admin"
      ? {
          name: "CleanNest Admin",
          email: "Administrator account",
        }
      : {
          name: "CleanNest Customer",
          email: "Customer account",
        };

  const currentUser =
    user ?? fallbackUser;

  const initials = useMemo(
    () => getInitials(currentUser.name),
    [currentUser.name],
  );

  function isItemActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  async function handleLogout() {
    if (!onLogout || logoutLoading) {
      return;
    }

    await onLogout();
  }

  function renderSidebarContent(
    isCollapsed: boolean,
    isMobile = false,
  ) {
    return (
      <div className="relative flex h-full w-full min-w-0 flex-col overflow-hidden bg-gradient-to-b from-[#071a33] via-[#0b2545] to-[#0d315c] text-white">
        {/* Background decorations */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <motion.div
            className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-primary/35 blur-3xl"
            animate={{
              scale: [1, 1.25, 1],
              x: [0, 35, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              y: [0, -35, 0],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            animate={{
              backgroundPosition: [
                "0px 0px",
                "48px 48px",
              ],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Brand */}
        <div
          className={`relative z-10 flex min-h-[88px] shrink-0 items-center border-b border-white/10 ${
            isCollapsed
              ? "justify-center px-3"
              : "justify-between px-5"
          }`}
        >
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex min-w-0 items-center gap-3"
            title="CleanNest"
          >
            <motion.span
              whileHover={{
                scale: 1.08,
                rotate: 5,
              }}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-primary shadow-[0_14px_35px_rgba(0,0,0,0.24)]"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-primary/15"
                animate={{
                  left: [
                    "-50%",
                    "145%",
                  ],
                }}
                transition={{
                  duration: 2.7,
                  repeat: Infinity,
                  repeatDelay: 1.8,
                  ease: "easeInOut",
                }}
              />

              <Home className="relative h-6 w-6" />
            </motion.span>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: -12,
                    width: 0,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    width: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    x: -12,
                    width: 0,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                  className="min-w-0 overflow-hidden"
                >
                  <p className="whitespace-nowrap font-heading text-xl font-extrabold">
                    CleanNest
                  </p>

                  <p className="mt-0.5 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200/70">
                    Cleaning made simple
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Role information */}
        <div
          className={`relative z-10 mx-3 mt-4 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] ${
            isCollapsed
              ? "px-2 py-3"
              : "px-4 py-4"
          }`}
        >
          <motion.div
            aria-hidden="true"
            className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/25 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div
            className={`relative flex items-center ${
              isCollapsed
                ? "justify-center"
                : "gap-3"
            }`}
          >
            <motion.span
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200"
            >
              {role === "admin" ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </motion.span>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -10,
                  }}
                  className="min-w-0"
                >
                  <p className="truncate text-sm font-bold">
                    {roleTitle}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-blue-100/55">
                    {roleDescription}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 mt-5 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!isCollapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/40">
              Navigation
            </p>
          )}

          <div className="min-w-0 space-y-1.5">
            {items.map((item, index) => {
              const Icon = item.icon;
              const active =
                isItemActive(item.href);

              return (
                <motion.div
                  key={item.href}
                  initial={{
                    opacity: 0,
                    x: -16,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      0.08 +
                      index * 0.045,
                  }}
                  className="min-w-0"
                >
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    title={
                      isCollapsed
                        ? item.label
                        : undefined
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`group relative flex min-h-[50px] min-w-0 items-center overflow-hidden rounded-xl transition-colors ${
                      isCollapsed
                        ? "justify-center px-2"
                        : "gap-3 px-3.5"
                    } ${
                      active
                        ? "text-white"
                        : "text-blue-100/65 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={`dashboard-active-navigation-${
                          isMobile
                            ? "mobile"
                            : "desktop"
                        }`}
                        className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-r from-primary via-blue-600 to-cyan-500 shadow-[0_12px_28px_rgba(30,111,217,0.3)]"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                      />
                    )}

                    {active && (
                      <motion.span
                        aria-hidden="true"
                        className="absolute inset-y-0 -left-1/3 w-1/4 skew-x-[-20deg] bg-white/20"
                        animate={{
                          left: [
                            "-35%",
                            "135%",
                          ],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                        active
                          ? "bg-white/15"
                          : "bg-white/[0.06] group-hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={{
                            opacity: 0,
                            x: -8,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: -8,
                          }}
                          className="relative z-10 min-w-0 flex-1 truncate text-sm font-semibold"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {!isCollapsed &&
                      item.badge !==
                        undefined && (
                        <span
                          className={`relative z-10 flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-primary/20 text-cyan-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                    {!isCollapsed &&
                      item.badge ===
                        undefined && (
                        <ChevronRight
                          className={`relative z-10 h-4 w-4 shrink-0 transition-all duration-300 ${
                            active
                              ? "translate-x-0 opacity-100"
                              : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                          }`}
                        />
                      )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="relative z-10 min-w-0 shrink-0 overflow-hidden border-t border-white/10 p-3">
          <div
            className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] ${
              isCollapsed
                ? "p-2"
                : "p-3"
            }`}
          >
            <div
              className={`flex min-w-0 items-center ${
                isCollapsed
                  ? "justify-center"
                  : "gap-3"
              }`}
            >
              <motion.div
                whileHover={{
                  scale: 1.07,
                }}
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-sm font-extrabold text-white shadow-lg"
              >
                {initials}

                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy bg-emerald-400" />
              </motion.div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -10,
                    }}
                    className="min-w-0 flex-1 overflow-hidden"
                  >
                    <p className="truncate text-sm font-bold">
                      {currentUser.name}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] text-blue-100/50">
                      {currentUser.email ??
                        roleDescription}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {onLogout && (
              <motion.button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  logoutLoading
                }
                whileHover={
                  logoutLoading
                    ? undefined
                    : {
                        y: -2,
                      }
                }
                whileTap={
                  logoutLoading
                    ? undefined
                    : {
                        scale: 0.97,
                      }
                }
                title={
                  isCollapsed
                    ? "Log out"
                    : undefined
                }
                className={`mt-3 flex min-h-10 w-full min-w-0 items-center rounded-xl text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/15 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isCollapsed
                    ? "justify-center px-2"
                    : "gap-3 px-3"
                }`}
              >
                <LogOut
                  className={`h-4 w-4 shrink-0 ${
                    logoutLoading
                      ? "animate-pulse"
                      : ""
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate">
                    {logoutLoading
                      ? "Logging out..."
                      : "Log out"}
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Desktop collapse button */}
        {!isMobile && (
          <button
            type="button"
            onClick={
              onToggleCollapsed
            }
            aria-label={
              isCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            className="absolute -right-4 top-28 z-30 hidden h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-white text-primary shadow-[0_8px_24px_rgba(11,37,69,0.18)] transition-all hover:scale-110 hover:bg-primary hover:text-white lg:flex"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile menu button */}
      <motion.button
        type="button"
        onClick={onOpenMobile}
        whileTap={{
          scale: 0.94,
        }}
        aria-label="Open dashboard menu"
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-white shadow-[0_12px_35px_rgba(11,37,69,0.28)] lg:hidden"
      >
        <Menu className="h-5 w-5" />

        <motion.span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Sparkles className="h-3 w-3" />
        </motion.span>
      </motion.button>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{
          width: collapsed
            ? 84
            : 250,
        }}
        transition={{
          duration: 0.3,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 shadow-[12px_0_40px_rgba(11,37,69,0.15)] lg:block"
      >
        {renderSidebarContent(
          collapsed,
          false,
        )}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close dashboard menu"
              onClick={
                onCloseMobile
              }
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-40 bg-navy/65 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{
                x: "-100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100%",
              }}
              transition={{
                duration: 0.35,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="fixed inset-y-0 left-0 z-50 w-[min(86vw,290px)] overflow-hidden shadow-[18px_0_60px_rgba(0,0,0,0.35)] lg:hidden"
            >
              {renderSidebarContent(
                false,
                true,
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}