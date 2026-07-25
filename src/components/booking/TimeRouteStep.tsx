"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarX2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UsersRound,
} from "lucide-react";

import {
  getFullDayScheduleBlock,
  getRecurringScheduleBlock,
  isFridaySchedule,
} from "@/lib/bookingScheduleRules";

import {
  motion,
  useReducedMotion,
} from "motion/react";

const CLEAN_NEST_TIME_ZONE =
  "Asia/Beirut";

const OPENING_TIME_MINUTES =
  8 * 60;

const CLOSING_TIME_MINUTES =
  18 * 60;

const SLOT_INTERVAL_MINUTES =
  60;

const DATE_OPTION_COUNT = 7;

type PropertyType =
  | "apartment"
  | "house"
  | "office"
  | "other";

type SlotStatus =
  | "checking"
  | "available"
  | "unavailable";

export interface TimeRouteAddOnInput {
  addOnId: string;
  quantity: number;
}

export interface TimeRouteSelection {
  bookingDate: string;
  startTime: string;
  endTime: string;
}

export interface TimeRoutePricingSnapshot {
  baseAmount: number;
  addOnsAmount: number;
  discountAmount: number;
  totalAmount: number;
  estimatedDurationMinutes: number;
}

interface TimeRouteStepProps {
  serviceId: string;
  serviceAreaId: string;

  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  propertySize: number;

  addOns: TimeRouteAddOnInput[];

  bookingDate: string;
  startTime: string;
  endTime: string;

  onChange: (
    selection: TimeRouteSelection,
  ) => void;

  onTrustedQuote?: (
    snapshot:
      TimeRoutePricingSnapshot,
  ) => void;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;

  status: SlotStatus;
  message: string;

  remainingCapacity:
    | number
    | null;

  blockedPeriod: boolean;
  requestFailed: boolean;
}

interface ApiResponse {
  data?: unknown;
  quote?: unknown;
  availability?: unknown;

  message?: unknown;
  error?: unknown;
}

interface DateOption {
  value: string;
  weekday: string;
  day: string;
  month: string;
  fullLabel: string;
  isClosed: boolean;
  closureReason: string | null;
  isFriday: boolean;
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

function padNumber(
  value: number,
): string {
  return String(value).padStart(
    2,
    "0",
  );
}

function minutesToTime(
  totalMinutes: number,
): string {
  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  const minutes =
    totalMinutes % 60;

  return `${padNumber(
    hours,
  )}:${padNumber(minutes)}`;
}

function timeToMinutes(
  value: string,
): number {
  const [hours, minutes] =
    value
      .split(":")
      .map(Number);

  return (
    (hours ?? 0) * 60 +
    (minutes ?? 0)
  );
}

function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const startMinutes =
    timeToMinutes(
      startTime,
    );

  const endMinutes =
    startMinutes +
    durationMinutes;

  if (
    endMinutes >=
    24 * 60
  ) {
    return "";
  }

  return minutesToTime(
    endMinutes,
  );
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

function formatDuration(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "Not calculated";
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

function getBeirutDateParts(
  date = new Date(),
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          CLEAN_NEST_TIME_ZONE,

        year: "numeric",
        month: "2-digit",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",

        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(
      date,
    );

  const values =
    new Map(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ],
      ),
    );

  return {
    year:
      Number(
        values.get("year"),
      ),

    month:
      Number(
        values.get("month"),
      ),

    day:
      Number(
        values.get("day"),
      ),

    hour:
      Number(
        values.get("hour"),
      ),

    minute:
      Number(
        values.get("minute"),
      ),
  };
}

function getBeirutToday(): string {
  const {
    year,
    month,
    day,
  } = getBeirutDateParts();

  return `${year}-${padNumber(
    month,
  )}-${padNumber(day)}`;
}

function getBeirutCurrentMinutes(): number {
  const {
    hour,
    minute,
  } = getBeirutDateParts();

  return (
    hour * 60 +
    minute
  );
}

function addDaysToDateString(
  dateString: string,
  numberOfDays: number,
): string {
  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year ?? 2000,
      (month ?? 1) - 1,
      day ?? 1,
    ),
  );

  date.setUTCDate(
    date.getUTCDate() +
      numberOfDays,
  );

  return [
    date.getUTCFullYear(),

    padNumber(
      date.getUTCMonth() +
        1,
    ),

    padNumber(
      date.getUTCDate(),
    ),
  ].join("-");
}

