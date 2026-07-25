import "server-only";

import { randomInt } from "node:crypto";

import mongoose, {
    Types,
    type ClientSession,
} from "mongoose";

import { AppError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";

import AddressModel from "@/models/Address";
import BookingModel from "@/models/Booking";
import BookingAddonModel from "@/models/BookingAddOn";
import BookingStatusHistoryModel from "@/models/BookingStatusHistory";
import PromoCodeModel from "@/models/PromoCode";
import PromoCodeUsageModel from "@/models/PromoCodeUsage";
import ServiceAreaModel from "@/models/ServiceArea";

import {
    bookingDateTimeToUtc,
    type CreateBookingInput,
} from "@/validators/bookingValidator";

import {
    calculateBookingPrice,
    type BookingPriceQuote,
} from "@/services/bookingPriceService";

import { checkBookingAvailability } from "@/services/bookingAvailabilityService";

interface CreateCustomerBookingOptions {
    customerId: string;
    input: CreateBookingInput;
}

interface BookingAddressSummary {
    id: string;
    label: string;
    city: string;
    area: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
}

interface BookingCreationResult {
    booking: {
        id: string;
        bookingNumber: string;
        status: string;
        source: string;
        frequency: string;

        bookingDate: string;
        startTime: string;
        endTime: string;
        estimatedDurationMinutes: number;

        property: {
            type: string;
            bedrooms?: number;
            bathrooms?: number;
            size?: number;
        };

        assignedCleanerName: string | null;

        paymentMethod: string;
        paymentStatus: string;

        customerNotes: string | null;

        address: BookingAddressSummary;

        serviceArea: {
            id: string;
            city: string;
            area: string;
            serviceFee: number;
        };

        service: BookingPriceQuote["service"];

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

        createdAt: string;
    };
}

const MAX_BOOKING_NUMBER_ATTEMPTS = 10;

function roundMoney(value: number) {
    return (
        Math.round(
            (value + Number.EPSILON) * 100,
        ) / 100
    );
}

function normalizeLocationText(value: string) {
    return value.trim().toLowerCase();
}

function validateObjectId(
    value: string,
    fieldName: string,
) {
    if (!Types.ObjectId.isValid(value)) {
        throw new AppError(
            `${fieldName} is invalid.`,
            422,
        );
    }

    return new Types.ObjectId(value);
}

function timeToMinutes(time: string) {
    const [hours = 0, minutes = 0] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
    const hours = Math.floor(
        totalMinutes / 60,
    );

    const minutes =
        totalMinutes % 60;

    return `${String(hours).padStart(
        2,
        "0",
    )}:${String(minutes).padStart(
        2,
        "0",
    )}`;
}

/*
 * The real end time is calculated from the trusted
 * service, property and add-on duration.
 */
function calculateEndTime(
    startTime: string,
    durationMinutes: number,
) {
    const startMinutes =
        timeToMinutes(startTime);

    const endMinutes =
        startMinutes + durationMinutes;

    if (endMinutes >= 24 * 60) {
        throw new AppError(
            "This cleaning plan extends past midnight. Please select an earlier start time.",
            422,
        );
    }

    return minutesToTime(endMinutes);
}

function bookingNumberDatePart() {
    const now = new Date();

    const year = String(
        now.getUTCFullYear(),
    ).slice(-2);

    const month = String(
        now.getUTCMonth() + 1,
    ).padStart(2, "0");

    const day = String(
        now.getUTCDate(),
    ).padStart(2, "0");

    return `${year}${month}${day}`;
}

async function generateBookingNumber(
    session: ClientSession,
) {
    const datePart =
        bookingNumberDatePart();

    for (
        let attempt = 0;
        attempt <
        MAX_BOOKING_NUMBER_ATTEMPTS;
        attempt += 1
    ) {
        const randomPart = String(
            randomInt(100000, 1000000),
        );

        const bookingNumber =
            `CN-${datePart}-${randomPart}`;

        const alreadyExists =
            await BookingModel.exists({
                bookingNumber,
            }).session(session);

        if (!alreadyExists) {
            return bookingNumber;
        }
    }

    throw new AppError(
        "Unable to generate a booking number. Please try again.",
        500,
    );
}

async function consumePromoCodeUsage({
    promoCodeId,
    customerId,
    bookingId,
    discountAmount,
    session,
}: {
    promoCodeId?: string;
    customerId: Types.ObjectId;
    bookingId: Types.ObjectId;
    discountAmount: number;
    session: ClientSession;
}) {
    if (!promoCodeId) {
        return;
    }

    const promoObjectId =
        validateObjectId(
            promoCodeId,
            "Promo-code ID",
        );

    const promoCode =
        await PromoCodeModel.findById(
            promoObjectId,
        )
            .select(
                "perCustomerLimit",
            )
            .session(session)
            .lean()
            .exec();

    if (!promoCode) {
        throw new AppError(
            "The selected promo code could not be found.",
            404,
        );
    }

    const [
        trackedUsageCount,
        bookingUsageCount,
    ] = await Promise.all([
        PromoCodeUsageModel.countDocuments({
            promoCodeId:
                promoObjectId,
            customerId,
        }).session(session),
        BookingModel.countDocuments({
            promoCodeId:
                promoObjectId,
            customerId,
            _id: {
                $ne: bookingId,
            },
        }).session(session),
    ]);
    const customerUsageCount =
        Math.max(
            trackedUsageCount,
            bookingUsageCount,
        );

    if (
        customerUsageCount >=
        promoCode.perCustomerLimit
    ) {
        throw new AppError(
            "You have already used this promo code the maximum number of times.",
            409,
        );
    }

    /*
     * The usage condition and increment happen atomically,
     * preventing the maximum-use limit from being exceeded.
     */
    const updateResult =
        await PromoCodeModel.updateOne(
            {
                _id: promoObjectId,
                isActive: true,

                $expr: {
                    $lt: [
                        {
                            $ifNull: [
                                "$usageCount",
                                0,
                            ],
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
            },
        );

    if (
        updateResult.modifiedCount !== 1
    ) {
        throw new AppError(
            "The selected promo code is no longer available.",
            409,
        );
    }

    await PromoCodeUsageModel.create(
        [
            {
                promoCodeId:
                    promoObjectId,
                customerId,
                bookingId,
                discountAmount,
                usedAt:
                    new Date(),
            },
        ],
        {
            session,
        },
    );
}

export async function createCustomerBooking({
    customerId,
    input,
}: CreateCustomerBookingOptions): Promise<BookingCreationResult> {
    await connectDB();

    const customerObjectId =
        validateObjectId(
            customerId,
            "Customer ID",
        );

    const serviceObjectId =
        validateObjectId(
            input.serviceId,
            "Service ID",
        );

    const addressObjectId =
        validateObjectId(
            input.addressId,
            "Address ID",
        );

    const serviceAreaObjectId =
        validateObjectId(
            input.serviceAreaId,
            "Service-area ID",
        );

    /*
     * A customer may only book using one of their
     * own active saved addresses.
     */
    const address =
        await AddressModel.findOne({
            _id: addressObjectId,
            customerId: customerObjectId,
            isActive: true,
        }).exec();

    if (!address) {
        throw new AppError(
            "The selected address could not be found.",
            404,
        );
    }

    const serviceArea =
        await ServiceAreaModel.findById(
            serviceAreaObjectId,
        ).exec();

    if (
        !serviceArea ||
        !serviceArea.isActive
    ) {
        throw new AppError(
            "The selected service area is unavailable.",
            404,
        );
    }

    /*
     * New address records contain serviceAreaId.
     * Older records are matched using city and area.
     */
    if (address.serviceAreaId) {
        if (
            address.serviceAreaId.toString() !==
            serviceAreaObjectId.toString()
        ) {
            throw new AppError(
                "The selected address does not belong to this service area.",
                422,
            );
        }
    } else {
        const addressCity =
            normalizeLocationText(
                address.city,
            );

        const addressArea =
            normalizeLocationText(
                address.area,
            );

        const serviceAreaCity =
            normalizeLocationText(
                serviceArea.city,
            );

        const serviceAreaName =
            normalizeLocationText(
                serviceArea.area,
            );

        if (
            addressCity !== serviceAreaCity ||
            addressArea !== serviceAreaName
        ) {
            throw new AppError(
                "The selected address is outside this service area.",
                422,
            );
        }
    }

    /*
     * The server loads all prices and durations from
     * MongoDB. Client-submitted prices are never trusted.
     */
    const priceQuote =
        await calculateBookingPrice(
          {
            serviceId: input.serviceId,

            promoCodeId:
                input.promoCodeId ||
                undefined,

            property: input.property,
            addOns: input.addOns,
            frequency: input.frequency,
          },
          {
            customerId,
          },
        );

    const estimatedDurationMinutes =
        priceQuote.estimatedDurationMinutes;

    const calculatedEndTime =
        calculateEndTime(
            input.startTime,
            estimatedDurationMinutes,
        );

    /*
     * Availability uses the server-calculated end time.
     * input.endTime is intentionally not trusted.
     */
    const availability =
        await checkBookingAvailability(
            {
                serviceId: input.serviceId,
                serviceAreaId:
                    input.serviceAreaId,
                bookingDate:
                    input.bookingDate,
                startTime:
                    input.startTime,
                endTime:
                    calculatedEndTime,
            },
            {
                maximumConcurrentBookings:
                    serviceArea
                        .maximumConcurrentBookings,
            },
        );

    if (!availability.available) {
        throw new AppError(
            availability.message,
            409,
        );
    }

    const serviceAreaFee =
        roundMoney(
            serviceArea.serviceFee ?? 0,
        );

    /*
     * The promo discount applies to the service and
     * add-ons. The service-area fee is added afterward.
     */
    const subtotalAmount =
        roundMoney(
            priceQuote.subtotalAmount +
            serviceAreaFee,
        );

    const totalAmount =
        roundMoney(
            priceQuote.totalAmount +
            serviceAreaFee,
        );

    /*
     * bookingDate stores the selected Lebanon calendar
     * date at the beginning of that local day.
     */
    const bookingDate =
        bookingDateTimeToUtc(
            input.bookingDate,
            "00:00",
        );

    const session =
        await mongoose.startSession();

    try {
        /*
         * Return the new document directly from the transaction.
         * This avoids assigning to an outer variable, which caused
         * TypeScript to incorrectly infer `createdBooking` as never.
         */
        const createdBooking =
            await session.withTransaction(
                async () => {
                    /*
                     * Connect an older address record to the matched
                     * service area after successful validation.
                     */
                    if (!address.serviceAreaId) {
                        await AddressModel.updateOne(
                            {
                                _id: addressObjectId,
                                customerId:
                                    customerObjectId,
                            },
                            {
                                $set: {
                                    serviceAreaId:
                                        serviceAreaObjectId,
                                },
                            },
                            {
                                session,
                            },
                        );
                    }

                    const bookingNumber =
                        await generateBookingNumber(
                            session,
                        );

                    const bookingDocuments =
                        await BookingModel.create(
                            [
                                {
                                    bookingNumber,

                                    customerId:
                                        customerObjectId,

                                    serviceId:
                                        serviceObjectId,

                                    addressId:
                                        addressObjectId,

                                    createdByUserId:
                                        customerObjectId,

                                    serviceAreaId:
                                        serviceAreaObjectId,

                                    promoCodeId:
                                        priceQuote.promoCode
                                            ? new Types.ObjectId(
                                                priceQuote
                                                    .promoCode.id,
                                            )
                                            : undefined,

                                    source: "customer",
                                    status: "pending",

                                    frequency:
                                        input.frequency,

                                    bookingDate,

                                    startTime:
                                        input.startTime,

                                    endTime:
                                        calculatedEndTime,

                                    estimatedDurationMinutes,

                                    propertyType:
                                        input.property
                                            .propertyType,

                                    bedrooms:
                                        input.property
                                            .bedrooms,

                                    bathrooms:
                                        input.property
                                            .bathrooms,

                                    propertySize:
                                        input.property
                                            .propertySize,

                                    baseAmount:
                                        priceQuote.baseAmount,

                                    serviceBaseAmount:
                                        priceQuote
                                            .serviceBaseAmount,

                                    propertyAdjustmentAmount:
                                        priceQuote
                                            .propertyAdjustmentAmount,

                                    addOnsAmount:
                                        priceQuote
                                            .addOnsAmount,

                                    serviceAreaFee,

                                    discountAmount:
                                        priceQuote
                                            .discountAmount,

                                    totalAmount,

                                    paymentMethod:
                                        input.paymentMethod,

                                    paymentStatus:
                                        input.paymentMethod ===
                                            "card"
                                            ? "pending"
                                            : "unpaid",

                                    assignedCleanerName:
                                        undefined,

                                    customerNotes:
                                        input.customerNotes ||
                                        undefined,

                                    rescheduleCount: 0,
                                },
                            ],
                            {
                                session,
                            },
                        );

                    const booking =
                        bookingDocuments.at(0);

                    if (!booking) {
                        throw new AppError(
                            "The booking could not be created.",
                            500,
                        );
                    }

                    const bookingId =
                        booking._id as Types.ObjectId;

                    if (
                        priceQuote.addOns.length >
                        0
                    ) {
                        await BookingAddonModel.insertMany(
                            priceQuote.addOns.map(
                                (addOn) => ({
                                    bookingId,

                                    addonId:
                                        new Types.ObjectId(
                                            addOn.addOnId,
                                        ),

                                    addonName:
                                        addOn.name,

                                    quantity:
                                        addOn.quantity,

                                    unitPrice:
                                        addOn.unitPrice,

                                    lineTotal:
                                        addOn.totalPrice,

                                    unitExtraDurationMinutes:
                                        addOn
                                            .unitExtraDurationMinutes,

                                    totalExtraDurationMinutes:
                                        addOn
                                            .totalExtraDurationMinutes,
                                }),
                            ),
                            {
                                session,
                            },
                        );
                    }

                    await BookingStatusHistoryModel.create(
                        [
                            {
                                bookingId,

                                previousStatus:
                                    undefined,

                                newStatus:
                                    "pending",

                                changedByUserId:
                                    customerObjectId,

                                reason:
                                    "Booking created by customer.",

                                metadata: {
                                    source:
                                        "customer",

                                    paymentMethod:
                                        input.paymentMethod,
                                },
                            },
                        ],
                        {
                            session,
                        },
                    );

                    await consumePromoCodeUsage({
                        promoCodeId:
                            priceQuote.promoCode?.id,
                        customerId:
                            customerObjectId,
                        bookingId,
                        discountAmount:
                            priceQuote.discountAmount,
                        session,
                    });

                    return booking;
                },
            );

        if (!createdBooking) {
            throw new AppError(
                "The booking transaction did not return a booking.",
                500,
            );
        }

        return {
            booking: {
                id:
                    createdBooking._id.toString(),

                bookingNumber:
                    createdBooking.bookingNumber,

                status:
                    createdBooking.status,

                source:
                    createdBooking.source,

                frequency:
                    createdBooking.frequency,

                bookingDate:
                    input.bookingDate,

                startTime:
                    createdBooking.startTime,

                endTime:
                    createdBooking.endTime,

                estimatedDurationMinutes:
                    createdBooking
                        .estimatedDurationMinutes ??
                    estimatedDurationMinutes,

                property: {
                    type:
                        createdBooking
                            .propertyType,

                    bedrooms:
                        createdBooking.bedrooms,

                    bathrooms:
                        createdBooking.bathrooms,

                    size:
                        createdBooking
                            .propertySize,
                },

                assignedCleanerName:
                    createdBooking
                        .assignedCleanerName ??
                    null,

                paymentMethod:
                    createdBooking
                        .paymentMethod,

                paymentStatus:
                    createdBooking
                        .paymentStatus,

                customerNotes:
                    createdBooking
                        .customerNotes ??
                    null,

                address: {
                    id:
                        address._id.toString(),

                    label:
                        address.label,

                    city:
                        address.city,

                    area:
                        address.area,

                    street:
                        address.street,

                    building:
                        address.building ?? "",

                    floor:
                        address.floor ?? "",

                    apartment:
                        address.apartment ?? "",
                },

                serviceArea: {
                    id: serviceArea._id.toString(),

                    city: serviceArea.city,

                    area: serviceArea.area,

                    serviceFee: serviceAreaFee,
                },

                service:
                    priceQuote.service,

                addOns:
                    priceQuote.addOns,

                pricing: {
                    currency: "USD",

                    serviceBaseAmount:
                        priceQuote
                            .serviceBaseAmount,

                    propertyAdjustmentAmount:
                        priceQuote
                            .propertyAdjustmentAmount,

                    baseAmount:
                        priceQuote.baseAmount,

                    addOnsAmount:
                        priceQuote.addOnsAmount,

                    serviceAreaFee,

                    subtotalAmount,

                    discountAmount:
                        priceQuote.discountAmount,

                    totalAmount,

                    promoCode:
                        priceQuote.promoCode,
                },

                createdAt:
                    createdBooking
                        .createdAt
                        .toISOString(),
            },
        };
    } finally {
        await session.endSession();
    }
}
