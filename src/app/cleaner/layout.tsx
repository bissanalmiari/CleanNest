import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import CleanerLayoutClient from "@/components/layout/CleanerLayoutClient";
import { getCurrentUser } from "@/lib/auth";

export default async function CleanerLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login");
  if (currentUser.role !== "cleaner") {
    redirect(currentUser.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }

  return (
    <CleanerLayoutClient
      user={{
        name: currentUser.name,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
      }}
    >
      {children}
    </CleanerLayoutClient>
  );
}
