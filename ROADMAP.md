# CleanNest Project Plan

_Last reviewed: 2026-08-04_

CleanNest is a cleaning-services booking platform (Next.js 15, TypeScript, MongoDB
Atlas/Mongoose, Stripe, Supabase storage). The core product is largely built:
customer booking flow, cleaner portal, admin console, payments, reviews, promo
codes, notifications, and reporting all exist end to end. This plan captures
where things stand, what needs hardening before a real launch, and where the
product could go next.

## 1. Current state (what's already built)

- **Customer**: signup/login with OTP email verification, address book,
  service catalog + add-ons, price preview, booking creation/reschedule/cancel,
  Stripe checkout + cash payments, reviews, notifications, profile.
- **Cleaner portal**: login, today/upcoming jobs, availability management,
  job actions, proof-of-work photo upload, proof reports.
- **Admin console**: dashboards, bookings, cleaners, customers, admin users,
  payments (refund / mark-cash-paid / fail), promo codes, services, service
  areas, reviews, settings, revenue & popular-services reports with export.
- **Platform**: JWT session auth via httpOnly cookie, role-based middleware,
  Mongoose models with schema-level validation, queued transactional email
  with a documented SPF/DKIM/DMARC setup guide, a Vercel cron job that
  reconciles bookings and drains the notification queue every 5 minutes.

## 2. Now — production-readiness gaps

These are concrete issues found in the repo, not speculation. Recommend
tackling before pointing this at real customers/money.

1. **No automated tests.** No `*.test.*`/`*.spec.*` files anywhere in `src`.
   Given Stripe payments, pricing math (`Booking.ts` pre-validate hooks), and
   refund/cancellation flows are all money-handling code paths, this is the
   highest-leverage gap. Start with the pricing engine (`src/lib` pricing) and
   the Stripe webhook handler.
2. **No CI.** No `.github/workflows`. Nothing currently blocks a broken build,
   failed lint, or type error from reaching `dev`/`main`. Add a workflow that
   runs `lint` + `build` (and tests, once they exist) on PRs.
3. **Cleaner-assignment model is half-migrated.** `Booking.ts` still carries a
   free-text `assignedCleanerName` field with a comment saying "there is no
   cleaner account" — but a full cleaner-account system exists in parallel
   (`CleanerAssignment` model, cleaner login, `/api/cleaner/jobs`, proof
   upload). `assignedCleanerName` is referenced in 10 files. Decide which
   system is canonical and retire the other — right now admin bookings and
   the cleaner portal could disagree about who's assigned to a job.
4. **Demo bypass flags.** `ENABLE_DEMO_CHECK_IN` / `NEXT_PUBLIC_ENABLE_DEMO_CHECK_IN`
   let cleaners check in without normal validation. Confirmed present in
   `.env.local.example` with a "keep both false in production" warning —
   make this a hard launch-checklist item, ideally enforced in code (throw if
   `NODE_ENV === "production"` and the flag is true) rather than relying on
   someone remembering.
5. **Email deliverability isn't launch-ready per your own docs.**
   `docs/email-deliverability.md` lays out required SPF/DKIM/DMARC setup on a
   real sending domain — worth confirming this has actually been done for
   the production domain, not just documented.
6. **Stale branches.** 19 branches on `origin` (`AdminDashboard`,
   `Booking_Page` vs `Booking_page`, `PromoCodes` vs `promoCodes`, etc.), most
   look already merged into `dev` via PRs. Worth pruning so `git branch -a`
   is actually useful for finding active work.
7. **No error monitoring.** Nothing like Sentry wired in — right now a
   production error (e.g. a failed Stripe webhook) fails silently from the
   team's point of view unless someone checks logs.

## 3. Next — near-term product work

Grounded in what the schema already supports or clearly anticipates:

- **Recurring bookings**: `Booking.frequency` already supports
  `weekly`/`biweekly`/`monthly`, but check whether the booking flow actually
  creates a recurring series or just tags a single booking — worth verifying
  end to end (auto-creation of the next occurrence, ability to cancel the
  series vs. one occurrence).
- **Cleaner ratings/performance**: `Review` model exists tied to bookings —
  confirm whether reviews roll up into a per-cleaner rating the admin can use
  for assignment decisions.
- **SMS notifications**: `NotificationPreference` model exists; only email
  looks wired up (`nodemailer`). Day-of reminders and cleaner arrival alerts
  are a common ask for this kind of product.
- **Service area self-serve growth**: `ServiceArea` model + fee already
  exists; admin-side tooling for adding new coverage areas as the business
  expands.

## 4. Later — bigger bets (validate demand before building)

- Cleaner payouts (Stripe Connect) if cleaners are contractors, not admin-
  assigned staff.
- Loyalty/referral program building on the existing `PromoCode` system.
- Native mobile or PWA for the cleaner portal (field use case).
- Multi-language support if the customer base isn't English-only.

## 5. Launch checklist (condensed)

- [ ] Pricing engine + Stripe webhook covered by tests
- [ ] CI running lint/build/tests on every PR
- [ ] Cleaner-assignment: one system, not two
- [ ] Demo bypass flags hard-disabled in production
- [ ] SPF/DKIM/DMARC verified on the real sending domain
- [ ] Error monitoring wired up
- [ ] Stale branches pruned
