import type { DayOfWeek } from "./enums";

export interface CleanerAvailability {
  id: string;
  cleanerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BlockedTime {
  id: string;
  cleanerId?: string;
  startDatetime: string;
  endDatetime: string;
  reason?: string;
  createdByUserId: string;
}
