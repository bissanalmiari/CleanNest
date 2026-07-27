import "server-only";

import { Types } from "mongoose";

import { AppError, NotFoundError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import { emailAppUrl, isPublicEmailUrl, sendEmail } from "@/lib/email";
import Notification, { type INotification, type NotificationType } from "@/models/Notification";
import NotificationPreference from "@/models/NotificationPreference";
import User from "@/models/User";
import type {
  AppNotification,
  NotificationListResponse,
  NotificationPreferences,
} from "@/types/notification";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  bookingId?: string;
  dedupeKey?: string;
  email?: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  bookingUpdates: true,
  assignmentUpdates: true,
  reminders: true,
  serviceReports: true,
};

function toNotification(notification: INotification): AppNotification {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href ?? null,
    bookingId: notification.bookingId?.toString() ?? null,
    readAt: notification.readAt?.toISOString() ?? null,
    emailStatus: notification.emailStatus,
    createdAt: notification.createdAt.toISOString(),
  };
}

function emailCategoryEnabled(type: NotificationType, preferences: NotificationPreferences) {
  if (!preferences.emailEnabled) return false;
  if (type === "booking_reminder") return preferences.reminders;
  if (["assignment_new", "assignment_accepted", "assignment_declined"].includes(type)) {
    return preferences.assignmentUpdates;
  }
  if (type === "service_completed") return preferences.serviceReports;
  return preferences.bookingUpdates;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function transactionalEmail(input: CreateNotificationInput, name: string) {
  const actionUrl = input.href ? emailAppUrl(input.href) : emailAppUrl("/");
  const includeLinks = isPublicEmailUrl(actionUrl);
  const safeTitle = escapeHtml(input.title);
  const safeMessage = escapeHtml(input.message);
  const safeName = escapeHtml(name);
  const preferencesUrl = emailAppUrl("/profile?section=notifications");
  return {
    html: `
      <div style="background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#0b2545">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7f3;border-radius:20px;overflow:hidden">
          <div style="background:#0b3154;padding:24px 28px;color:#ffffff">
            <div style="font-size:22px;font-weight:800">CleanNest</div>
            <div style="margin-top:5px;color:#a5e9f3;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">Cleaning made simple</div>
          </div>
          <div style="padding:30px 28px">
            <p style="margin:0 0 14px;color:#64748b;font-size:14px">Hello ${safeName},</p>
            <h1 style="margin:0;font-size:24px;line-height:1.25">${safeTitle}</h1>
            <p style="margin:16px 0 24px;color:#475569;font-size:15px;line-height:1.7">${safeMessage}</p>
            ${
              includeLinks
                ? `<a href="${actionUrl}" style="display:inline-block;background:#1e6fd9;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px">Open CleanNest</a>`
                : `<p style="margin:0;color:#64748b;font-size:13px">Sign in to CleanNest to view this update.</p>`
            }
          </div>
          <div style="border-top:1px solid #e5edf5;padding:18px 28px;color:#94a3b8;font-size:11px;line-height:1.6">
            This is a transactional update about your CleanNest account.
            ${
              includeLinks
                ? `Manage optional email alerts in your <a href="${preferencesUrl}" style="color:#1e6fd9">notification preferences</a>.`
                : "Manage optional email alerts from your CleanNest profile."
            }
          </div>
        </div>
      </div>`,
    text: `Hello ${name},\n\n${input.title}\n\n${input.message}${
      includeLinks
        ? `\n\nOpen CleanNest: ${actionUrl}\n\nManage email preferences: ${preferencesUrl}`
        : "\n\nSign in to CleanNest to view this update."
    }`,
  };
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  await connectDB();
  const saved = await NotificationPreference.findOne({ userId }).lean();
  return saved
    ? {
        emailEnabled: saved.emailEnabled,
        bookingUpdates: saved.bookingUpdates,
        assignmentUpdates: saved.assignmentUpdates,
        reminders: saved.reminders,
        serviceReports: saved.serviceReports,
      }
    : DEFAULT_PREFERENCES;
}

export async function updateNotificationPreferences(
  userId: string,
  input: Partial<NotificationPreferences>
) {
  const allowed = Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => key in DEFAULT_PREFERENCES && typeof value === "boolean"
    )
  );
  if (Object.keys(allowed).length === 0) {
    throw new AppError("No valid notification preferences were provided", 422);
  }
  await connectDB();
  const saved = await NotificationPreference.findOneAndUpdate(
    { userId },
    { $set: allowed, $setOnInsert: { userId } },
    { upsert: true, new: true, runValidators: true }
  );
  return {
    emailEnabled: saved.emailEnabled,
    bookingUpdates: saved.bookingUpdates,
    assignmentUpdates: saved.assignmentUpdates,
    reminders: saved.reminders,
    serviceReports: saved.serviceReports,
  };
}

