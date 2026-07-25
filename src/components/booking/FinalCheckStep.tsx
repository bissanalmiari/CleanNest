"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  Banknote,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Home,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Tag,
  Timer,
  X,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

export type FinalCheckPaymentMethod =
  | "cash"
  | "card";

export type FinalCheckPropertyType =
  | "apartment"
  | "house"
  | "office"
  | "other";

export interface FinalCheckAddOn {
  addOnId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface FinalCheckDraft {
  serviceId: string;
  serviceName: string;

  propertyType: FinalCheckPropertyType;
  bedrooms: number;
  bathrooms: number;
  propertySize: number;

  addOns: FinalCheckAddOn[];

  addressId: string;
  addressLabel: string;

  serviceAreaId: string;
  serviceAreaLabel: string;
  serviceAreaFee: number;

  bookingDate: string;
  startTime: string;
  endTime: string;

  paymentMethod: FinalCheckPaymentMethod;
  customerNotes: string;
}

interface FinalCheckStepProps {
  draft: FinalCheckDraft;

  onPaymentMethodChange: (
    method: FinalCheckPaymentMethod,
  ) => void;

  onCustomerNotesChange: (
    notes: string,
  ) => void;
}

interface PropertyPriceLine {
  code: string;
  label: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  extraDurationMinutes: number;
}

interface QuoteAddOnLine {
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

interface AppliedPromoCode {
  id: string;
  code: string;
  description: string;

  discountType:
    | "percentage"
    | "fixed_amount";

  discountValue: number;
  discountAmount: number;
}

interface BookingPriceQuote {
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

  addOns: QuoteAddOnLine[];

  promoCode:
    | AppliedPromoCode
    | null;

  serviceBaseAmount: number;
  propertyAdjustmentAmount: number;

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

interface CreatedBooking {
  id: string;
  bookingNumber: string;
  status: string;

  bookingDate: string;
  startTime: string;
  endTime: string;

  estimatedDurationMinutes: number;

  pricing?: {
    currency: string;
    serviceAreaFee: number;
    totalAmount: number;
  };
}

interface ApiResponse {
  success?: boolean;

  data?: {
    quote?: unknown;
    booking?: unknown;
  };

  quote?: unknown;
  booking?: unknown;

  message?: unknown;
  error?: unknown;
}

function readString(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

function readNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsedValue =
    Number(value);

  return Number.isFinite(
    parsedValue,
  )
    ? parsedValue
    : fallback;
}

function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

function formatDuration(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "0 min";
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (
    remainingMinutes === 0
  ) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatClockTime(
  value: string,
): string {
  if (!value) {
    return "Not selected";
  }

  const [hours, minutes] =
    value
      .split(":")
      .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return value;
  }

  const date = new Date(
    Date.UTC(
      2000,
      0,
      1,
      hours ?? 0,
      minutes ?? 0,
    ),
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    },
  ).format(date);
}

function formatBookingDate(
  value: string,
): string {
  if (!value) {
    return "Not selected";
  }

  const [year, month, day] =
    value
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
    ),
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}

function propertyTypeLabel(
  value: FinalCheckPropertyType,
): string {
  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
}

function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const [hours, minutes] =
    startTime
      .split(":")
      .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    durationMinutes <= 0
  ) {
    return "";
  }

  const startMinutes =
    (hours ?? 0) * 60 +
    (minutes ?? 0);

  const endMinutes =
    startMinutes +
    durationMinutes;

  if (
    endMinutes >=
    24 * 60
  ) {
    return "";
  }

  const endHours =
    Math.floor(
      endMinutes / 60,
    );

  const endMinuteValue =
    endMinutes % 60;

  return `${String(
    endHours,
  ).padStart(2, "0")}:${String(
    endMinuteValue,
  ).padStart(2, "0")}`;
}

function extractErrorMessage(
  payload: ApiResponse,
  fallback: string,
): string {
  if (
    typeof payload.message ===
    "string"
  ) {
    return payload.message;
  }

  if (
    typeof payload.error ===
    "string"
  ) {
    return payload.error;
  }

  const errorRecord =
    asRecord(payload.error);

  if (
    errorRecord &&
    typeof errorRecord.message ===
      "string"
  ) {
    return errorRecord.message;
  }

  return fallback;
}

function normalizePropertyLine(
  value: unknown,
): PropertyPriceLine | null {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  return {
    code:
      readString(record.code),

    label:
      readString(
        record.label,
        "Property adjustment",
      ),

    quantity:
      readNumber(
        record.quantity,
      ),

    unitAmount:
      readNumber(
        record.unitAmount,
      ),

    totalAmount:
      readNumber(
        record.totalAmount,
      ),

    extraDurationMinutes:
      readNumber(
        record.extraDurationMinutes,
      ),
  };
}

