export const FRIDAY_PRAYER_START = "12:00";
export const FRIDAY_PRAYER_END = "14:00";

export interface RecurringScheduleBlock {
  code: "SUNDAY_CLOSED" | "FRIDAY_PRAYER";
  reason: string;
  fullDay: boolean;
}

function getUtcWeekday(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  if (!year || !month || !day) return -1;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function getFullDayScheduleBlock(bookingDate: string): RecurringScheduleBlock | null {
  if (getUtcWeekday(bookingDate) === 0) {
    return {
      code: "SUNDAY_CLOSED",
      reason: "CleanNest is closed every Sunday.",
      fullDay: true,
    };
  }

  return null;
}

export function getRecurringScheduleBlock({
  bookingDate,
  startTime,
  endTime,
}: {
  bookingDate: string;
  startTime: string;
  endTime: string;
}): RecurringScheduleBlock | null {
  const fullDayBlock = getFullDayScheduleBlock(bookingDate);
  if (fullDayBlock) return fullDayBlock;

  if (getUtcWeekday(bookingDate) !== 5) return null;

  const requestedStart = timeToMinutes(startTime);
  const requestedEnd = timeToMinutes(endTime);
  const prayerStart = timeToMinutes(FRIDAY_PRAYER_START);
  const prayerEnd = timeToMinutes(FRIDAY_PRAYER_END);

  if (requestedStart < prayerEnd && requestedEnd > prayerStart) {
    return {
      code: "FRIDAY_PRAYER",
      reason:
        "This booking overlaps Friday prayer time. Please choose a slot ending by 12:00 PM or starting at 2:00 PM.",
      fullDay: false,
    };
  }

  return null;
}

export function isFridaySchedule(bookingDate: string) {
  return getUtcWeekday(bookingDate) === 5;
}
