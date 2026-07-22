import type { ReactNode } from "react";
import Navbar from "@/components/shared/Navbar";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}