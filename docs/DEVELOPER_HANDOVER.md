# CleanNest Developer Handover

## 1. Project overview

CleanNest is a full-stack cleaning-services marketplace and operations application. It supports:

- Public service discovery, reviews, marketing content, and contact enquiries.
- Customer registration, email verification, profile/address management, booking, rescheduling, cancellation, reviews, notifications, and payment.
- Cleaner accounts with availability, assigned jobs, job actions, proof checklists, before/after photos, issue reporting, and check-in/check-out.
- Admin management of customers, cleaners, services, bookings, assignments, payments, promo codes, settings, dashboards, and reports.
- Background booking-status reconciliation and queued notification processing.

The application is a single Next.js repository: the browser UI and server-side API route handlers are deployed together.

## 2. Technology stack

| Area | Technology |
| --- | --- |
| Application framework | Next.js 15 App Router, React 19, TypeScript |
| Styling/UI | Tailwind CSS 3, Motion, Lucide icons, CVA, `clsx`, `tailwind-merge` |
| Forms and validation | React Hook Form, Zod, `@hookform/resolvers` |
| Database | MongoDB Atlas through Mongoose |
| Authentication | Custom JWT session stored in an HTTP-only cookie; `jsonwebtoken` and `bcryptjs` |
| Email | Nodemailer over an SMTP connection string; optional application-level DKIM |
| Card payments | Stripe Checkout and Stripe webhooks |
| File storage | Supabase Storage using a server-side service-role client |
| Reports | Server-generated DOCX files using `docx` |
| Hosting/scheduling | Vercel-compatible deployment and Vercel Cron |
| Package tooling | npm, TypeScript, ESLint, Prettier, `tsx` for seed scripts |

`cloudinary` and `next-cloudinary` are present in `package.json`, but the current upload code uses Supabase Storage. Confirm that they are no longer needed before removing them.

## 3. Repository structure

The repository root is the directory containing `package.json` (currently `CleanNest/CleanNest` in the checked-out workspace).

```text
.
├── docs/
│   ├── DEVELOPER_HANDOVER.md       # This document
│   └── email-deliverability.md     # SMTP/domain deliverability notes
├── public/images/                  # Static marketing images
├── scripts/
│   ├── seed.ts                     # Legacy catalog seed + admin seed (see known issues)
│   └── seedCatalog.ts              # Idempotent service/add-on catalog seed
├── src/
│   ├── app/
│   │   ├── (public)/               # Public pages; group name is omitted from URLs
│   │   ├── (auth)/                 # Login, signup, verification, password recovery
│   │   ├── (customer)/             # Customer portal at unprefixed URLs
│   │   ├── (cleaner)/              # Older/alternate cleaner route-group pages
│   │   ├── admin/                  # Admin UI at /admin/*
│   │   ├── cleaner/                # Active cleaner UI at /cleaner/*
│   │   └── api/                    # Next.js route handlers
│   ├── components/                 # Feature and shared React components
│   ├── config/                     # UI/navigation configuration
│   ├── constants/                  # Static application data
│   ├── hooks/                      # Client-side feature hooks
│   ├── lib/                        # Infrastructure and cross-cutting helpers
│   ├── models/                     # Mongoose schemas and indexes
│   ├── services/                   # Business logic and database access
│   ├── store/                      # Client booking-wizard state
│   ├── types/                      # Shared domain and API types
│   └── validators/                 # Zod input schemas
├── middleware.ts                   # Presence-only protected-page redirect
├── next.config.js                  # Next.js and remote image configuration
├── vercel.json                     # Scheduled booking reconciliation
└── package.json                    # Dependencies and lifecycle scripts
```

Important architectural files:

- `src/lib/db.ts`: cached Mongoose connection suitable for Next.js/serverless reuse.
- `src/lib/auth.ts`: JWT creation/verification, session cookie, current-user loading, and role guards.
- `src/lib/rbac.ts`: a second role-guard wrapper used by payment routes.
- `src/lib/pricing.ts` and `src/services/bookingPriceService.ts`: trusted server-side price calculation.
- `src/lib/bookingScheduleRules.ts` and `src/services/bookingAvailabilityService.ts`: scheduling constraints and capacity checks.
- `src/lib/stripe.ts`: singleton Stripe server client.
- `src/lib/supabase.ts`: storage buckets and upload helpers.
- `src/lib/email.ts`: SMTP transport and transactional email construction.
- `src/services/*`: the main place for workflows; route handlers should remain thin.
- `src/validators/*`: API input contracts.

