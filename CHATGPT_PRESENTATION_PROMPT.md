# Copy-ready message for ChatGPT

Copy everything below this line and send it to ChatGPT. If possible, also upload screenshots of the home page, booking wizard, customer dashboard, cleaner job page, and admin dashboard so it can use the real interface instead of inventing visuals.

---

I want you to create a complete, polished presentation about my website project. Use every factual detail below. Do not invent features, statistics, integrations, or business claims that are not included. If a feature is incomplete or a future improvement, label it honestly instead of presenting it as finished.

## Presentation assignment

Create a professional 20–24 slide presentation about **CleanNest**, a full-stack cleaning-services booking and operations platform for Lebanon. The audience may include a university instructor, project jury, developers, and potential business stakeholders, so balance business value, user experience, and technical depth.

For every slide, provide:

1. Slide number and title.
2. Concise on-slide text (prefer 3–6 short bullets).
3. A recommended visual, diagram, screenshot, chart, or icon arrangement.
4. Speaker notes explaining the slide naturally and in more detail.
5. A smooth transition sentence to the next slide.

Also provide:

- An opening script lasting about 30–45 seconds.
- A closing script lasting about 30–45 seconds.
- A final Q&A slide.
- A short list of likely jury questions with strong suggested answers.
- A consistent design system for the slides based on the website’s actual visual identity.
- Clear placeholders such as `[Insert screenshot: Customer booking wizard]`; do not pretend screenshots were supplied if they were not.
- Diagrams for the system architecture, booking lifecycle, payment flow, and role-based platform structure.

Suggested narrative: problem → solution → audience and roles → public experience → booking journey → customer portal → cleaner operations → admin operations → payments and automation → architecture and data → security → challenges and current limitations → future roadmap → conclusion.

## 1. Project identity and concept

- Product name: **CleanNest**.
- Tagline used in the interface: **“Cleaning made simple.”**
- Core positioning: a production-oriented, full-stack cleaning-services marketplace and operations platform.
- Main goal: manage the complete cleaning-service journey from service discovery and account creation through booking, payment, cleaner fulfillment, proof of service, review, reporting, and administration.
- Geographic/business context: Lebanon, with Beirut as the default business time zone (`Asia/Beirut`).
- Public contact information currently displayed: `cleannest.project@gmail.com`, `+961 1 234 567`, and Beirut, Lebanon.
- Displayed working hours: Monday–Saturday, 8:00 AM–7:00 PM.
- Sunday is blocked by the scheduling rules.
- Friday bookings cannot overlap prayer time from 12:00 PM to 2:00 PM.
- Payment currency is currently USD.
- The platform combines the browser UI and server API in one Next.js App Router repository.

## 2. Problem and proposed solution

The product addresses common cleaning-service problems:

- Customers often depend on phone calls, vague quotations, uncertain availability, and fragmented follow-up.
- A cleaning business needs more than a booking form: it also needs customer records, saved locations, staff availability, assignments, service execution, evidence, payment reconciliation, notifications, reviews, and reporting.
- CleanNest centralizes these operations in one role-aware system.
- It provides clear service discovery, server-calculated prices, guided scheduling, customer self-service, cleaner job workflows, and an administrative control center.

The About page describes the idea as making professional cleaner booking effortless, transparent, and trustworthy. Its mission is: **“Make every home feel fresh, healthy, and comfortable.”** Its values are:

- Trusted Professionals: cleaners are presented as vetted before visiting homes.
- Eco-Friendly Care: preference for gentler, lower-impact methods and products.
- Customer First: the experience is designed around customer comfort and schedule.

## 3. Users and role-based experiences

The application has three roles: **customer**, **cleaner**, and **admin**. User accounts can be `active`, `suspended`, or `pending_verification`.

### Customer

- Creates and verifies an account.
- Manages profile, password, and avatar.
- Saves multiple addresses and chooses a default.
- Browses services and service details.
- Builds a personalized booking.
- Selects add-ons, date, time, payment method, and notes.
- Receives trusted price previews and availability validation.
- Views, edits, reschedules, or cancels eligible bookings.
- Pays by cash or Stripe card checkout.
- Views payment history and notifications.
- Reviews eligible completed bookings and may upload before/after images.
- Accesses authorized proof-of-service reports.

Customer navigation: Dashboard, My Bookings, Addresses, My Reviews, and Payments.

### Cleaner

