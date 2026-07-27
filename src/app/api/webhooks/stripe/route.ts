// src/app/api/webhooks/stripe/route.ts
// POST /api/webhooks/stripe
// Public endpoint (no session/cookie auth — Stripe calls this directly).
// Verified instead via the Stripe-Signature header + STRIPE_WEBHOOK_SECRET.
//
// This is the reliable source of truth for payment confirmation: it fires
// even if the customer closes the browser tab before the /payments/success
// page gets a chance to call the verify endpoint.
//
// Register this URL in the Stripe Dashboard (or via `stripe listen --forward-to
// localhost:3000/api/webhooks/stripe` during local development) for the
// "checkout.session.completed" event.

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { handleStripeCheckoutWebhook } from "@/services/paymentService";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("[stripe webhook] Missing signature or webhook secret");
    return NextResponse.json(
      { success: false, error: "Webhook not configured" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed", err);
    return NextResponse.json(
      { success: false, error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.expired"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleStripeCheckoutWebhook(session);
    }
  } catch (err) {
    console.error("[stripe webhook] Failed to process event", err);
    // Still acknowledge receipt so Stripe doesn't retry indefinitely for a
    // problem on our side that a retry won't fix (e.g. a missing payment).
  }

  return NextResponse.json({ received: true });
}