## 4. Setup and installation

### Prerequisites

- Node.js 20 or a compatible current LTS release.
- npm (the project currently records `npm@11.13.0`).
- A MongoDB Atlas database, or another reachable MongoDB deployment.
- Optional for full functionality: SMTP credentials, Stripe test credentials, and a Supabase project.

### Local setup

1. Change to the directory containing `package.json`.
2. Install the lockfile exactly:

   ```bash
   npm ci
   ```

3. Create the local environment file:

   ```powershell
   Copy-Item .env.local.example .env.local
   ```

4. Fill in at least `MONGODB_URI` and `AUTH_SECRET`.
5. Seed the service/add-on catalog:

   ```bash
   npm run seed:catalog
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000`.

When `EMAIL_SERVER` is blank, email content (including development OTP codes) is written to the server console instead of being sent. Upload and card-payment features still require their external services.

### Initial admin account

The intended admin seed uses `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, with a minimum password length of eight characters. However, `scripts/seed.ts` currently combines the legacy service seed and admin seed in one file and starts both workflows. Do not rely on `npm run seed` in a shared or production database until that script is separated; see **Known issues**.

## 5. Environment and configuration

Never expose server-only values through `NEXT_PUBLIC_*`, commit `.env.local`, or use production Stripe/Supabase secrets in client components.

| Variable | Required | Purpose/default |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `AUTH_SECRET` | Yes | Secret used to sign session JWTs. Use a long random value. |
| `AUTH_TOKEN_EXPIRES_IN` | No | JWT lifetime; defaults to `7d`. |
| `APP_URL` | Recommended | Absolute public app URL used in email and Stripe redirects; defaults to `http://localhost:3000`. |
| `EMAIL_SERVER` | Production email | Nodemailer SMTP URL. Without it, messages are logged. |
| `EMAIL_FROM` | Production email | Authenticated From identity. |
| `EMAIL_REPLY_TO` | No | Default reply-to address. |
| `EMAIL_RETURN_PATH` | No | SMTP envelope/bounce address. |
| `EMAIL_MESSAGE_DOMAIN` | No | Domain used in generated message IDs. |
| `EMAIL_DKIM_DOMAIN` | No | DKIM signing domain when signing in-app. |
| `EMAIL_DKIM_SELECTOR` | No | DKIM selector. |
| `EMAIL_DKIM_PRIVATE_KEY` | No | DKIM PEM key; escaped newlines are supported. |
| `STRIPE_SECRET_KEY` | Card payments | Stripe secret key; use test mode locally. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | Verifies `/api/webhooks/stripe` signatures. |
| `SUPABASE_URL` | Uploads | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Uploads | Server-only service-role key. |
| `SUPABASE_AVATAR_BUCKET` | No | Avatar bucket; default `avatars`. |
| `SUPABASE_REVIEW_BUCKET` | No | Review image bucket; default `review-images`. |
| `SUPABASE_SERVICE_IMAGE_BUCKET` | No | Service cover bucket; default `service-images`. |
| `SUPABASE_PROOF_BUCKET` | No | Proof image bucket; defaults to the review bucket. |
| `BUSINESS_TIME_ZONE` | No | Scheduler time zone; default `Asia/Beirut`. |
| `CLEANNEST_MAX_SIMULTANEOUS_BOOKINGS` | No | Global scheduling-capacity fallback. Per-area capacity is also stored in `ServiceArea`. |
| `CRON_SECRET` | Scheduled jobs | Bearer secret accepted by internal cron routes. Vercel also supplies its configured cron authorization. |
| `ENABLE_DEMO_CHECK_IN` | No | Server-side cleaner location bypass; keep `false` in production. |
| `NEXT_PUBLIC_ENABLE_DEMO_CHECK_IN` | No | Matching client-visible demo switch; keep `false` in production. |
| `ADMIN_NAME` | Admin seed only | Name of the first seeded admin. |
| `ADMIN_EMAIL` | Admin seed only | Email of the first seeded admin. |
| `ADMIN_PASSWORD` | Admin seed only | Password of the first seeded admin. |

