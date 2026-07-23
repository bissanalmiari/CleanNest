import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import CustomerLayoutClient from "@/components/layout/CustomerLayoutClient";

interface CustomerLayoutProps {
  children: ReactNode;
}

export default async function CustomerLayout({
  children,
}: CustomerLayoutProps) {
  const currentUser =
    await getCurrentUser();

  /*
   * No valid authenticated session.
   */
  if (!currentUser) {
    redirect("/login");
  }

  /*
   * Prevent administrators or any other role from
   * opening customer pages.
   */
  if (
    currentUser.role !== "customer"
  ) {
    if (
      currentUser.role === "admin"
    ) {
      redirect("/admin/dashboard");
    }

    redirect("/login");
  }

  return (
    <CustomerLayoutClient
      user={{
        name: currentUser.name,
        email: currentUser.email,
      }}
    >
      {children}
    </CustomerLayoutClient>
  );
}