"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/shared/button";

export default function AdminDashboardPage() {
  const { logout, loading } = useAuth();
  return <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-semibold text-navy">Dashboard</h1>
          <Button variant="secondary" size="sm" onClick={() => logout()} isLoading={loading}>
            Log out
          </Button>
        </div>
      </div>;
}
