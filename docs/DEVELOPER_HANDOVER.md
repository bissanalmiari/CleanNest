CleanNest

<p align="center">
  <strong>A full-stack cleaning-services marketplace and operations platform built with Next.js.</strong>
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?logo=next.js">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss">
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe">
</p>

Overview

CleanNest is a production-oriented platform for managing cleaning services from discovery through fulfillment.

It combines:

A public marketing and service-discovery website

Customer registration, profile management, saved addresses, bookings, payments, reviews, and notifications

Cleaner availability, assignments, check-in/check-out, proof-of-service, issue reporting, and job progress

Admin tools for users, services, bookings, cleaner assignments, payments, promo codes, reports, settings, and customer enquiries

Background reconciliation for time-driven booking statuses and queued notifications

The browser application and server-side API are implemented in a single Next.js App Router repository.

Table of Contents

Key Features

Technology Stack

Architecture

Repository Structure

Getting Started

Environment Variables

Available Scripts

Core Workflows

Database Models

API Overview

Authentication and Authorization

Testing and Quality Checks

Deployment

Security Notes

Known Issues and Roadmap

Developer Handover Checklist

Key Features

Public Experience

Service discovery and service details

Approved customer reviews

Marketing content and contact enquiries

Registration, email verification, login, and password recovery

Customer Portal

Profile and avatar management

Saved-address management with a default address

Service and add-on selection

Trusted server-side price previews

Availability checks and capacity validation

Booking creation, rescheduling, editing, and cancellation

Cash and card payment flows

Booking history, payment history, reviews, and notifications

Cleaner Portal

Weekly availability management

Assigned-job dashboard

Job acceptance and lifecycle actions

On-the-way, check-in, check-out, and completion actions

Checklist and proof-of-service management

Before/after image uploads

Issue reporting and optional location verification

Admin Portal

Customer, cleaner, and general-user management

Service catalog and service-image management

Booking queue, booking details, assignments, and status changes

Payment review, cash settlement, failure handling, and refunds

Promo-code management

Contact-message inbox and workflow

Business settings and operational reports

Development-only catalog helpers

Automation

Booking-status reconciliation

Queued notification processing

Vercel Cron compatibility

Stripe webhook processing

Technology Stack

Area

Technology

Framework

Next.js 15 App Router

Frontend

React 19, TypeScript

Styling

Tailwind CSS 3, Motion, Lucide icons

UI utilities

CVA, clsx, tailwind-merge

Forms

React Hook Form

Validation

Zod, @hookform/resolvers

Database

MongoDB Atlas

ODM

Mongoose

Authentication

Custom JWT session in an HTTP-only cookie

Password hashing

bcryptjs

Email

Nodemailer over SMTP

Payments

Stripe Checkout and Stripe webhooks

File storage

Supabase Storage

Reports

Server-generated DOCX files with docx

Deployment

Vercel-compatible

Package manager

npm

Seed tooling

tsx

cloudinary and next-cloudinary are currently present in package.json, while active upload flows use Supabase Storage. Confirm they are unused before removing them.

Architecture

flowchart LR
    Browser[Next.js React UI]
    Routes[App Router API Handlers]
    Validators[Zod Validators]
    Services[Domain Services]
    Models[Mongoose Models]
    Mongo[(MongoDB Atlas)]
    Stripe[Stripe]
    Supabase[Supabase Storage]
    SMTP[SMTP / Nodemailer]
    Cron[Vercel Cron]

    Browser --> Routes
    Routes --> Validators
    Routes --> Services
    Services --> Models
    Models --> Mongo
    Services --> Stripe
    Services --> Supabase
    Services --> SMTP
    Cron --> Routes

Architectural Principles

Thin route handlers: authenticate, validate, and delegate.

Service-layer workflows: multi-step business operations belong in src/services.

Server-owned pricing: browser totals are never authoritative.

Central validation: Zod defines API contracts; Mongoose protects persistence invariants.

Explicit audit records: status, reschedule, assignment, payment, and promo histories are stored separately.

Ownership checks: authenticated users can access only their own customer or cleaner records.

Serverless-ready database reuse: the Mongoose connection is cached on globalThis.

External file storage: MongoDB stores metadata and URLs, not binary uploads.

Repository Structure

.
├── docs/
│   ├── DEVELOPER_HANDOVER.md
│   └── email-deliverability.md
├── public/
│   └── images/
├── scripts/
│   ├── seed.ts
│   └── seedCatalog.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   ├── (cleaner)/
│   │   ├── admin/
│   │   ├── cleaner/
│   │   └── api/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── models/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── validators/
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── package.json

