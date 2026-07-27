import "server-only";

import mongoose, { Types, type ClientSession } from "mongoose";

import { AppError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";

import AddressModel from "@/models/Address";
import BookingModel from "@/models/Booking";
import BookingAddonModel from "@/models/BookingAddOn";
import PromoCodeModel from "@/models/PromoCode";
import PromoCodeUsageModel from "@/models/PromoCodeUsage";
import ServiceAreaModel from "@/models/ServiceArea";

import {
  checkBookingChangeWindow,
  type BookingPricePreviewInput,
  type EditBookingInput,
} from "@/validators/bookingValidator";

import {
  BookingPricingError,
  calculateBookingPrice,
  type BookingPriceQuote,
} from "@/services/bookingPriceService";

import {
  BookingAvailabilityError,
  checkBookingAvailability,
} from "@/services/bookingAvailabilityService";

interface EditCustomerBookingOptions {
  customerId: string;
  bookingId: string;
  input: EditBookingInput;
}

interface EditedBookingResult {
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    frequency: string;

    bookingDate: string;
    startTime: string;
    endTime: string;
    estimatedDurationMinutes: number;

    property: {
      type: string;
      bedrooms: number | null;
      bathrooms: number | null;
      size: number | null;
    };

    address: {
      id: string;
      label: string;
      city: string;
      area: string;
      street: string;
      building: string;
      floor: string;
      apartment: string;
    };

    serviceArea: {
      id: string;
      city: string;
      area: string;
      serviceFee: number;
    };

    addOns: BookingPriceQuote["addOns"];

    pricing: {
      currency: "USD";
      serviceBaseAmount: number;
      propertyAdjustmentAmount: number;
      baseAmount: number;
      addOnsAmount: number;
      serviceAreaFee: number;
      subtotalAmount: number;
      discountAmount: number;
      totalAmount: number;
      promoCode: BookingPriceQuote["promoCode"];
    };

    paymentMethod: string;
    paymentStatus: string;
    customerNotes: string | null;
    assignedCleanerName: string | null;

    updatedAt: string;
  };
}

function validateObjectId(value: string, fieldName: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`${fieldName} is invalid.`, 422);
  }

  return new Types.ObjectId(value);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeLocationText(value: string) {
  return value.trim().toLowerCase();
}

