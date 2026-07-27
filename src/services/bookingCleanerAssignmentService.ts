import "server-only";

import mongoose, { Types } from "mongoose";

import { AppError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";

import BookingModel from "@/models/Booking";
import BookingCleanerAssignmentHistoryModel from "@/models/BookingCleanerAssignmentHistory";

import type { AssignCleanerNameInput } from "@/validators/bookingValidator";

interface AssignCleanerNameOptions {
  adminId: string;
  bookingId: string;
  input: AssignCleanerNameInput;
}

type AssignmentAction = "assigned" | "reassigned" | "removed";

interface CleanerAssignmentResult {
  booking: {
    id: string;
    bookingNumber: string;
    status: string;

    bookingDate: string;
    startTime: string;
    endTime: string;

    previousCleanerName: string | null;
    assignedCleanerName: string | null;

    assignmentAction: AssignmentAction;
    assignmentNote: string | null;

    customerId: string;
    serviceId: string;
    addressId: string;
    serviceAreaId: string;

    historyId: string;
    updatedAt: string;
  };
}

function validateObjectId(value: string, fieldName: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`${fieldName} is invalid.`, 422);
  }

  return new Types.ObjectId(value);
}

function normalizeCleanerName(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function normalizeNote(value?: string) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function determineAssignmentAction({
  previousCleanerName,
  newCleanerName,
}: {
  previousCleanerName?: string;
  newCleanerName?: string;
}): AssignmentAction {
  if (!previousCleanerName && newCleanerName) {
    return "assigned";
  }

  if (previousCleanerName && newCleanerName) {
    return "reassigned";
  }

  return "removed";
}

function formatDateInBeirut(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new AppError("Unable to determine the booking date.", 500);
  }

  return `${year}-${month}-${day}`;
}

/*
 * Assigns, replaces, or removes a cleaner name.
 *
 * There is no cleaner user account or cleaner ID.
 * The admin enters a plain name for the booking task.
 */
export async function assignCleanerNameToBooking({
  adminId,
  bookingId,
  input,
}: AssignCleanerNameOptions): Promise<CleanerAssignmentResult> {
  await connectDB();

  const adminObjectId = validateObjectId(adminId, "Admin ID");

  const bookingObjectId = validateObjectId(bookingId, "Booking ID");

  const nextCleanerName = normalizeCleanerName(input.assignedCleanerName);

  const assignmentNote = normalizeNote(input.note);

  const session = await mongoose.startSession();

  try {
    const transactionResult = await session.withTransaction(async () => {
      const booking = await BookingModel.findById(bookingObjectId).session(session).exec();

      if (!booking) {
        throw new AppError("The booking could not be found.", 404);
      }

      /*
       * Cleaner names are assigned before the
       * cleaning task starts.
       */
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        throw new AppError(
          "A cleaner name can only be assigned to a pending or confirmed booking.",
          409
        );
      }

      const previousCleanerName = booking.assignedCleanerName?.trim() || undefined;

      if (previousCleanerName === nextCleanerName) {
        throw new AppError(
          nextCleanerName
            ? `${nextCleanerName} is already assigned to this booking.`
            : "This booking does not currently have an assigned cleaner name.",
          422
        );
      }

      const assignmentAction = determineAssignmentAction({
        previousCleanerName,
        newCleanerName: nextCleanerName,
      });

      booking.assignedCleanerName = nextCleanerName;

      await booking.save({
        session,
      });

      const historyDocuments = await BookingCleanerAssignmentHistoryModel.create(
        [
          {
            bookingId: bookingObjectId,

            previousCleanerName,

            newCleanerName: nextCleanerName,

            action: assignmentAction,

            changedByUserId: adminObjectId,

            note: assignmentNote,
          },
        ],
        {
          session,
        }
      );

      const history = historyDocuments.at(0);

      if (!history) {
        throw new AppError("The cleaner-assignment history could not be created.", 500);
      }

      return {
        booking,
        history,
        previousCleanerName,
        assignmentAction,
      };
    });

    if (!transactionResult) {
      throw new AppError("The cleaner-assignment transaction did not return a booking.", 500);
    }

    const { booking, history, previousCleanerName, assignmentAction } = transactionResult;

    return {
      booking: {
        id: booking._id.toString(),

        bookingNumber: booking.bookingNumber,

        status: booking.status,

        bookingDate: formatDateInBeirut(booking.bookingDate),

        startTime: booking.startTime,

        endTime: booking.endTime,

        previousCleanerName: previousCleanerName ?? null,

        assignedCleanerName: booking.assignedCleanerName ?? null,

        assignmentAction,

        assignmentNote: assignmentNote ?? null,

        customerId: booking.customerId.toString(),

        serviceId: booking.serviceId.toString(),

        addressId: booking.addressId.toString(),

        serviceAreaId: booking.serviceAreaId.toString(),

        historyId: history._id.toString(),

        updatedAt: booking.updatedAt.toISOString(),
      },
    };
  } finally {
    await session.endSession();
  }
}