The checked-in `.env.local.example` omits `CLEANNEST_MAX_SIMULTANEOUS_BOOKINGS` and the three `ADMIN_*` variables. Add them there when the seed script is repaired.

Supabase buckets are made public by some upload helpers and allow JPEG, PNG, and WebP files up to 5 MB. Public URLs are persisted in MongoDB. Treat this public visibility as a product/privacy decision, especially for service-proof photos.

## 6. Database structure

Mongoose generates collection names from the model names (normally lowercase plural form). Relationships below are logical ObjectId references; MongoDB does not enforce foreign keys.

### Identity and customer data

| Model | Purpose and key fields |
| --- | --- |
| `User` | Identity, password hash, role (`customer`, `cleaner`, `admin`), account status, profile data, email-verification OTP hash/expiry, and reset OTP hash/expiry. Email is unique. |
| `Address` | Customer-owned address, label/contact/location fields, service-area relation, access instructions, and default flag. |
| `Notification` | User notification payload, type/channel, read/sent state, scheduling and delivery attempts. |
| `NotificationPreference` | Per-user email/in-app preferences and reminder choices. |
| `ContactMessage` | Public enquiries and admin handling status. |

### Catalog and coverage

| Model | Purpose and key fields |
| --- | --- |
| `Service` | Service name/slug, descriptions, category, base price, duration, features, image, and active state. Slug is unique. |
| `AddOn` | Reusable optional extra with price, added duration, quantity limit, and active state. |
| `ServiceAddon` | Many-to-many link from service to add-on, with price/duration/quantity overrides and ordering. |
| `ServiceArea` | City/area/postal code, service fee, concurrent-booking capacity, and active state. City + area is unique case-insensitively. |
| `Settings` | Singleton-like business configuration used by admin settings and booking rules. |

### Booking and operations

| Model | Purpose and key fields |
| --- | --- |
| `Booking` | Booking number; customer/service/address/area; schedule; property data; immutable pricing snapshot; payment data; status; notes; cancellation and reschedule metadata. |
| `BookingAddOn` | Snapshot of each selected add-on, quantity, unit price, duration, and total for a booking. |
| `BookingStatusHistory` | Append-only booking status audit trail. |
| `BookingRescheduleHistory` | Previous/new schedule, actor, reason, and source. |
| `BookingCleanerAssignmentHistory` | Older name-only cleaner assignment audit trail. |
| `CleanerAssignment` | Account-based relationship between a booking and cleaner, with assignment status and operational timestamps. |
| `CleanerAvailability` | Weekly availability windows for cleaner accounts. |
| `BlockedTime` | Cleaner-specific unavailable time ranges. |
| `ServiceProof` | Per-assignment checklist, before/after photos, issues, travel/check-in/out timestamps, and optional check-in coordinates. |

### Commercial data

| Model | Purpose and key fields |
| --- | --- |
| `Payment` | One or more booking payment records: USD amount, cash/card method, provider (`cash`, `test_card`, `stripe`), state, Stripe identifiers, failure/refund metadata, and timestamps. |
| `PromoCode` | Code, discount type/value, applicability constraints, date window, usage limits, and active state. |
| `PromoCodeUsage` | Customer/code/booking redemption audit used to enforce limits. |
| `Review` | Customer review tied to a completed booking/service, rating, text, moderation state, and before/after image URLs. |

The authoritative schema details, validation hooks, and compound indexes are in `src/models`. Important invariants include:

- Booking totals are recalculated server-side from base amount + add-ons + service-area fee - discount.
- End time must be later than start time; duration is derived.
- Booking number and catalog slugs are unique.
- Status, reschedule, promo-use, and assignment history are separate audit records.
- Payment currency is currently fixed to USD.

