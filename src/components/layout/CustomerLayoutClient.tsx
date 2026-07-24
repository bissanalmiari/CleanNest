"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Star,
  UserRound,
} from "lucide-react";

import DashboardSidebar, {
  type DashboardNavigationItem,
} from "@/components/shared/DashboardSidebar";

interface CustomerLayoutClientProps {
  children: ReactNode;

  user: {
    name: string;
    email: string;
  };
}

/*
 * The "(customer)" folder is a route group.
 * It does not appear in the browser URL.
 *
 * Example:
 * src/app/(customer)/bookings/page.tsx
 * becomes:
 * /bookings
 */
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
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export default function CustomerLayoutClient({
  children,
  user,
}: CustomerLayoutClientProps) {
  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-soft">
      <DashboardSidebar
        role="customer"
        items={customerNavigation}
        user={{
          name: user.name,
          email: user.email,
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