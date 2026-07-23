"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProfileView } from "@/components/profile/ProfileView";

export default function CustomerProfilePage() {
  return (
    <RequireAuth allowedRoles={["customer"]}>
      <ProfileView />
    </RequireAuth>
  );
}