There are two overlapping cleaner representations: legacy `assignedCleanerName`/`BookingCleanerAssignmentHistory` and newer `CleanerAssignment` records linked to cleaner `User` accounts. New work should use the account-based path unless intentionally maintaining compatibility.

## 7. Main features and workflows

### Registration and email verification

1. A customer or cleaner submits `/api/auth/register`.
2. The password is hashed with bcrypt (12 rounds).
3. A `pending_verification` user and hashed OTP/expiry are stored.
4. The raw OTP is emailed, or logged locally without SMTP.
5. `/api/auth/verify-email` validates it, activates the account, creates a JWT, and sets the session cookie.
6. Login rejects invalid, suspended, or unverified accounts.

Forgot-password and reset-password use a separate hashed OTP. Resend requests have cooldown/expiry logic in `src/lib/otp.ts` and `src/services/authService.ts`.

### Customer booking

1. The customer retrieves active services/add-ons and saved addresses.
2. Availability is checked against business rules, service duration/add-ons, service-area capacity, existing bookings, cleaner availability, and blocked time.
3. Price-preview endpoints call trusted server logic; the browser's total is never authoritative.
4. Create revalidates the inputs, availability, promo code, and price, then writes the booking, add-on snapshots, initial status history, promo usage, payment record, and notifications.
5. Customer dashboard/history routes return customer-owned records only.
6. Reschedule/cancel operations enforce status/time rules and append history.

### Payment

- Cash bookings retain a cash payment record and can be marked paid by an admin after service.
- Card checkout creates/reuses a Stripe Checkout Session and redirects to Stripe.
- The success page can verify a session, but `/api/webhooks/stripe` is the durable source for asynchronous Stripe state changes.
- Admins can inspect, mark failed, mark cash paid, and refund eligible payments.
- Payment services synchronize both the `Payment` record and booking payment status.

Use the Stripe CLI locally to forward webhook events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Put the emitted `whsec_...` value in `STRIPE_WEBHOOK_SECRET`.

### Cleaner operations

Admins create cleaner users and assign them to bookings through `CleanerAssignment`. A cleaner can:

- Maintain weekly availability.
- View today's/upcoming assigned jobs.
- Accept/decline or progress permitted job actions.
- Mark on-my-way, check in/out, complete checklist items, upload before/after images, and report issues.

Location checking can be bypassed only with the two explicit demo environment switches. Never enable that bypass in production.

### Reviews and proof reports

Customers can review eligible completed bookings and upload before/after images. Admins can moderate reviews. Cleaner service proof is visible through cleaner routes and an authorized proof-report endpoint; ownership/role checks are performed server-side.

### Notifications and automation

Domain services queue in-app/email notifications. `/api/internal/notifications/process` processes due notification work. `/api/internal/bookings/reconcile` advances or reconciles time-driven booking state. Both require cron authorization.

`vercel.json` currently schedules booking reconciliation every five minutes, but does **not** schedule notification processing.

## 8. API routes

All routes are under `/api`. Inputs are generally validated with Zod and errors are normalized through `apiError`/`apiResponse` helpers.

### Public and authentication

| Methods and route | Responsibility |
| --- | --- |
| `GET /services`, `GET /services/[slug]` | Public active service catalog and details. |
| `GET /reviews`, `GET /reviews/[id]` | Public/paginated approved review data and details. |
| `POST /contact` | Store a public contact enquiry. |
| `POST /auth/register` | Create a pending customer/cleaner and send verification OTP. |
| `POST /auth/verify-email`, `POST /auth/resend-otp` | Verify or resend account OTP. |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Start, end, or inspect the cookie session. |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | Password-reset OTP flow. |
| `POST /webhooks/stripe` | Verify Stripe signature and apply payment events. |

### Shared authenticated routes

| Methods and route | Responsibility |
| --- | --- |
| `GET, PUT /profile`; `PUT /profile/password`; `POST /profile/avatar` | Profile, password, and avatar management. |
| `GET, POST /addresses`; `PATCH, DELETE /addresses/[id]`; `PATCH /addresses/[id]/default` | User-owned address CRUD/default selection. |
| `GET /notifications`; `PATCH /notifications/[id]/read`; `POST /notifications/read-all`; `GET, PUT /notifications/preferences` | Notification inbox and preferences. |
| `POST /promo-codes/validate` | Validate a code for the authenticated booking context. |
| `POST /reviews`; `PATCH, DELETE /reviews/[id]`; `POST /reviews/upload-image` | Customer review creation/ownership updates; admin moderation is also handled by the item route. |
| `GET /proof-reports/[bookingId]` | Authorized service-proof report data. |

