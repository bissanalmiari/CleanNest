"use client";

import { useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Alert } from "@/components/ui/Alert";
import type { PublicUser } from "@/types/user";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface Props {
  user: PublicUser;
  onUploaded: (updatedUser: PublicUser) => void;
}

export function AvatarUpload({ user, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, loading } = useProfile();
  const [preview, setPreview] = useState<string | null>(user.avatarUrl);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError("Only JPEG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError("Image must be under 5MB");
      return;
    }

    setPreview(URL.createObjectURL(file)); // instant local preview
    const updatedUser = await uploadAvatar(file);
    if (updatedUser) {
      onUploaded(updatedUser);
      setPreview(updatedUser.avatarUrl);
    } else {
      setPreview(user.avatarUrl); // revert on failure
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-primary/20 bg-primary-light transition hover:border-primary disabled:opacity-60"
        aria-label="Change profile picture"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Change photo"}
      </button>

      {localError && (
        <Alert variant="error">
          <span className="text-xs">{localError}</span>
        </Alert>
      )}
    </div>
  );
}