function createDateOption(
  value: string,
): DateOption {
  const [year, month, day] =
    value
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year ?? 2000,
      (month ?? 1) - 1,
      day ?? 1,
      12,
    ),
  );
  const closure =
    getFullDayScheduleBlock(
      value,
    );

  return {
    value,
    isClosed: Boolean(closure),
    closureReason:
      closure?.reason ?? null,
    isFriday:
      isFridaySchedule(value),

    weekday:
      new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "short",
          timeZone: "UTC",
        },
      ).format(date),

    day:
      new Intl.DateTimeFormat(
        "en-US",
        {
          day: "2-digit",
          timeZone: "UTC",
        },
      ).format(date),

    month:
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          timeZone: "UTC",
        },
      ).format(date),

    fullLabel:
      new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        },
      ).format(date),
  };
}

function isPastSlot(
  bookingDate: string,
  startTime: string,
): boolean {
  const today =
    getBeirutToday();

  if (
    bookingDate < today
  ) {
    return true;
  }

  if (
    bookingDate > today
  ) {
    return false;
  }

  return (
    timeToMinutes(
      startTime,
    ) <=
    getBeirutCurrentMinutes()
  );
}

function buildTimeSlots(
  durationMinutes: number,
): AvailabilitySlot[] {
  if (
    durationMinutes <= 0
  ) {
    return [];
  }

  const slots:
    AvailabilitySlot[] =
      [];

  for (
    let startMinutes =
      OPENING_TIME_MINUTES;

    startMinutes +
      durationMinutes <=
    CLOSING_TIME_MINUTES;

    startMinutes +=
      SLOT_INTERVAL_MINUTES
  ) {
    slots.push({
      startTime:
        minutesToTime(
          startMinutes,
        ),

      endTime:
        minutesToTime(
          startMinutes +
            durationMinutes,
        ),

      status:
        "checking",

      message:
        "Checking availability.",

      remainingCapacity:
        null,

      blockedPeriod:
        false,

      requestFailed:
        false,
    });
  }

  return slots;
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
    asRecord(
      payload.error,
    );

  if (
    errorRecord &&
    typeof errorRecord.message ===
      "string"
  ) {
    return errorRecord.message;
  }

  return fallback;
}

function extractQuote(
  payload: ApiResponse,
): Record<
  string,
  unknown
> | null {
  const dataRecord =
    asRecord(
      payload.data,
    );

  return asRecord(
    dataRecord?.quote ??
      payload.quote,
  );
}

function extractAvailability(
  payload: ApiResponse,
): Record<
  string,
  unknown
> | null {
  const dataRecord =
    asRecord(
      payload.data,
    );

  return asRecord(
    dataRecord?.availability ??
      payload.availability,
  );
}

