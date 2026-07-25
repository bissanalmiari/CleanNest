// Lightweight JWT-based session helper for Route Handlers / Server Components.
// Requires: npm install jsonwebtoken bcryptjs
// Env: AUTH_SECRET (already in .env.local.example)
import "server-only";
import { cookies } from "next/headers";
import jwt,  { type SignOptions } from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/User";
import { ForbiddenError, UnauthorizedError } from "@/lib/apiError";
import type { PublicUser} from "@/types/user";
import { UserRole } from "@/types/enums";

const AUTH_COOKIE = "cleannest_token";
const JWT_SECRET = process.env.AUTH_SECRET as string;
const JWT_EXPIRES_IN = process.env.AUTH_TOKEN_EXPIRES_IN ?? "7d";

if (!JWT_SECRET) {
  // Thrown at import time only when actually used server-side.
  console.warn("[auth] AUTH_SECRET is not set — set it in .env.local");
}

interface TokenPayload {
  sub: string; // user id
  role: UserRole;
}

export function signAuthToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

type AuthenticatedUserRecord = Pick<
  IUser,
  | "name"
  | "email"
  | "phone"
  | "role"
  | "status"
  | "avatarUrl"
  | "dateOfBirth"
  | "gender"
  | "preferredLanguage"
  | "bio"
  | "createdAt"
  | "updatedAt"
> & {
  _id: { toString(): string };
};

function toPublicUser(userDoc: AuthenticatedUserRecord): PublicUser {
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

/** Returns the logged-in user, or null if no valid session cookie is present. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  await connectDB();
  const userDoc = await User.findById(payload.sub)
    .select(
      "name email phone role status avatarUrl dateOfBirth gender preferredLanguage bio createdAt updatedAt",
    )
    .lean()
    .exec();
  if (!userDoc || userDoc.status !== "active") return null;

  return toPublicUser(userDoc as AuthenticatedUserRecord);
}

/** Same as getCurrentUser but throws a 401 AppError when unauthenticated. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("You must be logged in to do this");
  return user;
}

/**
 * Role middleware for API routes — the real security boundary for RBAC.
 * Call at the top of any Route Handler that only specific roles may reach:
 *
 *   const admin = await requireRole("admin");
 *
 * Throws 401 if there's no session, 403 if the session's role isn't allowed.
 * Client-side redirects (middleware, <RequireAuth>) are only a UX nicety —
 * this function is what actually keeps a cleaner from calling an admin
 * endpoint by hand.
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<PublicUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `This action requires one of these roles: ${allowedRoles.join(", ")}`
    );
  }
  return user;
}
