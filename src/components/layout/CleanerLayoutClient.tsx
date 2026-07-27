"use client";

import type { ReactNode } from "react";
import { CalendarCheck2, CalendarDays, Clock3 } from "lucide-react";

import AuthenticatedNavbar, {
  type AuthenticatedNavigationItem,
} from "@/components/shared/AuthenticatedNavbar";

interface CleanerLayoutClientProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

const cleanerNavigation: AuthenticatedNavigationItem[] = [
  {
    label: "Today's route",
    href: "/cleaner/today",
    icon: CalendarCheck2,
  },
  {
    label: "Upcoming jobs",
    href: "/cleaner/upcoming",
    icon: CalendarDays,
  },
  {
    label: "Availability",
    href: "/cleaner/availability",
    icon: Clock3,
  },
];

export default function CleanerLayoutClient({ children, user }: CleanerLayoutClientProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f7fb]">
      <AuthenticatedNavbar role="cleaner" items={cleanerNavigation} user={user} />
      <main className="min-h-[calc(100vh-76px)] min-w-0">{children}</main>
    </div>
  );
}