export default function TimeRouteStep({
  serviceId,
  serviceAreaId,

  propertyType,
  bedrooms,
  bathrooms,
  propertySize,

  addOns,

  bookingDate,
  startTime,
  endTime,

  onChange,
  onTrustedQuote,
}: TimeRouteStepProps) {
  const prefersReducedMotion =
    useReducedMotion();

  const quoteVersionRef =
    useRef(0);

  const availabilityVersionRef =
    useRef(0);

  const onChangeRef =
    useRef(onChange);

  const onTrustedQuoteRef =
    useRef(
      onTrustedQuote,
    );

  const selectedDateRef =
    useRef(
      bookingDate,
    );

  const selectedStartTimeRef =
    useRef(
      startTime,
    );

  const selectedEndTimeRef =
    useRef(
      endTime,
    );

  const today =
    useMemo(
      () =>
        getBeirutToday(),
      [],
    );

  const dateOptions =
    useMemo(() => {
      return Array.from(
        {
          length:
            DATE_OPTION_COUNT,
        },
        (_, index) =>
          createDateOption(
            addDaysToDateString(
              today,
              index,
            ),
          ),
      );
    }, [today]);

  const pricingPayload =
    useMemo(
      () => ({
        serviceId,

        frequency:
          "one_time",

        property: {
          propertyType,
          bedrooms,
          bathrooms,
          propertySize,
        },

        addOns:
          addOns.map(
            (addOn) => ({
              addOnId:
                addOn.addOnId,

              quantity:
                addOn.quantity,
            }),
          ),
      }),
      [
        addOns,
        bathrooms,
        bedrooms,
        propertySize,
        propertyType,
        serviceId,
      ],
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    bookingDate,
  );

  const [
    trustedDurationMinutes,
    setTrustedDurationMinutes,
  ] = useState<
    number | null
  >(null);

  const [
    isLoadingQuote,
    setIsLoadingQuote,
  ] = useState(false);

  const [
    quoteError,
    setQuoteError,
  ] = useState<
    string | null
  >(null);

  const [
    slots,
    setSlots,
  ] = useState<
    AvailabilitySlot[]
  >([]);

  const [
    isCheckingAvailability,
    setIsCheckingAvailability,
  ] = useState(false);

  const [
    availabilityError,
    setAvailabilityError,
  ] = useState<
    string | null
  >(null);

  const [
    refreshNumber,
    setRefreshNumber,
  ] = useState(0);

  useEffect(() => {
    onChangeRef.current =
      onChange;
  }, [onChange]);

  useEffect(() => {
    onTrustedQuoteRef.current =
      onTrustedQuote;
  }, [onTrustedQuote]);

  useEffect(() => {
    selectedDateRef.current =
      bookingDate;

    selectedStartTimeRef.current =
      startTime;

    selectedEndTimeRef.current =
      endTime;

    setSelectedDate(
      bookingDate,
    );
  }, [
    bookingDate,
    endTime,
    startTime,
  ]);

  useEffect(() => {
    if (
      !bookingDate ||
      !getFullDayScheduleBlock(
        bookingDate,
      )
    ) {
      return;
    }

    selectedDateRef.current = "";
    selectedStartTimeRef.current = "";
    selectedEndTimeRef.current = "";
    setSelectedDate("");
    setSlots([]);
    setAvailabilityError(
      "CleanNest is closed every Sunday. Please choose another day.",
    );
    onChangeRef.current({
      bookingDate: "",
      startTime: "",
      endTime: "",
    });
  }, [bookingDate]);

  /*
   * First load the trusted quote.
   *
   * This provides the real duration after property
   * adjustments and selected add-ons are included.
   */
  useEffect(() => {
    quoteVersionRef.current +=
      1;

    const requestVersion =
      quoteVersionRef.current;

    const controller =
      new AbortController();

    if (!serviceId) {
      setTrustedDurationMinutes(
        null,
      );

      setQuoteError(
        "Select a cleaning plan before choosing a time.",
      );

      setIsLoadingQuote(
        false,
      );

      return () => {
        controller.abort();
      };
    }

    async function loadTrustedQuote() {
      setIsLoadingQuote(true);
      setQuoteError(null);

      setTrustedDurationMinutes(
        null,
      );

      setSlots([]);
      setAvailabilityError(null);

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
              "The trusted cleaning duration could not be calculated.",
            ),
          );
        }

        const quote =
          extractQuote(
            payload,
          );

        if (!quote) {
          throw new Error(
            "The pricing response did not contain a valid quote.",
          );
        }

        const estimatedDurationMinutes =
          readNumber(
            quote.estimatedDurationMinutes,
          );

        if (
          estimatedDurationMinutes <=
          0
        ) {
          throw new Error(
            "The trusted cleaning duration is invalid.",
          );
        }

        if (
          requestVersion !==
            quoteVersionRef.current
        ) {
          return;
        }

        setTrustedDurationMinutes(
          estimatedDurationMinutes,
        );

        onTrustedQuoteRef.current?.({
          baseAmount:
            readNumber(
              quote.baseAmount,
            ),

          addOnsAmount:
            readNumber(
              quote.addOnsAmount,
            ),

          discountAmount:
            readNumber(
              quote.discountAmount,
            ),

          totalAmount:
            readNumber(
              quote.totalAmount,
            ),

          estimatedDurationMinutes,
        });

        const existingStartTime =
          selectedStartTimeRef.current;

        const existingEndTime =
          selectedEndTimeRef.current;

        if (
          existingStartTime &&
          existingEndTime
        ) {
          const trustedEndTime =
            calculateEndTime(
              existingStartTime,
              estimatedDurationMinutes,
            );

          if (
            trustedEndTime !==
            existingEndTime
          ) {
            onChangeRef.current({
              bookingDate:
                selectedDateRef.current,

              startTime: "",
              endTime: "",
            });
          }
        }
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        if (
          requestVersion !==
          quoteVersionRef.current
        ) {
          return;
        }

        setTrustedDurationMinutes(
          null,
        );

        setQuoteError(
          error instanceof Error
            ? error.message
            : "The trusted cleaning duration could not be calculated.",
        );
      } finally {
        if (
          requestVersion ===
            quoteVersionRef.current &&
          !controller.signal.aborted
        ) {
          setIsLoadingQuote(
            false,
          );
        }
      }
    }

    void loadTrustedQuote();

    return () => {
      controller.abort();
    };
  }, [
    pricingPayload,
    serviceId,
  ]);

  /*
   * After the trusted duration is known, generate
   * possible slots and verify each one using the
   * availability endpoint.
   */
  useEffect(() => {
    availabilityVersionRef.current +=
      1;

    const requestVersion =
      availabilityVersionRef.current;

    const controller =
      new AbortController();

    if (
      !selectedDate ||
      !serviceId ||
      !serviceAreaId ||
      !trustedDurationMinutes
    ) {
      setSlots([]);

      setIsCheckingAvailability(
        false,
      );

      return () => {
        controller.abort();
      };
    }

    const baseSlots =
      buildTimeSlots(
        trustedDurationMinutes,
      );

    const preparedSlots =
      baseSlots.map(
        (slot) => {
          if (
            isPastSlot(
              selectedDate,
              slot.startTime,
            )
          ) {
            return {
              ...slot,

              status:
                "unavailable" as const,

              message:
                "This time has already passed.",
            };
          }

          const recurringBlock =
            getRecurringScheduleBlock({
              bookingDate:
                selectedDate,
              startTime:
                slot.startTime,
              endTime:
                slot.endTime,
            });

          if (recurringBlock) {
            return {
              ...slot,
              status:
                "unavailable" as const,
              message:
                recurringBlock.reason,
              blockedPeriod: true,
            };
          }

          return slot;
        },
      );

    setSlots(
      preparedSlots,
    );

    setAvailabilityError(
      null,
    );

    setIsCheckingAvailability(
      true,
    );

    async function checkSlot(
      slot:
        AvailabilitySlot,
    ): Promise<AvailabilitySlot> {
      if (
        slot.status ===
        "unavailable"
      ) {
        return slot;
      }

      try {
        const response =
          await fetch(
            "/api/customer/bookings/availability",
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
                JSON.stringify({
                  serviceId,
                  serviceAreaId,

                  bookingDate:
                    selectedDate,

                  startTime:
                    slot.startTime,

                  endTime:
                    slot.endTime,
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
            return {
              ...slot,

              status:
                "unavailable",

              message:
                "The availability server returned an invalid response.",

              requestFailed:
                true,
            };
          }
        }

        if (!response.ok) {
          return {
            ...slot,

            status:
              "unavailable",

            message:
              extractErrorMessage(
                payload,
                "This time could not be checked.",
              ),

            requestFailed:
              true,
          };
        }

        const availability =
          extractAvailability(
            payload,
          );

        if (!availability) {
          return {
            ...slot,

            status:
              "unavailable",

            message:
              "Availability information was missing.",

            requestFailed:
              true,
          };
        }

        const capacity =
          asRecord(
            availability.capacity,
          );

        const available =
          availability.available ===
          true;

        return {
          ...slot,

          status:
            available
              ? "available"
              : "unavailable",

          message:
            typeof availability.message ===
            "string"
              ? availability.message
              : available
                ? "This time is available."
                : "This time is unavailable.",

          remainingCapacity:
            capacity
              ? readNumber(
                  capacity.remainingCapacity,
                )
              : null,

          blockedPeriod:
            availability.blockedPeriod ===
            true,

          requestFailed:
            false,
        };
      } catch {
        if (
          controller.signal.aborted
        ) {
          return slot;
        }

        return {
          ...slot,

          status:
            "unavailable",

          message:
            "Unable to reach the availability server.",

          requestFailed:
            true,
        };
      }
    }

    async function checkAllSlots() {
      const checkedSlots =
        await Promise.all(
          preparedSlots.map(
            checkSlot,
          ),
        );

      if (
        controller.signal.aborted ||
        requestVersion !==
          availabilityVersionRef.current
      ) {
        return;
      }

      setSlots(
        checkedSlots,
      );

      setIsCheckingAvailability(
        false,
      );

      const checkedRequests =
        checkedSlots.filter(
          (slot) =>
            !isPastSlot(
              selectedDate,
              slot.startTime,
            ),
        );

      const everyRequestFailed =
        checkedRequests.length >
          0 &&
        checkedRequests.every(
          (slot) =>
            slot.requestFailed,
        );

      if (
        everyRequestFailed
      ) {
        setAvailabilityError(
          checkedRequests[0]
            ?.message ??
            "Availability could not be checked.",
        );
      }

      const selectedStartTime =
        selectedStartTimeRef.current;

      const selectedEndTime =
        selectedEndTimeRef.current;

      if (
        selectedStartTime &&
        selectedEndTime
      ) {
        const stillAvailable =
          checkedSlots.some(
            (slot) =>
              slot.startTime ===
                selectedStartTime &&
              slot.endTime ===
                selectedEndTime &&
              slot.status ===
                "available",
          );

        if (!stillAvailable) {
          onChangeRef.current({
            bookingDate:
              selectedDate,

            startTime: "",
            endTime: "",
          });
        }
      }
    }

    void checkAllSlots();

    return () => {
      controller.abort();
    };
  }, [
    refreshNumber,
    selectedDate,
    serviceAreaId,
    serviceId,
    trustedDurationMinutes,
  ]);

  const selectedDateOption =
    useMemo(
      () =>
        createDateOption(
          selectedDate ||
            today,
        ),
      [
        selectedDate,
        today,
      ],
    );

  const selectedSlot =
    useMemo(
      () =>
        slots.find(
          (slot) =>
            slot.startTime ===
              startTime &&
            slot.endTime ===
              endTime &&
            slot.status ===
              "available",
        ) ?? null,
      [
        endTime,
        slots,
        startTime,
      ],
    );

  const availableSlotCount =
    useMemo(
      () =>
        slots.filter(
          (slot) =>
            slot.status ===
            "available",
        ).length,
      [slots],
    );

  function handleDateSelection(
    nextDate: string,
  ) {
    if (!nextDate) {
      return;
    }

    const fullDayBlock =
      getFullDayScheduleBlock(
        nextDate,
      );

    if (fullDayBlock) {
      setAvailabilityError(
        fullDayBlock.reason,
      );
      return;
    }

    selectedDateRef.current =
      nextDate;

    selectedStartTimeRef.current =
      "";

    selectedEndTimeRef.current =
      "";

    setSelectedDate(
      nextDate,
    );

    setSlots([]);

    setAvailabilityError(
      null,
    );

    onChangeRef.current({
      bookingDate:
        nextDate,

      startTime: "",
      endTime: "",
    });
  }

  function handleSlotSelection(
    slot:
      AvailabilitySlot,
  ) {
    if (
      slot.status !==
      "available"
    ) {
      return;
    }

    selectedDateRef.current =
      selectedDate;

    selectedStartTimeRef.current =
      slot.startTime;

    selectedEndTimeRef.current =
      slot.endTime;

    onChangeRef.current({
      bookingDate:
        selectedDate,

      startTime:
        slot.startTime,

      endTime:
        slot.endTime,
    });
  }

  if (
    !serviceId ||
    !serviceAreaId
  ) {
    return (
      <div className="mt-8 rounded-[1.8rem] border border-amber-200 bg-amber-50 p-7 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />

        <h3 className="mt-5 font-heading text-2xl font-black text-amber-900">
          Route information is incomplete
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-amber-700">
          Select a cleaning plan and a
          serviceable address before
          choosing a time.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-5 rounded-[1.6rem] border border-primary/10 bg-primary-light/35 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
              Trusted scheduling
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black text-navy">
              Reserve your cleaning arrival time
            </h3>

            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              The duration now includes
              your property details and
              every selected extra before
              availability is checked.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-white px-5 py-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            Trusted duration
          </p>

          {isLoadingQuote ? (
            <div className="mt-2 flex items-center gap-2 text-sm font-extrabold text-primary">
              <LoaderCircle className="h-4 w-4 animate-spin" />

              Calculating…
            </div>
          ) : (
            <p className="mt-2 text-lg font-extrabold text-navy">
              {trustedDurationMinutes
                ? formatDuration(
                    trustedDurationMinutes,
                  )
                : "Unavailable"}
            </p>
          )}
        </div>
      </section>

      {quoteError && (
        <section className="rounded-[1.7rem] border border-red-200 bg-red-50 p-6 text-center">
          <TimerReset className="mx-auto h-10 w-10 text-red-500" />

          <h3 className="mt-4 font-heading text-2xl font-black text-red-800">
            Duration could not be calculated
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-red-600">
            {quoteError}
          </p>

          <button
            type="button"
            onClick={() => {
              setRefreshNumber(
                (current) =>
                  current + 1,
              );
            }}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white"
          >
            <RefreshCw className="h-4 w-4" />

            Try again
          </button>
        </section>
      )}

      {!quoteError &&
        trustedDurationMinutes && (
          <>
            <section>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                    Route date
                  </p>

                  <h3 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-navy">
                    Choose a cleaning day
                  </h3>
                </div>

                <div className="w-full lg:w-auto">
                  <label
                    htmlFor="booking-date"
                    className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Another date
                  </label>

                  <div className="relative mt-2">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />

                    <input
                      id="booking-date"
                      type="date"
                      min={today}
                      value={
                        selectedDate
                      }
                      onChange={(
                        event,
                      ) => {
                        handleDateSelection(
                          event.target.value,
                        );
                      }}
                      className="min-h-[52px] w-full rounded-2xl border border-primary/15 bg-white py-3 pl-12 pr-4 text-base font-bold text-navy outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                {dateOptions.map(
                  (
                    option,
                    index,
                  ) => {
                    const isSelected =
                      selectedDate ===
                      option.value;
                    const isClosed =
                      option.isClosed;

                    return (
                      <motion.button
                        key={
                          option.value
                        }
                        type="button"
                        disabled={
                          isClosed
                        }
                        title={
                          option.closureReason ??
                          (option.isFriday
                            ? "Friday prayer break: 12:00 PM–2:00 PM"
                            : undefined)
                        }
                        onClick={() => {
                          handleDateSelection(
                            option.value,
                          );
                        }}
                        initial={
                          prefersReducedMotion
                          || isClosed
                            ? undefined
                            : {
                                opacity: 0,
                                y: 14,
                              }
                        }
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.04,
                        }}
                        whileHover={
                          prefersReducedMotion
                            ? undefined
                            : {
                                y: -3,
                              }
                        }
                        whileTap={{
                          scale: 0.98,
                        }}
                        className={`relative overflow-hidden rounded-[1.4rem] border px-4 py-5 text-center transition ${
                          isClosed
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-80"
                            : isSelected
                            ? "border-primary bg-primary text-white shadow-[0_16px_35px_rgba(30,111,217,0.25)]"
                            : "border-slate-200 bg-white text-navy hover:border-primary/35"
                        }`}
                      >
                        {isClosed && (
                          <span
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-400 to-orange-400"
                          />
                        )}
                        <p
                          className={`text-xs font-extrabold uppercase tracking-[0.12em] ${
                            isClosed
                              ? "text-slate-400"
                              : isSelected
                              ? "text-cyan-100"
                              : "text-slate-400"
                          }`}
                        >
                          {
                            option.weekday
                          }
                        </p>

                        <p className="mt-3 font-heading text-3xl font-black">
                          {
                            option.day
                          }
                        </p>

                        <p
                          className={`mt-1 text-sm font-bold ${
                            isClosed
                              ? "text-slate-400"
                              : isSelected
                              ? "text-blue-100"
                              : "text-slate-500"
                          }`}
                        >
                          {
                            option.month
                          }
                        </p>

                        {isClosed ? (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-red-500">
                            <CalendarX2 className="h-3 w-3" />
                            Closed
                          </span>
                        ) : option.isFriday ? (
                          <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700">
                            Prayer 12–2
                          </span>
                        ) : null}
                      </motion.button>
                    );
                  },
                )}
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-primary/10 bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                    Available arrivals
                  </p>

                  <h3 className="mt-2 font-heading text-2xl font-black text-navy">
                    {selectedDate
                      ? selectedDateOption.fullLabel
                      : "Select a date first"}
                  </h3>
                </div>

                {selectedDate && (
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">
                      {
                        availableSlotCount
                      }{" "}
                      available
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setRefreshNumber(
                          (current) =>
                            current + 1,
                        );
                      }}
                      disabled={
                        isCheckingAvailability
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 bg-white text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Refresh availability"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          isCheckingAvailability
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {!selectedDate ? (
                <div className="py-14 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-4 text-base font-bold text-slate-500">
                    Choose a date to view
                    available arrival
                    times.
                  </p>
                </div>
              ) : slots.length ===
                  0 &&
                isCheckingAvailability ? (
                <div className="py-14 text-center">
                  <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />

                  <p className="mt-4 text-base font-bold text-slate-500">
                    Checking CleanNest
                    capacity…
                  </p>
                </div>
              ) : slots.length ===
                0 ? (
                <div className="py-14 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />

                  <p className="mt-4 text-base font-bold text-slate-600">
                    The trusted cleaning
                    duration cannot finish
                    within the current
                    booking hours.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {slots.map(
                    (slot) => {
                      const isSelected =
                        startTime ===
                          slot.startTime &&
                        endTime ===
                          slot.endTime;

                      const isAvailable =
                        slot.status ===
                        "available";

                      const isChecking =
                        slot.status ===
                        "checking";

                      return (
                        <motion.button
                          key={`${slot.startTime}-${slot.endTime}`}
                          type="button"
                          disabled={
                            !isAvailable
                          }
                          onClick={() => {
                            handleSlotSelection(
                              slot,
                            );
                          }}
                          whileHover={
                            prefersReducedMotion ||
                            !isAvailable
                              ? undefined
                              : {
                                  y: -3,
                                }
                          }
                          whileTap={
                            !isAvailable
                              ? undefined
                              : {
                                  scale:
                                    0.98,
                                }
                          }
                          title={
                            slot.message
                          }
                          className={`relative min-h-[112px] rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary text-white shadow-[0_14px_32px_rgba(30,111,217,0.24)]"
                              : isAvailable
                                ? "border-emerald-200 bg-emerald-50 text-navy hover:border-primary"
                                : isChecking
                                  ? "cursor-wait border-slate-200 bg-slate-50 text-slate-400"
                                  : "cursor-not-allowed border-red-100 bg-red-50/60 text-slate-400 opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <Clock3
                              className={`h-5 w-5 ${
                                isSelected
                                  ? "text-cyan-200"
                                  : isAvailable
                                    ? "text-emerald-600"
                                    : "text-slate-300"
                              }`}
                            />

                            {isChecking ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : isSelected ? (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary">
                                <Check className="h-4 w-4" />
                              </span>
                            ) : isAvailable ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-300" />
                            )}
                          </div>

                          <p className="mt-4 text-lg font-extrabold">
                            {formatClockTime(
                              slot.startTime,
                            )}
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${
                              isSelected
                                ? "text-blue-100"
                                : "text-slate-500"
                            }`}
                          >
                            Ends{" "}
                            {formatClockTime(
                              slot.endTime,
                            )}
                          </p>

                          {slot.blockedPeriod && (
                            <p className="mt-3 inline-flex rounded-full bg-red-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-red-600">
                              Closed period
                            </p>
                          )}

                          {isAvailable &&
                            slot.remainingCapacity !==
                              null && (
                              <p
                                className={`mt-3 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${
                                  isSelected
                                    ? "text-cyan-100"
                                    : "text-emerald-700"
                                }`}
                              >
                                <UsersRound className="h-3.5 w-3.5" />

                                {
                                  slot.remainingCapacity
                                }{" "}
                                capacity left
                              </p>
                            )}
                        </motion.button>
                      );
                    },
                  )}
                </div>
              )}

              {availabilityError && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                  <p className="text-sm font-semibold leading-6 text-red-600">
                    {
                      availabilityError
                    }
                  </p>
                </div>
              )}
            </section>

            {selectedSlot && (
              <motion.section
                initial={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: 0,
                        y: 12,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="grid gap-5 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-lg font-extrabold text-emerald-900">
                      Time route reserved
                    </p>

                    <p className="mt-2 text-base font-semibold leading-7 text-emerald-700">
                      {
                        selectedDateOption.fullLabel
                      }{" "}
                      ·{" "}
                      {formatClockTime(
                        selectedSlot.startTime,
                      )}{" "}
                      to{" "}
                      {formatClockTime(
                        selectedSlot.endTime,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />

                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                    Trusted duration verified
                  </span>
                </div>
              </motion.section>
            )}
          </>
        )}
    </div>
  );
}
