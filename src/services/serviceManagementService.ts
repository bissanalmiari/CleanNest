// src/services/serviceManagementService.ts
// Admin service-catalog data-access layer: list, detail, create, update, delete.

import "server-only";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import { AppError, NotFoundError } from "@/lib/apiError";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await Service.findOne({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  if (existing) {
    throw new AppError(`A service with slug "${slug}" already exists`, 409);
  }
}

/* ------------------------------------------------------------------ */
/* 1) List services (searchable + filterable + paginated)              */
/* ------------------------------------------------------------------ */

export interface ServiceListFilters {
  search?: string; // matches name
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getAllServices(filters: ServiceListFilters = {}) {
  await connectDB();

  const { search, category, isActive, page = 1, limit = 50 } = filters;

  const match: Record<string, unknown> = {};

  if (category) match.category = category;
  if (typeof isActive === "boolean") match.isActive = isActive;
  if (search) match.name = { $regex: search, $options: "i" };

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(200, Math.max(1, limit));

  const [services, total] = await Promise.all([
    Service.find(match)
      .sort({ name: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean()
      .exec(),
    Service.countDocuments(match),
  ]);

  return { services, total, page: safePage, limit: safeLimit };
}

/* ------------------------------------------------------------------ */
/* 2) Service detail                                                    */
/* ------------------------------------------------------------------ */

export async function getServiceById(id: string) {
  await connectDB();

  const service = await Service.findById(id).lean();
  if (!service) {
    throw new NotFoundError("Service not found");
  }

  return service;
}

/* ------------------------------------------------------------------ */
/* 3) Create                                                            */
/* ------------------------------------------------------------------ */

export interface CreateServiceInput {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  category: string;
  price: number;
  durationMinutes: number;
  includedSquareMeters?: number;
  pricePerAdditionalSquareMeter?: number;
  minutesPerAdditionalSquareMeter?: number;
  features?: string[];
  imageUrl?: string;
  isActive?: boolean;
}

export async function createService(input: CreateServiceInput) {
  await connectDB();

  const {
    name,
    category,
    price,
    durationMinutes,
    includedSquareMeters,
    pricePerAdditionalSquareMeter,
    minutesPerAdditionalSquareMeter,
    shortDescription,
    description,
    features,
    imageUrl,
  } = input;

  if (!name?.trim() || !category?.trim()) {
    throw new AppError("Name and category are required", 422);
  }
  if (!shortDescription?.trim()) {
    throw new AppError("Short description is required", 422);
  }
  if (!description?.trim()) {
    throw new AppError("Description is required", 422);
  }
  if (!(price > 0)) {
    throw new AppError("Price must be a positive number", 422);
  }
  if (!(durationMinutes > 0)) {
    throw new AppError("Duration must be a positive number of minutes", 422);
  }

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(name);
  await assertSlugAvailable(slug);

  const service = await Service.create({
    name: name.trim(),
    slug,
    shortDescription: shortDescription.trim(),
    description: description.trim(),
    category: category.trim(),
    price,
    durationMinutes,
    includedSquareMeters: includedSquareMeters ?? 60,
    pricePerAdditionalSquareMeter: pricePerAdditionalSquareMeter ?? 0.4,
    minutesPerAdditionalSquareMeter: minutesPerAdditionalSquareMeter ?? 0.75,
    features: features?.map((feature) => feature.trim()).filter(Boolean) ?? [],
    imageUrl: imageUrl?.trim() ?? "",
    isActive: input.isActive ?? true,
  });

  return service.toObject();
}

/* ------------------------------------------------------------------ */
/* 4) Update                                                            */
/* ------------------------------------------------------------------ */

export interface UpdateServiceInput {
  name?: string;
  slug?: string; // only regenerated if explicitly provided
  shortDescription?: string;
  description?: string;
  category?: string;
  price?: number;
  durationMinutes?: number;
  includedSquareMeters?: number;
  pricePerAdditionalSquareMeter?: number;
  minutesPerAdditionalSquareMeter?: number;
  features?: string[];
  imageUrl?: string;
  isActive?: boolean;
}

export async function updateService(id: string, input: UpdateServiceInput) {
  await connectDB();

  const service = await Service.findById(id);
  if (!service) {
    throw new NotFoundError("Service not found");
  }

  if (input.price !== undefined && !(input.price > 0)) {
    throw new AppError("Price must be a positive number", 422);
  }
  if (input.durationMinutes !== undefined && !(input.durationMinutes > 0)) {
    throw new AppError("Duration must be a positive number of minutes", 422);
  }

  // Slug is intentionally NOT regenerated from a new name automatically —
  // that would silently break any existing links to the old slug. Only
  // change it if the caller explicitly sends a new slug value.
  if (input.slug !== undefined) {
    const nextSlug = slugify(input.slug);
    await assertSlugAvailable(nextSlug, id);
    service.slug = nextSlug;
  }

  if (input.name !== undefined) service.name = input.name.trim();
  if (input.shortDescription !== undefined)
    service.shortDescription = input.shortDescription.trim();
  if (input.description !== undefined) service.description = input.description.trim();
  if (input.category !== undefined) service.category = input.category.trim();
  if (input.price !== undefined) service.price = input.price;
  if (input.durationMinutes !== undefined) service.durationMinutes = input.durationMinutes;
  if (input.includedSquareMeters !== undefined)
    service.includedSquareMeters = input.includedSquareMeters;
  if (input.pricePerAdditionalSquareMeter !== undefined)
    service.pricePerAdditionalSquareMeter = input.pricePerAdditionalSquareMeter;
  if (input.minutesPerAdditionalSquareMeter !== undefined)
    service.minutesPerAdditionalSquareMeter = input.minutesPerAdditionalSquareMeter;
  if (input.features !== undefined)
    service.features = input.features.map((feature) => feature.trim()).filter(Boolean);
  if (input.imageUrl !== undefined) service.imageUrl = input.imageUrl.trim();
  if (input.isActive !== undefined) service.isActive = input.isActive;

  await service.save();
  return service.toObject();
}

/* ------------------------------------------------------------------ */
/* 5) Delete                                                            */
/* ------------------------------------------------------------------ */

export async function deleteService(id: string) {
  await connectDB();

  const service = await Service.findById(id);
  if (!service) {
    throw new NotFoundError("Service not found");
  }

  // NOTE: this is a hard delete. It does not cascade to ServiceAddon links
  // or historical Booking documents that reference this serviceId — those
  // will keep pointing at an id that no longer resolves. In practice,
  // setting isActive to false (a "soft delete") is usually the safer
  // operational choice for a service that has booking history, since it
  // hides the service from new bookings without breaking old records.
  // Hard delete is implemented here because it was explicitly requested.
  await service.deleteOne();

  return { deletedId: id };
}
