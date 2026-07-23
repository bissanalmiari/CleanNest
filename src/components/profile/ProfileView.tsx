"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { Alert } from "@/components/ui/Alert";
import { ChangePasswordForm } from "./ChangePasswordForm";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  fr: "French",
};


/**
 * Role-agnostic profile page content. A customer, admin, or cleaner all see
 * and edit the same fields for their own account — only the surrounding
 * page (and its <RequireAuth> role check) differs.
 */
export function ProfileView() {
  const { user, loading, error, fetchProfile } = useProfile();
const [showPasswordForm, setShowPasswordForm] = useState(false);
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !user) {
    return <div className="p-6 text-sm text-navy/60">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        {error ? <Alert variant="error">{error}</Alert> : <p>Profile not found.</p>}
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
  

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-navy">My Profile</h1>
        <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium capitalize text-primary">
          {user.role}
        </span>
      </div>

      <div className="flex items-center gap-4 rounded-card bg-surface p-6 shadow-card">
        <AvatarUpload
          user={user}
          onUploaded={() => {
            /* useProfile already updates `user` internally on success */
          }}
        />
        <div>
          <p className="font-heading text-lg text-navy">{user.name}</p>
          <p className="text-sm text-navy/60">{user.email}</p>
          {user.phone && <p className="text-sm text-navy/60">{user.phone}</p>}
          <p className="mt-1 text-xs text-navy/40">Member since {memberSince}</p>
        </div>
      </div>

      {(user.bio || user.dateOfBirth || user.gender) && (
        <div className="grid grid-cols-1 gap-3 rounded-card bg-surface p-6 shadow-card sm:grid-cols-2">
          {user.bio && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-navy/40">Bio</p>
              <p className="text-sm text-navy/80">{user.bio}</p>
            </div>
          )}
          {user.dateOfBirth && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-navy/40">
                Date of birth
              </p>
              <p className="text-sm text-navy/80">
                {new Date(user.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
          )}
          {user.gender && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-navy/40">Gender</p>
              <p className="text-sm text-navy/80">{GENDER_LABELS[user.gender]}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy/40">Language</p>
            <p className="text-sm text-navy/80">{LANGUAGE_LABELS[user.preferredLanguage]}</p>
          </div>
        </div>
      )}

      <div className="rounded-card bg-surface p-6 shadow-card">
        <h2 className="mb-4 font-heading text-lg text-navy">Edit Details</h2>
        <EditProfileForm user={user} onSaved={() => {}} />
      </div>

      <div className="flex items-center justify-between rounded-card bg-surface p-6 shadow-card">
        
  <div className="flex items-center justify-between">
    <div>
      <h2 className="font-heading text-lg text-navy">Password</h2>
      <p className="text-sm text-navy/60">Change your account password</p>
    </div>
    {!showPasswordForm && (
      <button
        type="button"
        onClick={() => setShowPasswordForm(true)}
        className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
      >
        Change password
      </button>
    )}
  </div>
  {showPasswordForm && (
    <ChangePasswordForm onDone={() => setShowPasswordForm(false)} />
  )}
</div>
      </div>
  
  );
}