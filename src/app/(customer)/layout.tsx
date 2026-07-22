"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Settings,
  Star,
  UserRound,
} from "lucide-react";

import DashboardSidebar, {
  type DashboardNavigationItem,
} from "@/components/shared/DashboardSidebar";

interface CustomerLayoutProps {
  children: ReactNode;
}

const customerNavigation: DashboardNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Bookings",
    href: "/customer/bookings",
    icon: CalendarDays,
  },
  {
    label: "Book a Service",
    href: "/customer/book-service",
    icon: PlusCircle,
  },
  {
    label: "Saved Addresses",
    href: "/customer/addresses",
    icon: MapPin,
  },
  {
    label: "My Reviews",
    href: "/customer/reviews",
    icon: Star,
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/customer/settings",
    icon: Settings,
  },
];

export default function CustomerLayout({
  children,
}: CustomerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-soft">
      <DashboardSidebar
        role="customer"
        items={customerNavigation}
        user={{
          name: "CleanNest Customer",
          email: "Customer account",
        }}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={() => {
          setCollapsed((current) => !current);
        }}
        onOpenMobile={() => {
          setMobileOpen(true);
        }}
        onCloseMobile={() => {
          setMobileOpen(false);
        }}
      />

      <main
        className={`min-h-screen min-w-0 pt-16 transition-[margin-left] duration-300 ease-out lg:pt-0 ${
          collapsed ? "lg:ml-[84px]" : "lg:ml-[250px]"
        }`}
      >
        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}