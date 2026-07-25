// src/services/userManagementService.ts
// Admin user-management data-access layer: list, detail, block/unblock, delete.
// passwordHash is never returned by any function here — every query either
// relies on the schema's select:false default or explicitly excludes it.

import "server-only";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";
import CleanerAssignment from "@/models/CleanerAssignment";
import { AppError, NotFoundError } from "@/lib/apiError";

/* ------------------------------------------------------------------ */
/* 1) List users (searchable + filterable + paginated)                 */
/* ------------------------------------------------------------------ */

export interface UserListFilters {
  search?: string; // matches name, email, or phone
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getAllUsers(filters: UserListFilters = {}) {
  await connectDB();

  const { search, role, status, page = 1, limit = 20 } = filters;

  const match: Record<string, unknown> = {};

  if (role) match.role = role;
  if (status) match.status = status;

  if (search) {
    match.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [users, total, roleSummary, statusSummary, newThisMonth] =
    await Promise.all([
    User.find(match)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean()
      .exec(),
    User.countDocuments(match),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
  ]);

  const roleCounts = new Map(
    roleSummary.map((item) => [String(item._id), Number(item.count)])
  );
  const statusCounts = new Map(
    statusSummary.map((item) => [String(item._id), Number(item.count)])
  );

  return {
    users,
    total,
    page: safePage,
    limit: safeLimit,
    summary: {
      totalUsers: roleSummary.reduce(
        (sum, item) => sum + Number(item.count),
        0
      ),
      admins: roleCounts.get("admin") ?? 0,
      customers: roleCounts.get("customer") ?? 0,
      cleaners: roleCounts.get("cleaner") ?? 0,
      active: statusCounts.get("active") ?? 0,
      suspended: statusCounts.get("suspended") ?? 0,
      pendingVerification: statusCounts.get("pending_verification") ?? 0,
      newThisMonth,
    },
  };
}

/* ------------------------------------------------------------------ */
/* 2) User detail                                                       */
/* ------------------------------------------------------------------ */

export async function getUserById(id: string) {
  await connectDB();

  const user = await User.findById(id).select("-passwordHash").lean().exec();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const [bookingCount, assignmentCount] = await Promise.all([
    Booking.countDocuments({ customerId: id }),
    CleanerAssignment.countDocuments({ cleanerId: id }),
  ]);

  return { user, bookingCount, assignmentCount };
}

/* ------------------------------------------------------------------ */
/* 3) Block / unblock                                                   */
/* ------------------------------------------------------------------ */

export async function blockUser(userId: string, actingAdminId: string) {
  await connectDB();

  if (userId === actingAdminId) {
    throw new AppError("You cannot block your own account", 403);
  }

  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.status = "suspended";
  await user.save();

  return user.toObject();
}

export async function unblockUser(userId: string) {
  await connectDB();

  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.status = "active";
  await user.save();

  return user.toObject();
}

/* ------------------------------------------------------------------ */
/* 4) Delete                                                            */
/* ------------------------------------------------------------------ */

export async function deleteUser(userId: string, actingAdminId: string) {
  await connectDB();

  if (userId === actingAdminId) {
    throw new AppError("You cannot delete your own account", 403);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // NOTE: this is a hard delete. It does not cascade to the user's
  // bookings, reviews, or other related records — those will keep
  // referencing a customerId/cleanerId that no longer resolves to a
  // user. That's an accepted tradeoff for this iteration; a future
  // pass should either soft-delete (keep the record, anonymize it) or
  // explicitly clean up related collections before removing the user.
  await user.deleteOne();

  return { deletedId: userId };
}