- Maintains weekly availability.
- Sees today’s route and upcoming assigned jobs.
- Opens job details.
- Accepts or declines supported assignments.
- Marks on-the-way, checks in, checks out, and performs permitted lifecycle actions.
- Completes service checklists.
- Uploads before/after proof images.
- Reports issues.
- Can optionally use location verification.
- Can access only assigned jobs and their proof data.

Cleaner navigation: Today’s route, Upcoming jobs, and Availability.

### Admin

- Views operational dashboard metrics.
- Manages bookings and creates bookings on behalf of customers.
- Assigns one or multiple cleaners where supported.
- Changes booking statuses and reviews booking history/details.
- Manages services, images, customers, cleaners, and general admin users.
- Blocks/unblocks supported user accounts.
- Reviews payments, marks cash as collected, marks failures, and processes eligible card refunds.
- Creates and manages promo codes.
- Moderates customer reviews.
- Handles contact enquiries through new, in-progress, and resolved states.
- Views notifications.
- Produces reports and document exports.
- Changes business settings.

Admin navigation: Dashboard, Bookings, Services, Customers, Cleaners, Promo Codes, Reports, Payments, Reviews, Contact Messages, Notifications, and Settings.

## 4. Public website experience

Public pages and components include:

- Home page.
- Services catalog.
- Individual service details by slug.
- About page.
- Public customer-reviews page.
- Login, customer signup, email verification, forgot password, and reset password.
- Marketing contact form.
- Shared navbar, footer, and floating booking call-to-action.

The home page includes:

- An animated hero centered on the idea that the customer’s home becomes the cleaning plan.
- A visual cleaning route moving through living room, kitchen, bedroom, and bathroom.
- Trust messages: account-protected booking, eco-conscious options, and flexible scheduling.
- Services preview.
- About section.
- Why Choose Us section.
- Animated statistics.
- Reviews section.
- FAQ accordion.
- Contact section and enquiry form.
- Footer with brand, quick links, customer links, social links, contact details, trust strip, newsletter UI, and booking banner.
- Floating “Book Now” experience.

Home-page marketing statistics currently displayed:

- 1,200+ successful cleanings.
- 98% satisfied customers.
- 4.9/5 average rating.
- A “4 Core Cleaning Services” counter. Note honestly that the current seeded catalog has expanded to 18 services, so this older marketing counter may need updating.

FAQ answers explain that:

- Users sign in, choose a service, address, date, and time, review the details, and confirm.
- Cash after service and a project/demo card checkout are supported.
- Eligible bookings may be cancelled or rescheduled at least 24 hours before their start.
- Available slots are displayed during booking.
- The complete price is visible before confirmation.
- An administrator can assign one or several cleaners depending on needs and availability.

The services explorer supports:

- Text search.
- Category filters.
- Minimum and maximum price filtering.
- Sorting.
- Pagination.
- Loading, error, empty-result, and retry states.
- Service cards and detailed service pages.
- Comparison of price, estimated duration, description, included features, and suitable add-ons.

The About page presents the story in three stages: the idea (simpler booking), the build (transparent pricing and flexible scheduling), and today (growth across Lebanon). It repeats the public statistics and includes calls to book or browse services.

## 5. Authentication and account security

- Customer signup collects full name, email, optional phone, password, and password confirmation.
- Passwords require at least eight characters in the current UI/validation flow.
- Passwords are hashed with `bcryptjs`.
- New accounts are saved as `pending_verification`.
- Email verification uses a six-digit OTP; only its hash and expiry are stored.
- The raw OTP is sent by SMTP/Nodemailer, or printed to the server console when local email is not configured.
- Resend-verification is supported.
- Login rejects invalid, suspended, or unverified accounts.
- Forgot-password and reset-password use a separate six-digit OTP flow.
- Authentication uses a custom JWT session stored in an HTTP-only cookie named `cleannest_token`.
- Cookie properties: HTTP-only, SameSite=Lax, path `/`, and Secure in production.
- The JWT contains the user ID in `sub` and the role; it is signed with `AUTH_SECRET`.
- Authenticated requests reload the user from MongoDB, so invalid, deleted, inactive, or unauthorized users are rejected.
- Middleware checks cookie presence for routing convenience, but server-side API authorization is the real security boundary.
- Role guards and ownership checks protect customer and cleaner records.

## 6. Five-step customer booking journey

The primary booking interface is a visually guided route builder with five steps:

1. **Home Profile / Home Base** — choose a saved serviceable address or add a new one; provide property type and profile. Property types are apartment, house, office, or other. The UI begins with apartment, 1 bedroom, 1 bathroom, and 80 m² as draft defaults.
2. **Cleaning Plan** — select the main service, starting with a recommendation or comparing price, duration, and essential details.
3. **Extra Touches** — add optional service-compatible extras and quantities.
4. **Time Route** — select an available date and arrival time; the expected end time is calculated from total duration.
5. **Final Check** — review address, service, property, add-ons, date/time, notes, payment method, price breakdown, and final total before confirming.