Important Files

File

Responsibility

src/lib/db.ts

Cached Mongoose connection

src/lib/auth.ts

JWT, session cookie, current-user loading, and role guards

src/lib/rbac.ts

Additional role-guard helpers used by selected routes

src/lib/pricing.ts

Shared pricing utilities

src/services/bookingPriceService.ts

Trusted booking-price calculation

src/lib/bookingScheduleRules.ts

Scheduling rules

src/services/bookingAvailabilityService.ts

Capacity, overlap, blocked-time, and availability checks

src/lib/stripe.ts

Stripe server client

src/lib/supabase.ts

Upload buckets and storage helpers

src/lib/email.ts

SMTP transport and transactional email generation

src/services/*

Business workflows and database access

src/validators/*

Zod request contracts

src/models/*

Mongoose schemas, hooks, and indexes

Getting Started

Prerequisites

Node.js 20 or a compatible current LTS release

npm

MongoDB Atlas or another reachable MongoDB deployment

Optional for complete functionality:

SMTP credentials

Stripe test credentials

Supabase project and storage buckets

Stripe CLI for local webhook testing

Installation

Clone the repository and enter the directory containing package.json.

git clone <repository-url>
cd CleanNest

Install the exact lockfile dependencies.

npm ci

Create the local environment file.

PowerShell

Copy-Item .env.local.example .env.local

macOS/Linux

cp .env.local.example .env.local

Configure at least:

MONGODB_URI=
AUTH_SECRET=

Seed the service and add-on catalog.

npm run seed:catalog

Start the development server.

npm run dev

Open:

http://localhost:3000

Faster Dependency Installation

When package-lock.json is present:

npm ci --prefer-offline --no-audit --no-fund

When peer-dependency resolution blocks installation:

npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund

Local Email Behavior

When EMAIL_SERVER is blank, email content is written to the server console instead of being sent. This includes development OTP codes.

Stripe and Supabase features still require their respective external services.

Environment Variables

Never commit .env.local, expose server-only secrets through NEXT_PUBLIC_*, or use production credentials in local development.

Required

Variable

Purpose

MONGODB_URI

MongoDB connection string

AUTH_SECRET

Secret used to sign session JWTs

Application and Authentication

Variable

Required

Default / Purpose

AUTH_TOKEN_EXPIRES_IN

No

JWT lifetime; defaults to 7d

APP_URL

Recommended

Public application URL; defaults to http://localhost:3000

BUSINESS_TIME_ZONE

No

Booking time zone; defaults to Asia/Beirut

CLEANNEST_MAX_SIMULTANEOUS_BOOKINGS

No

Global capacity fallback

CRON_SECRET

Scheduled jobs

Bearer secret for internal cron routes

Email

Variable

Required

Purpose

EMAIL_SERVER

Production email

Nodemailer SMTP URL

EMAIL_FROM

Production email

Authenticated sender identity

EMAIL_REPLY_TO

No

Default reply-to address

CONTACT_EMAIL

No

Public contact-form inbox

EMAIL_RETURN_PATH

No

SMTP envelope and bounce address

EMAIL_MESSAGE_DOMAIN

No

Domain used in generated message IDs

EMAIL_DKIM_DOMAIN

No

DKIM signing domain

EMAIL_DKIM_SELECTOR

No

DKIM selector

EMAIL_DKIM_PRIVATE_KEY

No

DKIM private key

Stripe

Variable

Required

Purpose

STRIPE_SECRET_KEY

Card payments

Stripe server key

STRIPE_WEBHOOK_SECRET

Webhooks

Verifies Stripe webhook signatures

Supabase Storage

Variable

Required

Purpose

SUPABASE_URL

Uploads

Supabase project URL

SUPABASE_SERVICE_ROLE_KEY

Uploads

Server-only service-role key

SUPABASE_AVATAR_BUCKET

No

Avatar bucket; defaults to avatars

SUPABASE_REVIEW_BUCKET

No

Review-image bucket; defaults to review-images

SUPABASE_SERVICE_IMAGE_BUCKET

No

Service-image bucket; defaults to service-images

SUPABASE_PROOF_BUCKET

No

Proof-image bucket

Cleaner Demo Mode

Variable

Required

Purpose

ENABLE_DEMO_CHECK_IN

No

Server-side location bypass

NEXT_PUBLIC_ENABLE_DEMO_CHECK_IN

No

Matching client-visible demo flag

Keep both values disabled in production.

Initial Admin Seed

Variable

Required

Purpose

ADMIN_NAME

Admin seed

Initial administrator name

ADMIN_EMAIL

Admin seed

Initial administrator email

ADMIN_PASSWORD

Admin seed

Initial administrator password

The current .env.local.example should be updated to include CLEANNEST_MAX_SIMULTANEOUS_BOOKINGS and the three ADMIN_* variables.

Available Scripts

npm run dev
npm run dev:turbo
npm run build
npm run start
npm run lint
npm run format
npm run seed:catalog
npm run seed

Recommended Validation

npx tsc --noEmit
npm run build

Core Workflows

Registration and Email Verification

A customer or cleaner submits /api/auth/register.

The password is hashed with bcrypt.

A pending_verification user is stored with a hashed OTP and expiry.

The raw OTP is sent through SMTP or logged locally.

/api/auth/verify-email validates the OTP and activates the account.

A JWT is created and stored in the session cookie.

Login rejects invalid, suspended, or unverified accounts.

Forgot-password and reset-password use a separate OTP flow.

Customer Booking

The customer loads active services, add-ons, and saved addresses.

The server calculates a trusted price preview.

Availability is checked against:

Business scheduling rules

Service and add-on duration

Service-area capacity

Existing bookings

Cleaner availability

Blocked periods

Booking creation revalidates all inputs, pricing, availability, and promo-code rules.

The server writes:

Booking

Add-on snapshots

Initial status history

Promo-code usage

Payment record

Notifications

Rescheduling and cancellation enforce status and time restrictions and append audit history.

Payment

Cash bookings create a cash payment record.

Card checkout creates or reuses a Stripe Checkout Session.

Stripe webhooks are the durable source of asynchronous payment state changes.

Admins can mark cash payments as paid, mark failures, and refund eligible payments.

Payment services synchronize both payment and booking payment status.

Local webhook forwarding:

stripe listen --forward-to localhost:3000/api/webhooks/stripe

Store the emitted whsec_... value in:

STRIPE_WEBHOOK_SECRET=

Cleaner Operations

A cleaner can:

Maintain weekly availability

View assigned jobs

Accept or decline supported assignments

Mark on-the-way

Check in and check out

Complete proof checklists

Upload before/after images

Report issues

Complete permitted job actions

Reviews and Proof

Customers can review eligible completed bookings.

Review images are uploaded to Supabase Storage.

Admins can moderate reviews.

Cleaner service-proof data is protected by server-side ownership and role checks.

Notifications and Cron Jobs

Internal routes:

GET /api/internal/bookings/reconcile
GET /api/internal/notifications/process

Both routes require cron authorization.

vercel.json currently schedules booking reconciliation. Notification processing must be scheduled separately.

Database Models

Identity and Customer Data

Model

Purpose

User

Authentication, role, status, profile, OTPs, and password-reset data

Address

Customer-owned saved locations and default-address state

Notification

In-app and email notification queue

NotificationPreference

User delivery preferences

ContactMessage

Public customer enquiries

Catalog and Coverage

Model

Purpose

Service

Cleaning-service catalog

AddOn

Reusable optional extras

ServiceAddon

Service-to-add-on relationship and overrides

ServiceArea

Geographic coverage, fee, and capacity

Settings

Business-wide configuration

Booking and Operations

Model

Purpose

Booking

Customer booking, schedule, pricing snapshot, payment state, and lifecycle

BookingAddOn

Selected add-on snapshots

BookingStatusHistory

Status audit trail

BookingRescheduleHistory

Schedule-change audit trail

BookingCleanerAssignmentHistory

Legacy name-based assignment history

CleanerAssignment

Account-based cleaner assignment

CleanerAvailability

Cleaner weekly availability

BlockedTime

Unavailable time ranges

ServiceProof

Operational proof, photos, checklist, and issues

Commercial Data

Model

Purpose

Payment

Cash/card payment records and provider metadata

PromoCode

Discount rules and constraints

PromoCodeUsage

Redemption audit and usage-limit enforcement

Review

Booking-linked customer review and moderation state

Important Invariants

Booking prices are recalculated on the server.

Booking totals use:

base amount + add-ons + service-area fee - discount

End time must be later than start time.

Booking numbers and service slugs are unique.

Status, reschedule, assignment, payment, and promo histories are explicit records.

Payment currency is currently fixed to USD.

API Overview

All application routes are under /api.

Public and Authentication

Method

Route

Purpose

GET

/api/services

Public active service catalog

GET

/api/services/[slug]

Service details

GET

/api/reviews

Approved reviews

GET

/api/reviews/[id]

Review details

POST

/api/contact

Submit a public enquiry

POST

/api/auth/register

Create a pending account

POST

/api/auth/verify-email

Verify account OTP

POST

/api/auth/resend-otp

Resend verification OTP

POST

/api/auth/login

Start a session

POST

/api/auth/logout

End a session

GET

/api/auth/me

Inspect the current session

POST

/api/auth/forgot-password

Request password-reset OTP

POST

/api/auth/reset-password

Reset password

POST

/api/webhooks/stripe

Apply Stripe events

Shared Authenticated Routes

Method

Route

Purpose

GET, PUT

/api/profile

Profile management

PUT

/api/profile/password

Password change

POST

/api/profile/avatar

Avatar upload

GET, POST

/api/addresses

Address list and creation

PATCH, DELETE

/api/addresses/[id]

Address update and deletion

PATCH

/api/addresses/[id]/default

Set default address

GET

/api/notifications

Notification inbox

PATCH

/api/notifications/[id]/read

Mark one notification as read

POST

/api/notifications/read-all

Mark all as read

GET, PUT

/api/notifications/preferences

Notification preferences

POST

/api/promo-codes/validate

Validate a promo code

POST

/api/reviews

Create a review

PATCH, DELETE

/api/reviews/[id]

Update/delete owned review

POST

/api/reviews/upload-image

Upload review image

GET

/api/proof-reports/[bookingId]

Authorized proof report

Customer Routes

Method

Route

Purpose

GET

/api/customer

Current-customer summary

GET

/api/customer/dashboard

Customer dashboard

GET

/api/customer/services

Booking-ready services

GET

/api/customer/services/[serviceId]/add-ons

Service add-ons

GET

/api/customer/booking-addresses

Serviceable saved addresses

GET

/api/customer/bookings

Customer booking history

POST

/api/customer/bookings/create

Create a booking

POST

/api/customer/bookings/availability

Check a slot

POST

/api/customer/bookings/price-preview

Trusted price preview

POST

/api/customer/bookings/price-preview/batch

Batch price preview

PATCH

/api/customer/bookings/[bookingId]

Edit an owned booking

POST

/api/customer/bookings/[bookingId]/cancel

Cancel an owned booking

POST

/api/customer/bookings/[bookingId]/reschedule

Reschedule an owned booking

GET

/api/customer/payments

Payment history

GET

/api/customer/payments/[paymentId]

Payment details

GET

/api/customer/payments/booking/[bookingId]

Payment by booking

POST

/api/customer/payments/booking/[bookingId]/checkout

Create Stripe Checkout

POST

/api/customer/payments/booking/[bookingId]/pay

Direct/test payment flow

GET

/api/customer/payments/verify

Verify returned Checkout session

Cleaner Routes

Method

Route

Purpose

GET, PUT

/api/cleaner/availability

Weekly availability

GET

/api/cleaner/jobs

Assigned-job list

GET

/api/cleaner/jobs/[id]

Job details

PATCH

/api/cleaner/jobs/[id]/action

Apply lifecycle action

GET, PATCH

/api/cleaner/jobs/[id]/proof

Proof state

POST

/api/cleaner/jobs/[id]/proof/upload

Upload proof image

Admin Route Groups

Route Group

Responsibility

/api/admin/dashboard

KPIs and dashboard data

/api/admin/users

General-user management

/api/admin/customers

Customer management

/api/admin/cleaners

Cleaner management

/api/admin/services

Service catalog and images

/api/admin/bookings

Booking management and assignment

/api/admin/payments

Payment management

/api/admin/promo-codes

Promo-code management

/api/admin/contact-messages

Contact enquiry workflow

/api/admin/settings

Business configuration

/api/admin/reports

Reporting and document export

Internal Routes

Method

Route

Purpose

GET

/api/internal/bookings/reconcile

Time-driven booking reconciliation

GET

/api/internal/notifications/process

Process queued notifications

Authentication and Authorization

Session cookie: cleannest_token

Cookie properties:

HTTP-only

SameSite=Lax

Path /

Secure in production

JWT payload includes:

User ID in sub

User role

JWTs are signed with AUTH_SECRET.

Authenticated requests reload the user from the database.

Missing, invalid, deleted, inactive, or unauthorized accounts are rejected.

requireUser() authenticates.

requireRole(...) and requireAdmin() enforce role access.

Customer and cleaner services also enforce record ownership.

Middleware checks only for cookie presence and is not a security boundary.

API authorization is enforced server-side.

Route Groups

Parenthesized folders organize layouts but do not appear in URLs.

For example:

src/app/(customer)/bookings/page.tsx

is served at:

/bookings

not:

/customer/bookings

Testing and Quality Checks

Recommended before every merge:

npx tsc --noEmit
npm run build

Additional commands:

npm run lint
npm run format

Current Validation Status

Validation recorded on 2026-07-27:

npx tsc --noEmit passed

npm run lint passed without warnings or errors

npm run build passed

Manual Smoke-Test Checklist

Register and verify a new account.

Log out and log in.

Create, edit, default, and delete an address.

Preview booking price and availability.

Create cash and card bookings.

Complete Stripe Checkout and verify webhook state.

Reschedule and cancel a booking.

Confirm history and notifications.

Assign a cleaner.

Progress a cleaner job and upload proof.

Complete a booking and submit a review.

Moderate the review as an admin.

Exercise admin filters, payment actions, reports, promo codes, and settings.

Call internal routes with valid and invalid cron authorization.

Use:

A disposable MongoDB database

Stripe test mode

Non-production Supabase buckets

SMTP sandbox or console email output

There is currently no automated unit, integration, or end-to-end test suite.

Deployment

Vercel

Import the repository.

Set the project root to the directory containing package.json.

Configure Preview and Production environment variables separately.

Set APP_URL to the canonical HTTPS origin.

Configure MongoDB Atlas network access for the deployment.

Create and verify Supabase storage buckets.

Create a Stripe webhook:

https://your-domain.example/api/webhooks/stripe

Configure the Stripe webhook signing secret.

Configure CRON_SECRET.

Confirm the booking-reconciliation schedule in vercel.json.

Add a schedule for notification processing when required.

Run a production build before promotion.

npm run build

Traditional Node Hosting

Start the built application with:

npm run start

A traditional host must independently schedule:

/api/internal/bookings/reconcile
/api/internal/notifications/process

and include the expected bearer authorization.

Security Notes

Never trust browser-calculated prices.

Never expose AUTH_SECRET, Stripe secrets, or Supabase service-role keys.

Keep cleaner demo check-in disabled in production.

Verify customer ownership for addresses, bookings, payments, and reviews.

Verify cleaner assignment ownership for job and proof routes.

Validate every request with Zod.

Keep API routes responsible for authorization even when UI guards exist.

Review proof-image and review-image privacy before production.

Prefer private storage buckets and signed URLs for sensitive operational images.

Use Stripe webhook signatures for durable payment updates.

Add transactions or compensating operations to multi-document workflows.

Known Issues and Roadmap

High Priority

Split scripts/seed.ts

Separate catalog and admin seeding.

Avoid concurrent workflows sharing and disconnecting the same Mongoose connection.

Consolidate cleaner architecture

Migrate fully to account-based CleanerAssignment.

Remove legacy assignedCleanerName flows after compatibility is no longer required.

Resolve duplicate cleaner page trees

Confirm whether /today or /cleaner/today is authoritative.

Remove the unused route tree.

Add automated tests

Pricing

Capacity and overlap

Authorization and ownership

Booking rollback

Promo limits

Stripe idempotency

Cron behavior

Make multi-document workflows atomic

Use Mongoose sessions and transactions where appropriate.

Medium Priority

Migrate from deprecated next lint behavior to the ESLint CLI.

Schedule notification processing.

Align JWT and cookie expiration.

Unify RBAC helpers.

Resolve shared type and schema drift.

Review public proof-image visibility.

Remove or gate development mutation endpoints.

Audit legacy routes and unused Cloudinary packages.

Operational Improvements

Add structured logging and error monitoring.

Add Stripe webhook replay visibility.

Add notification dead-letter handling.

Document migrations, backups, and restore procedures.

Developer Handover Checklist

Before taking ownership of the project:

Read this README.

Read docs/DEVELOPER_HANDOVER.md.

Read docs/email-deliverability.md.

Create a fresh .env.local.

Run npm ci.

Run npm run seed:catalog.

Run npx tsc --noEmit.

Run npm run build.

Trace changes through:

route -> validator -> service -> model

Preserve:

Server-side pricing

Availability checks

Role authorization

Resource ownership

Audit history

Payment synchronization

Use account-based cleaner assignments for new work.

Test third-party integrations only with non-production credentials.

Update documentation when routes, models, environment variables, or workflows change.

Contributing

Create a feature branch.

git switch -c feature/your-feature

Make focused changes.

Run quality checks.

npx tsc --noEmit
npm run build

Commit with a clear message.

git add .
git commit -m "Add descriptive change"

Push the branch and open a pull request.

License

Add the project license here before public distribution.

<p align="center">
  Built for a cleaner, simpler, and more reliable service experience.
</p>