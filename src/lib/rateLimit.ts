// Basic in-memory fixed-window rate limiter for API routes. Good enough for
// coarse abuse protection on a single serverless instance; unlike the
// DB-timestamp cooldown pattern in src/lib/otp.ts (which throttles a
// specific business action), this is a generic per-key request counter with
// no persistence — it resets on cold start and isn't shared across
// instances, which is an accepted tradeoff since this repo has no
// Redis/Upstash-style store to back a distributed limiter.
import "server-only";
import { TooManyRequestsError } from "@/lib/apiError";

const hits = new Map<string, number[]>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

/** Throws TooManyRequestsError once `key` has been hit `limit` times within `windowMs`. */
export function enforceRateLimit(key: string, { limit, windowMs }: RateLimitOptions): void {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recentHits = (hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (recentHits.length >= limit) {
    throw new TooManyRequestsError("Too many requests — please try again shortly");
  }

  recentHits.push(now);
  hits.set(key, recentHits);
}
