// src/services/customerManagementService.ts
// Admin customer-management data-access layer: list, detail, create, update,
// block/unblock, delete. Scoped to role === "customer" only — cleaners and
// admins are never returned or touched by any function here.
// passwordHash is never returned by any read function — every query either
// relies on the schema's select:false default or explicitly excludes it.

import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { AppError, ConflictError, NotFoundError } from "@/lib/apiError";

const PASSWORD_SALT_ROUNDS = 12;
const ROLE = "customer" as const;

/* ------------------------------------------------------------------ */
/* 1) List customers (searchable + filterable + paginated)             */
/* ------------------------------------------------------------------ */

export interface CustomerListFilters {
  search?: string; // matches name, email, or phone
  status?: string;
  page?: number;
  limit?: number;
}

export async function getAllCustomers(filters: CustomerListFilters = {}) {
  await connectDB();

  const { search, status, page = 1, limit = 20 } = filters;

  const match: Record<string, unknown> = { role: ROLE };

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

  const [customers, total] = await Promise.all([
    User.find(match)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean()
      .exec(),
    User.countDocuments(match),
  ]);

  return { users: customers, total, page: safePage, limit: safeLimit };
}

/* ------------------------------------------------------------------ */
/* 2) Customer detail                                                   */
/* ------------------------------------------------------------------ */

export async function getCustomerById(id: string) {
  await connectDB();

  const user = await User.findOne({ _id: id, role: ROLE })
    .select("-passwordHash")
    .lean()
    .exec();

  if (!user) {
    throw new NotFoundError("Customer not found");
  }

  const bookingCount = await Booking.countDocuments({ customerId: id });

  return { user, bookingCount };
}

/* ------------------------------------------------------------------ */
/* 3) Create                                                            */
/* ------------------------------------------------------------------ */

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function createCustomer(input: CreateCustomerInput) {
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
  return safeUser;
}

/* ------------------------------------------------------------------ */
/* 4) Update                                                            */
/* ------------------------------------------------------------------ */

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
}

export async function updateCustomer(userId: string, input: UpdateCustomerInput) {
  await connectDB();

  const user = await User.findOne({ _id: userId, role: ROLE });
  if (!user) {
    throw new NotFoundError("Customer not found");
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
  return safeUser;
}

/* ------------------------------------------------------------------ */
/* 5) Block / unblock                                                   */
/* ------------------------------------------------------------------ */

export async function blockCustomer(userId: string) {
  await connectDB();

  const user = await User.findOne({ _id: userId, role: ROLE }).select("-passwordHash");
  if (!user) {
    throw new NotFoundError("Customer not found");
  }

  user.status = "suspended";
  await user.save();

  return user.toObject();
}

export async function unblockCustomer(userId: string) {
  await connectDB();

  const user = await User.findOne({ _id: userId, role: ROLE }).select("-passwordHash");
  if (!user) {
    throw new NotFoundError("Customer not found");
  }

  user.status = "active";
  await user.save();

  return user.toObject();
}

/* ------------------------------------------------------------------ */
/* 6) Delete                                                            */
/* ------------------------------------------------------------------ */

export async function deleteCustomer(userId: string, actingAdminId: string) {
  await connectDB();

  if (userId === actingAdminId) {
    throw new AppError("You cannot delete your own account", 403);
  }

  const user = await User.findOne({ _id: userId, role: ROLE });
  if (!user) {
    throw new NotFoundError("Customer not found");
  }

  // NOTE: hard delete — does not cascade to bookings/reviews. Same accepted
  // tradeoff as the original userManagementService; a future pass should
  // either soft-delete or clean up related collections first.
  await user.deleteOne();

  return { deletedId: userId };
}