function normalizeQuoteAddOn(
  value: unknown,
): QuoteAddOnLine | null {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  const addOnId =
    readString(
      record.addOnId,
    );

  if (!addOnId) {
    return null;
  }

  return {
    addOnId,

    name:
      readString(
        record.name,
        "Extra touch",
      ),

    description:
      readString(
        record.description,
      ),

    quantity:
      Math.max(
        1,
        readNumber(
          record.quantity,
          1,
        ),
      ),

    unitPrice:
      readNumber(
        record.unitPrice,
      ),

    totalPrice:
      readNumber(
        record.totalPrice,
      ),

    unitExtraDurationMinutes:
      readNumber(
        record.unitExtraDurationMinutes,
      ),

    totalExtraDurationMinutes:
      readNumber(
        record.totalExtraDurationMinutes,
      ),

    maximumQuantity:
      Math.max(
        1,
        readNumber(
          record.maximumQuantity,
          1,
        ),
      ),
  };
}

function normalizePromoCode(
  value: unknown,
): AppliedPromoCode | null {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  const id =
    readString(record.id);

  const code =
    readString(record.code);

  if (!id || !code) {
    return null;
  }

  const discountType =
    record.discountType ===
    "fixed_amount"
      ? "fixed_amount"
      : "percentage";

  return {
    id,
    code,

    description:
      readString(
        record.description,
      ),

    discountType,

    discountValue:
      readNumber(
        record.discountValue,
      ),

    discountAmount:
      readNumber(
        record.discountAmount,
      ),
  };
}

function normalizeQuote(
  value: unknown,
): BookingPriceQuote | null {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  const service =
    asRecord(
      record.service,
    );

  const property =
    asRecord(
      record.property,
    );

  if (
    !service ||
    !property
  ) {
    return null;
  }

  const serviceId =
    readString(service.id);

  if (!serviceId) {
    return null;
  }

  const propertyLines =
    Array.isArray(
      property.lines,
    )
      ? property.lines
          .map(
            normalizePropertyLine,
          )
          .filter(
            (
              line,
            ): line is PropertyPriceLine =>
              line !== null,
          )
      : [];

  const addOns =
    Array.isArray(
      record.addOns,
    )
      ? record.addOns
          .map(
            normalizeQuoteAddOn,
          )
          .filter(
            (
              addOn,
            ): addOn is QuoteAddOnLine =>
              addOn !== null,
          )
      : [];

  return {
    currency: "USD",

    service: {
      id: serviceId,

      name:
        readString(
          service.name,
          "Cleaning service",
        ),

      basePrice:
        readNumber(
          service.basePrice,
        ),

      baseDurationMinutes:
        readNumber(
          service.baseDurationMinutes,
        ),
    },

    property: {
      type:
        readString(
          property.type,
        ),

      bedrooms:
        property.bedrooms ===
        undefined
          ? undefined
          : readNumber(
              property.bedrooms,
            ),

      bathrooms:
        property.bathrooms ===
        undefined
          ? undefined
          : readNumber(
              property.bathrooms,
            ),

      size:
        property.size ===
        undefined
          ? undefined
          : readNumber(
              property.size,
            ),

      adjustmentAmount:
        readNumber(
          property.adjustmentAmount,
        ),

      extraDurationMinutes:
        readNumber(
          property.extraDurationMinutes,
        ),

      lines:
        propertyLines,
    },

    addOns,

    promoCode:
      normalizePromoCode(
        record.promoCode,
      ),

    serviceBaseAmount:
      readNumber(
        record.serviceBaseAmount,
    ),

    propertyAdjustmentAmount:
      readNumber(
        record.propertyAdjustmentAmount,
      ),

    baseAmount:
      readNumber(
        record.baseAmount,
      ),

    addOnsAmount:
      readNumber(
        record.addOnsAmount,
      ),

    subtotalAmount:
      readNumber(
        record.subtotalAmount,
      ),

    discountAmount:
      readNumber(
        record.discountAmount,
      ),

    totalAmount:
      readNumber(
        record.totalAmount,
      ),

    serviceDurationMinutes:
      readNumber(
        record.serviceDurationMinutes,
      ),

    propertyExtraDurationMinutes:
      readNumber(
        record.propertyExtraDurationMinutes,
      ),

    addOnsExtraDurationMinutes:
      readNumber(
        record.addOnsExtraDurationMinutes,
      ),

    estimatedDurationMinutes:
      readNumber(
        record.estimatedDurationMinutes,
      ),
  };
}

