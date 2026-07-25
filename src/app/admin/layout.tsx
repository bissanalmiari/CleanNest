import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClient from "@/components/layout/AdminLayoutClient";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect(currentUser.role === "customer" ? "/dashboard" : "/login");
  }

  return (
    <AdminLayoutClient
      user={{
        name: currentUser.name,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