export async function createNotification(input: CreateNotificationInput) {
  if (!Types.ObjectId.isValid(input.userId)) return null;
  await connectDB();
  let notification: INotification;
  try {
    notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      bookingId: input.bookingId,
      dedupeKey: input.dedupeKey,
      emailStatus: input.email ? "pending" : "not_requested",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return Notification.findOne({
        userId: input.userId,
        dedupeKey: input.dedupeKey,
      });
    }
    throw error;
  }

  return notification;
}

export async function deliverPendingNotificationEmails(limit = 25) {
  await connectDB();
  const pending = await Notification.find({ emailStatus: "pending" })
    .sort({ createdAt: 1 })
    .limit(Math.min(100, Math.max(1, limit)))
    .select("_id")
    .lean();

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    const notification = await Notification.findOneAndUpdate(
      { _id: item._id, emailStatus: "pending" },
      { $set: { emailStatus: "processing" } },
      { new: true }
    );
    if (!notification) continue;

    const [user, preferences] = await Promise.all([
      User.findById(notification.userId).select("name email status").lean(),
      getNotificationPreferences(notification.userId.toString()),
    ]);
    if (
      !user ||
      user.status !== "active" ||
      !emailCategoryEnabled(notification.type, preferences)
    ) {
      notification.emailStatus = "skipped";
      await notification.save();
      skipped += 1;
      continue;
    }

    try {
      const input: CreateNotificationInput = {
        userId: notification.userId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        href: notification.href,
        bookingId: notification.bookingId?.toString(),
      };
      const content = transactionalEmail(input, user.name);
      await sendEmail({
        to: user.email,
        subject: notification.title,
        html: content.html,
        text: content.text,
        referenceId: notification._id.toString(),
      });
      notification.emailStatus = "sent";
      notification.emailSentAt = new Date();
      notification.emailError = undefined;
      await notification.save();
      sent += 1;
    } catch (error) {
      notification.emailStatus = "failed";
      notification.emailError =
        error instanceof Error ? error.message.slice(0, 1000) : "Email delivery failed";
      await notification.save();
      failed += 1;
    }
  }

  return { checked: pending.length, sent, failed, skipped };
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  return Promise.all(inputs.map((input) => createNotification(input)));
}

export async function notifyActiveAdmins(input: Omit<CreateNotificationInput, "userId">) {
  await connectDB();
  const admins = await User.find({
    role: "admin",
    status: "active",
  })
    .select("_id")
    .lean();
  return createNotifications(
    admins.map((admin) => ({
      ...input,
      userId: admin._id.toString(),
      dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${admin._id.toString()}` : undefined,
    }))
  );
}

export async function listNotifications(
  userId: string,
  limit = 20,
  page = 1
): Promise<NotificationListResponse> {
  await connectDB();
  const safeLimit = Math.min(50, Math.max(1, limit));
  const safePage = Math.max(1, page);
  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Notification.countDocuments({ userId, readAt: { $exists: false } }),
    Notification.countDocuments({ userId }),
  ]);
  return {
    notifications: notifications.map(toNotification),
    unreadCount,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function markNotificationRead(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Notification not found");
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) throw new NotFoundError("Notification not found");
  return toNotification(notification);
}

export async function markAllNotificationsRead(userId: string) {
  await connectDB();
  const result = await Notification.updateMany(
    { userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  );
  return { updated: result.modifiedCount };
}
