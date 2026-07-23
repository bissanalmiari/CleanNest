// src/services/userManagementService.ts
// Admin user-management data-access layer: list, detail, block/unblock, delete.
// passwordHash is never returned by any function here — every query either
// relies on the schema's select:false default or explicitly excludes it.

import "server-only";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";
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

  const [users, total] = await Promise.all([
    User.find(match)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean()
      .exec(),
    User.countDocuments(match),
  ]);

  return { users, total, page: safePage, limit: safeLimit };
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

  // Booking count only makes sense for customers, but computing it is
  // harmless (and simply returns 0) for other roles too.
  const bookingCount = await Booking.countDocuments({ customerId: id });

  return { user, bookingCount };
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
