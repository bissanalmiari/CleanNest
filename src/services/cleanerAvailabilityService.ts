import "server-only";

import { AppError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import CleanerAvailability from "@/models/CleanerAvailability";
import type { DayOfWeek } from "@/types/enums";

export interface CleanerAvailabilityDay {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function getCleanerAvailability(cleanerId: string) {
  await connectDB();
  const saved = await CleanerAvailability.find({ cleanerId }).lean().exec();
  const byDay = new Map(saved.map((item) => [item.dayOfWeek, item]));

  return DAYS.map((dayOfWeek) => {
    const day = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      startTime: day?.startTime ?? DEFAULT_START,
      endTime: day?.endTime ?? DEFAULT_END,
      isAvailable: day?.isAvailable ?? dayOfWeek !== "sunday",
    };
  });
}

export async function updateCleanerAvailability(cleanerId: string, days: CleanerAvailabilityDay[]) {
  if (!Array.isArray(days) || days.length !== DAYS.length) {
    throw new AppError("Please provide all seven days", 422);
  }

  const uniqueDays = new Set(days.map((day) => day.dayOfWeek));
  if (uniqueDays.size !== DAYS.length || days.some((day) => !DAYS.includes(day.dayOfWeek))) {
    throw new AppError("Availability contains invalid or duplicate days", 422);
  }

  for (const day of days) {
    if (!TIME_PATTERN.test(day.startTime) || !TIME_PATTERN.test(day.endTime)) {
      throw new AppError("Availability time must use the HH:mm format", 422);
    }
    if (day.isAvailable && day.startTime >= day.endTime) {
      throw new AppError(`${day.dayOfWeek} end time must be after start time`, 422);
    }
  }

  await connectDB();
  await CleanerAvailability.bulkWrite(
    days.map((day) => ({
      updateOne: {
        filter: { cleanerId, dayOfWeek: day.dayOfWeek },
        update: { $set: day },
        upsert: true,
      },
    }))
  );

  return getCleanerAvailability(cleanerId);
}
