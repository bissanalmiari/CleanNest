import { UserRole, UserStatus } from "@/types/enums";
import { Schema, models, model, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;

  // Email-verification OTP (sent on register / resend-otp)
  emailVerificationOtpHash?: string | null;
  emailVerificationOtpExpires?: Date | null;

  // Password-reset OTP (sent on forgot-password)
  passwordResetOtpHash?: string | null;
  passwordResetOtpExpires?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: ["customer", "admin", "cleaner"],
      default: "customer",
    },
    status: {
      // Kept in sync with UserStatus in src/types/enums.ts
      type: String,
      enum: ["active", "suspended", "pending_verification"],
      default: "pending_verification",
    },
    avatarUrl: {
      type: String,
      default: null,
    },

    emailVerificationOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    passwordResetOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
export default User;