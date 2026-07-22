// Role middleware: guards Route Handlers by requiring a valid session and,
// optionally, a specific set of roles (e.g. requireRole("admin")).
import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/apiError";
import type { PublicUser } from "@/types/user";
import type { UserRole } from "@/types/enums";

/**
 * Ensures a request is authenticated AND the user's role is one of `roles`.
 * Throws UnauthorizedError (401) if not logged in, ForbiddenError (403) if
 * logged in but the role doesn't match. Call this at the top of a Route
 * Handler:
 *
 *   const user = await requireRole("admin");
 *   const user = await requireRole("admin", "cleaner");
 */
export async function requireRole(...roles: UserRole[]): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("You must be logged in to do this");

  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ForbiddenError("You do not have permission to perform this action");
  }

  return user;
}

/** Convenience wrapper for admin-only endpoints. */
export async function requireAdmin(): Promise<PublicUser> {
  return requireRole("admin");
}
