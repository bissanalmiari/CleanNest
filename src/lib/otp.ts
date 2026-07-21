// OTP generation and verification for email verification & password reset.
// Requires: npm install bcryptjs
import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/** How long a generated OTP stays valid. */
export const OTP_EXPIRY_MINUTES = 10;

/** Minimum time a user must wait before requesting another OTP for the same purpose. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = 10;

/** Generates a cryptographically-random numeric OTP, e.g. "482913". */
export function generateOtp(length: number = OTP_LENGTH): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

/** Hashes an OTP the same way passwords are hashed, so raw codes never touch the DB. */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_SALT_ROUNDS);
}

/** Compares a plaintext OTP against its stored hash. */
export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/** Returns the Date at which a freshly-generated OTP should expire. */
export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/** True if `expiresAt` is in the past (or missing). */
export function isOtpExpired(expiresAt?: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() < Date.now();
}

/**
 * True if a previous OTP was generated too recently to allow another one to be sent yet.
 * `expiresAt` is the expiry of the *existing* OTP; we back-compute when it was created.
 */
export function isWithinResendCooldown(expiresAt?: Date | null): boolean {
  if (!expiresAt) return false;
  const createdAtMs = expiresAt.getTime() - OTP_EXPIRY_MINUTES * 60 * 1000;
  const elapsedSeconds = (Date.now() - createdAtMs) / 1000;
  return elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS;
}
