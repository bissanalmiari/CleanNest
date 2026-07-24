"use client";

import {
  useMemo,
  useState,
  type ComponentType,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Home,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  SprayCan,
  WandSparkles,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

import CleaningPlanStep, {
  type CleaningPlanService,
} from "./CleaningPlanStep";

import ExtraTouchesStep, {
  type ExtraTouchSelection,
} from "./ExtraTouchesStep";

import FinalCheckStep, {
  type FinalCheckPaymentMethod,
} from "./FinalCheckStep";

import HomeBaseStep, {
  type HomeBaseAddress,
} from "./HomeBaseStep";

import SpaceScanStep from "./SpaceScanStep";

import TimeRouteStep, {
  type TimeRoutePricingSnapshot,
  type TimeRouteSelection,
} from "./TimeRouteStep";

type BookingStepId =
  | "space"
  | "plan"
  | "extras"
  | "address"
  | "schedule"
  | "review";

type PropertyType =
  | "apartment"
  | "house"
  | "office"
  | "other";

interface BookingStep {
  id: BookingStepId;
  number: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;

  icon: ComponentType<{
    className?: string;
  }>;
}

interface BookingAddonDraft {
  addOnId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface BookingDraft {
  serviceId: string;
  serviceName: string;

  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  propertySize: number;

  addOns: BookingAddonDraft[];

  addressId: string;
  addressLabel: string;

  serviceAreaId: string;
  serviceAreaLabel: string;

  bookingDate: string;
  startTime: string;
  endTime: string;

  paymentMethod:
    | "cash"
    | "card";

  customerNotes: string;

  baseAmount: number;
  addOnsAmount: number;
  serviceAreaFee: number;
  discountAmount: number;
  totalAmount: number;

  estimatedDurationMinutes: number;
}

const DEFAULT_BOOKING_STEP: BookingStep = {
  id: "space",
  number: "01",
  label: "Space Scan",
  shortLabel: "Space",
  eyebrow: "Map your property",
  title:
    "Tell us what kind of space we are cleaning.",
  description:
    "Build the foundation of your cleaning route by selecting the property type, room count, and approximate size.",
  icon: Home,
};

const BOOKING_STEPS: BookingStep[] = [
  DEFAULT_BOOKING_STEP,

  {
    id: "plan",
    number: "02",
    label: "Cleaning Plan",
    shortLabel: "Plan",
    eyebrow:
      "Choose the main service",
    title:
      "Select the cleaning experience your space needs.",
    description:
      "Choose a CleanNest service and see how it affects the estimated route duration and starting price.",
    icon: SprayCan,
  },

  {
    id: "extras",
    number: "03",
    label: "Extra Touches",
    shortLabel: "Extras",
    eyebrow:
      "Personalize the result",
    title:
      "Add focused cleaning touches to specific areas.",
    description:
      "Personalize your route with optional services such as appliance cleaning and additional care.",
    icon: Plus,
  },

  {
    id: "address",
    number: "04",
    label: "Home Base",
    shortLabel: "Address",
    eyebrow:
      "Choose the destination",
    title:
      "Connect this cleaning route to an address.",
    description:
      "Select a saved address and confirm that it belongs to an active CleanNest service area.",
    icon: MapPin,
  },

  {
    id: "schedule",
    number: "05",
    label: "Time Route",
    shortLabel: "Time",
    eyebrow:
      "Reserve your visit",
    title:
      "Choose when your cleaning route should begin.",
    description:
      "Select an available date and start time. CleanNest calculates the expected completion time using the trusted server duration.",
    icon: CalendarDays,
  },

  {
    id: "review",
    number: "06",
    label: "Final Check",
    shortLabel: "Review",
    eyebrow:
      "Inspect before booking",
    title:
      "Review the complete route before confirmation.",
    description:
      "Check your property, service, extras, address, schedule, payment method, and final calculated total.",
    icon: ClipboardCheck,
  },
];

const INITIAL_BOOKING_DRAFT: BookingDraft = {
  serviceId: "",
  serviceName: "Not selected",

  propertyType: "apartment",
  bedrooms: 1,
  bathrooms: 1,
  propertySize: 80,

  addOns: [],

  addressId: "",
  addressLabel:
    "No address selected",

  serviceAreaId: "",
  serviceAreaLabel:
    "Not selected",

  bookingDate: "",
  startTime: "",
  endTime: "",

  paymentMethod: "cash",
  customerNotes: "",

  baseAmount: 0,
  addOnsAmount: 0,
  serviceAreaFee: 0,
  discountAmount: 0,
  totalAmount: 0,

  estimatedDurationMinutes: 0,
};

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
    return "Not calculated";
  }

  const hours = Math.floor(
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
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
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
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
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

function formatSelectedTime(
  startTime: string,
  endTime: string,
): string {
  if (
    !startTime ||
    !endTime
  ) {
    return "Not selected";
  }

  return `${formatClockTime(
    startTime,
  )} – ${formatClockTime(
    endTime,
  )}`;
}

function propertyTypeLabel(
  propertyType: PropertyType,
): string {
  return (
    propertyType
      .charAt(0)
      .toUpperCase() +
    propertyType.slice(1)
  );
}

function roomLabel(
  propertyType: PropertyType,
): string {
  if (
    propertyType === "office"
  ) {
    return "Work areas";
  }

  if (
    propertyType === "other"
  ) {
    return "Main rooms";
  }

  return "Bedrooms";
}

export default function BookingRouteBuilder() {
  const prefersReducedMotion =
    useReducedMotion();

  const [
    currentStepIndex,
    setCurrentStepIndex,
  ] = useState(0);

  const [
    furthestStepIndex,
    setFurthestStepIndex,
  ] = useState(0);

  const [draft, setDraft] =
    useState<BookingDraft>({
      ...INITIAL_BOOKING_DRAFT,
      addOns: [],
    });

  const [
    stepError,
    setStepError,
  ] = useState<
    string | null
  >(null);

  const currentStep: BookingStep =
    BOOKING_STEPS.at(
      currentStepIndex,
    ) ?? DEFAULT_BOOKING_STEP;

  const CurrentStepIcon =
    currentStep.icon;

  const totalSteps =
    BOOKING_STEPS.length;

  const progress =
    totalSteps > 0
      ? ((currentStepIndex + 1) /
          totalSteps) *
        100
      : 0;

  const routeLineProgress =
    totalSteps > 1
      ? (currentStepIndex /
          (totalSteps - 1)) *
        100
      : 0;

  const isFirstStep =
    currentStepIndex === 0;

  const isLastStep =
    currentStepIndex ===
    totalSteps - 1;

  const completedStepCount =
    currentStepIndex;

  const nextStep =
    BOOKING_STEPS.at(
      currentStepIndex + 1,
    );

  const isSpaceStepValid =
    draft.propertySize >= 20 &&
    draft.propertySize <= 2000 &&
    draft.bedrooms >= 0 &&
    draft.bedrooms <= 30 &&
    draft.bathrooms >= 0 &&
    draft.bathrooms <= 30;

  const isPlanStepValid =
    Boolean(draft.serviceId);

  const isAddressStepValid =
    Boolean(
      draft.addressId &&
        draft.serviceAreaId,
    );

  const isScheduleStepValid =
    Boolean(
      draft.bookingDate &&
        draft.startTime &&
        draft.endTime,
    );

  const isCurrentStepValid =
    currentStep.id === "space"
      ? isSpaceStepValid
      : currentStep.id === "plan"
        ? isPlanStepValid
        : currentStep.id ===
            "address"
          ? isAddressStepValid
          : currentStep.id ===
              "schedule"
            ? isScheduleStepValid
            : true;

  const roomPreview = useMemo(
    () => [
      {
        name: roomLabel(
          draft.propertyType,
        ),

        value:
          draft.bedrooms,

        icon: BedDouble,
      },

      {
        name: "Bathrooms",

        value:
          draft.bathrooms,

        icon: Bath,
      },
    ],
    [
      draft.bathrooms,
      draft.bedrooms,
      draft.propertyType,
    ],
  );

  const selectedExtraQuantity =
    useMemo(() => {
      return draft.addOns.reduce(
        (
          total,
          addOn,
        ) =>
          total +
          addOn.quantity,
        0,
      );
    }, [draft.addOns]);

  function goToPreviousStep() {
    setStepError(null);

    setCurrentStepIndex(
      (previousIndex) =>
        Math.max(
          0,
          previousIndex - 1,
        ),
    );
  }

  function goToNextStep() {
    if (isLastStep) {
      return;
    }

    if (!isCurrentStepValid) {
      if (
        currentStep.id === "plan"
      ) {
        setStepError(
          "Select a cleaning plan before continuing.",
        );
      } else if (
        currentStep.id ===
        "address"
      ) {
        setStepError(
          "Select an address inside an active CleanNest service area before continuing.",
        );
      } else if (
        currentStep.id ===
        "schedule"
      ) {
        setStepError(
          "Select an available cleaning date and arrival time before continuing.",
        );
      } else {
        setStepError(
          "Complete the current route stage before continuing.",
        );
      }

      return;
    }

    setStepError(null);

    const nextStepIndex =
      Math.min(
        currentStepIndex + 1,
        totalSteps - 1,
      );

    setCurrentStepIndex(
      nextStepIndex,
    );

    setFurthestStepIndex(
      (
        previousFurthestStep,
      ) =>
        Math.max(
          previousFurthestStep,
          nextStepIndex,
        ),
    );
  }

  function handleStepSelection(
    stepIndex: number,
  ) {
    if (
      stepIndex >
      furthestStepIndex
    ) {
      return;
    }

    setStepError(null);

    setCurrentStepIndex(
      stepIndex,
    );
  }

  function resetRoute() {
    setDraft({
      ...INITIAL_BOOKING_DRAFT,
      addOns: [],
    });

    setStepError(null);
    setCurrentStepIndex(0);
    setFurthestStepIndex(0);
  }

  function handleServiceSelection(
    service: CleaningPlanService,
  ) {
    setStepError(null);

    setDraft(
      (currentDraft) => {
        const nextBaseAmount =
          service.basePrice;

        const nextAddOnsAmount =
          0;

        const nextTotalAmount =
          Math.max(
            0,
            nextBaseAmount +
              nextAddOnsAmount +
              currentDraft.serviceAreaFee -
              currentDraft.discountAmount,
          );

        return {
          ...currentDraft,

          serviceId:
            service.id,

          serviceName:
            service.name,

          baseAmount:
            nextBaseAmount,

          estimatedDurationMinutes:
            service.estimatedDurationMinutes,

          addOns: [],

          addOnsAmount:
            nextAddOnsAmount,

          bookingDate: "",
          startTime: "",
          endTime: "",

          totalAmount:
            nextTotalAmount,
        };
      },
    );
  }

  function handleAddOnsChange(
    nextAddOns:
      ExtraTouchSelection[],
  ) {
    setStepError(null);

    setDraft(
      (currentDraft) => {
        const nextAddOnsAmount =
          nextAddOns.reduce(
            (
              total,
              addOn,
            ) =>
              total +
              addOn.quantity *
                addOn.unitPrice,
            0,
          );

        const nextTotalAmount =
          Math.max(
            0,
            currentDraft.baseAmount +
              nextAddOnsAmount +
              currentDraft.serviceAreaFee -
              currentDraft.discountAmount,
          );

        return {
          ...currentDraft,

          addOns:
            nextAddOns,

          addOnsAmount:
            nextAddOnsAmount,

          /*
           * Add-ons can change the trusted duration.
           * The previous slot is no longer valid.
           */
          bookingDate: "",
          startTime: "",
          endTime: "",

          totalAmount:
            nextTotalAmount,
        };
      },
    );
  }

  function handleAddressSelection(
    address: HomeBaseAddress,
  ) {
    setStepError(null);

    setDraft(
      (currentDraft) => {
        const nextServiceAreaFee =
          address.serviceFee;

        const nextTotalAmount =
          Math.max(
            0,
            currentDraft.baseAmount +
              currentDraft.addOnsAmount +
              nextServiceAreaFee -
              currentDraft.discountAmount,
          );

        return {
          ...currentDraft,

          addressId:
            address.id,

          addressLabel:
            address.fullAddress ||
            address.label,

          serviceAreaId:
            address.serviceAreaId,

          serviceAreaLabel:
            address.serviceAreaLabel,

          serviceAreaFee:
            nextServiceAreaFee,

          bookingDate: "",
          startTime: "",
          endTime: "",

          totalAmount:
            nextTotalAmount,
        };
      },
    );
  }

  function handleTimeRouteChange(
    selection:
      TimeRouteSelection,
  ) {
    setStepError(null);

    setDraft(
      (currentDraft) => ({
        ...currentDraft,

        bookingDate:
          selection.bookingDate,

        startTime:
          selection.startTime,

        endTime:
          selection.endTime,
      }),
    );
  }

  function handleTrustedTimeRouteQuote(
    snapshot:
      TimeRoutePricingSnapshot,
  ) {
    setDraft(
      (currentDraft) => ({
        ...currentDraft,

        baseAmount:
          snapshot.baseAmount,

        addOnsAmount:
          snapshot.addOnsAmount,

        discountAmount:
          snapshot.discountAmount,

        estimatedDurationMinutes:
          snapshot.estimatedDurationMinutes,

        totalAmount:
          Math.max(
            0,
            snapshot.totalAmount +
              currentDraft.serviceAreaFee,
          ),
      }),
    );
  }

  function handlePaymentMethodChange(
    paymentMethod:
      FinalCheckPaymentMethod,
  ) {
    setStepError(null);

    setDraft(
      (currentDraft) => ({
        ...currentDraft,
        paymentMethod,
      }),
    );
  }

  function handleCustomerNotesChange(
    customerNotes: string,
  ) {
    setDraft(
      (currentDraft) => ({
        ...currentDraft,

        customerNotes:
          customerNotes.slice(
            0,
            1000,
          ),
      }),
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",

          backgroundSize:
            "48px 48px",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [
                  1,
                  1.16,
                  1,
                ],

                x: [
                  0,
                  35,
                  0,
                ],
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-[28rem] w-[28rem] rounded-full bg-cyan-300/10 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [
                  1.1,
                  0.92,
                  1.1,
                ],

                y: [
                  0,
                  -28,
                  0,
                ],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto max-w-[1500px]">
        <header className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_15px_35px_rgba(11,37,69,0.2)]">
                <WandSparkles className="h-5 w-5" />
              </span>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
                  CleanNest booking system
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Route reference CN / NEW
                </p>
              </div>
            </div>

            <h1 className="mt-6 max-w-4xl font-heading text-4xl font-black leading-[1.03] tracking-[-0.045em] text-navy sm:text-5xl lg:text-[3.5rem]">
              Build a cleaning route
              around your home.
            </h1>

            <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-500 lg:text-lg">
              Each stage adds another
              part to your cleaning
              journey. Your selections
              remain visible while
              CleanNest calculates the
              trusted price and estimated
              duration.
            </p>
          </div>

          <button
            type="button"
            onClick={resetRoute}
            className="flex min-h-12 w-fit items-center gap-3 rounded-2xl border border-primary/10 bg-white/90 px-5 text-sm font-extrabold text-slate-600 shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" />

            Reset route
          </button>
        </header>

        <div className="grid items-start gap-8 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_30px_90px_rgba(11,37,69,0.12)] backdrop-blur-xl">
            <div className="relative overflow-hidden bg-navy px-5 pb-6 pt-6 text-white sm:px-7 lg:px-9">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.18),transparent_30%)]"
              />

              <div className="relative flex items-center justify-between gap-5">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.21em] text-cyan-300/85">
                    Active cleaning route
                  </p>

                  <p className="mt-2 font-heading text-xl font-black">
                    Step{" "}
                    {currentStepIndex +
                      1}{" "}
                    of {totalSteps}
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 font-mono text-xs font-bold text-blue-100">
                  {Math.round(progress)}%
                </div>
              </div>

              <div className="relative mt-7">
                <div className="absolute left-[8.333%] right-[8.333%] top-5 h-0.5 bg-white/10" />

                <motion.div
                  className="absolute left-[8.333%] top-5 h-0.5 origin-left bg-gradient-to-r from-primary via-cyan-300 to-emerald-300"
                  animate={{
                    width: `${
                      routeLineProgress *
                      0.83334
                    }%`,
                  }}
                  transition={{
                    duration: 0.55,

                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                />

                <div className="relative grid grid-cols-6 gap-2">
                  {BOOKING_STEPS.map(
                    (
                      step,
                      stepIndex,
                    ) => {
                      const Icon =
                        step.icon;

                      const isCurrent =
                        stepIndex ===
                        currentStepIndex;

                      const isCompleted =
                        stepIndex <
                        currentStepIndex;

                      const isAccessible =
                        stepIndex <=
                        furthestStepIndex;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          disabled={
                            !isAccessible
                          }
                          onClick={() => {
                            handleStepSelection(
                              stepIndex,
                            );
                          }}
                          className="group flex min-w-0 flex-col items-center"
                          aria-current={
                            isCurrent
                              ? "step"
                              : undefined
                          }
                        >
                          <motion.span
                            animate={
                              isCurrent &&
                              !prefersReducedMotion
                                ? {
                                    scale:
                                      [
                                        1,
                                        1.08,
                                        1,
                                      ],
                                  }
                                : undefined
                            }
                            transition={{
                              duration: 2,
                              repeat:
                                Infinity,
                              ease:
                                "easeInOut",
                            }}
                            className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border transition-all sm:h-12 sm:w-12 ${
                              isCurrent
                                ? "border-cyan-300 bg-primary text-white shadow-[0_0_25px_rgba(34,211,238,0.32)]"
                                : isCompleted
                                  ? "border-emerald-300 bg-emerald-400 text-navy"
                                  : isAccessible
                                    ? "border-white/20 bg-white/10 text-blue-100 hover:bg-white/15"
                                    : "cursor-not-allowed border-white/10 bg-white/5 text-white/25"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </motion.span>

                          <span
                            className={`mt-3 hidden max-w-full truncate text-[11px] font-extrabold sm:block ${
                              isCurrent
                                ? "text-cyan-300"
                                : isCompleted
                                  ? "text-emerald-300"
                                  : "text-blue-100/55"
                            }`}
                          >
                            {
                              step.shortLabel
                            }
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7 lg:p-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{
                    opacity: 0,
                    y: 18,
                    filter:
                      "blur(6px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter:
                      "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: -14,
                    filter:
                      "blur(5px)",
                  }}
                  transition={{
                    duration: 0.35,

                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                >
                  <div className="grid gap-8 min-[1750px]:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-primary/50">
                          {
                            currentStep.number
                          }
                        </span>

                        <span className="h-px w-10 bg-primary/25" />

                        <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
                          {
                            currentStep.eyebrow
                          }
                        </p>
                      </div>

                      <h2 className="mt-5 max-w-4xl font-heading text-3xl font-black leading-[1.08] tracking-[-0.04em] text-navy sm:text-4xl">
                        {
                          currentStep.title
                        }
                      </h2>

                      <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-500">
                        {
                          currentStep.description
                        }
                      </p>

                      {currentStep.id ===
                      "space" ? (
                        <SpaceScanStep
                          value={{
                            propertyType:
                              draft.propertyType,

                            bedrooms:
                              draft.bedrooms,

                            bathrooms:
                              draft.bathrooms,

                            propertySize:
                              draft.propertySize,
                          }}
                          onChange={(
                            update,
                          ) => {
                            setStepError(
                              null,
                            );

                            setDraft(
                              (
                                currentDraft,
                              ) => ({
                                ...currentDraft,
                                ...update,

                                /*
                                 * Property changes can change
                                 * the trusted duration and price.
                                 */
                                bookingDate:
                                  "",

                                startTime:
                                  "",

                                endTime:
                                  "",
                              }),
                            );
                          }}
                        />
                      ) : currentStep.id ===
                        "plan" ? (
                        <CleaningPlanStep
                          selectedServiceId={
                            draft.serviceId
                          }
                          propertyType={
                            draft.propertyType
                          }
                          propertySize={
                            draft.propertySize
                          }
                          onSelect={
                            handleServiceSelection
                          }
                        />
                      ) : currentStep.id ===
                        "extras" ? (
                        <ExtraTouchesStep
                          serviceId={
                            draft.serviceId
                          }
                          serviceName={
                            draft.serviceName
                          }
                          selectedAddOns={
                            draft.addOns
                          }
                          onChange={
                            handleAddOnsChange
                          }
                        />
                      ) : currentStep.id ===
                        "address" ? (
                        <HomeBaseStep
                          selectedAddressId={
                            draft.addressId
                          }
                          onSelect={
                            handleAddressSelection
                          }
                        />
                      ) : currentStep.id ===
                        "schedule" ? (
                        <TimeRouteStep
                          serviceId={
                            draft.serviceId
                          }
                          serviceAreaId={
                            draft.serviceAreaId
                          }
                          propertyType={
                            draft.propertyType
                          }
                          bedrooms={
                            draft.bedrooms
                          }
                          bathrooms={
                            draft.bathrooms
                          }
                          propertySize={
                            draft.propertySize
                          }
                          addOns={
                            draft.addOns
                          }
                          bookingDate={
                            draft.bookingDate
                          }
                          startTime={
                            draft.startTime
                          }
                          endTime={
                            draft.endTime
                          }
                          onChange={
                            handleTimeRouteChange
                          }
                          onTrustedQuote={
                            handleTrustedTimeRouteQuote
                          }
                        />
                      ) : currentStep.id ===
                        "review" ? (
                        <FinalCheckStep
                          draft={
                            draft
                          }
                          onPaymentMethodChange={
                            handlePaymentMethodChange
                          }
                          onCustomerNotesChange={
                            handleCustomerNotesChange
                          }
                        />
                      ) : (
                        <div className="mt-8 rounded-[1.7rem] border border-dashed border-primary/25 bg-primary-light/35 p-6 sm:p-7">
                          <div className="flex items-start gap-5">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                              <CurrentStepIcon className="h-6 w-6" />
                            </span>

                            <div>
                              <p className="font-heading text-xl font-black text-navy">
                                {
                                  currentStep.label
                                }{" "}
                                workspace
                              </p>

                              <p className="mt-3 text-base font-medium leading-7 text-slate-500">
                                This route stage
                                is not available.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {stepError && (
                        <p
                          aria-live="polite"
                          className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600"
                        >
                          {stepError}
                        </p>
                      )}
                    </div>

                    <div className="hidden rounded-[1.7rem] border border-primary/10 bg-[#edf5fc] p-4 min-[1750px]:block">
                      <div className="flex items-center justify-between px-1 py-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary">
                          Property route
                        </p>

                        <span className="font-mono text-[10px] font-bold text-primary/45">
                          CN-HOME
                        </span>
                      </div>

                      <div className="relative mt-4 grid aspect-square grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-[1.4rem] border border-primary/10 bg-white/70 p-2">
                        <motion.div
                          className="absolute left-[22%] top-[23%] z-20 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-lg"
                          animate={{
                            left:
                              currentStepIndex %
                                2 ===
                              0
                                ? "22%"
                                : "68%",

                            top:
                              currentStepIndex <
                              3
                                ? "23%"
                                : "67%",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 95,
                            damping: 17,
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>

                        {[
                          "Living",
                          "Kitchen",
                          "Bedroom",
                          "Bathroom",
                        ].map(
                          (
                            room,
                            roomIndex,
                          ) => {
                            const isClean =
                              roomIndex <
                              Math.min(
                                completedStepCount,
                                4,
                              );

                            const isActive =
                              roomIndex ===
                              Math.min(
                                currentStepIndex,
                                3,
                              );

                            return (
                              <div
                                key={room}
                                className={`flex flex-col justify-end rounded-xl border p-3 transition-all ${
                                  isActive
                                    ? "border-primary/40 bg-primary-light shadow-sm"
                                    : isClean
                                      ? "border-emerald-200 bg-emerald-50"
                                      : "border-slate-200 bg-white/75"
                                }`}
                              >
                                <span
                                  className={`mb-auto flex h-7 w-7 items-center justify-center rounded-lg ${
                                    isClean
                                      ? "bg-emerald-500 text-white"
                                      : isActive
                                        ? "bg-primary text-white"
                                        : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {isClean ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Home className="h-3.5 w-3.5" />
                                  )}
                                </span>

                                <p className="mt-3 text-[11px] font-extrabold text-navy">
                                  {room}
                                </p>
                              </div>
                            );
                          },
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl bg-navy px-4 py-4 text-white">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-cyan-300">
                          Active stage
                        </p>

                        <p className="mt-2 text-sm font-extrabold">
                          {
                            currentStep.label
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col-reverse gap-4 border-t border-primary/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={
                    goToPreviousStep
                  }
                  disabled={
                    isFirstStep
                  }
                  className="flex min-h-[52px] items-center justify-center gap-3 rounded-2xl border border-primary/10 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-5 w-5" />

                  Previous stage
                </button>

                {!isLastStep && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                        Next route point
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-navy">
                        {nextStep?.label ??
                          "Next stage"}
                      </p>
                    </div>

                    <motion.button
                      type="button"
                      onClick={
                        goToNextStep
                      }
                      whileHover={
                        prefersReducedMotion
                          ? undefined
                          : {
                              y: -2,
                            }
                      }
                      whileTap={{
                        scale: 0.98,
                      }}
                      className="group flex min-h-[52px] items-center justify-center gap-3 rounded-2xl bg-navy px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_35px_rgba(11,37,69,0.2)] transition hover:bg-primary"
                    >
                      Continue route

                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </motion.button>
                  </div>
                )}

                {isLastStep && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />

                    Confirm your booking above
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="2xl:sticky 2xl:top-6">
            <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_25px_70px_rgba(11,37,69,0.11)] backdrop-blur-xl">
              <div className="bg-navy px-6 py-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.19em] text-cyan-300">
                      Live route ledger
                    </p>

                    <p className="mt-2 font-heading text-2xl font-black">
                      Booking snapshot
                    </p>
                  </div>

                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-300 to-emerald-300"
                    animate={{
                      width: `${progress}%`,
                    }}
                    transition={{
                      duration: 0.5,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs font-semibold text-blue-100/65">
                  {completedStepCount}{" "}
                  of {totalSteps} route
                  stages completed
                </p>
              </div>

              <div className="p-6">
                <div className="rounded-[1.4rem] border border-primary/10 bg-primary-light/35 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">
                        Property
                      </p>

                      <p className="mt-2 text-base font-extrabold text-navy">
                        {propertyTypeLabel(
                          draft.propertyType,
                        )}
                      </p>
                    </div>

                    <Home className="h-6 w-6 text-primary" />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {roomPreview.map(
                      ({
                        name,
                        value,
                        icon: Icon,
                      }) => (
                        <div
                          key={name}
                          className="rounded-xl border border-white bg-white/80 p-4"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />

                            <span className="text-xs font-bold text-slate-500">
                              {name}
                            </span>
                          </div>

                          <p className="mt-3 font-heading text-2xl font-black text-navy">
                            {value}
                          </p>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-3 rounded-xl border border-white bg-white/80 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Approximate size
                    </p>

                    <p className="mt-2 text-base font-extrabold text-navy">
                      {
                        draft.propertySize
                      }{" "}
                      m²
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <SummaryRow
                    icon={SprayCan}
                    label="Cleaning plan"
                    value={
                      draft.serviceName
                    }
                  />

                  <SummaryRow
                    icon={Plus}
                    label="Extra touches"
                    value={
                      selectedExtraQuantity >
                      0
                        ? `${selectedExtraQuantity} selected`
                        : "None selected"
                    }
                  />

                  <SummaryRow
                    icon={MapPin}
                    label="Home base"
                    value={
                      draft.addressLabel
                    }
                  />

                  <SummaryRow
                    icon={CalendarDays}
                    label="Date"
                    value={formatBookingDate(
                      draft.bookingDate,
                    )}
                  />

                  <SummaryRow
                    icon={Clock3}
                    label="Arrival time"
                    value={formatSelectedTime(
                      draft.startTime,
                      draft.endTime,
                    )}
                  />

                  <SummaryRow
                    icon={Clock3}
                    label="Trusted duration"
                    value={formatDuration(
                      draft.estimatedDurationMinutes,
                    )}
                  />
                </div>

                <div className="mt-7 border-t border-primary/10 pt-6">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-primary">
                    Current estimate
                  </p>

                  <div className="mt-5 space-y-4">
                    <PriceRow
                      label="Cleaning route"
                      value={
                        draft.baseAmount
                      }
                    />

                    <PriceRow
                      label="Extra touches"
                      value={
                        draft.addOnsAmount
                      }
                    />

                    <PriceRow
                      label="Area fee"
                      value={
                        draft.serviceAreaFee
                      }
                    />

                    {draft.discountAmount >
                      0 && (
                      <PriceRow
                        label="Discount"
                        value={
                          -draft.discountAmount
                        }
                      />
                    )}
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-5 rounded-[1.4rem] bg-navy p-5 text-white">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-cyan-300">
                        Route estimate
                      </p>

                      <p className="mt-2 text-xs text-blue-100/65">
                        Final price shown
                        during review
                      </p>
                    </div>

                    <p className="font-heading text-3xl font-black">
                      {formatCurrency(
                        draft.totalAmount,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-4 rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <p className="text-xs font-medium leading-6 text-emerald-700">
                    Prices, duration, and
                    availability are
                    verified again by the
                    server before your
                    booking is created.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

interface SummaryRowProps {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string;
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <p
          className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-navy"
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

interface PriceRowProps {
  label: string;
  value: number;
}

function PriceRow({
  label,
  value,
}: PriceRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-semibold text-slate-500">
        {label}
      </span>

      <span className="font-extrabold text-navy">
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