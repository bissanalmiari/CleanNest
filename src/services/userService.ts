// userService: data-access layer for the User collection (profile features).
// Requires: npm install bcryptjs
import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AppError, NotFoundError } from "@/lib/apiError";
import type { PublicUser, UpdateProfileInput } from "@/types/user";

function toPublicUser(userDoc: any): PublicUser {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone ?? null,
    role: userDoc.role,
    status: userDoc.status,
    avatarUrl: userDoc.avatarUrl ?? null,
    createdAt: userDoc.createdAt.toISOString(),
    updatedAt: userDoc.updatedAt.toISOString(),
  };
}

/** Retrieve profile information for a given user id. */
export async function getUserProfile(userId: string): Promise<PublicUser> {
  await connectDB();
  const userDoc = await User.findById(userId);
  if (!userDoc) throw new NotFoundError("User not found");
  return toPublicUser(userDoc);
}

/** Update profile (name, phone). Email/role/status are intentionally not editable here. */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<PublicUser> {
  await connectDB();
  const userDoc = await User.findById(userId);
  if (!userDoc) throw new NotFoundError("User not found");

  if (input.name !== undefined) userDoc.name = input.name;
  if (input.phone !== undefined) userDoc.phone = input.phone ?? undefined;

  await userDoc.save();
  return toPublicUser(userDoc);
}

/** Change password: verifies the current password before hashing and saving the new one. */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await connectDB();
  const userDoc = await User.findById(userId).select("+passwordHash");
  if (!userDoc) throw new NotFoundError("User not found");

  const isValid = await bcrypt.compare(currentPassword, userDoc.passwordHash);
  if (!isValid) throw new AppError("Current password is incorrect", 401);

  userDoc.passwordHash = await bcrypt.hash(newPassword, 12);
  await userDoc.save();
}

/** Persist the uploaded avatar URL on the user document. */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
  await connectDB();
  const userDoc = await User.findById(userId);
  if (!userDoc) throw new NotFoundError("User not found");

  userDoc.avatarUrl = avatarUrl;
  await userDoc.save();
  return toPublicUser(userDoc);
}