### Customer routes

| Methods and route | Responsibility |
| --- | --- |
| `GET /customer`, `GET /customer/dashboard` | Current customer summary/dashboard. |
| `GET /customer/services`, `GET /customer/services/[serviceId]/add-ons` | Booking-ready catalog. |
| `GET /customer/booking-addresses` | Saved address choices with service-area data. |
| `GET /customer/bookings`, `POST /customer/bookings/create` | List owned bookings and create one. |
| `POST /customer/bookings/availability` | Validate a proposed time slot. |
| `POST /customer/bookings/price-preview`, `POST /customer/bookings/price-preview/batch` | Trusted single/batch price estimates. |
| `PATCH /customer/bookings/[bookingId]` | Edit allowed fields on an owned booking. |
| `POST /customer/bookings/[bookingId]/cancel`, `POST /customer/bookings/[bookingId]/reschedule` | Customer cancellation/rescheduling. |
| `GET /customer/payments`, `GET /customer/payments/[paymentId]`, `GET /customer/payments/booking/[bookingId]` | Owned payment history/detail. |
| `POST /customer/payments/booking/[bookingId]/checkout` | Create Stripe Checkout. |
| `POST /customer/payments/booking/[bookingId]/pay` | Test/direct payment flow used by the application. |
| `GET /customer/payments/verify` | Verify a returned Stripe Checkout session. |

### Cleaner routes

| Methods and route | Responsibility |
| --- | --- |
| `GET, PUT /cleaner/availability` | Read/update the current cleaner's weekly availability. |
| `GET /cleaner/jobs`, `GET /cleaner/jobs/[id]` | Assigned job list/detail. |
| `PATCH /cleaner/jobs/[id]/action` | Apply allowed assignment/job lifecycle actions. |
| `GET, PATCH /cleaner/jobs/[id]/proof` | Read/update checklist, issues, and proof state. |
| `POST /cleaner/jobs/[id]/proof/upload` | Upload a before/after proof image. |

### Admin routes

| Route group | Methods and responsibility |
| --- | --- |
| `/admin/dashboard` | `GET` KPI/dashboard data. |
| `/admin/users`, `/admin/users/[id]`, `/admin/users/[id]/block` | List/detail/delete/block general users. |
| `/admin/customers`, `/admin/customers/[id]`, `/admin/customers/[id]/block` | Customer CRUD and suspension. |
| `/admin/cleaners`, `/admin/cleaners/[id]`, `/admin/cleaners/[id]/block` | Cleaner CRUD and suspension. |
| `/admin/services`, `/admin/services/[id]`, `/admin/services/[id]/image` | Catalog CRUD and cover-image upload/removal. |
| `/admin/bookings`, `/admin/bookings/options`, `/admin/bookings/[id]` | Booking queue, form options, creation, and detail. |
| `/admin/bookings/[id]/status` | Change status and append audit history. |
| `/admin/bookings/[id]/assign-cleaner` | New account-based cleaner assignment. |
| `/admin/bookings/[id]/assign` | Legacy name-based assignment compatibility endpoint. |
| `/admin/payments`, `/admin/payments/[id]` | Payment list/detail. |
| `/admin/payments/[id]/mark-cash-paid`, `/fail`, `/refund` | Admin payment transitions. |
| `/admin/promo-codes`, `/admin/promo-codes/[id]` | Promo-code CRUD. |
| `/admin/settings` | `GET/PATCH` business settings. |
| `/admin/reports/bookings`, `/revenue`, `/popular-services`, `/export` | Reporting datasets and document export. |
| `/admin/dev/seed-addons` | Admin-only development data mutation; disable/remove in production. |

### Internal and compatibility routes