Booking options and rules:

- Frequencies supported in the shared domain model: one-time, weekly, biweekly, and monthly. The current route builder primarily creates the selected booking journey using these domain values where exposed.
- Payment choices in customer booking: cash or card.
- Customer notes can contain up to 1,000 characters.
- A booking may contain up to 20 distinct add-ons; duplicate add-on IDs are rejected.
- Bedroom and bathroom counts are limited and validated; property size must be positive.
- The chosen service area contributes its own fee and capacity constraints.
- Booking end time must be later than start time.
- Bookings must be in the future.
- Scheduling uses Beirut time and handles daylight-saving offsets.
- Customers may cancel or reschedule only when the booking is not completed, cancelled, in progress, or already started, and at least 24 hours remain.
- Reschedule and cancellation actions create explicit audit history.

## 7. Trusted pricing engine

The browser never owns the authoritative price. The server loads active catalog records and recalculates everything.

Pricing formula:

**service base price + property adjustment + add-ons + service-area fee − valid promo discount = total**

Pricing also calculates duration:

**service base duration + property extra duration + add-on extra duration = estimated duration**

Current property adjustments:

- Apartment: no flat surcharge; includes 1 bedroom and 1 bathroom; each extra bedroom adds $8 and 20 minutes; each extra bathroom adds $6 and 15 minutes.
- House: $15 and 30-minute flat adjustment; includes 2 bedrooms and 1 bathroom; each extra bedroom adds $10 and 25 minutes; each extra bathroom adds $7 and 20 minutes.
- Office: $10 and 20-minute flat adjustment; includes 1 bathroom; each extra bathroom adds $6 and 15 minutes.
- Other: $5 and 15-minute flat adjustment; includes 0 bedrooms and 0 bathrooms; each extra bedroom adds $8 and 20 minutes; each extra bathroom adds $6 and 15 minutes.
- The pricing engine can also apply floor-area pricing above an included square-meter threshold configured by the service.

Promo-code validation checks:

- Code existence and active state.
- Start and expiry dates.
- Global maximum uses.
- Per-customer limit.
- Applicable services.
- Minimum booking amount.
- Percentage or fixed-amount discount.
- Optional maximum discount for percentage codes.
- Usage is recorded in a separate audit model.

## 8. Seeded service catalog

The current seed catalog contains 18 services. Prices are starting/base prices in USD and durations are initial estimates before property and add-on adjustments:

1. Regular Home Cleaning — $35 — 120 minutes.
2. Deep Cleaning — $65 — 240 minutes.
3. Move-In / Move-Out Cleaning — $85 — 300 minutes.
4. Office Cleaning — $75 — 240 minutes.
5. Sofa and Upholstery Cleaning — $45 — 120 minutes.
6. Post-Construction Cleaning — $110 — 360 minutes.
7. Airbnb Turnover Cleaning — $55 — 180 minutes.
8. Villa Cleaning — $120 — 360 minutes.
9. Kitchen Intensive Cleaning — $48 — 150 minutes.
10. Bathroom Sanitizing — $38 — 120 minutes.
11. Window and Glass Cleaning — $50 — 150 minutes.
12. Carpet and Rug Cleaning — $55 — 150 minutes.
13. Mattress Refresh Cleaning — $40 — 90 minutes.
14. After-Event Cleanup — $80 — 240 minutes.
15. Retail Store Cleaning — $70 — 210 minutes.
16. Clinic and Wellness Sanitizing — $95 — 240 minutes.
17. School and Daycare Cleaning — $105 — 300 minutes.
18. Eco-Friendly Home Cleaning — $45 — 150 minutes.

Catalog categories include Home Cleaning, Commercial Cleaning, Specialized Cleaning, Hospitality Cleaning, Room-Specific Cleaning, and Event Cleaning.

Each service includes a unique slug, short description, long description, category, price, duration, feature list, active state, and optional cover image. Service-detail pages show included features and explain a simple three-part journey: build the booking, CleanNest prepares the visit, and enjoy the result.

## 9. Add-on catalog

The seed file contains 56 optional extras. Each has a price, extra duration, maximum quantity, active state, and service compatibility relationship. Use grouped examples on slides rather than placing all 56 on one unreadable slide, but mention that the platform supports 56 seeded add-ons.

