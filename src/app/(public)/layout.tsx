import type { ReactNode } from "react";
import Navbar from "@/components/shared/Navbar";
import { getCurrentUser } from "@/lib/auth";

type PublicLayoutProps = {
  children: ReactNode;
};

export default async function PublicLayout({
  children,
}: PublicLayoutProps) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar user={user} />
      {children}
    </>
  );
}