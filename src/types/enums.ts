// Shared union types (ERD "status"/"type" style columns).
// Centralized here so models, API routes, and UI all reference the same values.

export type UserRole = "customer" | "cleaner" | "admin";
export type UserStatus = "active" | "suspended" | "pending_verification";

export type BookingSource = "customer" | "admin";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type BookingFrequency = "one_time" | "weekly" | "biweekly" | "monthly";
export type PropertyType = "apartment" | "house" | "office" | "other";
export type PaymentMethod = "cash" | "card" | "wallet" | "bank_transfer";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";

export type AssignmentStatus = "assigned" | "accepted" | "declined" | "completed";

export type DiscountType = "percentage" | "fixed_amount";

export type ContactMessageStatus = "new" | "in_progress" | "resolved";

export type Gender = "male" | "female";
export type PreferredLanguage = "en" | "ar" | "fr";

export type DayOfWeek =
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