### Kitchen and appliance extras

- Inside Refrigerator — $15, +30 min, max 2.
- Inside Oven — $18, +40 min, max 2.
- Microwave Interior — $8, +15 min, max 3.
- Dishwasher Interior — $14, +25 min, max 2.
- Range Hood Degreasing — $16, +30 min, max 2.
- Kitchen Cabinet Exteriors — $20, +35 min, max 2.
- Inside Kitchen Cabinets — $28, +50 min, max 2.
- Pantry Shelf Reset — $18, +35 min, max 2.
- Kitchen Backsplash and Grout — $16, +30 min, max 2.
- Small Appliance Exteriors — $5, +10 min, max 8.

### Windows, surfaces, and outdoor areas

- Interior Windows — $6, +15 min, max 20.
- Accessible Exterior Windows — $8, +18 min, max 20.
- Window Track Detailing — $4, +10 min, max 20.
- Glass Doors and Partitions — $7, +12 min, max 20.
- Blinds Dusting — $7, +15 min, max 15.
- Curtain Vacuuming — $10, +20 min, max 12.
- Baseboards and Trim — $12, +25 min, max 8.
- Interior Doors and Frames — $5, +12 min, max 20.
- Wall Spot Cleaning — $9, +20 min, max 10.
- Light Fixtures — $6, +12 min, max 15.
- Ceiling Fans — $8, +15 min, max 10.
- Balcony Cleaning — $14, +30 min, max 5.
- Patio or Terrace Cleaning — $22, +45 min, max 4.
- Staircase Detailing — $18, +35 min, max 5.
- Garage Floor Sweep — $24, +45 min, max 3.

### Upholstery, bedrooms, and fabric care

- Sofa Cleaning — $12, +25 min, max 8.
- Upholstered Chair Cleaning — $7, +15 min, max 20.
- Mattress Refresh — $18, +30 min, max 8.
- Fabric Headboard Cleaning — $12, +20 min, max 8.
- Fitted Carpet Cleaning — $25, +45 min, max 10.
- Area Rug Cleaning — $16, +30 min, max 12.
- Intensive Pet Hair Removal — $20, +40 min, max 4.
- Fabric Spot Treatment — $8, +15 min, max 10.

### Bathroom, laundry, organization, and household help

- Shower Glass Descaling — $14, +25 min, max 5.
- Bathroom Grout Detailing — $18, +35 min, max 5.
- Inside Bathroom Cabinets — $14, +25 min, max 5.
- Laundry Wash and Fold — $12, +25 min, max 6.
- Ironing Service — $15, +35 min, max 6.
- Bed Linen Change — $6, +12 min, max 12.
- Dishwashing — $10, +25 min, max 5.
- Trash Bin Sanitizing — $5, +10 min, max 12.
- Light Room Organization — $18, +35 min, max 8.

### Office, specialist, hospitality, and event extras

- Workstation Disinfection — $6, +12 min, max 30.
- Meeting Room Reset — $18, +30 min, max 8.
- Office Break Room Detail — $22, +40 min, max 4.
- Display and Shelf Detailing — $8, +15 min, max 20.
- Fine Dust Second Pass — $35, +60 min, max 4.
- Label and Adhesive Removal — $8, +15 min, max 15.
- Light Paint Spot Removal — $15, +30 min, max 8.
- Extra Debris Bagging — $8, +15 min, max 15.
- Guest Supply Restocking — $10, +20 min, max 5.
- Guest-Ready Styling — $12, +20 min, max 4.
- Event Table and Chair Reset — $20, +40 min, max 5.
- Enhanced High-Touch Disinfection — $18, +30 min, max 8.
- Classroom Desk and Chair Detail — $18, +35 min, max 10.
- Play Area Surface Cleaning — $20, +40 min, max 8.

## 10. Availability and capacity logic

Before accepting a booking, the server checks:

- Business scheduling rules.
- Sunday closure and Friday prayer-time block.
- Requested start and calculated end time.
- Service duration, property duration adjustments, and add-on duration.
- Service-area coverage and fee.
- Service-area and global capacity.
- Existing overlapping bookings.
- Cleaner weekly availability.
- Cleaner assignments.
- Explicit blocked periods.
- Optional exclusion of the current booking during rescheduling/editing.

Availability and pricing are revalidated during creation, so an outdated browser preview cannot bypass rules.

## 11. Booking and payment lifecycle

Booking statuses: pending, confirmed, in progress, completed, and cancelled.

Payment statuses: unpaid, pending, paid, refunded, and failed.

