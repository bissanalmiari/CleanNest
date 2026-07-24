
import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
export const REVIEW_BUCKET = process.env.SUPABASE_REVIEW_BUCKET || "review-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — uploads will fail"
  );
}

export const supabaseAdmin = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false },
});

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionForMime(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? "jpg";
}

/** Generic upload into any bucket/path — the building block the two helpers below use. */
async function uploadToBucket(
  bucket: string,
  path: string,
  buffer: Buffer,
  mimeType: string,
  options: { upsert: boolean }
): Promise<{ url: string; path: string }> {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    upsert: options.upsert,
  });

  if (error) {
    throw new Error(`Failed to upload to ${bucket}: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}`, path };
}

/**
 * Uploads a profile picture to the avatars bucket at a per-user path
 * (avatars/{userId}.{ext}), overwriting any previous avatar for that user.
 */
export async function uploadAvatarToSupabase(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const path = `${userId}.${extensionForMime(mimeType)}`;
  return uploadToBucket(AVATAR_BUCKET, path, buffer, mimeType, { upsert: true });
}

/**
 * Uploads a single before/after review photo to the review-images bucket, at
 * review-images/{bookingId}/{before|after}-{timestamp}.{ext}. Never overwrites
 * — each photo gets its own unique path, since a review can have several.
 */
export async function uploadReviewImageToSupabase(
  bookingId: string,
  slot: "before" | "after",
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const path = `${bookingId}/${slot}-${Date.now()}.${extensionForMime(mimeType)}`;
  return uploadToBucket(REVIEW_BUCKET, path, buffer, mimeType, { upsert: false });
}
