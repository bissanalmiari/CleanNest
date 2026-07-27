import { NextResponse } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";

/** Thrown deliberately anywhere in the app for a known, expected failure. */
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be logged in to do this") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do this") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "This already exists") {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests — please try again shortly") {
    super(message, 429);
  }
}

/**
 * Central error handler for every API route. Call it from the `catch` block:
 *   catch (error) { return errorResponse(error); }
 *
 * IMPORTANT: order matters here — Mongoose's ValidationError and CastError
 * must be checked before the generic fallback, or every failed .create()/
 * .save() collapses into an opaque 500 with no indication of which field
 * actually failed (which is the exact bug that was happening).
 */
export function errorResponse(error: unknown) {
  // Our own deliberate throws (AppError and its subclasses).
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  // Zod input-validation failures (request body/query didn't match a schema).
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        issues: error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  // Mongoose schema validation failures (required fields missing, minlength,
  // enum mismatch, custom validators, etc.) — e.g. what "Service validation
  // failed" was. `error.errors` is a map of fieldName -> ValidatorError.
  if (error instanceof mongoose.Error.ValidationError) {
    const fieldErrors: Record<string, string> = {};
    for (const [field, validatorError] of Object.entries(error.errors)) {
      fieldErrors[field] = validatorError.message;
    }
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        issues: fieldErrors,
      },
      { status: 422 }
    );
  }

  // Malformed ObjectId passed to findById/findOne/etc.
  if (error instanceof mongoose.Error.CastError) {
    return NextResponse.json(
      { success: false, error: `Invalid value for '${error.path}'` },
      { status: 400 }
    );
  }

  // Duplicate key on a unique index (e.g. a slug or email that already exists).
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    const keyValue = (error as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "field";
    return NextResponse.json(
      { success: false, error: `This ${field} is already in use` },
      { status: 409 }
    );
  }

  // Truly unexpected — log the full error server-side, but never leak
  // internals to the client.
  console.error("[api-error]", error);
  return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
}
