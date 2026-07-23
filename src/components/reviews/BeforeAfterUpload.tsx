"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImagePair {
  before: string | null;
  after: string | null;
}

interface BeforeAfterUploadProps {
  bookingId: string;
  pairs: ImagePair[];
  onChange: (pairs: ImagePair[]) => void;
  uploadImage: (bookingId: string, slot: "before" | "after", file: File) => Promise<string | null>;
  maxPairs?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Lets a customer attach one or more before/after photo pairs to their
 * review. Each pair uploads independently to Supabase (via uploadImage) as
 * soon as it's picked — the review form just collects the resulting URLs.
 */
export function BeforeAfterUpload({
  bookingId,
  pairs,
  onChange,
  uploadImage,
  maxPairs = 3,
}: BeforeAfterUploadProps) {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(pairIndex: number, slot: "before" | "after", file: File | null) {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be under 5MB");
      return;
    }

    setUploadingSlot(`${pairIndex}-${slot}`);
    const url = await uploadImage(bookingId, slot, file);
    setUploadingSlot(null);

    if (!url) {
      setError("Failed to upload image — please try again");
      return;
    }

    const next = [...pairs];
    // With noUncheckedIndexedAccess on, next[pairIndex] is typed as
    // `ImagePair | undefined` — spreading it directly is a type error.
    // Fall back to an empty pair so the spread always has a real object.
    const currentPair = next[pairIndex] ?? { before: null, after: null };
    next[pairIndex] = { ...currentPair, [slot]: url };
    onChange(next);
  }

  function addPair() {
    if (pairs.length >= maxPairs) return;
    onChange([...pairs, { before: null, after: null }]);
  }

  function removePair(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-navy">
        Before &amp; after photos (optional)
      </span>

      {pairs.map((pair, index) => (
        <div key={index} className="flex items-center gap-3 rounded-card border border-navy/10 p-3">
          <ImageSlot
            label="Before"
            url={pair.before}
            uploading={uploadingSlot === `${index}-before`}
            onPick={(file) => handlePick(index, "before", file)}
          />
          <span className="text-navy/30">→</span>
          <ImageSlot
            label="After"
            url={pair.after}
            uploading={uploadingSlot === `${index}-after`}
            onPick={(file) => handlePick(index, "after", file)}
          />
          <button
            type="button"
            onClick={() => removePair(index)}
            className="ml-auto self-start text-xs text-navy/40 hover:text-status-cancelled"
          >
            Remove
          </button>
        </div>
      ))}

      {pairs.length < maxPairs && (
        <button
          type="button"
          onClick={addPair}
          className="rounded-card border border-dashed border-navy/20 px-3 py-2 text-xs font-medium text-primary hover:border-primary"
        >
          + Add before/after photo pair
        </button>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function ImageSlot({
  label,
  url,
  uploading,
  onPick,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onPick: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative h-20 w-20 overflow-hidden rounded-card border border-navy/15 bg-surface-soft flex items-center justify-center hover:border-primary transition disabled:opacity-60"
      >
        {url ? (
          <Image src={url} alt={label} fill className="object-cover" />
        ) : (
          <span className="text-2xl text-navy/25">+</span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
          </span>
        )}
      </button>
      <span className="text-[11px] text-navy/50">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}