function extractQuote(
  payload: ApiResponse,
): BookingPriceQuote | null {
  return normalizeQuote(
    payload.data?.quote ??
      payload.quote,
  );
}

function normalizeCreatedBooking(
  value: unknown,
): CreatedBooking | null {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  const id =
    readString(record.id);

  const bookingNumber =
    readString(
      record.bookingNumber,
    );

  if (
    !id ||
    !bookingNumber
  ) {
    return null;
  }

  const pricing =
    asRecord(
      record.pricing,
    );

  return {
    id,
    bookingNumber,

    status:
      readString(
        record.status,
        "pending",
      ),

    bookingDate:
      readString(
        record.bookingDate,
      ),

    startTime:
      readString(
        record.startTime,
      ),

    endTime:
      readString(
        record.endTime,
      ),

    estimatedDurationMinutes:
      readNumber(
        record.estimatedDurationMinutes,
      ),

    pricing: pricing
      ? {
          currency:
            readString(
              pricing.currency,
              "USD",
            ),

          serviceAreaFee:
            readNumber(
              pricing.serviceAreaFee,
            ),

          totalAmount:
            readNumber(
              pricing.totalAmount,
            ),
        }
      : undefined,
  };
}

function extractCreatedBooking(
  payload: ApiResponse,
): CreatedBooking | null {
  return normalizeCreatedBooking(
    payload.data?.booking ??
      payload.booking,
  );
}