| Methods and route | Responsibility |
| --- | --- |
| `GET /internal/bookings/reconcile` | Cron-protected booking status reconciliation. |
| `GET /internal/notifications/process` | Cron-protected queued notification processing. |
| `GET /bookings` | Legacy health-like placeholder returning `{ "message": "OK" }`; it does not list bookings. |
| `/bookings/availability`, `/bookings/calculate-price`, `/bookings/cancel`, `/bookings/id`, `/bookings/reschedule` | Handler-less legacy placeholders. Use `/customer/bookings/*`. |
| `/services/id`, `/promo-codes` | Handler-less placeholders. Use `/services/[slug]` and authenticated `/promo-codes/validate`. |

## 9. Authentication and authorization

- The cookie name is `cleannest_token`.
- It is HTTP-only, `SameSite=Lax`, path `/`, secure in production, and currently has a fixed seven-day max age.
- The JWT contains user ID (`sub`) and role, is signed with `AUTH_SECRET`, and defaults to a seven-day expiry.
- Every authenticated request reloads the user and rejects missing, invalid, deleted, non-active, or unauthorized users.
- `requireUser()` provides authentication; `requireRole(...)`/`requireAdmin()` provide API RBAC.
- `middleware.ts` checks only whether the cookie exists and redirects unauthenticated page requests to login. It does not verify JWTs or roles and is a UX layer, not a security boundary.
- API routes return JSON 401/403 responses rather than middleware redirects.
- Customer and cleaner services must additionally scope queried resources by the current user/assignment; role checks alone do not prove record ownership.
- Public signup permits customer and cleaner roles. Admin creation is intentionally outside public registration.

The UI also contains client-side auth guards/layout redirects, but server-side route/service checks are authoritative.

## 10. Important implementation decisions

- **Server-owned pricing:** all persisted money values are calculated from database catalog/area/promo data and saved as snapshots. Never trust client totals.
- **Service layer:** route handlers parse/authenticate and delegate to services. Put multi-document workflow logic in `src/services`, not React components.
- **Audit records:** status, reschedule, assignment, payment, and promo-use history are explicit records rather than inferred from current state.
- **Serverless database cache:** `connectDB()` caches the Mongoose connection/promise on `globalThis`.
- **Storage separation:** binary files live in Supabase; MongoDB stores metadata/public URLs.
- **Soft business deactivation:** services/areas/add-ons and users use active/status fields where historical references must remain valid.
- **Central validation:** Zod validators handle request payloads; Mongoose hooks enforce persistence invariants.
- **Time zone:** automated booking decisions use `BUSINESS_TIME_ZONE`, not the server machine's local zone.
- **Route groups:** parentheses organize layouts without changing URLs. The customer group therefore serves `/dashboard`, `/bookings`, etc.; active cleaner/admin paths use real URL prefixes.

Multi-document booking/payment workflows do not appear to use MongoDB transactions consistently. If the deployment uses a replica set (Atlas does), transactions would reduce partial-write risk in creation, promo redemption, status history, assignment, and payment synchronization.

## 11. Running, quality checks, and testing

Available scripts:

```bash
npm run dev
npm run dev:turbo
npm run build
npm run start
npm run lint
npm run format
npm run seed:catalog
npm run seed
```

Recommended pre-commit validation:

```bash
npx tsc --noEmit
npm run build
```

Validation performed on 2026-07-27:

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings/errors; Next.js reports that `next lint` is deprecated.
- `npm run build`: passed and generated 96 static pages plus the dynamic route handlers.

There is currently no automated unit/integration/end-to-end test suite or `test` script. Until one is added, manually smoke-test:

1. Register, capture the OTP from SMTP/server output, verify, log out, and log in.
2. Create and default an address in an active service area.
3. Preview availability/price and create cash and card bookings.
4. Complete Stripe Checkout and confirm both success-return and webhook state.
5. Reschedule/cancel and verify history and notifications.
6. Assign an account-based cleaner, progress a job, and upload service proof.
7. Complete a booking and submit/moderate a review.
8. Exercise admin filters, payment actions, reports, promo codes, and settings.
9. Call internal routes with and without valid cron authorization.

