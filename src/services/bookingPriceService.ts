import "server-only";

import { Types } from "mongoose";

import ServiceModel from "@/models/Service";
import AddonModel from "@/models/AddOn";
import ServiceAddonModel from "@/models/ServiceAddOn";
import PromoCodeModel from "@/models/PromoCode";

import type { BookingPricePreviewInput } from "@/validators/bookingValidator";

export type BookingPricingErrorCode =
  | "INVALID_ID"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_INACTIVE"
  | "ADDON_NOT_FOUND"
  | "ADDON_INACTIVE"
  | "ADDON_NOT_AVAILABLE"
  | "ADDON_QUANTITY_EXCEEDED"
  | "PROMO_NOT_FOUND"
  | "PROMO_INACTIVE"
  | "PROMO_NOT_STARTED"
  | "PROMO_EXPIRED"
  | "PROMO_USAGE_LIMIT_REACHED"
  | "PROMO_SERVICE_NOT_ALLOWED"
  | "PROMO_MINIMUM_NOT_REACHED"
  | "INVALID_PROPERTY";

export class BookingPricingError extends Error {
  readonly code: BookingPricingErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: BookingPricingErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);

    this.name = "BookingPricingError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface PropertyPricingResult {
  amount: number;
  extraDurationMinutes: number;
  lines: PropertyPriceLine[];
}

export interface PropertyPriceLine {
  code:
    | "property_type"
    | "bedrooms"
    | "bathrooms"
    | "property_size";

  label: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  extraDurationMinutes: number;
}

export interface BookingAddonPriceLine {
  addOnId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitExtraDurationMinutes: number;
  totalExtraDurationMinutes: number;
  maximumQuantity: number;
}

export interface AppliedPromoCode {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  discountAmount: number;
}

export interface BookingPriceQuote {
  currency: "USD";

  service: {
    id: string;
    name: string;
    basePrice: number;
    baseDurationMinutes: number;
  };

  property: {
    type: string;
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    adjustmentAmount: number;
    extraDurationMinutes: number;
    lines: PropertyPriceLine[];
  };

  addOns: BookingAddonPriceLine[];

  promoCode: AppliedPromoCode | null;

  serviceBaseAmount: number;
  propertyAdjustmentAmount: number;

  /*
   * baseAmount is the amount stored in Booking.
   * It includes the service price and property adjustment.
   */
  baseAmount: number;

  addOnsAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;

  serviceDurationMinutes: number;
  propertyExtraDurationMinutes: number;
  addOnsExtraDurationMinutes: number;
  estimatedDurationMinutes: number;
}

/*
 * These rules are centralized so they can be changed
 * without changing the calculation algorithm.
 *
 * All monetary values are in USD.
 */
export const PROPERTY_PRICING_RULES = {
  apartment: {
    flatAmount: 0,
    flatMinutes: 0,

    includedBedrooms: 1,
    extraBedroomAmount: 8,
    extraBedroomMinutes: 20,

    includedBathrooms: 1,
    extraBathroomAmount: 6,
    extraBathroomMinutes: 15,

    includedSize: 100,
    sizeStep: 50,
    sizeStepAmount: 7,
    sizeStepMinutes: 15,
  },

  house: {
    flatAmount: 15,
    flatMinutes: 30,

    includedBedrooms: 2,
    extraBedroomAmount: 10,
    extraBedroomMinutes: 25,

    includedBathrooms: 1,
    extraBathroomAmount: 7,
    extraBathroomMinutes: 20,

    includedSize: 150,
    sizeStep: 50,
    sizeStepAmount: 9,
    sizeStepMinutes: 20,
  },

  office: {
    flatAmount: 10,
    flatMinutes: 20,

    includedBedrooms: 0,
    extraBedroomAmount: 0,
    extraBedroomMinutes: 0,

    includedBathrooms: 1,
    extraBathroomAmount: 6,
    extraBathroomMinutes: 15,

    includedSize: 80,
    sizeStep: 40,
    sizeStepAmount: 10,
    sizeStepMinutes: 20,
  },

  other: {
    flatAmount: 5,
    flatMinutes: 15,

    includedBedrooms: 0,
    extraBedroomAmount: 8,
    extraBedroomMinutes: 20,

    includedBathrooms: 0,
    extraBathroomAmount: 6,
    extraBathroomMinutes: 15,

    includedSize: 50,
    sizeStep: 50,
    sizeStepAmount: 8,
    sizeStepMinutes: 15,
  },
} as const;

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

