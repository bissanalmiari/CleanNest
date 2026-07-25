// src/services/cleanerService.ts
// Admin cleaner-management data-access layer: list, detail, create, update,
// block/unblock, delete. Scoped to role === "cleaner" only — customers and
// admins are never returned or touched by any function here.
// passwordHash is never returned by any read function — every query either
// relies on the schema's select:false default or explicitly excludes it.

import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import CleanerAssignment from "@/models/CleanerAssignment";
import { AppError, ConflictError, NotFoundError } from "@/lib/apiError";

const PASSWORD_SALT_ROUNDS = 12;
const ROLE = "cleaner" as const;

/* ------------------------------------------------------------------ */
/* 1) List cleaners (searchable + filterable + paginated)              */
/* ------------------------------------------------------------------ */

export interface CleanerListFilters {
  search?: string; // matches name, email, or phone
  status?: string;
  page?: number;
  limit?: number;
}

export async function getAllCleaners(filters: CleanerListFilters = {}) {
  await connectDB();

  const { search, status, page = 1, limit = 20 } = filters;

  const cleanerMatch: Record<string, unknown> = { role: ROLE };
  const match: Record<string, unknown> = { ...cleanerMatch };

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

  const [cleaners, total, statusSummary, newThisMonth] = await Promise.all([
    User.find(match)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean()
      .exec(),
    User.countDocuments(match),
    User.aggregate([
      { $match: cleanerMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.countDocuments({
      ...cleanerMatch,
      createdAt: { $gte: startOfMonth },
    }),
  ]);

  const statusCounts = new Map(
    statusSummary.map((item) => [String(item._id), Number(item.count)])
  );

  return {
    users: cleaners,
    total,
    page: safePage,
    limit: safeLimit,
    summary: {
      totalCleaners: statusSummary.reduce(
        (sum, item) => sum + Number(item.count),
        0
      ),
      activeCleaners: statusCounts.get("active") ?? 0,
      suspendedCleaners: statusCounts.get("suspended") ?? 0,
      newThisMonth,
    },
  };
}

/* ------------------------------------------------------------------ */
/* 2) Cleaner detail                                                    */
/* ------------------------------------------------------------------ */

export async function getCleanerById(id: string) {
  await connectDB();

  const user = await User.findOne({ _id: id, role: ROLE })
    .select("-passwordHash")
    .lean()
    .exec();

  if (!user) {
    throw new NotFoundError("Cleaner not found");
  }

  const assignmentCount = await CleanerAssignment.countDocuments({ cleanerId: id });

  return { user, assignmentCount };
}

/* ------------------------------------------------------------------ */
/* 3) Create                                                            */
/* ------------------------------------------------------------------ */

export interface CreateCleanerInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function createCleaner(input: CreateCleanerInput) {
  await connectDB();

  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone ?? null,
    passwordHash,
    role: ROLE,
    status: "active", // admin-created accounts skip email verification
  });

  const { passwordHash: _omit, ...safeUser } = user.toObject();
  void _omit;
  return safeUser;
}

/* ------------------------------------------------------------------ */
/* 4) Update                                                            */
/* ------------------------------------------------------------------ */

export interface UpdateCleanerInput {
  name?: string;
  email?: string;
  phone?: string | null;
}

export async function updateCleaner(userId: string, input: UpdateCleanerInput) {
  await connectDB();

  const user = await User.findOne({ _id: userId, role: ROLE });
  if (!user) {
    throw new NotFoundError("Cleaner not found");
  }

  if (input.email && input.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }
    user.email = input.email.toLowerCase();
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone ?? undefined;

  await user.save();

  const { passwordHash: _omit, ...safeUser } = user.toObject();
  void _omit;
  return safeUser;
}

/* ------------------------------------------------------------------ */
/* 5) Block / unblock                                                   */
/* ------------------------------------------------------------------ */

export async function blockCleaner(userId: string) {
  await connectDB();

  const user = await User.findOne({ _id: userId, role: ROLE }).select("-passwordHash");
  if (!user) {
    throw new NotFoundError("Cleaner not found");
  }

  user.status = "suspended";
  await user.save();

  return user.toObject();
}

export async function unblockCleaner(userId: string) {
  await connectDB();

  const user = await User.findOne({ _id: userId, role: ROLE }).select("-passwordHash");
  if (!user) {
    throw new NotFoundError("Cleaner not found");
  }

  user.status = "active";
  await user.save();

  return user.toObject();
}

/* ------------------------------------------------------------------ */
/* 6) Delete                                                            */
/* ------------------------------------------------------------------ */

export async function deleteCleaner(userId: string, actingAdminId: string) {
  await connectDB();

  if (userId === actingAdminId) {
    throw new AppError("You cannot delete your own account", 403);
  }

  const user = await User.findOne({ _id: userId, role: ROLE });
  if (!user) {
    throw new NotFoundError("Cleaner not found");
  }

  // NOTE: hard delete — does not cascade to bookings/assignments/reviews.
  // Same accepted tradeoff as customerManagementService.deleteCustomer; a
  // future pass should either soft-delete or clean up related collections
  // first.
  await user.deleteOne();

  return { deletedId: userId };
}
