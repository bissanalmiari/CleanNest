// Supabase Storage config, used for profile avatar uploads.
// Requires: npm install @supabase/supabase-js
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_AVATAR_BUCKET
//
// Uses the SERVICE ROLE key (not the anon key) because this only ever runs
// server-side, inside a Route Handler — it needs to bypass Storage RLS to
// write into another user's avatar path safely, after we've already
// verified the caller's identity via requireUser().
import "server-only";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "avatars";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — avatar uploads will fail"
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

/**
 * Uploads a profile picture to the `avatars` bucket at a per-user path
 * (avatars/{userId}.{ext}), overwriting any previous avatar for that user,
 * and returns its public URL.
 */
export async function uploadAvatarToSupabase(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const ext = EXTENSION_BY_MIME[mimeType] ?? "jpg";
  const path = `${userId}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(AVATAR_BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: true, // overwrite the previous avatar for this user
  });

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  // Cache-bust so the browser/CDN doesn't keep showing the old image after
  // an overwrite — same path, new content, different query string.
  const url = `${data.publicUrl}?v=${Date.now()}`;

  return { url, path };
}
