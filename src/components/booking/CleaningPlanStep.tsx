"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  SprayCan,
  WandSparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

export interface CleaningPlanService {
  id: string;
  name: string;
  description: string;

  basePrice: number;
  estimatedDurationMinutes: number;

  badge: string | null;
  slug: string;
  features: string[];
}

interface CleaningPlanStepProps {
  selectedServiceId: string;

  propertyType:
    | "apartment"
    | "house"
    | "office"
    | "other";

  propertySize: number;

  onSelect: (
    service: CleaningPlanService,
  ) => void;
}

interface ServicesApiResponse {
  success?: boolean;

  data?: {
    services?: CleaningPlanService[];
  };

  services?: CleaningPlanService[];

  error?: string;
  message?: string;
}

interface ServiceVisual {
  icon: LucideIcon;
  label: string;
}

const DEFAULT_FEATURES = [
  "Professional cleaning equipment",
  "Trusted CleanNest cleaning process",
  "Duration calculated for your property",
];

function extractServices(
  payload: ServicesApiResponse,
): CleaningPlanService[] {
  if (
    Array.isArray(
      payload.data?.services,
    )
  ) {
    return payload.data.services;
  }

  if (
    Array.isArray(payload.services)
  ) {
    return payload.services;
  }

  return [];
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatDuration(
  minutes: number,
) {
  if (minutes <= 0) {
    return "Calculated after selection";
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function getServiceVisual(
  serviceName: string,
): ServiceVisual {
  const normalizedName =
    serviceName
      .trim()
      .toLowerCase();

  if (
    normalizedName.includes("deep")
  ) {
    return {
      icon: WandSparkles,
      label: "Detailed care",
    };
  }

  if (
    normalizedName.includes("move")
  ) {
    return {
      icon: Home,
      label: "Transition care",
    };
  }

  if (
    normalizedName.includes(
      "office",
    ) ||
    normalizedName.includes(
      "commercial",
    )
  ) {
    return {
      icon: Waves,
      label: "Workplace care",
    };
  }

  if (
    normalizedName.includes(
      "standard",
    ) ||
    normalizedName.includes(
      "regular",
    ) ||
    normalizedName.includes(
      "basic",
    )
  ) {
    return {
      icon: SprayCan,
      label: "Routine care",
    };
  }

  return {
    icon: Sparkles,
    label: "CleanNest care",
  };
}

function propertyTypeLabel(
  propertyType:
    | "apartment"
    | "house"
    | "office"
    | "other",
) {
  return (
    propertyType
      .charAt(0)
      .toUpperCase() +
    propertyType.slice(1)
  );
}

export default function CleaningPlanStep({
  selectedServiceId,
  propertyType,
  propertySize,
  onSelect,
}: CleaningPlanStepProps) {
  const prefersReducedMotion =
    useReducedMotion();

  const [
    services,
    setServices,
  ] = useState<
    CleaningPlanService[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  async function loadServices() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        "/api/customer/services",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const responseText =
        await response.text();

      let payload: ServicesApiResponse =
        {};

      if (responseText.trim()) {
        try {
          payload = JSON.parse(
            responseText,
          ) as ServicesApiResponse;
        } catch {
          throw new Error(
            "The services server returned an invalid response.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          payload.error ??
            payload.message ??
            "Unable to load cleaning services.",
        );
      }

      const loadedServices =
        extractServices(payload);

      setServices(
        loadedServices,
      );
    } catch (error) {
      setServices([]);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load cleaning services.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  const selectedService =
    useMemo(
      () =>
        services.find(
          (service) =>
            service.id ===
            selectedServiceId,
        ) ?? null,
      [
        selectedServiceId,
        services,
      ],
    );

  if (isLoading) {
    return (
      <div className="mt-8 flex min-h-[360px] items-center justify-center rounded-[1.8rem] border border-primary/10 bg-white">
        <div className="px-6 text-center">
          <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-primary" />

          <h3 className="mt-5 font-heading text-2xl font-black text-navy">
            Preparing your cleaning
            plans
          </h3>

          <p className="mt-3 text-base font-medium text-slate-500">
            Loading available CleanNest
            services.
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mt-8 rounded-[1.8rem] border border-red-200 bg-red-50 p-7 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

        <h3 className="mt-5 font-heading text-2xl font-black text-red-800">
          Cleaning plans could not be
          loaded
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={() => {
            void loadServices();
          }}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-red-600 px-6 text-sm font-extrabold text-white transition hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />

          Try again
        </button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="mt-8 rounded-[1.8rem] border border-amber-200 bg-amber-50 p-7 text-center">
        <SprayCan className="mx-auto h-10 w-10 text-amber-600" />

        <h3 className="mt-5 font-heading text-2xl font-black text-amber-900">
          No cleaning plans are
          available
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-amber-700">
          An administrator must activate
          at least one cleaning service
          before customers can continue.
        </p>

        <button
          type="button"
          onClick={() => {
            void loadServices();
          }}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-amber-600 px-6 text-sm font-extrabold text-white transition hover:bg-amber-700"
        >
          <RefreshCw className="h-4 w-4" />

          Refresh services
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Property information */}
      <section className="grid gap-5 rounded-[1.6rem] border border-primary/10 bg-primary-light/35 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300">
            <Home className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
              Space profile received
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black text-navy">
              {propertyTypeLabel(
                propertyType,
              )}{" "}
              · {propertySize} m²
            </h3>

            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Choose the main cleaning
              plan for this property.
              Duration and pricing will
              be verified by the server
              before the booking is
              confirmed.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full border border-primary/15 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
          Stage 02
        </span>
      </section>

      {/* Service catalogue */}
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              Cleaning catalogue
            </p>

            <h3 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-navy">
              Select your main cleaning
              plan
            </h3>
          </div>

          <p className="max-w-md text-base font-medium leading-7 text-slate-500 md:text-right">
            Select one main service.
            Optional extra touches can
            be added during the next
            stage.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
          {services.map(
            (service, index) => {
              const isSelected =
                service.id ===
                selectedServiceId;

              const visual =
                getServiceVisual(
                  service.name,
                );

              const Icon =
                visual.icon;

              const features =
                service.features.length >
                0
                  ? service.features
                  : DEFAULT_FEATURES;

              return (
                <motion.button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    onSelect(service);
                  }}
                  initial={
                    prefersReducedMotion
                      ? undefined
                      : {
                          opacity: 0,
                          y: 18,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(
                      index * 0.06,
                      0.3,
                    ),
                  }}
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: -4,
                        }
                  }
                  whileTap={{
                    scale: 0.985,
                  }}
                  className={`relative min-h-[440px] overflow-hidden rounded-[1.7rem] border p-6 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary-light/70 shadow-[0_22px_55px_rgba(30,111,217,0.16)]"
                      : "border-slate-200 bg-white shadow-[0_12px_35px_rgba(11,37,69,0.06)] hover:border-primary/35"
                  }`}
                  aria-pressed={
                    isSelected
                  }
                >
                  <div
                    aria-hidden="true"
                    className={`absolute -right-16 -top-16 h-48 w-48 rounded-full transition ${
                      isSelected
                        ? "bg-primary/[0.12]"
                        : "bg-slate-50"
                    }`}
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition ${
                          isSelected
                            ? "bg-primary text-white shadow-[0_12px_28px_rgba(30,111,217,0.28)]"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-slate-200 bg-white text-transparent"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-navy px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-300">
                          {service.badge ??
                            visual.label}
                        </span>

                        {isSelected && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                            Selected
                          </span>
                        )}
                      </div>

                      <h4 className="mt-5 font-heading text-2xl font-black leading-tight tracking-[-0.03em] text-navy">
                        {service.name}
                      </h4>

                      <p className="mt-3 text-base font-medium leading-7 text-slate-500">
                        {
                          service.description
                        }
                      </p>
                    </div>

                    <div className="mt-6 space-y-3">
                      {features
                        .slice(0, 3)
                        .map(
                          (
                            feature,
                            featureIndex,
                          ) => (
                            <div
                              key={`${service.id}-${featureIndex}`}
                              className="flex items-start gap-3"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <Check className="h-3 w-3" />
                              </span>

                              <p className="text-sm font-semibold leading-6 text-slate-600">
                                {
                                  feature
                                }
                              </p>
                            </div>
                          ),
                        )}
                    </div>

                    <div className="mt-auto grid grid-cols-1 gap-3 border-t border-primary/10 pt-6 sm:grid-cols-2">
                      <div className="rounded-2xl bg-surface-soft p-4">
                        <div className="flex items-center gap-2">
                          <BadgeDollarSign className="h-4 w-4 shrink-0 text-primary" />

                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                            Starting price
                          </p>
                        </div>

                        <p className="mt-3 font-heading text-2xl font-black text-navy">
                          {formatCurrency(
                            service.basePrice,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-soft p-4">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 shrink-0 text-primary" />

                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                            Base duration
                          </p>
                        </div>

                        <p className="mt-3 text-base font-extrabold leading-6 text-navy">
                          {formatDuration(
                            service.estimatedDurationMinutes,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            },
          )}
        </div>
      </section>

      {/* Selected service confirmation */}
      {selectedService && (
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
              <CheckCircle2 className="h-5 w-5" />
            </span>

            <div>
              <p className="text-lg font-extrabold text-emerald-900">
                Cleaning plan selected
              </p>

              <p className="mt-2 text-base font-semibold leading-7 text-emerald-700">
                {selectedService.name} ·{" "}
                {formatCurrency(
                  selectedService.basePrice,
                )}{" "}
                starting price ·{" "}
                {formatDuration(
                  selectedService.estimatedDurationMinutes,
                )}
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />

            <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
              Plan ready
            </span>
          </div>
        </motion.section>
      )}
    </div>
  );
}