Payment methods supported by the wider domain: cash, card, wallet, and bank transfer; current customer booking exposes cash and card.

Important card-payment behavior:

- A customer card booking is saved before Stripe Checkout so it has a stable booking ID.
- While the card payment is unpaid, pending, or failed, the booking remains visible to the customer.
- It is excluded from the admin booking queue and does not send the admin “new booking” notification until payment succeeds.
- After successful payment it enters the admin queue automatically.
- It remains visible if it is later refunded.
- Stripe Checkout sessions can be created or reused.
- Stripe webhooks are the durable source of asynchronous payment status changes.
- The success page briefly polls an authenticated verification endpoint as a fallback when a webhook is delayed.
- Webhook processing errors return HTTP 500 so Stripe retries.
- Payment updates synchronize the Payment record and Booking payment status.

Cash behavior:

- Cash bookings create a cash payment record.
- They appear in the admin queue immediately because cash is collected after service.
- An admin can later mark cash as collected.

Admin-created bookings are always visible in the admin queue.

Administrative payment actions include confirming cash collection, marking a payment failed with an audit reason, and issuing an eligible full or partial card refund.

## 12. Cleaner fulfillment and proof of service

The cleaner portal supports the operational side of a visit:

- Weekly availability configuration by day and time.
- Today and upcoming job views.
- Assignment states: assigned, accepted, declined, and completed.
- Job-detail access protected by assignment ownership.
- On-the-way, check-in, check-out, and completion actions.
- A service checklist.
- Before and after photo upload.
- Issue reporting.
- Optional location verification.
- Proof metadata stored in MongoDB while image files are stored externally in Supabase Storage.
- Authorized proof reports can be viewed for a booking.

A demo check-in capability exists for safe testing. It is automatically available locally or with Stripe test keys, or can be explicitly enabled server-side. It must stay disabled with live production Stripe keys unless deliberately configured.

## 13. Reviews, notifications, and communication

### Reviews

- Only eligible completed bookings can be reviewed.
- Reviews are linked to the customer and booking.
- Customers can create, update, and delete their own reviews where allowed.
- Ratings, written comments, and optional image uploads are supported.
- Review images use Supabase Storage.
- Admins moderate review approval.
- Only approved reviews appear publicly.
- Public reviews have pagination and average-rating presentation.

### Notifications

- The system contains in-app notifications, an email queue, preferences, unread state, mark-one-read, and mark-all-read.
- Notification preferences can control delivery behavior.
- Background processing sends queued notifications.
- Booking reminders and workflow events are handled by notification services.

### Contact enquiries

- Public users can submit a contact form.
- Enquiries are saved as ContactMessage records.
- Admin workflow states are new, in progress, and resolved.
- The contact section explains: send your message → CleanNest reviews it → receive assistance.

## 14. Admin analytics and operations

The admin portal is the central control room. Presentation screenshots should highlight:

- KPI/stat cards and operational dashboard.
- Upcoming and recent bookings.
- Booking filters, queue, details, status badges, histories, and cleaner assignment.
- Customer and cleaner list/detail pages.
- Service catalog creation/editing and image management.
- Promo-code constraints and lifecycle.
- Payment ledger and action dialogs.
- Review moderation.
- Contact-message inbox.
- Notification inbox.
- Business settings.
- Reports with revenue trend, booking-status distribution, popular services, booking tables, and downloadable DOCX exports.

Business settings include:

- Business name.
- Support email and phone.
- Business address.
- Booking lead time in hours.
- Cancellation window in hours.
- Maintenance mode.
- Email notification enable/disable.
- SMS notification enable/disable (setting exists; no SMS provider integration is documented as complete).

## 15. Technical stack

- Framework: Next.js 15 App Router.
- Frontend: React 19 and TypeScript 5.
- Styling: Tailwind CSS 3.
- Animation: Motion.
- Icons: Lucide React.
- Form handling: React Hook Form.
- Validation: Zod and `@hookform/resolvers`.
- Database: MongoDB Atlas.
- ODM: Mongoose.
- Authentication: custom JWT in an HTTP-only cookie.
- Password hashing: bcryptjs.
- Email: Nodemailer over SMTP.
- Payments: Stripe Checkout and webhooks.
- File storage: Supabase Storage.
- Reports: server-generated DOCX files using `docx`.
- UI utilities: CVA, clsx, and tailwind-merge.
- Deployment: Vercel-compatible.
- Package manager: npm.
- Seed tooling: tsx.
- Cloudinary and next-cloudinary packages remain installed, but active uploads use Supabase; they should be confirmed unused before removal.

