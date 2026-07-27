// reviewService: business logic for reviews. Route handlers stay thin and
// just call into this file, matching the pattern in userService.ts.
import "server-only";
import { connectDB } from "@/lib/db";
import Review, { type IReview } from "@/models/Review";
import Booking from "@/models/Booking";
import CleanerAssignment from "@/models/CleanerAssignment";
import User from "@/models/User";
import Service from "@/models/Service";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/apiError";
import type { Review as ReviewDTO } from "@/types/payment";
import type {
  CreateReviewValues,
  UpdateReviewValues,
  ListReviewsQuery,
} from "@/validators/reviewValidator";

const REVIEW_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function toReviewDTO(doc: IReview, includePrivate = false): ReviewDTO {
  return {
    id: doc._id.toString(),
    bookingId: doc.bookingId.toString(),
    customerId: doc.customerId.toString(),
    serviceId: doc.serviceId?.toString(),
    rating: doc.rating,
    comment: doc.comment,
    tags: doc.tags ?? [],
    privateFeedback: includePrivate ? doc.privateFeedback : undefined,
    isVerified: doc.isVerified !== false,
    canEdit: Date.now() - doc.createdAt.getTime() <= REVIEW_EDIT_WINDOW_MS,
    beforeImages: doc.beforeImages,
    afterImages: doc.afterImages,
    adminReply: doc.adminReply,
    isVisible: doc.isVisible,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Creates a review for a completed booking the customer actually owns. */
export async function createReview(
  customerId: string,
  input: CreateReviewValues
): Promise<ReviewDTO> {
  await connectDB();

  const booking = await Booking.findById(input.bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customerId.toString() !== customerId) {
    throw new ForbiddenError("You can only review your own bookings");
  }
  if (booking.status !== "completed") {
    throw new AppError("You can only review a completed booking", 400);
  }

  const existing = await Review.findOne({ bookingId: input.bookingId });
  if (existing) throw new AppError("This booking has already been reviewed", 409);

  const doc = await Review.create({
    bookingId: input.bookingId,
    customerId,
    serviceId: booking.serviceId,
    rating: input.rating,
    comment: input.comment,
    tags: input.tags ?? [],
    privateFeedback: input.privateFeedback,
    isVerified: true,
    beforeImages: input.beforeImages ?? [],
    afterImages: input.afterImages ?? [],
  });

  return toReviewDTO(doc, true);
}

interface ListResult {
  reviews: ReviewDTO[];
  total: number;
  page: number;
  limit: number;
}

function anonymizeCustomerName(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "Verified customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.at(-1)?.charAt(0)}.`;
}

/**
 * Lists reviews, optionally scoped to a booking, customer, or cleaner.
 * `includeHidden` should only ever be true for admin callers — everyone
 * else only sees isVisible: true reviews.
 */
export async function listReviews(
  query: ListReviewsQuery,
  includeHidden: boolean,
  includePrivate = false
): Promise<ListResult> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (query.bookingId) filter.bookingId = query.bookingId;
  if (query.customerId) filter.customerId = query.customerId;
  if (!includeHidden) filter.isVisible = true;

  if (query.serviceId) {
    const serviceBookings = await Booking.find({ serviceId: query.serviceId }).select("_id");
    filter.$or = [
      { serviceId: query.serviceId },
      { bookingId: { $in: serviceBookings.map((booking) => booking._id) } },
    ];
  }

  // Reviews don't store cleanerId directly (a review is of a booking, and
  // cleaner assignment is tracked separately) — resolve it via CleanerAssignment.
  if (query.cleanerId) {
    const assignments = await CleanerAssignment.find({ cleanerId: query.cleanerId }).select(
      "bookingId"
    );
    const bookingIds = assignments.map((a: { bookingId: unknown }) => a.bookingId);
    filter.bookingId = filter.bookingId
      ? filter.bookingId // bookingId filter already narrower, keep it
      : { $in: bookingIds };
  }

  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Review.countDocuments(filter),
  ]);

  const bookingDocuments = await Booking.find({
    _id: { $in: docs.map((doc) => doc.bookingId) },
  })
    .select("_id serviceId")
    .lean();
  const serviceIdByBookingId = new Map(
    bookingDocuments.map((booking) => [booking._id.toString(), booking.serviceId.toString()])
  );
  const serviceIds = Array.from(
    new Set(
      docs
        .map(
          (doc) => doc.serviceId?.toString() ?? serviceIdByBookingId.get(doc.bookingId.toString())
        )
        .filter((value): value is string => Boolean(value))
    )
  );
  const [customers, services] = await Promise.all([
    User.find({ _id: { $in: docs.map((doc) => doc.customerId) } })
      .select("_id name")
      .lean(),
    Service.find({ _id: { $in: serviceIds } })
      .select("_id name")
      .lean(),
  ]);
  const customerNameById = new Map(
    customers.map((customer) => [customer._id.toString(), anonymizeCustomerName(customer.name)])
  );
  const serviceNameById = new Map(
    services.map((service) => [service._id.toString(), service.name])
  );

  return {
    reviews: docs.map((doc) => {
      const serviceId =
        doc.serviceId?.toString() ?? serviceIdByBookingId.get(doc.bookingId.toString());
      return {
        ...toReviewDTO(doc, includePrivate),
        serviceId,
        customerName: customerNameById.get(doc.customerId.toString()) ?? "Verified customer",
        serviceName: serviceId ? serviceNameById.get(serviceId) : undefined,
      };
    }),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getReviewById(reviewId: string): Promise<ReviewDTO> {
  await connectDB();
  const doc = await Review.findById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");
  return toReviewDTO(doc);
}

/** Owner-only edit of rating/comment/images. */
export async function updateReview(
  reviewId: string,
  requesterId: string,
  input: UpdateReviewValues
): Promise<ReviewDTO> {
  await connectDB();

  const doc = await Review.findById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");
  if (doc.customerId.toString() !== requesterId) {
    throw new ForbiddenError("You can only edit your own review");
  }
  if (Date.now() - doc.createdAt.getTime() > REVIEW_EDIT_WINDOW_MS) {
    throw new AppError("Reviews can only be edited within 7 days of submission", 409);
  }

  if (input.rating !== undefined) doc.rating = input.rating;
  if (input.comment !== undefined) doc.comment = input.comment;
  if (input.tags !== undefined) doc.tags = input.tags;
  if (input.privateFeedback !== undefined) doc.privateFeedback = input.privateFeedback;
  if (input.beforeImages !== undefined) doc.beforeImages = input.beforeImages;
  if (input.afterImages !== undefined) doc.afterImages = input.afterImages;

  await doc.save();
  return toReviewDTO(doc, true);
}

/** Admin-only: reply to a review. */
export async function replyToReview(reviewId: string, adminReply: string): Promise<ReviewDTO> {
  await connectDB();
  const doc = await Review.findById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");
  doc.adminReply = adminReply;
  await doc.save();
  return toReviewDTO(doc);
}

/** Admin-only: hide/show a review (e.g. abusive content) without deleting it. */
export async function setReviewVisibility(
  reviewId: string,
  isVisible: boolean
): Promise<ReviewDTO> {
  await connectDB();
  const doc = await Review.findById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");
  doc.isVisible = isVisible;
  await doc.save();
  return toReviewDTO(doc);
}

/** Deletes a review — allowed for its owner, or any admin. */
export async function deleteReview(
  reviewId: string,
  requesterId: string,
  requesterRole: string
): Promise<void> {
  await connectDB();

  const doc = await Review.findById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");

  const isOwner = doc.customerId.toString() === requesterId;
  const isAdmin = requesterRole === "admin";
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You do not have permission to delete this review");
  }

  await doc.deleteOne();
}

/** Used by the upload-image route to confirm the caller owns this booking before writing to Storage. */
export async function assertBookingOwnership(bookingId: string, customerId: string) {
  await connectDB();
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customerId.toString() !== customerId) {
    throw new ForbiddenError("You can only upload photos for your own bookings");
  }
  if (booking.status !== "completed") {
    throw new AppError("Photos can only be added to completed bookings", 400);
  }
  return booking;
}