Use a disposable database and Stripe test mode for development/testing.

## 12. Deployment

### Vercel

1. Import the repository and set the project root to the directory containing `package.json`.
2. Configure all required environment variables separately for Preview and Production.
3. Set `APP_URL` to the deployed canonical HTTPS origin.
4. Use MongoDB Atlas network access suitable for Vercel's runtime.
5. Create Supabase buckets/permissions and test public upload URLs.
6. Create a Stripe webhook targeting:

   ```text
   https://your-domain.example/api/webhooks/stripe
   ```

7. Subscribe it to the Checkout/payment/refund events handled in `src/app/api/webhooks/stripe/route.ts`, then set its signing secret.
8. Configure `CRON_SECRET`. `vercel.json` deploys the five-minute booking reconciliation schedule.
9. Add a schedule for `/api/internal/notifications/process` if queued notifications should be delivered automatically.
10. Run `npm run build` before promotion and smoke-test with production-like external-service test credentials.

The build output is started with `npm run start` on a traditional Node host. Such a host must independently schedule the two internal GET routes and send the expected bearer authorization.

## 13. Known issues and future improvements

Prioritized maintenance items:

1. **Split `scripts/seed.ts`.** It contains a legacy service seed and first-admin seed in the same module, starts both asynchronously, and shares/disconnects the same Mongoose connection. Keep catalog work in `seedCatalog.ts` and create a dedicated `seedAdmin.ts`.
2. **Consolidate cleaner architecture.** Remove or migrate legacy `assignedCleanerName`, name-only assignment history, `/admin/bookings/[id]/assign`, and stale comments once all consumers use cleaner accounts and `CleanerAssignment`.
3. **Resolve duplicate cleaner page trees.** `src/app/(cleaner)` produces unprefixed URLs such as `/today`, while `src/app/cleaner` produces `/cleaner/today`. Confirm the intended tree and remove the other.
4. **Add automated tests.** Prioritize pricing, capacity/overlap, booking creation rollback, authorization/ownership, status transitions, promo limits, Stripe idempotency, and cron behavior.
5. **Modernize linting before Next.js 16.** It currently passes, but Next.js 15 reports `next lint` as deprecated and states that it will be removed in Next.js 16. Migrate to the ESLint CLI.
6. **Make multi-document workflows atomic.** Use Mongoose sessions/transactions or robust compensating/idempotent operations.
7. **Schedule notification processing.** Only booking reconciliation is present in `vercel.json`.
8. **Align session lifetimes.** JWT expiry is configurable, but cookie max age is hard-coded to seven days.
9. **Unify RBAC helpers.** `src/lib/auth.ts` and `src/lib/rbac.ts` both define role guards, while several admin routes define local wrappers.
10. **Fix type/schema drift.** The shared `Gender` type exposes only `male | female`, while the Mongoose schema also accepts `other | prefer_not_to_say`.
11. **Review public proof-image privacy.** Proof and review storage can be public; consider private buckets and signed URLs.
12. **Remove development mutation endpoints from production.** `/api/admin/dev/seed-addons` should be development-gated or removed.
13. **Audit legacy dependencies/routes.** Confirm Cloudinary packages and compatibility `/api/bookings` are unused before removal.
14. **Add observability and recovery.** Structured logs, error monitoring, job metrics, Stripe webhook replay visibility, and notification dead-letter handling are not documented/implemented as a complete operational system.
15. **Document data migrations/backups.** There is no formal migration runner, schema-versioning strategy, or restore procedure. Add these before substantial production data accumulates.

## 14. Handover checklist for the next developer

- Read this file, `README.md`, and `docs/email-deliverability.md`.
- Create a fresh local environment and run the verified validation commands.
- Use `seed:catalog`; repair the admin seed before using `seed`.
- Trace route -> validator -> service -> model for any feature change.
- Preserve server-side authorization, ownership checks, pricing, availability, and audit writes.
- Use account-based cleaner assignments for new work.
- Test external integrations in SMTP sandbox/test mode, Stripe test mode, and non-production Supabase/MongoDB projects.
- Update this document whenever routes, models, environment variables, deployment jobs, or major workflows change.
