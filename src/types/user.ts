import type { UserRole, UserStatus, Gender, PreferredLanguage } from "./enums";

// Plain client-side shapes (no Mongoose Document methods) — what API responses
// actually look like once serialized to JSON.

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  preferredLanguage: PreferredLanguage;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  customerId: string;
  serviceAreaId?: string;
  label: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  propertyType: "apartment" | "house" | "office" | "other";
  bedrooms: number;
  bathrooms: number;
  propertySize: number;
  isDefault: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  preferredLanguage?: PreferredLanguage;
  bio?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UploadAvatarResult {
  avatarUrl: string;
}