export default function FinalCheckStep({
  draft,
  onPaymentMethodChange,
  onCustomerNotesChange,
}: FinalCheckStepProps) {
  const router =
    useRouter();

  const prefersReducedMotion =
    useReducedMotion();

  const requestVersionRef =
    useRef(0);

  const redirectTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const [quote, setQuote] =
    useState<
      BookingPriceQuote | null
    >(null);

  const [
    isLoadingQuote,
    setIsLoadingQuote,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    quoteError,
    setQuoteError,
  ] = useState<
    string | null
  >(null);

  const [
    submissionError,
    setSubmissionError,
  ] = useState<
    string | null
  >(null);

  const [
    createdBooking,
    setCreatedBooking,
  ] = useState<
    CreatedBooking | null
  >(null);

  const [
    refreshNumber,
    setRefreshNumber,
  ] = useState(0);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCodeId, setAppliedPromoCodeId] =
    useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const pricingPayload =
    useMemo(
      () => ({
        serviceId:
          draft.serviceId,

        frequency:
          "one_time",

        property: {
          propertyType:
            draft.propertyType,

          bedrooms:
            draft.bedrooms,

          bathrooms:
            draft.bathrooms,

          propertySize:
            draft.propertySize,
        },

        addOns:
          draft.addOns.map(
            (addOn) => ({
              addOnId:
                addOn.addOnId,

              quantity:
                addOn.quantity,
            }),
          ),

        promoCodeId:
          appliedPromoCodeId ??
          undefined,
      }),
      [
        appliedPromoCodeId,
        draft.addOns,
        draft.bathrooms,
        draft.bedrooms,
        draft.propertySize,
        draft.propertyType,
        draft.serviceId,
      ],
    );

  useEffect(() => {
    return () => {
      if (
        redirectTimerRef.current
      ) {
        clearTimeout(
          redirectTimerRef.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!draft.serviceId) {
      setQuote(null);
      setIsLoadingQuote(false);

      setQuoteError(
        "A cleaning plan is required before requesting a price.",
      );

      return;
    }

    requestVersionRef.current +=
      1;

    const requestVersion =
      requestVersionRef.current;

    const controller =
      new AbortController();

    async function loadQuote() {
      setIsLoadingQuote(true);
      setQuoteError(null);
      setSubmissionError(null);

      try {
        const response =
          await fetch(
            "/api/customer/bookings/price-preview",
            {
              method: "POST",

              credentials:
                "include",

              cache:
                "no-store",

              signal:
                controller.signal,

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  pricingPayload,
                ),
            },
          );

        const responseText =
          await response.text();

        let payload:
          ApiResponse = {};

        if (
          responseText.trim()
        ) {
          try {
            payload =
              JSON.parse(
                responseText,
              ) as ApiResponse;
          } catch {
            throw new Error(
              "The pricing server returned an invalid response.",
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            extractErrorMessage(
              payload,
              "The trusted price could not be calculated.",
            ),
          );
        }

        const nextQuote =
          extractQuote(
            payload,
          );

        if (!nextQuote) {
          throw new Error(
            "The pricing response did not contain a valid quote.",
          );
        }

        if (
          requestVersion !==
          requestVersionRef.current
        ) {
          return;
        }

        setQuote(nextQuote);

        if (
          nextQuote.promoCode &&
          appliedPromoCodeId ===
            nextQuote.promoCode.id
        ) {
          setPromoMessage({
            type: "success",
            text: `${nextQuote.promoCode.code} applied — you save ${formatCurrency(
              nextQuote.promoCode.discountAmount,
            )}.`,
          });
        }
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        if (
          requestVersion !==
          requestVersionRef.current
        ) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "The trusted price could not be calculated.";

        if (appliedPromoCodeId) {
          setPromoMessage({
            type: "error",
            text: message,
          });
          setAppliedPromoCodeId(null);
        } else {
          setQuote(null);
          setQuoteError(message);
        }
      } finally {
        if (
          requestVersion ===
            requestVersionRef.current &&
          !controller.signal.aborted
        ) {
          setIsLoadingQuote(
            false,
          );
        }
      }
    }

    void loadQuote();

    return () => {
      controller.abort();
    };
  }, [
    appliedPromoCodeId,
    pricingPayload,
    refreshNumber,
    draft.serviceId,
  ]);

  async function handleApplyPromoCode() {
    const code = promoInput.trim().toUpperCase();
    if (!code || isApplyingPromo) {
      if (!code) {
        setPromoMessage({
          type: "error",
          text: "Enter a promo code first.",
        });
      }
      return;
    }

    setIsApplyingPromo(true);
    setPromoMessage(null);

    try {
      const response = await fetch(
        "/api/promo-codes/validate",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            serviceId: draft.serviceId,
            bookingAmount:
              quote?.subtotalAmount,
          }),
        },
      );
      const payload = (await response.json()) as {
        success?: boolean;
        data?: {
          promoCode?: {
            id?: string;
            code?: string;
          };
        };
        error?: string;
      };
      const promoCode = payload.data?.promoCode;

      if (
        !response.ok ||
        !payload.success ||
        !promoCode?.id
      ) {
        throw new Error(
          payload.error ??
            "This promo code could not be applied.",
        );
      }

      setPromoInput(promoCode.code ?? code);
      setAppliedPromoCodeId(promoCode.id);
    } catch (error) {
      setPromoMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "This promo code could not be applied.",
      });
    } finally {
      setIsApplyingPromo(false);
    }
  }

  function handleRemovePromoCode() {
    setAppliedPromoCodeId(null);
    setPromoInput("");
    setPromoMessage(null);
  }

  const trustedEndTime =
    useMemo(() => {
      if (!quote) {
        return draft.endTime;
      }

      return calculateEndTime(
        draft.startTime,
        quote.estimatedDurationMinutes,
      );
    }, [
      draft.endTime,
      draft.startTime,
      quote,
    ]);

  const subtotalWithAreaFee =
    useMemo(() => {
      if (!quote) {
        return 0;
      }

      return roundMoney(
        quote.subtotalAmount +
          draft.serviceAreaFee,
      );
    }, [
      draft.serviceAreaFee,
      quote,
    ]);

  const finalTotalAmount =
    useMemo(() => {
      if (!quote) {
        return 0;
      }

      return roundMoney(
        quote.totalAmount +
          draft.serviceAreaFee,
      );
    }, [
      draft.serviceAreaFee,
      quote,
    ]);

  const notesLength =
    draft.customerNotes.length;

  const isComplete =
    Boolean(
      draft.serviceId &&
        draft.addressId &&
        draft.serviceAreaId &&
        draft.bookingDate &&
        draft.startTime &&
        trustedEndTime &&
        quote,
    );

  async function handleCreateBooking() {
    if (
      !quote ||
      !isComplete ||
      isSubmitting ||
      createdBooking
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response =
        await fetch(
          "/api/customer/bookings/create",
          {
            method: "POST",

            credentials:
              "include",

            cache:
              "no-store",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                serviceId:
                  draft.serviceId,

                addressId:
                  draft.addressId,

                serviceAreaId:
                  draft.serviceAreaId,

                promoCodeId:
                  appliedPromoCodeId ??
                  undefined,

                frequency:
                  "one_time",

                property: {
                  propertyType:
                    draft.propertyType,

                  bedrooms:
                    draft.bedrooms,

                  bathrooms:
                    draft.bathrooms,

                  propertySize:
                    draft.propertySize,
                },

                addOns:
                  draft.addOns.map(
                    (addOn) => ({
                      addOnId:
                        addOn.addOnId,

                      quantity:
                        addOn.quantity,
                    }),
                  ),

                paymentMethod:
                  draft.paymentMethod,

                customerNotes:
                  draft.customerNotes.trim(),

                bookingDate:
                  draft.bookingDate,

                startTime:
                  draft.startTime,

                /*
                 * The server recalculates the trusted
                 * end time, but the validator requires
                 * this field in the request.
                 */
                endTime:
                  trustedEndTime,
              }),
          },
        );

      const responseText =
        await response.text();

      let payload:
        ApiResponse = {};

      if (
        responseText.trim()
      ) {
        try {
          payload =
            JSON.parse(
              responseText,
            ) as ApiResponse;
        } catch {
          throw new Error(
            "The booking server returned an invalid response.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(
            payload,
            "The booking could not be created.",
          ),
        );
      }

      const booking =
        extractCreatedBooking(
          payload,
        );

      if (!booking) {
        throw new Error(
          "The booking was created, but its confirmation details were missing.",
        );
      }

      setCreatedBooking(
        booking,
      );

      redirectTimerRef.current =
        setTimeout(() => {
          router.push(
            "/bookings",
          );

          router.refresh();
        }, 1600);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "The booking could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdBooking) {
    return (
      <motion.div
        initial={
          prefersReducedMotion
            ? undefined
            : {
                opacity: 0,
                scale: 0.97,
                y: 20,
              }
        }
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="mt-8 overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_28px_80px_rgba(5,150,105,0.16)]"
      >
        <div className="bg-emerald-500 px-6 py-10 text-center text-white sm:px-10">
          <motion.span
            initial={
              prefersReducedMotion
                ? undefined
                : {
                    scale: 0,
                    rotate: -25,
                  }
            }
            animate={{
              scale: 1,
              rotate: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 14,
            }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-500 shadow-xl"
          >
            <CheckCircle2 className="h-10 w-10" />
          </motion.span>

          <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-100">
            Route successfully created
          </p>

          <h3 className="mt-3 font-heading text-3xl font-black sm:text-4xl">
            Your cleaning is booked.
          </h3>
        </div>

        <div className="p-6 text-center sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
            Booking number
          </p>

          <p className="mt-3 font-mono text-2xl font-black text-navy sm:text-3xl">
            {
              createdBooking.bookingNumber
            }
          </p>

          <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Date
              </p>

              <p className="mt-2 text-sm font-extrabold text-navy">
                {formatBookingDate(
                  createdBooking.bookingDate,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Time
              </p>

              <p className="mt-2 text-sm font-extrabold text-navy">
                {formatClockTime(
                  createdBooking.startTime,
                )}{" "}
                –{" "}
                {formatClockTime(
                  createdBooking.endTime,
                )}
              </p>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-7 text-slate-500">
            Your booking is pending
            confirmation. You are being
            redirected to My Bookings.
          </p>

          <LoaderCircle className="mx-auto mt-7 h-7 w-7 animate-spin text-primary" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Review introduction */}
      <section className="grid gap-5 rounded-[1.7rem] border border-primary/10 bg-primary-light/35 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
              Server-verified review
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black text-navy">
              Inspect your full cleaning route
            </h3>

            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              CleanNest reloads the
              service, property rules,
              add-ons, prices, and
              duration from the database.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={
            isLoadingQuote ||
            isSubmitting
          }
          onClick={() => {
            setRefreshNumber(
              (current) =>
                current + 1,
            );
          }}
          className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl border border-primary/15 bg-white px-5 text-sm font-extrabold text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isLoadingQuote
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh quote
        </button>
      </section>

      {isLoadingQuote && (
        <section className="flex min-h-[260px] items-center justify-center rounded-[1.7rem] border border-primary/10 bg-white">
          <div className="px-6 text-center">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />

            <h3 className="mt-5 font-heading text-2xl font-black text-navy">
              Calculating the trusted quote
            </h3>

            <p className="mt-3 text-base font-medium text-slate-500">
              Verifying the service,
              property, extras, and
              cleaning duration.
            </p>
          </div>
        </section>
      )}

      {quoteError && (
        <section className="rounded-[1.7rem] border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

          <h3 className="mt-4 font-heading text-2xl font-black text-red-800">
            The price could not be verified
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-red-600">
            {quoteError}
          </p>
        </section>
      )}

      {quote &&
        !isLoadingQuote && (
          <>
            {/* Main review cards */}
            <section className="grid gap-5 lg:grid-cols-2">
              <ReviewCard
                icon={Home}
                eyebrow="Property"
                title={propertyTypeLabel(
                  draft.propertyType,
                )}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <SmallStat
                    icon={BedDouble}
                    label={
                      draft.propertyType ===
                      "office"
                        ? "Work areas"
                        : draft.propertyType ===
                            "other"
                          ? "Main rooms"
                          : "Bedrooms"
                    }
                    value={String(
                      draft.bedrooms,
                    )}
                  />

                  <SmallStat
                    icon={Bath}
                    label="Bathrooms"
                    value={String(
                      draft.bathrooms,
                    )}
                  />

                  <SmallStat
                    icon={Home}
                    label="Size"
                    value={`${draft.propertySize} m²`}
                  />
                </div>

                {quote.property.lines
                  .length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-primary/10 pt-5">
                    {quote.property.lines.map(
                      (line) => (
                        <div
                          key={`${line.code}-${line.label}`}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <span className="font-semibold text-slate-500">
                            {line.label}
                          </span>

                          <span className="font-extrabold text-navy">
                            +
                            {formatCurrency(
                              line.totalAmount,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </ReviewCard>

              <ReviewCard
                icon={SprayCan}
                eyebrow="Cleaning plan"
                title={
                  quote.service.name ||
                  draft.serviceName
                }
              >
                <div className="space-y-3">
                  <ReviewLine
                    label="Service price"
                    value={formatCurrency(
                      quote.serviceBaseAmount,
                    )}
                  />

                  <ReviewLine
                    label="Property adjustment"
                    value={formatCurrency(
                      quote.propertyAdjustmentAmount,
                    )}
                  />

                  <ReviewLine
                    label="Base duration"
                    value={formatDuration(
                      quote.serviceDurationMinutes,
                    )}
                  />
                </div>
              </ReviewCard>

              <ReviewCard
                icon={Sparkles}
                eyebrow="Extra touches"
                title={
                  quote.addOns.length >
                  0
                    ? `${quote.addOns.length} selected`
                    : "No extras selected"
                }
              >
                {quote.addOns.length ===
                0 ? (
                  <p className="text-base font-medium leading-7 text-slate-500">
                    This booking contains
                    only the selected
                    cleaning plan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {quote.addOns.map(
                      (addOn) => (
                        <div
                          key={
                            addOn.addOnId
                          }
                          className="rounded-2xl bg-surface-soft p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-extrabold text-navy">
                                {
                                  addOn.name
                                }
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-500">
                                Quantity{" "}
                                {
                                  addOn.quantity
                                }{" "}
                                ·{" "}
                                {formatDuration(
                                  addOn.totalExtraDurationMinutes,
                                )}
                              </p>
                            </div>

                            <p className="font-extrabold text-primary">
                              {formatCurrency(
                                addOn.totalPrice,
                              )}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </ReviewCard>

              <ReviewCard
                icon={MapPin}
                eyebrow="Home base"
                title={
                  draft.serviceAreaLabel
                }
              >
                <p className="text-base font-semibold leading-7 text-slate-600">
                  {draft.addressLabel}
                </p>

                <div className="mt-5 rounded-2xl bg-surface-soft p-4">
                  <ReviewLine
                    label="Service-area fee"
                    value={formatCurrency(
                      draft.serviceAreaFee,
                    )}
                  />
                </div>
              </ReviewCard>

              <ReviewCard
                icon={CalendarDays}
                eyebrow="Cleaning date"
                title={formatBookingDate(
                  draft.bookingDate,
                )}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <SmallStat
                    icon={Clock3}
                    label="Arrival"
                    value={formatClockTime(
                      draft.startTime,
                    )}
                  />

                  <SmallStat
                    icon={Timer}
                    label="Trusted finish"
                    value={formatClockTime(
                      trustedEndTime,
                    )}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-extrabold text-emerald-800">
                    Estimated duration:{" "}
                    {formatDuration(
                      quote.estimatedDurationMinutes,
                    )}
                  </p>
                </div>
              </ReviewCard>

              <ReviewCard
                icon={CreditCard}
                eyebrow="Payment"
                title="Choose how to pay"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={
                      draft.paymentMethod ===
                      "cash"
                    }
                    disabled={
                      isSubmitting
                    }
                    onClick={() => {
                      onPaymentMethodChange(
                        "cash",
                      );
                    }}
                    className={`relative rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      draft.paymentMethod ===
                      "cash"
                        ? "border-primary bg-primary-light shadow-[0_12px_30px_rgba(30,111,217,0.12)]"
                        : "border-slate-200 bg-white hover:border-primary/35"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          draft.paymentMethod ===
                          "cash"
                            ? "bg-primary text-white"
                            : "bg-surface-soft text-primary"
                        }`}
                      >
                        <Banknote className="h-5 w-5" />
                      </span>

                      <SelectionCircle
                        selected={
                          draft.paymentMethod ===
                          "cash"
                        }
                      />
                    </div>

                    <p className="mt-4 font-extrabold text-navy">
                      Cash
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      Pay after the
                      cleaning service.
                    </p>
                  </button>

                  <button
                    type="button"
                    aria-pressed={
                      draft.paymentMethod ===
                      "card"
                    }
                    disabled={
                      isSubmitting
                    }
                    onClick={() => {
                      onPaymentMethodChange(
                        "card",
                      );
                    }}
                    className={`relative rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      draft.paymentMethod ===
                      "card"
                        ? "border-primary bg-primary-light shadow-[0_12px_30px_rgba(30,111,217,0.12)]"
                        : "border-slate-200 bg-white hover:border-primary/35"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          draft.paymentMethod ===
                          "card"
                            ? "bg-primary text-white"
                            : "bg-surface-soft text-primary"
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                      </span>

                      <SelectionCircle
                        selected={
                          draft.paymentMethod ===
                          "card"
                        }
                      />
                    </div>

                    <p className="mt-4 font-extrabold text-navy">
                      Card
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      The booking will be
                      created with pending
                      card payment.
                    </p>
                  </button>
                </div>
              </ReviewCard>
            </section>

            {/* Notes and pricing */}
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
              <div className="rounded-[1.7rem] border border-primary/10 bg-white p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <FileText className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary">
                      Optional instructions
                    </p>

                    <h3 className="mt-2 font-heading text-2xl font-black text-navy">
                      Notes for the cleaning team
                    </h3>
                  </div>
                </div>

                <textarea
                  value={
                    draft.customerNotes
                  }
                  disabled={
                    isSubmitting
                  }
                  maxLength={1000}
                  rows={7}
                  onChange={(event) => {
                    onCustomerNotesChange(
                      event.target.value,
                    );
                  }}
                  placeholder="Entry instructions, pets, priority rooms, delicate surfaces, or anything the team should know..."
                  className="mt-6 w-full resize-none rounded-2xl border border-primary/15 bg-surface-soft px-5 py-4 text-base font-medium leading-7 text-navy outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-400">
                    Maximum 1,000
                    characters
                  </p>

                  <p
                    className={`text-sm font-extrabold ${
                      notesLength > 950
                        ? "text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    {notesLength}/1000
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-primary/25 bg-primary-light/30 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <Tag className="h-4 w-4" />
                    </span>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                        Have a promo code?
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Apply it here and your trusted total will update automatically.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={promoInput}
                      disabled={
                        isApplyingPromo ||
                        Boolean(
                          appliedPromoCodeId,
                        )
                      }
                      onChange={(event) => {
                        setPromoInput(
                          event.target.value
                            .toUpperCase()
                            .replace(
                              /[^A-Z0-9_-]/g,
                              "",
                            ),
                        );
                        setPromoMessage(null);
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter"
                        ) {
                          event.preventDefault();
                          void handleApplyPromoCode();
                        }
                      }}
                      placeholder="e.g. WELCOME20"
                      maxLength={30}
                      className="min-h-12 flex-1 rounded-xl border border-primary/15 bg-white px-4 font-mono text-sm font-black tracking-[0.1em] text-navy outline-none transition placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50"
                    />

                    {appliedPromoCodeId ? (
                      <button
                        type="button"
                        onClick={
                          handleRemovePromoCode
                        }
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-extrabold text-red-500 transition hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          isApplyingPromo ||
                          !promoInput.trim()
                        }
                        onClick={() =>
                          void handleApplyPromoCode()
                        }
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-extrabold text-white shadow-lg transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isApplyingPromo ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                        {isApplyingPromo
                          ? "Checking"
                          : "Apply code"}
                      </button>
                    )}
                  </div>

                  {promoMessage && (
                    <p
                      aria-live="polite"
                      className={`mt-3 text-sm font-bold ${
                        promoMessage.type ===
                        "success"
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {promoMessage.text}
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.7rem] border border-primary/10 bg-white">
                <div className="bg-navy p-6 text-white">
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                    Estimated final total
                  </p>

                  <p className="mt-3 font-heading text-4xl font-black">
                    {formatCurrency(
                      finalTotalAmount,
                    )}
                  </p>

                  <p className="mt-2 text-sm font-medium text-blue-100/70">
                    Rechecked by the
                    server during
                    confirmation
                  </p>
                </div>

                <div className="space-y-4 p-6">
                  <PriceLine
                    label="Service base"
                    value={
                      quote.serviceBaseAmount
                    }
                  />

                  <PriceLine
                    label="Property adjustment"
                    value={
                      quote.propertyAdjustmentAmount
                    }
                  />

                  <PriceLine
                    label="Extra touches"
                    value={
                      quote.addOnsAmount
                    }
                  />

                  <PriceLine
                    label="Service-area fee"
                    value={
                      draft.serviceAreaFee
                    }
                  />

                  {quote.discountAmount >
                    0 && (
                    <PriceLine
                      label={
                        quote.promoCode
                          ? `Discount (${quote.promoCode.code})`
                          : "Discount"
                      }
                      value={
                        -quote.discountAmount
                      }
                    />
                  )}

                  <div className="border-t border-primary/10 pt-4">
                    <PriceLine
                      label="Subtotal before discount"
                      value={
                        subtotalWithAreaFee
                      }
                      strong
                    />
                  </div>

                  <div className="border-t border-primary/10 pt-4">
                    <PriceLine
                      label="Final total"
                      value={
                        finalTotalAmount
                      }
                      strong
                    />
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                      <p className="text-sm font-semibold leading-6 text-emerald-700">
                        The server checks
                        the service-area
                        fee, price,
                        duration, and
                        availability again
                        when the booking is
                        created.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {!trustedEndTime && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                <p className="text-sm font-semibold leading-6 text-red-600">
                  The trusted cleaning
                  duration extends past
                  midnight. Return to Time
                  Route and choose an
                  earlier arrival time.
                </p>
              </div>
            )}

            {submissionError && (
              <div
                aria-live="polite"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                <div>
                  <p className="font-extrabold text-red-800">
                    Booking could not be confirmed
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-red-600">
                    {submissionError}
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation */}
            <section className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_20px_60px_rgba(11,37,69,0.09)]">
              <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>

                  <div>
                    <p className="font-heading text-2xl font-black text-navy">
                      Ready to confirm?
                    </p>

                    <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
                      Your booking will
                      be created with
                      pending status.
                      CleanNest will
                      verify the selected
                      time and price one
                      final time.
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  disabled={
                    !isComplete ||
                    isSubmitting
                  }
                  onClick={() => {
                    void handleCreateBooking();
                  }}
                  whileHover={
                    prefersReducedMotion ||
                    !isComplete ||
                    isSubmitting
                      ? undefined
                      : {
                          y: -3,
                        }
                  }
                  whileTap={
                    !isComplete ||
                    isSubmitting
                      ? undefined
                      : {
                          scale: 0.98,
                        }
                  }
                  className="inline-flex min-h-[58px] min-w-[220px] items-center justify-center gap-3 rounded-2xl bg-primary px-7 text-base font-extrabold text-white shadow-[0_16px_35px_rgba(30,111,217,0.3)] transition hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />

                      Creating booking…
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />

                      Confirm booking
                    </>
                  )}
                </motion.button>
              </div>
            </section>
          </>
        )}
    </div>
  );
}

interface ReviewCardProps {
  icon: ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
  children: ReactNode;
}

function ReviewCard({
  icon: Icon,
  eyebrow,
  title,
  children,
}: ReviewCardProps) {
  return (
    <section className="rounded-[1.7rem] border border-primary/10 bg-white p-5 shadow-[0_12px_35px_rgba(11,37,69,0.05)] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary">
            {eyebrow}
          </p>

          <h3 className="mt-2 font-heading text-xl font-black text-navy">
            {title}
          </h3>
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

interface SmallStatProps {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string;
}

function SmallStat({
  icon: Icon,
  label,
  value,
}: SmallStatProps) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <Icon className="h-4 w-4 text-primary" />

      <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-base font-extrabold text-navy">
        {value}
      </p>
    </div>
  );
}

interface ReviewLineProps {
  label: string;
  value: string;
}

function ReviewLine({
  label,
  value,
}: ReviewLineProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-semibold text-slate-500">
        {label}
      </span>

      <span className="text-right font-extrabold text-navy">
        {value}
      </span>
    </div>
  );
}

interface PriceLineProps {
  label: string;
  value: number;
  strong?: boolean;
}

function PriceLine({
  label,
  value,
  strong = false,
}: PriceLineProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "font-extrabold text-navy"
            : "text-sm font-semibold text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-heading text-xl font-black text-navy"
            : "text-sm font-extrabold text-navy"
        }
      >
        {value < 0
          ? "-"
          : ""}

        {formatCurrency(
          Math.abs(value),
        )}
      </span>
    </div>
  );
}

function SelectionCircle({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-slate-200 bg-white text-transparent"
      }`}
    >
      <Check className="h-4 w-4" />
    </span>
  );
}
