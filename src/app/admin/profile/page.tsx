"use client";

// Admin's own account profile — deliberately the SAME ProfileView the
// customer role uses. An admin editing their own name/phone/bio isn't a
// different feature; only the allowed role differs.
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProfileView } from "@/components/profile/ProfileView";

export default function AdminProfilePage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <ProfileView />
    </RequireAuth>
  );
}