Current measured repository scope:

- 52 page files.
- 96 API route files.
- 23 Mongoose model files.
- 33 service-layer modules.
- 18 seeded services.
- 56 seeded add-ons.

## 16. Architecture

Use a layered architecture diagram with this flow:

**Browser / React UI → Next.js API route handlers → Zod validators → domain service layer → Mongoose models → MongoDB Atlas**

Show external connections from the service layer to:

- Stripe for card payments and refunds.
- Supabase Storage for avatars, service covers, review images, and proof images.
- SMTP/Nodemailer for verification, password recovery, and notifications.
- Vercel Cron/internal routes for status reconciliation and notification processing.

Architectural principles:

- Thin route handlers authenticate, validate, and delegate.
- Multi-step business logic lives in `src/services`.
- Pricing is owned by the server.
- Zod defines API contracts and Mongoose enforces persistence rules.
- Explicit history/audit records preserve important state changes.
- Ownership checks restrict access to the correct customer or cleaner.
- The MongoDB connection is cached on `globalThis` for serverless reuse.
- MongoDB stores file metadata and URLs, not binary files.
- Parenthesized App Router folders organize layouts but do not appear in URLs; for example `(customer)/bookings/page.tsx` is served at `/bookings`.

Repository organization:

- `src/app`: UI routes, layouts, and API handlers.
- `src/components`: booking, dashboard, services, home, cleaner, address, payment, review, notification, profile, shared UI, and other feature components.
- `src/services`: workflows and data access.
- `src/models`: Mongoose schemas and indexes.
- `src/validators`: centralized Zod contracts.
- `src/types`: shared TypeScript domain types.
- `src/hooks`: reusable client data and state hooks.
- `src/store`: booking wizard client state.
- `src/lib`: database, auth, pricing helpers, scheduling, Stripe, Supabase, email, OTP, API response/error, role utilities, and shared helpers.
- `scripts`: seeding, cleanup, payment audits, and payment reconciliation.
- `docs`: developer handover and email deliverability documentation.

## 17. Data model

Group the 23 models into four domains in an ERD-style slide.

### Identity and customer data

- User: credentials, role, status, profile, OTPs, and password reset.
- Address: customer-owned saved locations, property information, service-area link, and default state.
- Notification: in-app/email queue and delivery/read status.
- NotificationPreference: delivery preferences per user.
- ContactMessage: public enquiries and admin workflow.

### Catalog and geographic coverage

- Service: catalog listing, pricing, duration, features, image, and active state.
- AddOn: reusable optional extras.
- ServiceAddon: many-to-many service/add-on relationship and possible overrides.
- ServiceArea: geographic coverage, service fee, and capacity.
- Settings: singleton business configuration.

### Booking and fulfillment

- Booking: customer, service snapshot, schedule, property, address, pricing, payment state, source, and lifecycle.
- BookingAddOn: add-on snapshots selected at booking time.
- BookingStatusHistory: status audit trail.
- BookingRescheduleHistory: old/new schedule audit trail and reason.
- BookingCleanerAssignmentHistory: legacy name-based assignment audit.
- CleanerAssignment: account-based cleaner assignments.
- CleanerAvailability: weekly schedules.
- BlockedTime: unavailable ranges.
- ServiceProof: checklist, photos, timestamps, issues, and optional location evidence.

### Commercial data

- Payment: cash/card record, amount, status, Stripe/provider metadata, refunds, and audit data.
- PromoCode: percentage/fixed discounts, dates, limits, service restrictions, and minimums.
- PromoCodeUsage: customer redemption audit and counters.
- Review: booking-linked rating, comment, images, and moderation state.

Important data invariants:

- Booking number and service slug are unique.
- End time must follow start time.
- Prices and duration are snapshotted for historical accuracy.
- Status, reschedule, assignment, payment, and promo activity are explicitly auditable.
- Customer/cleaner ownership is checked server-side.

## 18. API surface

The repository contains 96 route files. Do not list all of them on a single slide; organize them by domain and use selected examples.

### Public/auth examples

- Services list and service-by-slug.
- Approved reviews and review details.
- Contact submission.
- Register, verify email, resend OTP, login, logout, current session, forgot password, reset password.
- Stripe webhook.

### Shared authenticated examples

- Profile read/update, password change, avatar upload.
- Address list/create/update/delete/default.
- Notifications list/read/read-all/preferences.
- Promo validation.
- Review create/update/delete and image upload.
- Authorized booking proof report.

### Customer examples

