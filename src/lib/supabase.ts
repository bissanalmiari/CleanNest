import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
export const REVIEW_BUCKET = process.env.SUPABASE_REVIEW_BUCKET || "review-images";
export const PROOF_BUCKET = process.env.SUPABASE_PROOF_BUCKET || REVIEW_BUCKET;
export const SERVICE_IMAGE_BUCKET = process.env.SUPABASE_SERVICE_IMAGE_BUCKET || "service-images";

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

async function ensurePublicBucket(bucket: string) {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucket);

  if (data && !error) {
    if (!data.public) {
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucket, {
        public: true,
        allowedMimeTypes: Object.keys(EXTENSION_BY_MIME),
        fileSizeLimit: 5 * 1024 * 1024,
      });

      if (updateError) {
        throw new Error(`Failed to make ${bucket} public: ${updateError.message}`);
      }
    }

    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    allowedMimeTypes: Object.keys(EXTENSION_BY_MIME),
    fileSizeLimit: 5 * 1024 * 1024,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Failed to prepare ${bucket}: ${createError.message}`);
  }
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

export async function removeServiceImageFromSupabase(serviceId: string) {
  await ensurePublicBucket(SERVICE_IMAGE_BUCKET);

  const possiblePaths = Object.values(EXTENSION_BY_MIME).map(
    (extension) => `${serviceId}/cover.${extension}`
  );
  const { error } = await supabaseAdmin.storage.from(SERVICE_IMAGE_BUCKET).remove(possiblePaths);

  if (error) {
    throw new Error(`Failed to remove the service image: ${error.message}`);
  }
}

export async function uploadServiceImageToSupabase(
  serviceId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; path: string }> {
  await ensurePublicBucket(SERVICE_IMAGE_BUCKET);
  await removeServiceImageFromSupabase(serviceId);

  const path = `${serviceId}/cover.${extensionForMime(mimeType)}`;
  return uploadToBucket(SERVICE_IMAGE_BUCKET, path, buffer, mimeType, {
    upsert: true,
  });
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

export async function uploadServiceProofImageToSupabase(
  bookingId: string,
  cleanerId: string,
  stage: "before" | "after",
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const path = `service-proofs/${bookingId}/${cleanerId}/${stage}-${Date.now()}.${extensionForMime(
    mimeType
  )}`;
  return uploadToBucket(PROOF_BUCKET, path, buffer, mimeType, { upsert: false });
}
