"use client";

import type { ReactNode } from "react";
import { CalendarDays, CreditCard, LayoutDashboard, MapPin, Star } from "lucide-react";

import AuthenticatedNavbar, {
  type AuthenticatedNavigationItem,
} from "@/components/shared/AuthenticatedNavbar";

interface CustomerLayoutClientProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

const customerNavigation: AuthenticatedNavigationItem[] = [
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
    label: "Addresses",
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
];

export default function CustomerLayoutClient({ children, user }: CustomerLayoutClientProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-soft">
      <AuthenticatedNavbar role="customer" items={customerNavigation} user={user} />
      <main className="min-h-[calc(100dvh-76px)] min-w-0">{children}</main>
    </div>
  );
}
