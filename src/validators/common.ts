// Shared building blocks reused across the validators/ folder, so every
// schema validates ids, times, and pagination the same way.
import { z } from "zod";

// Mongoose/MongoDB ObjectId — 24 hex characters.
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// "HH:MM" 24-hour time, matching how startTime/endTime are stored on Booking
// and CleanerAvailability.
export const timeStringSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format");

// ISO date string (e.g. "2026-07-21") used for bookingDate / date-only inputs.
export const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !Number.isNaN(new Date(val).getTime()), "Invalid date");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});