function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function calculateEndTime(startTime: string, durationMinutes: number) {
  const startMinutes = timeToMinutes(startTime);

  const endMinutes = startMinutes + durationMinutes;

  if (endMinutes >= 24 * 60) {
    throw new AppError(
      "This cleaning plan extends past midnight. Please choose fewer add-ons or contact CleanNest support.",
      422
    );
  }

  return minutesToTime(endMinutes);
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

function fieldWasProvided(input: EditBookingInput, fieldName: keyof EditBookingInput) {
  return Object.prototype.hasOwnProperty.call(input, fieldName);
}

function mapPricingError(error: unknown): never {
  if (error instanceof BookingPricingError) {
    throw new AppError(error.message, error.statusCode);
  }

  throw error;
}

function mapAvailabilityError(error: unknown): never {
  if (error instanceof BookingAvailabilityError) {
    throw new AppError(error.message, error.statusCode);
  }

  throw error;
}

async function validateAddressAndServiceArea({
  customerId,
  addressId,
  serviceAreaId,
}: {
  customerId: Types.ObjectId;
  addressId: Types.ObjectId;
  serviceAreaId: Types.ObjectId;
}) {
  const [address, serviceArea] = await Promise.all([
    AddressModel.findOne({
      _id: addressId,
      customerId,
      isActive: true,
    }).exec(),

    ServiceAreaModel.findById(serviceAreaId).exec(),
  ]);

  if (!address) {
    throw new AppError("The selected address could not be found.", 404);
  }

  if (!serviceArea || !serviceArea.isActive) {
    throw new AppError("The selected service area is unavailable.", 404);
  }

  if (address.serviceAreaId) {
    if (address.serviceAreaId.toString() !== serviceAreaId.toString()) {
      throw new AppError("The selected address does not belong to this service area.", 422);
    }
  } else {
    const addressCity = normalizeLocationText(address.city);

    const addressArea = normalizeLocationText(address.area);

    const serviceCity = normalizeLocationText(serviceArea.city);

    const serviceAreaName = normalizeLocationText(serviceArea.area);

    if (addressCity !== serviceCity || addressArea !== serviceAreaName) {
      throw new AppError("The selected address is outside this service area.", 422);
    }
  }

  return {
    address,
    serviceArea,
  };
}

async function updatePromoUsage({
  previousPromoCodeId,
  nextPromoCodeId,
  customerId,
  bookingId,
  discountAmount,
  session,
}: {
  previousPromoCodeId?: string;
  nextPromoCodeId?: string;
  customerId: Types.ObjectId;
  bookingId: Types.ObjectId;
  discountAmount: number;
  session: ClientSession;
}) {
  if (previousPromoCodeId === nextPromoCodeId) {
    if (nextPromoCodeId) {
      await PromoCodeUsageModel.updateOne(
        {
          bookingId,
        },
        {
          $set: {
            promoCodeId: new Types.ObjectId(nextPromoCodeId),
            customerId,
            discountAmount,
          },
          $setOnInsert: {
            usedAt: new Date(),
          },
        },
        {
          upsert: true,
          session,
        }
      );
    }

    return;
  }

  /*
   * Release the usage consumed by the previous
   * promo code when it is removed or replaced.
   */
  if (previousPromoCodeId) {
    await PromoCodeModel.updateOne(
      {
        _id: new Types.ObjectId(previousPromoCodeId),
        usageCount: {
          $gt: 0,
        },
      },
      {
        $inc: {
          usageCount: -1,
        },
      },
      {
        session,
      }
    );

    await PromoCodeUsageModel.deleteOne({
      bookingId,
      promoCodeId: new Types.ObjectId(previousPromoCodeId),
    }).session(session);
  }

  /*
   * Consume the newly selected promo code atomically.
   */
  if (nextPromoCodeId) {
    const nextPromoObjectId = new Types.ObjectId(nextPromoCodeId);

    const promoCode = await PromoCodeModel.findById(nextPromoObjectId)
      .select("perCustomerLimit")
      .session(session)
      .lean()
      .exec();

    if (!promoCode) {
      throw new AppError("The selected promo code could not be found.", 404);
    }

    const [trackedUsageCount, bookingUsageCount] = await Promise.all([
      PromoCodeUsageModel.countDocuments({
        promoCodeId: nextPromoObjectId,
        customerId,
        bookingId: {
          $ne: bookingId,
        },
      }).session(session),
      BookingModel.countDocuments({
        promoCodeId: nextPromoObjectId,
        customerId,
        _id: {
          $ne: bookingId,
        },
      }).session(session),
    ]);
    const customerUsageCount = Math.max(trackedUsageCount, bookingUsageCount);

    if (customerUsageCount >= promoCode.perCustomerLimit) {
      throw new AppError("You have already used this promo code the maximum number of times.", 409);
    }

    const updateResult = await PromoCodeModel.updateOne(
      {
        _id: nextPromoObjectId,

        isActive: true,

        $expr: {
          $lt: [
            {
              $ifNull: ["$usageCount", 0],
            },
            "$maximumUses",
          ],
        },
      },
      {
        $inc: {
          usageCount: 1,
        },
      },
      {
        session,
      }
    );

    if (updateResult.modifiedCount !== 1) {
      throw new AppError("The selected promo code is no longer available.", 409);
    }

    await PromoCodeUsageModel.create(
      [
        {
          promoCodeId: nextPromoObjectId,
          customerId,
          bookingId,
          discountAmount,
          usedAt: new Date(),
        },
      ],
      {
        session,
      }
    );
  }
}

export async function editCustomerBooking({
  customerId,
  bookingId,
  input,
}: EditCustomerBookingOptions): Promise<EditedBookingResult> {
  await connectDB();

  const customerObjectId = validateObjectId(customerId, "Customer ID");

  const bookingObjectId = validateObjectId(bookingId, "Booking ID");

  const booking = await BookingModel.findOne({
    _id: bookingObjectId,
    customerId: customerObjectId,
  }).exec();

  if (!booking) {
    throw new AppError("The booking could not be found.", 404);
  }

  /*
   * Customers may only edit pending or confirmed bookings.
   */
  const changeWindow = checkBookingChangeWindow({
    bookingDate: booking.bookingDate,

    startTime: booking.startTime,

    status: booking.status,
  });

  if (!changeWindow.allowed) {
    throw new AppError(changeWindow.reason ?? "This booking can no longer be edited.", 409);
  }

  const currentBookingAddOns = await BookingAddonModel.find({
    bookingId: bookingObjectId,
  })
    .select(["addonId", "quantity"].join(" "))
    .lean()
    .exec();

  const nextAddressIdText = input.addressId ?? booking.addressId.toString();

  const nextServiceAreaIdText = input.serviceAreaId ?? booking.serviceAreaId.toString();

  const nextAddressObjectId = validateObjectId(nextAddressIdText, "Address ID");

  const nextServiceAreaObjectId = validateObjectId(nextServiceAreaIdText, "Service-area ID");

  const { address, serviceArea } = await validateAddressAndServiceArea({
    customerId: customerObjectId,

    addressId: nextAddressObjectId,

    serviceAreaId: nextServiceAreaObjectId,
  });

  const nextProperty: BookingPricePreviewInput["property"] = input.property ?? {
    propertyType: booking.propertyType,

    bedrooms: booking.bedrooms,

    bathrooms: booking.bathrooms,

    propertySize: booking.propertySize,
  };

  const nextAddOns: BookingPricePreviewInput["addOns"] =
    input.addOns ??
    currentBookingAddOns.map((addOn) => ({
      addOnId: addOn.addonId.toString(),

      quantity: addOn.quantity,
    }));

  const promoCodeWasProvided = fieldWasProvided(input, "promoCodeId");

  const nextPromoCodeId = promoCodeWasProvided
    ? input.promoCodeId?.trim() || undefined
    : booking.promoCodeId?.toString();

  let priceQuote: BookingPriceQuote;

  try {
    priceQuote = await calculateBookingPrice(
      {
        serviceId: booking.serviceId.toString(),

        promoCodeId: nextPromoCodeId,

        property: nextProperty,

        addOns: nextAddOns,

        frequency: booking.frequency,
      },
      {
        customerId,
        excludeBookingId: bookingId,
      }
    );
  } catch (error) {
    mapPricingError(error);
  }

  const estimatedDurationMinutes = priceQuote.estimatedDurationMinutes;

  const calculatedEndTime = calculateEndTime(booking.startTime, estimatedDurationMinutes);

  const bookingDateText = formatDateInBeirut(booking.bookingDate);

  /*
   * The date and start time remain unchanged, but a
   * property or add-on edit may change the duration.
   * Availability must therefore be checked again.
   */
  try {
    const availability = await checkBookingAvailability(
      {
        serviceId: booking.serviceId.toString(),

        serviceAreaId: nextServiceAreaObjectId.toString(),

        bookingDate: bookingDateText,

        startTime: booking.startTime,

        endTime: calculatedEndTime,

        excludeBookingId: bookingObjectId.toString(),
      },
      {
        maximumConcurrentBookings: serviceArea.maximumConcurrentBookings,
      }
    );

    if (!availability.available) {
      throw new AppError(availability.message, 409);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    mapAvailabilityError(error);
  }

  const serviceAreaFee = roundMoney(serviceArea.serviceFee ?? 0);

  const subtotalAmount = roundMoney(priceQuote.subtotalAmount + serviceAreaFee);

  const totalAmount = roundMoney(priceQuote.totalAmount + serviceAreaFee);

  const nextCustomerNotes = fieldWasProvided(input, "customerNotes")
    ? input.customerNotes?.trim() || undefined
    : booking.customerNotes;

  const nextPaymentMethod = input.paymentMethod ?? booking.paymentMethod;

  const appliedPromoCodeId = priceQuote.promoCode?.id;

  const session = await mongoose.startSession();

  try {
    const updatedBooking = await session.withTransaction(async () => {
      /*
       * Reload the booking inside the transaction so
       * a simultaneous status change cannot be ignored.
       */
      const transactionalBooking = await BookingModel.findOne({
        _id: bookingObjectId,
        customerId: customerObjectId,
      })
        .session(session)
        .exec();

      if (!transactionalBooking) {
        throw new AppError("The booking could not be found.", 404);
      }

      const latestChangeWindow = checkBookingChangeWindow({
        bookingDate: transactionalBooking.bookingDate,

        startTime: transactionalBooking.startTime,

        status: transactionalBooking.status,
      });

      if (!latestChangeWindow.allowed) {
        throw new AppError(
          latestChangeWindow.reason ?? "This booking can no longer be edited.",
          409
        );
      }

      await updatePromoUsage({
        previousPromoCodeId: transactionalBooking.promoCodeId?.toString(),

        nextPromoCodeId: appliedPromoCodeId,

        customerId: customerObjectId,

        bookingId: bookingObjectId,

        discountAmount: priceQuote.discountAmount,

        session,
      });

      transactionalBooking.addressId = nextAddressObjectId;

      transactionalBooking.serviceAreaId = nextServiceAreaObjectId;

      transactionalBooking.promoCodeId = appliedPromoCodeId
        ? new Types.ObjectId(appliedPromoCodeId)
        : undefined;

      transactionalBooking.propertyType = nextProperty.propertyType;

      transactionalBooking.bedrooms = nextProperty.bedrooms;

      transactionalBooking.bathrooms = nextProperty.bathrooms;

      transactionalBooking.propertySize = nextProperty.propertySize;

      transactionalBooking.endTime = calculatedEndTime;

      transactionalBooking.estimatedDurationMinutes = estimatedDurationMinutes;

      transactionalBooking.baseAmount = priceQuote.baseAmount;
      transactionalBooking.serviceBaseAmount = priceQuote.serviceBaseAmount;
      transactionalBooking.propertyAdjustmentAmount = priceQuote.propertyAdjustmentAmount;

      transactionalBooking.addOnsAmount = priceQuote.addOnsAmount;

      transactionalBooking.serviceAreaFee = serviceAreaFee;

      transactionalBooking.discountAmount = priceQuote.discountAmount;

      transactionalBooking.totalAmount = totalAmount;

      transactionalBooking.paymentMethod = nextPaymentMethod;

      /*
       * Changing from cash to card means payment
       * authorization is still pending.
       *
       * Changing from card to cash means payment is
       * collected after service.
       */
      if (
        transactionalBooking.paymentStatus !== "paid" &&
        transactionalBooking.paymentStatus !== "refunded"
      ) {
        transactionalBooking.paymentStatus = nextPaymentMethod === "card" ? "pending" : "unpaid";
      }

      transactionalBooking.customerNotes = nextCustomerNotes;

      await transactionalBooking.save({
        session,
      });

      /*
       * Replace booking add-ons with a fresh trusted
       * price snapshot.
       */
      await BookingAddonModel.deleteMany({
        bookingId: bookingObjectId,
      })
        .session(session)
        .exec();

      if (priceQuote.addOns.length > 0) {
        await BookingAddonModel.insertMany(
          priceQuote.addOns.map((addOn) => ({
            bookingId: bookingObjectId,

            addonId: new Types.ObjectId(addOn.addOnId),

            addonName: addOn.name,

            quantity: addOn.quantity,

            unitPrice: addOn.unitPrice,

            lineTotal: addOn.totalPrice,

            unitExtraDurationMinutes: addOn.unitExtraDurationMinutes,

            totalExtraDurationMinutes: addOn.totalExtraDurationMinutes,
          })),
          {
            session,
          }
        );
      }

      /*
       * Connect an older address record to the service
       * area after its city and area have been verified.
       */
      if (!address.serviceAreaId) {
        await AddressModel.updateOne(
          {
            _id: nextAddressObjectId,

            customerId: customerObjectId,
          },
          {
            $set: {
              serviceAreaId: nextServiceAreaObjectId,
            },
          },
          {
            session,
          }
        );
      }

      return transactionalBooking;
    });

    if (!updatedBooking) {
      throw new AppError("The booking update did not return a booking.", 500);
    }

    /*
     * This protects against an unexpected transaction
     * result where the selected promo changed but the
     * returned booking still contains the previous ID.
     */
    const returnedPromoCodeId = updatedBooking.promoCodeId?.toString();

    if (returnedPromoCodeId !== appliedPromoCodeId) {
      throw new AppError("The booking promo code could not be updated.", 500);
    }

    return {
      booking: {
        id: bookingObjectId.toString(),

        bookingNumber: updatedBooking.bookingNumber,

        status: updatedBooking.status,

        frequency: updatedBooking.frequency,

        bookingDate: bookingDateText,

        startTime: updatedBooking.startTime,

        endTime: updatedBooking.endTime,

        estimatedDurationMinutes:
          updatedBooking.estimatedDurationMinutes ?? estimatedDurationMinutes,

        property: {
          type: updatedBooking.propertyType,

          bedrooms: updatedBooking.bedrooms ?? null,

          bathrooms: updatedBooking.bathrooms ?? null,

          size: updatedBooking.propertySize ?? null,
        },

        address: {
          id: address._id.toString(),

          label: address.label,

          city: address.city,

          area: address.area,

          street: address.street,

          building: address.building ?? "",

          floor: address.floor ?? "",

          apartment: address.apartment ?? "",
        },

        serviceArea: {
          id: serviceArea._id.toString(),

          city: serviceArea.city,

          area: serviceArea.area,

          serviceFee: serviceAreaFee,
        },

        addOns: priceQuote.addOns,

        pricing: {
          currency: "USD",

          serviceBaseAmount: priceQuote.serviceBaseAmount,

          propertyAdjustmentAmount: priceQuote.propertyAdjustmentAmount,

          baseAmount: priceQuote.baseAmount,

          addOnsAmount: priceQuote.addOnsAmount,

          serviceAreaFee,

          subtotalAmount,

          discountAmount: priceQuote.discountAmount,

          totalAmount,

          promoCode: priceQuote.promoCode,
        },

        paymentMethod: updatedBooking.paymentMethod,

        paymentStatus: updatedBooking.paymentStatus,

        customerNotes: updatedBooking.customerNotes ?? null,

        assignedCleanerName: updatedBooking.assignedCleanerName ?? null,

        updatedAt: updatedBooking.updatedAt.toISOString(),
      },
    };
  } finally {
    await session.endSession();
  }
}
