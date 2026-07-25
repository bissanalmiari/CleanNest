"use client";

import {
  useState,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Sparkles,
  Star,
  Tag,
  UserRound,
  UserRoundCheck,
  Users,
} from "lucide-react";

import DashboardSidebar, {
  type DashboardNavigationItem,
} from "@/components/shared/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavigation: DashboardNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: CalendarDays,
  },
  {
    label: "Services",
    href: "/admin/services",
    icon: Sparkles,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    label: "Cleaners",
    href: "/admin/cleaners",
    icon: UserRoundCheck,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    label: "Promo Codes",
    href: "/admin/promo-codes",
    icon: Tag,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: UserRound,
  },
  {
    label: "Profile",
    href: "/admin/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const { logout } = useAuth();

  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  async function handleLogout() {
    if (logoutLoading) {
      return;
    }

    setLogoutLoading(true);
    setMobileOpen(false);

    try {
      await logout();

      // Forces an immediate full reload after the
      // authentication cookie/session is removed.
      window.location.replace("/login");
    } catch (error) {
      console.error(
        "Failed to log out:",
        error,
      );

      setLogoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-soft">
      <DashboardSidebar
        role="admin"
        items={adminNavigation}
        user={{
          name: "CleanNest Admin",
          email: "Administrator account",
        }}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={() => {
          setCollapsed(
            (current) => !current,
          );
        }}
        onOpenMobile={() => {
          setMobileOpen(true);
        }}
        onCloseMobile={() => {
          setMobileOpen(false);
        }}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <main
        className={`min-h-screen min-w-0 pt-16 transition-[margin-left] duration-300 ease-out lg:pt-0 ${
          collapsed
            ? "lg:ml-[84px]"
            : "lg:ml-[250px]"
        }`}
      >
        <div className="min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}