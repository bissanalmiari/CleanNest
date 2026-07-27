// src/lib/stripe.ts
// Singleton Stripe client. Requires STRIPE_SECRET_KEY in the environment
// (use a "sk_test_..." key while developing — CleanNest never needs a
// live key until you're ready to accept real payments).

import "server-only";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  // Thrown lazily (only when Stripe is actually used) would be nicer, but
  // failing fast at import time surfaces misconfiguration immediately
  // instead of a confusing error deep inside a checkout request.
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Card payments will fail until it is configured in .env.local."
  );
}

export const stripe = new Stripe(secretKey ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});