- Dashboard summary.
- Booking-ready services and add-ons.
- Serviceable addresses.
- Booking history, create, edit, cancel, reschedule, availability, single and batch price previews.
- Payment history/detail, booking payment lookup, checkout, direct/test pay, and returned-session verification.

### Cleaner examples

- Availability read/update.
- Assigned job list and details.
- Job lifecycle action.
- Proof state and proof-image upload.

### Admin groups

- Dashboard, users, customers, cleaners, services, bookings, payments, promo codes, reviews, contact messages, notifications, settings, and reports.
- Examples include cleaner assignment, status updates, service-image upload, refunds, cash settlement, payment failure, and report export.

### Internal automation

- Booking status reconciliation.
- Queued notification processing.
- Both require cron authorization using a bearer secret.

## 19. Automation and operational tooling

- Booking-status reconciliation updates time-driven booking states.
- Notification processing handles queued notifications.
- The repository is compatible with Vercel Cron.
- The current `vercel.json` schedules booking reconciliation.
- Notification processing still needs its own deployment schedule.
- Stripe webhooks process asynchronous events.
- A cleanup script audits abandoned unpaid customer-card bookings and can delete them only with an explicit `--execute` flag.
- Cleanup protects bookings with paid/refunded records, uses a MongoDB transaction, removes dependent records, and restores promo usage counters.
- A payment-consistency audit compares MongoDB booking/payment state and Stripe sessions.
- A reconciliation script can repair only Stripe-confirmed payments, updates booking and payment together in a transaction, and normalizes legacy `test_card` records.
- Seed scripts populate the catalog and initial data.

## 20. Visual and interaction design

Use the real CleanNest visual system in the presentation:

- Primary blue: `#1E6FD9`.
- Primary light: `#E6F0FD`.
- Primary dark: `#154F9E`.
- Navy: `#0B2545`.
- White surface: `#FFFFFF`.
- Soft surface: `#F5F9FE`.
- Status green: `#16A34A`.
- Status amber: `#D97706`.
- Status red: `#DC2626`.
- Status/in-progress blue: `#2563EB`.
- Heading font: Poppins.
- Body font: Inter.
- Typical card radius: 12px, while marketing cards often use larger rounded corners.
- Card shadow: subtle navy-tinted depth.
- Visual language: clean white/soft-blue surfaces, deep navy sections, blue-to-cyan gradients, glass-like panels, rounded cards, status chips, line icons, large headings, and generous spacing.
- Motion language: fade/slide entrances, counters, hover lift, glow/spotlight effects, route-progress animation, subtle 3D tilt, accordions, and reduced-motion support.
- Responsive layouts adapt to mobile, tablet, and desktop.
- Reusable loading skeletons, empty states, alerts, badges, modals, and confirmation dialogs create a complete product feel.

Suggested slide style:

- 16:9 format.
- Navy title/section slides with blue/cyan gradient accents.
- White content slides with navy headings and primary-blue highlights.
- Use Poppins-like bold headings and Inter-like body typography.
- Use simple Lucide-style line icons.
- Keep individual slides uncluttered; move technical detail into speaker notes or appendix slides.
- Avoid generic green “cleaning” branding that conflicts with the website’s blue/navy identity.

## 21. Quality, testing, deployment, and security

Recorded validation on 2026-07-27:

- `npx tsc --noEmit` passed.
- `npm run lint` passed without warnings or errors.
- `npm run build` passed.
- There is currently no automated unit, integration, or end-to-end suite.

Deployment approach:

- Vercel-compatible deployment.
- MongoDB Atlas must allow deployment connectivity.
- `APP_URL` should be the canonical HTTPS address.
- Stripe webhook endpoint is `/api/webhooks/stripe`.
- Supabase buckets must exist for the required upload types.
- Cron secret and schedules must be configured.
- A traditional Node host can run `npm run start` but must schedule the two internal jobs itself.

Security practices:

- Never trust client-side price calculations.
- Never expose JWT, Stripe, SMTP, database, or Supabase service-role secrets.
- Validate requests with Zod.
- Enforce role and ownership at API/service level even when UI guards exist.
- Verify Stripe webhook signatures.
- Keep demo check-in disabled in real production.
- Prefer private storage and signed URLs for sensitive proof/review images.
- Use transactions or compensating operations for multi-document workflows.

Do not include real environment-secret values in the presentation. Important configuration categories are MongoDB, authentication, application URL/time zone/capacity, cron authorization, SMTP/email identity, Stripe, Supabase buckets, demo-mode control, and initial admin seeding.

## 22. Honest current limitations and roadmap

