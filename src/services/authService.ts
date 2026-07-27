// authService: business logic for register / login / logout / OTP verification
// / forgot-password / reset-password. Route Handlers under src/app/api/auth/*
// should stay thin and delegate here.
import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/User";
import { signAuthToken } from "@/lib/auth";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  getOtpExpiryDate,
  isOtpExpired,
  isWithinResendCooldown,
} from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import {
  AppError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/lib/apiError";
import type {
  RegisterValues,
  LoginValues,
  ForgotPasswordValues,
  ResetPasswordValues,
  VerifyEmailValues,
  ResendOtpValues,
} from "@/validators/authValidator";
import type { PublicUser } from "@/types/user";

const PASSWORD_SALT_ROUNDS = 12;

function toPublicUser(userDoc: IUser): PublicUser {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone ?? null,
    role: userDoc.role,
    status: userDoc.status,
    avatarUrl: userDoc.avatarUrl ?? null,
    dateOfBirth: userDoc.dateOfBirth?.toISOString() ?? null,
    gender: userDoc.gender ?? null,
    preferredLanguage: userDoc.preferredLanguage,
    bio: userDoc.bio ?? null,
    createdAt: userDoc.createdAt.toISOString(),
    updatedAt: userDoc.updatedAt.toISOString(),
  };
}

/**
 * Creates a new user in "pending_verification" status and emails them an OTP.
 * The account cannot log in until verifyEmailOtp() is called successfully.
 */
export async function registerUser(input: RegisterValues): Promise<{ user: PublicUser }> {
  await connectDB();

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  const userDoc = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: input.role ?? "customer",
    status: "pending_verification",
    emailVerificationOtpHash: otpHash,
    emailVerificationOtpExpires: getOtpExpiryDate(),
  });

  await sendOtpEmail(userDoc.email, otp, "verify-email");

  return { user: toPublicUser(userDoc) };
}

/**
 * Logs a user in. Only "active" accounts may log in — accounts still in
 * "pending_verification" must verify their email first, and "suspended"
 * accounts are rejected outright.
 */
export async function loginUser(input: LoginValues): Promise<{ user: PublicUser; token: string }> {
  await connectDB();

  const userDoc = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!userDoc) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(input.password, userDoc.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (userDoc.status === "pending_verification") {
    throw new AppError("Please verify your email before logging in", 403);
  }
  if (userDoc.status === "suspended") {
    throw new AppError("This account has been suspended. Contact support for help.", 403);
  }

  const token = signAuthToken({ sub: userDoc._id.toString(), role: userDoc.role });
  return { user: toPublicUser(userDoc), token };
}

/**
 * Confirms a registration OTP, activates the account, and returns a fresh
 * session token so the client can be logged in immediately after verifying.
 */
export async function verifyEmailOtp(
  input: VerifyEmailValues
): Promise<{ user: PublicUser; token: string }> {
  await connectDB();

  const userDoc = await User.findOne({ email: input.email }).select(
    "+emailVerificationOtpHash +emailVerificationOtpExpires"
  );
  if (!userDoc) throw new NotFoundError("No account found for this email");

  if (userDoc.status === "active") {
    throw new AppError("This account is already verified", 409);
  }

  if (!userDoc.emailVerificationOtpHash || isOtpExpired(userDoc.emailVerificationOtpExpires)) {
    throw new AppError("This code has expired. Please request a new one.", 400);
  }

  const isValid = await verifyOtpHash(input.otp, userDoc.emailVerificationOtpHash);
  if (!isValid) {
    throw new AppError("Invalid verification code", 400);
  }

  userDoc.status = "active";
  userDoc.emailVerificationOtpHash = null;
  userDoc.emailVerificationOtpExpires = null;
  await userDoc.save();

  const token = signAuthToken({ sub: userDoc._id.toString(), role: userDoc.role });
  return { user: toPublicUser(userDoc), token };
}

/** Re-sends a fresh email-verification OTP, subject to a short resend cooldown. */
export async function resendEmailVerificationOtp(input: ResendOtpValues): Promise<void> {
  await connectDB();

  const userDoc = await User.findOne({ email: input.email }).select("+emailVerificationOtpExpires");
  if (!userDoc) throw new NotFoundError("No account found for this email");

  if (userDoc.status === "active") {
    throw new AppError("This account is already verified", 409);
  }

  if (isWithinResendCooldown(userDoc.emailVerificationOtpExpires)) {
    throw new TooManyRequestsError("Please wait a moment before requesting another code");
  }

  const otp = generateOtp();
  userDoc.emailVerificationOtpHash = await hashOtp(otp);
  userDoc.emailVerificationOtpExpires = getOtpExpiryDate();
  await userDoc.save();

  await sendOtpEmail(userDoc.email, otp, "verify-email");
}

/**
 * Always resolves successfully (even for unknown emails) so the endpoint
 * can't be used to enumerate registered accounts. Only sends an OTP when an
 * account actually exists for that email.
 */
export async function forgotPassword(input: ForgotPasswordValues): Promise<void> {
  await connectDB();

  const userDoc = await User.findOne({ email: input.email }).select("+passwordResetOtpExpires");
  if (!userDoc) return;

  if (isWithinResendCooldown(userDoc.passwordResetOtpExpires)) {
    // Silently no-op rather than revealing timing details to the caller.
    return;
  }

  const otp = generateOtp();
  userDoc.passwordResetOtpHash = await hashOtp(otp);
  userDoc.passwordResetOtpExpires = getOtpExpiryDate();
  await userDoc.save();

  await sendOtpEmail(userDoc.email, otp, "reset-password");
}

/** Verifies the password-reset OTP and, if valid, sets the new password. */
export async function resetPassword(input: ResetPasswordValues): Promise<void> {
  await connectDB();

  const userDoc = await User.findOne({ email: input.email }).select(
    "+passwordResetOtpHash +passwordResetOtpExpires"
  );
  if (!userDoc) throw new NotFoundError("No account found for this email");

  if (!userDoc.passwordResetOtpHash || isOtpExpired(userDoc.passwordResetOtpExpires)) {
    throw new AppError("This code has expired. Please request a new one.", 400);
  }

  const isValid = await verifyOtpHash(input.otp, userDoc.passwordResetOtpHash);
  if (!isValid) {
    throw new AppError("Invalid verification code", 400);
  }

  userDoc.passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_SALT_ROUNDS);
  userDoc.passwordResetOtpHash = null;
  userDoc.passwordResetOtpExpires = null;
  await userDoc.save();
}