function safeNumber(
  value: unknown,
  fallback = 0,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toObjectId(
  value: string,
  fieldName: string,
) {
  if (!Types.ObjectId.isValid(value)) {
    throw new BookingPricingError(
      "INVALID_ID",
      `${fieldName} is invalid.`,
      400,
      {
        field: fieldName,
        value,
      },
    );
  }

  return new Types.ObjectId(value);
}

function calculateStepsAboveIncluded(
  value: number,
  includedValue: number,
  step: number,
) {
  if (
    value <= includedValue ||
    step <= 0
  ) {
    return 0;
  }

  return Math.ceil(
    (value - includedValue) / step,
  );
}

function calculatePropertyPricing(
  property: BookingPricePreviewInput["property"],
): PropertyPricingResult {
  const rules =
    PROPERTY_PRICING_RULES[
      property.propertyType
    ];

  if (!rules) {
    throw new BookingPricingError(
      "INVALID_PROPERTY",
      "The selected property type is invalid.",
    );
  }

  const bedrooms = Math.max(
    0,
    safeNumber(property.bedrooms),
  );

  const bathrooms = Math.max(
    0,
    safeNumber(property.bathrooms),
  );

  const propertySize = Math.max(
    0,
    safeNumber(property.propertySize),
  );

  const lines: PropertyPriceLine[] = [];

  let amount = 0;
  let extraDurationMinutes = 0;

  if (
    rules.flatAmount > 0 ||
    rules.flatMinutes > 0
  ) {
    lines.push({
      code: "property_type",
      label: `${
        property.propertyType
          .charAt(0)
          .toUpperCase() +
        property.propertyType.slice(1)
      } property adjustment`,
      quantity: 1,
      unitAmount: rules.flatAmount,
      totalAmount: rules.flatAmount,
      extraDurationMinutes:
        rules.flatMinutes,
    });

    amount += rules.flatAmount;

    extraDurationMinutes +=
      rules.flatMinutes;
  }

  const extraBedrooms = Math.max(
    0,
    bedrooms -
      rules.includedBedrooms,
  );

  if (
    extraBedrooms > 0 &&
    rules.extraBedroomAmount > 0
  ) {
    const bedroomAmount =
      extraBedrooms *
      rules.extraBedroomAmount;

    const bedroomMinutes =
      extraBedrooms *
      rules.extraBedroomMinutes;

    lines.push({
      code: "bedrooms",
      label: "Additional bedrooms",
      quantity: extraBedrooms,
      unitAmount:
        rules.extraBedroomAmount,
      totalAmount: bedroomAmount,
      extraDurationMinutes:
        bedroomMinutes,
    });

    amount += bedroomAmount;

    extraDurationMinutes +=
      bedroomMinutes;
  }

  const extraBathrooms = Math.max(
    0,
    bathrooms -
      rules.includedBathrooms,
  );

  if (
    extraBathrooms > 0 &&
    rules.extraBathroomAmount > 0
  ) {
    const bathroomAmount =
      extraBathrooms *
      rules.extraBathroomAmount;

    const bathroomMinutes =
      extraBathrooms *
      rules.extraBathroomMinutes;

    lines.push({
      code: "bathrooms",
      label: "Additional bathrooms",
      quantity: extraBathrooms,
      unitAmount:
        rules.extraBathroomAmount,
      totalAmount: bathroomAmount,
      extraDurationMinutes:
        bathroomMinutes,
    });

    amount += bathroomAmount;

    extraDurationMinutes +=
      bathroomMinutes;
  }

  const sizeSteps =
    calculateStepsAboveIncluded(
      propertySize,
      rules.includedSize,
      rules.sizeStep,
    );

  if (
    sizeSteps > 0 &&
    rules.sizeStepAmount > 0
  ) {
    const sizeAmount =
      sizeSteps *
      rules.sizeStepAmount;

    const sizeMinutes =
      sizeSteps *
      rules.sizeStepMinutes;

    lines.push({
      code: "property_size",
      label: `Additional property size blocks of ${rules.sizeStep} m²`,
      quantity: sizeSteps,
      unitAmount:
        rules.sizeStepAmount,
      totalAmount: sizeAmount,
      extraDurationMinutes:
        sizeMinutes,
    });

    amount += sizeAmount;

    extraDurationMinutes +=
      sizeMinutes;
  }

  return {
    amount: roundMoney(amount),
    extraDurationMinutes,
    lines: lines.map((line) => ({
      ...line,
      unitAmount: roundMoney(
        line.unitAmount,
      ),
      totalAmount: roundMoney(
        line.totalAmount,
      ),
    })),
  };
}

async function calculateAddonPricing(
  serviceId: Types.ObjectId,
  selectedAddOns: BookingPricePreviewInput["addOns"],
) {
  if (selectedAddOns.length === 0) {
    return {
      lines: [] as BookingAddonPriceLine[],
      amount: 0,
      extraDurationMinutes: 0,
    };
  }

  const selectedAddOnIds =
    selectedAddOns.map((selection) =>
      toObjectId(
        selection.addOnId,
        "Add-on ID",
      ),
    );

  const serviceAddOnRelations =
    await ServiceAddonModel.find({
      serviceId,
      addonId: {
        $in: selectedAddOnIds,
      },
      isActive: true,
    }).exec();

  const relationByAddOnId = new Map(
    serviceAddOnRelations.map(
      (relation) => [
        relation.addonId.toString(),
        relation,
      ],
    ),
  );

  const addOns = await AddonModel.find({
    _id: {
      $in: selectedAddOnIds,
    },
  }).exec();

  const addOnById = new Map(
    addOns.map((addOn) => [
      addOn._id.toString(),
      addOn,
    ]),
  );

  const lines: BookingAddonPriceLine[] =
    [];

  let addOnsAmount = 0;
  let addOnsExtraDurationMinutes = 0;

  for (const selection of selectedAddOns) {
    const addOnId =
      selection.addOnId;

    const relation =
      relationByAddOnId.get(addOnId);

    if (!relation) {
      throw new BookingPricingError(
        "ADDON_NOT_AVAILABLE",
        "One of the selected add-ons is not available for this service.",
        400,
        {
          addOnId,
        },
      );
    }

    const addOn =
      addOnById.get(addOnId);

    if (!addOn) {
      throw new BookingPricingError(
        "ADDON_NOT_FOUND",
        "One of the selected add-ons could not be found.",
        404,
        {
          addOnId,
        },
      );
    }

    if (!addOn.isActive) {
      throw new BookingPricingError(
        "ADDON_INACTIVE",
        `${addOn.name} is currently unavailable.`,
        400,
        {
          addOnId,
          addOnName: addOn.name,
        },
      );
    }

    const maximumQuantity =
      relation.maxQuantity ??
      addOn.maxQuantity ??
      1;

    if (
      selection.quantity >
      maximumQuantity
    ) {
      throw new BookingPricingError(
        "ADDON_QUANTITY_EXCEEDED",
        `${addOn.name} allows a maximum quantity of ${maximumQuantity}.`,
        400,
        {
          addOnId,
          requestedQuantity:
            selection.quantity,
          maximumQuantity,
        },
      );
    }

    const unitPrice = roundMoney(
      relation.overridePrice ??
        addOn.price,
    );

    const unitExtraDurationMinutes =
      relation.overrideDurationMinutes ??
      addOn.extraDurationMinutes ??
      0;

    const totalPrice = roundMoney(
      unitPrice *
        selection.quantity,
    );

    const totalExtraDurationMinutes =
      unitExtraDurationMinutes *
      selection.quantity;

    lines.push({
      addOnId,
      name: addOn.name,
      description:
        addOn.description ?? "",
      quantity: selection.quantity,
      unitPrice,
      totalPrice,
      unitExtraDurationMinutes,
      totalExtraDurationMinutes,
      maximumQuantity,
    });

    addOnsAmount += totalPrice;

    addOnsExtraDurationMinutes +=
      totalExtraDurationMinutes;
  }

  return {
    lines,
    amount: roundMoney(
      addOnsAmount,
    ),
    extraDurationMinutes:
      addOnsExtraDurationMinutes,
  };
}

async function calculatePromoDiscount({
  promoCodeId,
  serviceId,
  subtotalAmount,
  now,
}: {
  promoCodeId?: string;
  serviceId: Types.ObjectId;
  subtotalAmount: number;
  now: Date;
}): Promise<AppliedPromoCode | null> {
  if (!promoCodeId?.trim()) {
    return null;
  }

  const promoObjectId = toObjectId(
    promoCodeId,
    "Promo-code ID",
  );

  const promoCode =
    await PromoCodeModel.findById(
      promoObjectId,
    ).exec();

  if (!promoCode) {
    throw new BookingPricingError(
      "PROMO_NOT_FOUND",
      "The selected promo code could not be found.",
      404,
    );
  }

  if (!promoCode.isActive) {
    throw new BookingPricingError(
      "PROMO_INACTIVE",
      "This promo code is not active.",
    );
  }

  const startDate =
    promoCode.startDate
      ? new Date(promoCode.startDate)
      : new Date(0);

  const expiryDate = new Date(
    promoCode.expiryDate,
  );

  if (
    now.getTime() <
    startDate.getTime()
  ) {
    throw new BookingPricingError(
      "PROMO_NOT_STARTED",
      "This promo code is not available yet.",
    );
  }

  if (
    now.getTime() >
    expiryDate.getTime()
  ) {
    throw new BookingPricingError(
      "PROMO_EXPIRED",
      "This promo code has expired.",
    );
  }

  const usageCount =
    promoCode.usageCount ?? 0;

  if (
    usageCount >=
    promoCode.maximumUses
  ) {
    throw new BookingPricingError(
      "PROMO_USAGE_LIMIT_REACHED",
      "This promo code has reached its maximum number of uses.",
    );
  }

  const applicableServiceIds =
    promoCode.applicableServiceIds ??
    [];

  const appliesToEveryService =
    applicableServiceIds.length === 0;

  const appliesToSelectedService =
    applicableServiceIds.some(
      (applicableServiceId) =>
        applicableServiceId.toString() ===
        serviceId.toString(),
    );

  if (
    !appliesToEveryService &&
    !appliesToSelectedService
  ) {
    throw new BookingPricingError(
      "PROMO_SERVICE_NOT_ALLOWED",
      "This promo code does not apply to the selected service.",
    );
  }

  const minimumBookingAmount =
    promoCode.minimumBookingAmount ??
    0;

  if (
    subtotalAmount <
    minimumBookingAmount
  ) {
    throw new BookingPricingError(
      "PROMO_MINIMUM_NOT_REACHED",
      `This promo code requires a minimum booking amount of $${roundMoney(
        minimumBookingAmount,
      ).toFixed(2)}.`,
      400,
      {
        subtotalAmount,
        minimumBookingAmount,
      },
    );
  }

  let discountAmount = 0;

  if (
    promoCode.discountType ===
    "percentage"
  ) {
    discountAmount =
      subtotalAmount *
      (promoCode.discountValue / 100);

    const maximumDiscountAmount =
      promoCode.maximumDiscountAmount;

    if (
      maximumDiscountAmount !==
        undefined &&
      maximumDiscountAmount !== null
    ) {
      discountAmount = Math.min(
        discountAmount,
        maximumDiscountAmount,
      );
    }
  } else {
    discountAmount =
      promoCode.discountValue;
  }

  discountAmount = roundMoney(
    Math.min(
      Math.max(discountAmount, 0),
      subtotalAmount,
    ),
  );

  return {
    id: promoCode._id.toString(),
    code: promoCode.code,
    description:
      promoCode.description ?? "",
    discountType:
      promoCode.discountType,
    discountValue: roundMoney(
      promoCode.discountValue,
    ),
    discountAmount,
  };
}

/*
 * Generates a trusted server-side booking quote.
 *
 * The route calling this service must establish the
 * MongoDB connection before invoking this function.
 */
export async function calculateBookingPrice(
  input: BookingPricePreviewInput,
  options?: {
    now?: Date;
  },
): Promise<BookingPriceQuote> {
  const now =
    options?.now ?? new Date();

  const serviceObjectId = toObjectId(
    input.serviceId,
    "Service ID",
  );

  const service =
    await ServiceModel.findById(
      serviceObjectId,
    ).exec();

  if (!service) {
    throw new BookingPricingError(
      "SERVICE_NOT_FOUND",
      "The selected service could not be found.",
      404,
    );
  }

  if (!service.isActive) {
    throw new BookingPricingError(
      "SERVICE_INACTIVE",
      "The selected service is currently unavailable.",
    );
  }

  const serviceBaseAmount =
    roundMoney(service.price);

  const serviceDurationMinutes =
    Math.max(
      0,
      safeNumber(
        service.durationMinutes,
      ),
    );

  const propertyPricing =
    calculatePropertyPricing(
      input.property,
    );

  const addOnPricing =
    await calculateAddonPricing(
      serviceObjectId,
      input.addOns,
    );

  const propertyAdjustmentAmount =
    propertyPricing.amount;

  const baseAmount = roundMoney(
    serviceBaseAmount +
      propertyAdjustmentAmount,
  );

  const addOnsAmount =
    addOnPricing.amount;

  const subtotalAmount = roundMoney(
    baseAmount + addOnsAmount,
  );

  const appliedPromo =
    await calculatePromoDiscount({
      promoCodeId:
        input.promoCodeId || undefined,
      serviceId: serviceObjectId,
      subtotalAmount,
      now,
    });

  const discountAmount =
    appliedPromo?.discountAmount ?? 0;

  const totalAmount = roundMoney(
    Math.max(
      0,
      subtotalAmount -
        discountAmount,
    ),
  );

  const estimatedDurationMinutes =
    serviceDurationMinutes +
    propertyPricing.extraDurationMinutes +
    addOnPricing.extraDurationMinutes;

  return {
    currency: "USD",

    service: {
      id: service._id.toString(),
      name: service.name,
      basePrice:
        serviceBaseAmount,
      baseDurationMinutes:
        serviceDurationMinutes,
    },

    property: {
      type: input.property.propertyType,
      bedrooms:
        input.property.bedrooms,
      bathrooms:
        input.property.bathrooms,
      size:
        input.property.propertySize,
      adjustmentAmount:
        propertyAdjustmentAmount,
      extraDurationMinutes:
        propertyPricing.extraDurationMinutes,
      lines: propertyPricing.lines,
    },

    addOns: addOnPricing.lines,

    promoCode: appliedPromo,

    serviceBaseAmount,
    propertyAdjustmentAmount,
    baseAmount,
    addOnsAmount,
    subtotalAmount,
    discountAmount,
    totalAmount,

    serviceDurationMinutes,
    propertyExtraDurationMinutes:
      propertyPricing.extraDurationMinutes,
    addOnsExtraDurationMinutes:
      addOnPricing.extraDurationMinutes,
    estimatedDurationMinutes,
  };
}