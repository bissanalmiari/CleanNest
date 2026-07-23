"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  MapPin,
  PlusCircle,
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
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Bookings",
    href: "/bookings",
    icon: CalendarDays,
  },
  {
    label: "Book a Service",
    href: "/book-service",
    icon: PlusCircle,
  },
  {
    label: "Saved Addresses",
    href: "/addresses",
    icon: MapPin,
  },
  {
    label: "My Reviews",
    href: "/reviews",
    icon: Star,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
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
        className={`min-h-screen min-w-0 pt-16 transition-[margin-left] duration-300 ease-out lg:pt-0 ${collapsed ? "lg:ml-[84px]" : "lg:ml-[250px]"
          }`}
      >
        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}