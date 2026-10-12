import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { connectDB } from "@/lib/db";
import { TooManyRequestsError } from "@/lib/apiError";
import { AuthRateLimit } from "@/models/AuthRateLimit";

/** Shared MongoDB counter; process memory is not shared by serverless instances. */
export async function enforceAuthRateLimit(
  scope: string,
  identifier: string,
  maximum: number,
  windowMs: number
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for authentication rate limiting");

  await connectDB();
  await AuthRateLimit.init();

  const bucket = Math.floor(Date.now() / windowMs);
  const key = createHmac("sha256", secret)
    .update(`${scope}:${identifier.toLowerCase()}:${bucket}`)
    .digest("hex");
  const expiresAt = new Date((bucket + 2) * windowMs);
  const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt } };

  let counter;
  try {
    counter = await AuthRateLimit.findOneAndUpdate({ key }, update, {
      upsert: true,
      new: true,
      lean: true,
    });
  } catch (error) {
    // Two instances can race on the first request for a bucket. The unique
    // key index ensures only one inserts; charge the other request as well.
    if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 11000) {
      throw error;
    }
    counter = await AuthRateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { new: true, lean: true }
    );
  }

  if (!counter) throw new Error("Authentication rate limit counter was not available");
  if (counter.count > maximum) {
    throw new TooManyRequestsError("Too many attempts. Please try again later.");
  }
}

/** Vercel owns this header at its edge; arbitrary forwarded headers are not trusted. */
export async function enforceAuthRequestRateLimit(
  request: Request,
  scope: string,
  maximum: number,
  windowMs: number
): Promise<void> {
  if (process.env.VERCEL !== "1") return;
  const address = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (!address || !isIP(address)) return;
  await enforceAuthRateLimit(`${scope}-ip`, address, maximum, windowMs);
}
