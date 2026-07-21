// Validation schemas for booking endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema, timeStringSchema, dateStringSchema } from "./common";

const addonSelectionSchema = z.object({
  addonId: objectIdSchema,
  quantity: z.number().int().min(1).max(20).optional().default(1),
});

// POST /api/bookings
export const createBookingSchema = z
  .object({
    serviceId: objectIdSchema,
    addressId: objectIdSchema,
    serviceAreaId: objectIdSchema,
    promoCode: z.string().trim().toUpperCase().optional(),

    frequency: z
      .enum(["one_time", "weekly", "biweekly", "monthly"])
      .optional()
      .default("one_time"),

    bookingDate: dateStringSchema,
    startTime: timeStringSchema,
    endTime: timeStringSchema,

    propertyType: z.enum(["apartment", "house", "office", "other"]),
    bedrooms: z.number().int().min(0).max(20).optional(),
    bathrooms: z.number().int().min(0).max(20).optional(),
    propertySize: z.number().positive().optional(),

    addons: z.array(addonSelectionSchema).optional().default([]),

    paymentMethod: z.enum(["cash", "card", "wallet", "bank_transfer"]),
    customerNotes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// POST /api/bookings/calculate-price
export const calculatePriceSchema = z.object({
  serviceId: objectIdSchema,
  serviceAreaId: objectIdSchema,
  addons: z.array(addonSelectionSchema).optional().default([]),
  promoCode: z.string().trim().toUpperCase().optional(),
});

// GET/POST /api/bookings/availability
export const checkAvailabilitySchema = z
  .object({
    serviceAreaId: objectIdSchema,
    date: dateStringSchema,
    startTime: timeStringSchema,
    endTime: timeStringSchema,
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// POST /api/bookings/cancel
export const cancelBookingSchema = z.object({
  bookingId: objectIdSchema,
  reason: z.string().trim().max(500).optional(),
});

// POST /api/bookings/reschedule
export const rescheduleBookingSchema = z
  .object({
    bookingId: objectIdSchema,
    newBookingDate: dateStringSchema,
    newStartTime: timeStringSchema,
    newEndTime: timeStringSchema,
  })
  .refine((data) => data.newStartTime < data.newEndTime, {
    message: "End time must be after start time",
    path: ["newEndTime"],
  });

// PATCH /api/bookings/[id] — admin/cleaner status transition
export const updateBookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]),
});

// Assigning a cleaner to a booking (admin action)
export const assignCleanerSchema = z.object({
  bookingId: objectIdSchema,
  cleanerId: objectIdSchema,
});

export const bookingIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateBookingValues = z.infer<typeof createBookingSchema>;
export type CalculatePriceValues = z.infer<typeof calculatePriceSchema>;
export type CheckAvailabilityValues = z.infer<typeof checkAvailabilitySchema>;
export type CancelBookingValues = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingValues = z.infer<typeof rescheduleBookingSchema>;
export type UpdateBookingStatusValues = z.infer<typeof updateBookingStatusSchema>;
export type AssignCleanerValues = z.infer<typeof assignCleanerSchema>;