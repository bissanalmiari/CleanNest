"use client";

// Client-side role gate for page content.
//
// This is a UX layer, not the security boundary — it calls /api/auth/me,
// which is answered by getCurrentUser() on the server (real JWT
// verification + a DB lookup). If that check fails, nothing sensitive was
// ever sent to the browser in the first place. Wrap any protected page's
// content with this component and pass the roles allowed to view it.
//
// Usage:
//   <RequireAuth allowedRoles={["admin"]}>
//     <AdminDashboard />
//   </RequireAuth>
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/types/user";
import type { UserRole } from "@/types/enums";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Roles allowed to view this page. Omit to just require "logged in, any role". */
  allowedRoles?: UserRole[];
}

type Status = "checking" | "allowed" | "denied";

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json: { success: boolean; data?: { user: PublicUser | null } } = await res.json();
        const user = json.data?.user ?? null;

        if (cancelled) return;

        if (!user) {
          router.replace(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
          setStatus("denied");
          return;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Logged in, but the wrong role for this page — send them home
          // rather than showing a broken or empty dashboard.
          router.replace("/");
          setStatus("denied");
          return;
        }

        setStatus("allowed");
      } catch {
        if (!cancelled) {
          router.replace("/login");
          setStatus("denied");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status !== "allowed") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-light border-t-primary" />
          <p className="text-sm text-navy/60">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}