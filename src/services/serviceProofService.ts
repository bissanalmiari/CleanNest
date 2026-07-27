import "server-only";

import { Types } from "mongoose";

import { AppError, ForbiddenError, NotFoundError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import CleanerAssignment from "@/models/CleanerAssignment";
import ServiceProof, { type IServiceProof } from "@/models/ServiceProof";
import type { PublicUser } from "@/types/user";
import type { ServiceProofReport } from "@/types/serviceProof";
import { createNotification, notifyActiveAdmins } from "@/services/notificationService";

const MAX_PHOTOS_PER_STAGE = 5;
const MAX_ISSUES = 10;

type LocationInput = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

type ProofSource = {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  cleanerId:
    | Types.ObjectId
    | { _id: Types.ObjectId; name?: string };
  checklist: Array<{
    key: string;
    label: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  beforePhotos: Array<{ url: string; uploadedAt: Date }>;
  afterPhotos: Array<{ url: string; uploadedAt: Date }>;
  issues: Array<{
    description: string;
    photos: Array<{ url: string; uploadedAt: Date }>;
    reportedAt: Date;
  }>;
  onMyWayAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  checkInLocation?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
};

function taskKey(label: string, index: number) {
  return `${index + 1}-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)}`;
}

function defaultChecklist(
  features: string[],
  property: { bedrooms?: number; bathrooms?: number },
) {
  const labels = [
    ...features.slice(0, 8),
    "Dust and wipe reachable surfaces",
    "Vacuum or mop all accessible floors",
    ...(property.bedrooms ? ["Complete bedroom cleaning"] : []),
    ...(property.bathrooms ? ["Sanitize bathrooms and fixtures"] : []),
    "Remove waste and leave bags in the agreed location",
    "Complete final quality inspection",
  ];
  const unique = [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
  return unique.map((label, index) => ({
    key: taskKey(label, index),
    label,
    completed: false,
  }));
}

async function assignmentContext(cleanerId: string, bookingId: string) {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new AppError("Booking ID is invalid", 422);
  }
  await connectDB();
  const assignment = await CleanerAssignment.findOne({
    cleanerId,
    bookingId,
    status: { $ne: "declined" },
  }).lean();
  if (!assignment) throw new NotFoundError("Job assignment not found");

  const booking = await Booking.findById(bookingId)
    .populate({ path: "serviceId", select: "features" })
    .lean();
  if (!booking) throw new NotFoundError("Booking not found");
  return { assignment, booking };
}

function toReport(
  proof: IServiceProof | ProofSource,
  cleanerName = "Cleaning professional",
): ServiceProofReport {
  const populatedCleaner =
    typeof proof.cleanerId === "object" &&
    proof.cleanerId !== null &&
    "name" in proof.cleanerId
      ? proof.cleanerId
      : null;
  const checklist = proof.checklist.map(
    (task: {
      key: string;
      label: string;
      completed: boolean;
      completedAt?: Date;
    }) => ({
      key: task.key,
      label: task.label,
      completed: task.completed,
      completedAt: task.completedAt?.toISOString() ?? null,
    }),
  );
  const photos = (items: Array<{ url: string; uploadedAt: Date }>) =>
    items.map((photo) => ({
      url: photo.url,
      uploadedAt: photo.uploadedAt.toISOString(),
    }));
  const completed = checklist.filter(
    (task: { completed: boolean }) => task.completed,
  ).length;
  const readyToComplete =
    Boolean(proof.checkedInAt) &&
    checklist.length > 0 &&
    completed === checklist.length &&
    proof.beforePhotos.length > 0 &&
    proof.afterPhotos.length > 0;

  return {
    id: proof._id.toString(),
    bookingId: proof.bookingId.toString(),
    assignmentId: proof.assignmentId.toString(),
    cleanerId: populatedCleaner
      ? populatedCleaner._id.toString()
      : proof.cleanerId.toString(),
    cleanerName: populatedCleaner?.name ?? cleanerName,
    checklist,
    beforePhotos: photos(proof.beforePhotos),
    afterPhotos: photos(proof.afterPhotos),
    issues: proof.issues.map(
      (issue: {
        description: string;
        photos: Array<{ url: string; uploadedAt: Date }>;
        reportedAt: Date;
      }) => ({
        description: issue.description,
        photos: photos(issue.photos),
        reportedAt: issue.reportedAt.toISOString(),
      }),
    ),
    onMyWayAt: proof.onMyWayAt?.toISOString() ?? null,
    checkedInAt: proof.checkedInAt?.toISOString() ?? null,
    checkedOutAt: proof.checkedOutAt?.toISOString() ?? null,
    checkInLocation:
      typeof proof.checkInLocation?.latitude === "number" &&
      typeof proof.checkInLocation?.longitude === "number"
      ? {
          latitude: proof.checkInLocation.latitude,
          longitude: proof.checkInLocation.longitude,
          accuracy: proof.checkInLocation.accuracy ?? null,
        }
      : null,
    progress: {
      completed,
      total: checklist.length,
      percentage:
        checklist.length === 0
          ? 0
          : Math.round((completed / checklist.length) * 100),
      readyToComplete,
    },
  };
}

export async function getOrCreateServiceProof(
  cleanerId: string,
  bookingId: string,
) {
  const { assignment, booking } = await assignmentContext(cleanerId, bookingId);
  let proof = await ServiceProof.findOne({
    assignmentId: assignment._id,
  });

  if (!proof) {
    const populatedService = booking.serviceId as unknown as {
      features?: string[];
    };
    try {
      proof = await ServiceProof.create({
        bookingId,
        assignmentId: assignment._id,
        cleanerId,
        checklist: defaultChecklist(populatedService?.features ?? [], booking),
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        proof = await ServiceProof.findOne({ assignmentId: assignment._id });
      } else {
        throw error;
      }
    }
  }
  if (!proof) throw new AppError("Could not initialize service proof", 500);
  return toReport(proof);
}

export async function checkInServiceProof(
  cleanerId: string,
  bookingId: string,
  location?: LocationInput,
) {
  await getOrCreateServiceProof(cleanerId, bookingId);
  const proof = await ServiceProof.findOne({ cleanerId, bookingId });
  if (!proof) throw new NotFoundError("Service proof not found");
  if (!proof.checkedInAt) proof.checkedInAt = new Date();
  if (location) proof.checkInLocation = location;
  await proof.save();
  return toReport(proof);
}

export async function markCleanerOnMyWay(
  cleanerId: string,
  bookingId: string,
) {
  const { booking } = await assignmentContext(cleanerId, bookingId);
  const report = await getOrCreateServiceProof(cleanerId, bookingId);
  if (report.checkedInAt) {
    throw new AppError("You have already checked in to this job", 409);
  }
  const proof = await ServiceProof.findOne({ cleanerId, bookingId });
  if (!proof) throw new NotFoundError("Service proof not found");
  if (!proof.onMyWayAt) {
    proof.onMyWayAt = new Date();
    await proof.save();
  }
  await createNotification({
    userId: booking.customerId.toString(),
    type: "on_my_way",
    title: "Your cleaner is on the way",
    message: `Your cleaning professional is heading to booking ${booking.bookingNumber}.`,
    href: "/bookings",
    bookingId,
    dedupeKey: `on-my-way:${bookingId}:${cleanerId}`,
    email: true,
  }).catch((error) => console.error("[notification:on-my-way]", error));
  return toReport(proof);
}

export async function updateProofTask(
  cleanerId: string,
  bookingId: string,
  key: string,
  completed: boolean,
) {
  await getOrCreateServiceProof(cleanerId, bookingId);
  const proof = await ServiceProof.findOne({ cleanerId, bookingId });
  if (!proof) throw new NotFoundError("Service proof not found");
  if (!proof.checkedInAt) {
    throw new AppError("Check in before completing the checklist", 409);
  }
  if (proof.checkedOutAt) {
    throw new AppError("This service report is already finalized", 409);
  }
  const task = proof.checklist.find((item) => item.key === key);
  if (!task) throw new NotFoundError("Checklist item not found");
  task.completed = completed;
  task.completedAt = completed ? new Date() : undefined;
  await proof.save();
  return toReport(proof);
}

export async function addProofIssue(
  cleanerId: string,
  bookingId: string,
  description: string,
) {
  const normalized = description.trim();
  if (!normalized || normalized.length > 1000) {
    throw new AppError("Issue description must contain 1 to 1000 characters", 422);
  }
  await getOrCreateServiceProof(cleanerId, bookingId);
  const proof = await ServiceProof.findOne({ cleanerId, bookingId });
  if (!proof) throw new NotFoundError("Service proof not found");
  if (proof.issues.length >= MAX_ISSUES) {
    throw new AppError("A maximum of 10 issues can be reported", 409);
  }
  proof.issues.push({ description: normalized, photos: [], reportedAt: new Date() });
  await proof.save();
  await notifyActiveAdmins({
    type: "issue_reported",
    title: "Cleaner reported a job issue",
    message: normalized,
    href: `/admin/bookings/${bookingId}`,
    bookingId,
    dedupeKey: `issue:${proof._id.toString()}:${proof.issues.length}`,
    email: true,
  }).catch((error) => console.error("[notification:issue]", error));
  return toReport(proof);
}

export async function addProofPhoto(
  cleanerId: string,
  bookingId: string,
  stage: "before" | "after",
  url: string,
) {
  await getOrCreateServiceProof(cleanerId, bookingId);
  const proof = await ServiceProof.findOne({ cleanerId, bookingId });
  if (!proof) throw new NotFoundError("Service proof not found");
  if (proof.checkedOutAt) {
    throw new AppError("This service report is already finalized", 409);
  }
  const target = stage === "before" ? proof.beforePhotos : proof.afterPhotos;
  if (stage === "after" && !proof.checkedInAt) {
    throw new AppError("Check in before adding after photos", 409);
  }
  if (target.length >= MAX_PHOTOS_PER_STAGE) {
    throw new AppError(`A maximum of ${MAX_PHOTOS_PER_STAGE} ${stage} photos is allowed`, 409);
  }
  target.push({ url, uploadedAt: new Date() });
  await proof.save();
  return toReport(proof);
}

export async function assertProofReadyAndCheckOut(
  cleanerId: string,
  bookingId: string,
) {
  const proof = await ServiceProof.findOne({ cleanerId, bookingId });
  if (!proof?.checkedInAt) {
    throw new AppError("Check in before completing this job", 409);
  }
  if (proof.checklist.some((task) => !task.completed)) {
    throw new AppError("Complete every checklist item before finishing", 409);
  }
  if (proof.beforePhotos.length === 0 || proof.afterPhotos.length === 0) {
    throw new AppError("Add at least one before and one after photo", 409);
  }
  if (!proof.checkedOutAt) {
    proof.checkedOutAt = new Date();
    await proof.save();
  }
  return toReport(proof);
}

export async function getBookingProofReports(
  currentUser: PublicUser,
  bookingId: string,
) {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new AppError("Booking ID is invalid", 422);
  }
  await connectDB();
  const booking = await Booking.findById(bookingId).select("customerId").lean();
  if (!booking) throw new NotFoundError("Booking not found");

  if (
    currentUser.role === "customer" &&
    booking.customerId.toString() !== currentUser.id
  ) {
    throw new ForbiddenError("This report belongs to another customer");
  }
  if (currentUser.role === "cleaner") {
    const ownsAssignment = await CleanerAssignment.exists({
      bookingId,
      cleanerId: currentUser.id,
    });
    if (!ownsAssignment) throw new ForbiddenError("This report is not assigned to you");
  }

  const filter =
    currentUser.role === "cleaner"
      ? { bookingId, cleanerId: currentUser.id }
      : { bookingId };
  const proofs = await ServiceProof.find(filter)
    .populate({ path: "cleanerId", select: "name" })
    .sort({ createdAt: 1 })
    .lean();
  return proofs.map((proof) =>
    toReport(proof as unknown as ProofSource),
  );
}
