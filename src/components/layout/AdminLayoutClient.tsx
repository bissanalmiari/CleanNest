"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Tag,
  UserRoundCheck,
  Users,
} from "lucide-react";

import AuthenticatedNavbar, {
  type AuthenticatedNavigationItem,
} from "@/components/shared/AuthenticatedNavbar";

interface AdminLayoutClientProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

const adminNavigation: AuthenticatedNavigationItem[] = [
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
    label: "Promo Codes",
    href: "/admin/promo-codes",
    icon: Tag,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: Megaphone,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
];

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-soft">
      <AuthenticatedNavbar role="admin" items={adminNavigation} user={user} />
      <main className="min-h-[calc(100vh-76px)] min-w-0">{children}</main>
    </div>
  );
}