Clearly separate completed functionality from current limitations:

- The public `/how-it-works` page is currently only a placeholder component.
- Footer links for privacy, terms, and cancellation policy are present, but corresponding completed page files were not found in the inspected project.
- The newsletter interface states that it is ready to connect to a backend subscription endpoint; the backend subscription flow is not complete.
- Notification processing exists but is not currently scheduled in `vercel.json`.
- SMS can be toggled in settings, but no completed SMS provider integration is documented.
- No automated tests currently exist.
- There are duplicate cleaner page trees (`/today`-style route groups and `/cleaner/today` routes); the authoritative set should be consolidated.
- Cleaner assignments still include a legacy name-based history alongside the newer account-based `CleanerAssignment` model.
- Some multi-document workflows should be made fully transactional.
- JWT and cookie expiry behavior should be aligned.
- Role-guard helpers and shared schema/types should be unified.
- Public visibility/privacy of proof images should be audited.
- Development mutation endpoints should be removed or gated.
- Unused/legacy routes and Cloudinary dependencies should be audited.
- Production observability needs structured logging, error monitoring, Stripe webhook replay visibility, and notification dead-letter handling.
- Backup, restore, migration, and operational documentation should be expanded.
- The catalog/admin seed scripts should be separated so concurrent workflows do not share and disconnect the same Mongoose connection.
- The homepage’s “4 Core Cleaning Services” statistic is stale compared with the current 18-service seed catalog.

Recommended roadmap priorities:

1. Automated tests for pricing, availability/capacity, overlaps, authorization, rollback, promo limits, Stripe idempotency, and cron behavior.
2. Consolidate cleaner routing and assignment architecture.
3. Add transactions to critical multi-record workflows.
4. Schedule notification processing.
5. Harden private media access and remove development-only paths.
6. Add monitoring, logs, backup/restore, and operational documentation.
7. Finish public placeholder/legal/newsletter pages and reconcile marketing statistics.

## 23. Key differentiators to emphasize

- It is not only a booking form; it is an end-to-end marketplace and operations system.
- The three portals are connected through one booking lifecycle.
- Server-owned pricing prevents client manipulation.
- Availability considers duration, geography, capacity, cleaner schedules, overlaps, closures, and blocked time.
- Stripe card bookings are hidden from the operational queue until paid, avoiding unpaid work orders.
- Service and add-on prices/durations are snapshotted to preserve historical truth.
- Explicit audit histories improve accountability.
- Cleaner proof-of-service connects the digital booking to real-world fulfillment.
- Public reviews close the trust loop after completion.
- The design is highly visual, responsive, animated, and role-specific.
- The codebase separates routes, validation, services, models, types, and UI for maintainability.

## 24. Recommended slide outline

You may improve this sequence while preserving all important content:

1. Title: CleanNest — Cleaning Made Simple.
2. The real-world problem.
3. The CleanNest solution and value proposition.
4. Platform scope and key numbers.
5. Three user roles and connected ecosystem.
6. Public website and brand experience.
7. Service catalog and personalization.
8. Five-step booking journey.
9. Trusted pricing and promo logic.
10. Smart scheduling and availability.
11. Customer dashboard and self-service.
12. Payment lifecycle: cash and Stripe.
13. Cleaner portal and job lifecycle.
14. Proof of service, reviews, and trust loop.
15. Admin operations center.
16. Reporting, notifications, and automation.
17. Technical stack.
18. Layered system architecture.
19. Data model / ERD overview.
20. Authentication, authorization, and security.
21. Quality, deployment, and operational tooling.
22. Challenges, honest limitations, and lessons learned.
23. Roadmap and future growth.
24. Conclusion and Q&A.

## Final writing instructions

- Make the slides concise, but make speaker notes detailed enough that I can present confidently without memorizing the codebase.
- Explain technical concepts in plain language before naming the technology.
- Emphasize the relationship between business needs and engineering decisions.
- Do not fill slides with endpoint lists or all 56 add-ons; summarize visually and place deep details in notes or an appendix.
- Do not call placeholder or planned features complete.
- Do not claim the marketing statistics are database-derived; describe them as displayed brand statistics.
- Do not reveal or fabricate credentials.
- Do not say there is an automated test suite.
- Refer to active file storage as Supabase Storage, not Cloudinary.
- Use USD when showing current prices.
- Use Lebanon/Beirut context consistently.
- End with the core message: CleanNest connects discovery, trusted booking, secure payment, accountable fulfillment, and business administration in one coherent platform.

Now create the complete presentation slide by slide.
