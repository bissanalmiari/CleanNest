import type { NotificationType } from "@/models/Notification";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  bookingId: string | null;
  readAt: string | null;
  emailStatus: "not_requested" | "pending" | "processing" | "sent" | "failed" | "skipped";
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  bookingUpdates: boolean;
  assignmentUpdates: boolean;
  reminders: boolean;
  serviceReports: boolean;
}
