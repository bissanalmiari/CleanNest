"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { AlertCircle, Camera, CheckCircle2, ImagePlus, LoaderCircle, Upload } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

import type { PublicUser } from "@/types/user";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface AvatarUploadProps {
  user: PublicUser;

  onUploaded: (updatedUser: PublicUser) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "CN";
  }

  const firstPart = parts[0] ?? "";

  if (parts.length === 1) {
    return firstPart.slice(0, 2).toUpperCase() || "CN";
  }

  const lastPart = parts[parts.length - 1] ?? "";

  const firstInitial = firstPart.charAt(0);

  const lastInitial = lastPart.charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase() || "CN";
}

export function AvatarUpload({ user, onUploaded }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const temporaryPreviewRef = useRef<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { uploadAvatar, loading, error, setError } = useProfile();

  const [preview, setPreview] = useState<string | null>(user.avatarUrl);

  const [localError, setLocalError] = useState<string | null>(null);

  const [uploadSucceeded, setUploadSucceeded] = useState(false);

  useEffect(() => {
    setPreview(user.avatarUrl);
  }, [user.avatarUrl]);

  useEffect(() => {
    return () => {
      if (temporaryPreviewRef.current) {
        URL.revokeObjectURL(temporaryPreviewRef.current);
      }

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function clearTemporaryPreview() {
    if (temporaryPreviewRef.current) {
      URL.revokeObjectURL(temporaryPreviewRef.current);

      temporaryPreviewRef.current = null;
    }
  }

  function clearSuccessTimer() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);

      successTimerRef.current = null;
    }
  }

  function openFilePicker() {
    if (loading) {
      return;
    }

    setLocalError(null);
    setError(null);
    setUploadSucceeded(false);

    clearSuccessTimer();

    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLocalError(null);
    setError(null);
    setUploadSucceeded(false);

    clearSuccessTimer();

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError("Choose a JPEG, PNG, or WEBP image.");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setLocalError("The image must be smaller than 5 MB.");

      event.target.value = "";
      return;
    }

    clearTemporaryPreview();

    const temporaryPreview = URL.createObjectURL(file);

    temporaryPreviewRef.current = temporaryPreview;

    setPreview(temporaryPreview);

    const updatedUser = await uploadAvatar(file);

    if (updatedUser) {
      clearTemporaryPreview();

      setPreview(updatedUser.avatarUrl);

      setUploadSucceeded(true);

      onUploaded(updatedUser);

      successTimerRef.current = setTimeout(() => {
        setUploadSucceeded(false);

        successTimerRef.current = null;
      }, 2500);
    } else {
      clearTemporaryPreview();

      setPreview(user.avatarUrl);
    }

    event.target.value = "";
  }

  const visibleError = localError ?? error;

  const initials = getInitials(user.name);

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <button
          type="button"
          disabled={loading}
          onClick={openFilePicker}
          aria-label="Change profile picture"
          className="group relative block rounded-full outline-none disabled:cursor-wait"
        >
          {/* Decorative outer ring */}
          <span
            aria-hidden="true"
            className="absolute -inset-3 rounded-full border border-cyan-300/20 transition duration-300 group-hover:scale-105 group-hover:border-cyan-300/45"
          />

          {/* Gradient ring */}
          <span
            aria-hidden="true"
            className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-cyan-300 via-primary to-emerald-300 opacity-80 shadow-[0_18px_45px_rgba(34,211,238,0.24)]"
          />

          {/* Avatar image */}
          <span className="relative block h-28 w-28 overflow-hidden rounded-full border-4 border-navy bg-gradient-to-br from-primary-light to-white sm:h-32 sm:w-32">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={`${user.name}'s profile`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light via-white to-cyan-50 font-heading text-3xl font-black text-primary">
                {initials}
              </span>
            )}

            {/* Hover/loading overlay */}
            <span
              className={`absolute inset-0 flex flex-col items-center justify-center bg-navy/70 text-white transition duration-300 ${
                loading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-7 w-7 animate-spin text-cyan-300" />

                  <span className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.13em]">
                    Uploading
                  </span>
                </>
              ) : (
                <>
                  <Camera className="h-7 w-7 text-cyan-300" />

                  <span className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.13em]">
                    Change photo
                  </span>
                </>
              )}
            </span>
          </span>

          {/* Camera/status badge */}
          <span className="absolute bottom-0 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-navy bg-white text-primary shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-cyan-50">
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : uploadSucceeded ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          disabled={loading}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload button */}
        <button
          type="button"
          disabled={loading}
          onClick={openFilePicker}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-xs font-extrabold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
              Uploading photo…
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4 text-cyan-300" />
              Upload new photo
            </>
          )}
        </button>

        <div className="mt-3 flex items-center gap-2 text-center text-[10px] font-bold uppercase tracking-[0.11em] text-blue-100/50">
          <Upload className="h-3.5 w-3.5" />
          JPG, PNG or WEBP · Max 5 MB
        </div>

        {uploadSucceeded && (
          <div
            aria-live="polite"
            className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-extrabold text-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4" />
            Profile photo updated
          </div>
        )}

        {visibleError && (
          <div
            role="alert"
            className="mt-4 flex max-w-[270px] items-start gap-2 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-left text-xs font-semibold leading-5 text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{visibleError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
