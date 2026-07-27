"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BadgeDollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  SprayCan,
  WandSparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import ServiceCoverImage from "@/components/services/ServiceCoverImage";

export interface CleaningPlanService {
  id: string;
  name: string;
  description: string;

  basePrice: number;
  estimatedDurationMinutes: number;

  badge: string | null;
  category: string;
  slug: string;
  imageUrl?: string;
  features: string[];
}

interface CleaningPlanStepProps {
  preferredServiceSlug?: string;
  selectedServiceId: string;

  propertyType: "apartment" | "house" | "office" | "other";

  propertySize: number;
  bedrooms: number;
  bathrooms: number;

  onSelect: (service: CleaningPlanService) => void;
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

interface PersonalizedServiceQuote {
  serviceBaseAmount: number;
  propertyAdjustmentAmount: number;
  baseAmount: number;
  estimatedDurationMinutes: number;
}

interface BatchPricePreviewApiResponse {
  success?: boolean;
  data?: {
    quotes?: Record<string, PersonalizedServiceQuote>;
  };
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

const SERVICES_PER_PAGE = 6;

function extractServices(payload: ServicesApiResponse): CleaningPlanService[] {
  if (Array.isArray(payload.data?.services)) {
    return payload.data.services;
  }

  if (Array.isArray(payload.services)) {
    return payload.services;
  }

  return [];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "Calculated after selection";
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function getServiceVisual(serviceName: string): ServiceVisual {
  const normalizedName = serviceName.trim().toLowerCase();

  if (normalizedName.includes("deep")) {
    return {
      icon: WandSparkles,
      label: "Detailed care",
    };
  }

  if (normalizedName.includes("move")) {
    return {
      icon: Home,
      label: "Transition care",
    };
  }

  if (normalizedName.includes("office") || normalizedName.includes("commercial")) {
    return {
      icon: Waves,
      label: "Workplace care",
    };
  }

  if (
    normalizedName.includes("standard") ||
    normalizedName.includes("regular") ||
    normalizedName.includes("basic")
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

function propertyTypeLabel(propertyType: "apartment" | "house" | "office" | "other") {
  return propertyType.charAt(0).toUpperCase() + propertyType.slice(1);
}

function getRecommendationScore(
  service: CleaningPlanService,
  property: {
    propertyType: "apartment" | "house" | "office" | "other";
    propertySize: number;
    bedrooms: number;
    bathrooms: number;
    preferredServiceSlug?: string;
  }
) {
  const slug = service.slug;
  let score = 0;

  if (slug === property.preferredServiceSlug) {
    score += 1000;
  }

  if (property.propertyType === "office") {
    if (slug === "office-cleaning") score += 100;
    if (service.category === "Commercial Cleaning") score += 55;
    if (slug === "window-glass-cleaning") score += 30;
  } else if (property.propertyType === "house") {
    if (slug === "regular-home-cleaning") score += 80;
    if (slug === "deep-cleaning") score += 70;
    if (slug === "eco-friendly-home-cleaning") score += 45;
    if (property.propertySize >= 180 && slug === "villa-cleaning") score += 100;
  } else if (property.propertyType === "apartment") {
    if (slug === "regular-home-cleaning") score += 100;
    if (slug === "deep-cleaning") score += 70;
    if (slug === "eco-friendly-home-cleaning") score += 55;
    if (slug === "airbnb-turnover-cleaning") score += 25;
  } else {
    if (slug === "deep-cleaning") score += 90;
    if (slug === "move-in-move-out-cleaning") score += 60;
    if (slug === "post-construction-cleaning") score += 40;
  }

  if (property.bathrooms >= 3 && slug === "bathroom-sanitizing") {
    score += 65;
  }

  if (property.bedrooms >= 4 && slug === "deep-cleaning") {
    score += 35;
  }

  if (property.propertySize >= 140 && slug === "deep-cleaning") {
    score += 25;
  }

  return score;
}

export default function CleaningPlanStep({
  preferredServiceSlug,
  selectedServiceId,
  propertyType,
  propertySize,
  bedrooms,
  bathrooms,
  onSelect,
}: CleaningPlanStepProps) {
  const prefersReducedMotion = useReducedMotion();

  const [services, setServices] = useState<CleaningPlanService[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [personalizedQuotes, setPersonalizedQuotes] = useState<
    Record<string, PersonalizedServiceQuote>
  >({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesReady, setQuotesReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  async function loadServices() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/customer/services", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const responseText = await response.text();

      let payload: ServicesApiResponse = {};

      if (responseText.trim()) {
        try {
          payload = JSON.parse(responseText) as ServicesApiResponse;
        } catch {
          throw new Error("The services server returned an invalid response.");
        }
      }

      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Unable to load cleaning services.");
      }

      const loadedServices = extractServices(payload);

      setServices(loadedServices);
    } catch (error) {
      setServices([]);

      setErrorMessage(error instanceof Error ? error.message : "Unable to load cleaning services.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  useEffect(() => {
    if (services.length === 0) {
      setQuotesReady(false);
      return;
    }

    const controller = new AbortController();
    setQuotesReady(false);

    async function loadPersonalizedQuotes() {
      setQuotesLoading(true);

      try {
        const response = await fetch("/api/customer/bookings/price-preview/batch", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceIds: services.map((service) => service.id),
            property: {
              propertyType,
              bedrooms,
              bathrooms,
              propertySize,
            },
          }),
        });
        const payload = (await response.json()) as BatchPricePreviewApiResponse;

        if (!response.ok || !payload.success || !payload.data?.quotes) {
          throw new Error(
            payload.error ?? payload.message ?? "Unable to calculate personalized service prices."
          );
        }

        if (!controller.signal.aborted) {
          setPersonalizedQuotes(payload.data.quotes);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setPersonalizedQuotes({});
        }
      } finally {
        if (!controller.signal.aborted) {
          setQuotesLoading(false);
          setQuotesReady(true);
        }
      }
    }

    void loadPersonalizedQuotes();

    return () => {
      controller.abort();
    };
  }, [bathrooms, bedrooms, propertySize, propertyType, services]);

  useEffect(() => {
    if (!preferredServiceSlug || selectedServiceId || !quotesReady) {
      return;
    }

    const preferredService = services.find((service) => service.slug === preferredServiceSlug);

    if (!preferredService) {
      return;
    }

    const personalizedQuote = personalizedQuotes[preferredService.id];

    onSelect({
      ...preferredService,
      basePrice: personalizedQuote?.baseAmount ?? preferredService.basePrice,
      estimatedDurationMinutes:
        personalizedQuote?.estimatedDurationMinutes ?? preferredService.estimatedDurationMinutes,
    });
  }, [
    onSelect,
    personalizedQuotes,
    preferredServiceSlug,
    quotesReady,
    selectedServiceId,
    services,
  ]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services]
  );
  const selectedQuote = selectedService ? personalizedQuotes[selectedService.id] : undefined;

  const categories = useMemo(
    () =>
      Array.from(new Set(services.map((service) => service.category || "Other Services"))).sort(
        (first, second) => first.localeCompare(second)
      ),
    [services]
  );

  const recommendedServiceRanking = useMemo(() => {
    return services
      .map((service) => ({
        id: service.id,
        score: getRecommendationScore(service, {
          propertyType,
          propertySize,
          bedrooms,
          bathrooms,
          preferredServiceSlug,
        }),
      }))
      .filter(({ score }) => score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 3);
  }, [bathrooms, bedrooms, preferredServiceSlug, propertySize, propertyType, services]);

  const recommendedServiceIds = useMemo(
    () => new Set(recommendedServiceRanking.map(({ id }) => id)),
    [recommendedServiceRanking]
  );
  const bestMatchId = recommendedServiceRanking[0]?.id;
  const bestMatchService = services.find((service) => service.id === bestMatchId) ?? null;
  const bestMatchQuote = bestMatchService ? personalizedQuotes[bestMatchService.id] : undefined;

  useEffect(() => {
    if (
      services.length > 0 &&
      recommendedServiceIds.size === 0 &&
      activeCategory === "recommended"
    ) {
      setActiveCategory("all");
    }
  }, [activeCategory, recommendedServiceIds, services.length]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchingServices = services.filter((service) => {
      const matchesCategory =
        activeCategory === "all" ||
        (activeCategory === "recommended" && recommendedServiceIds.has(service.id)) ||
        service.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        service.name,
        service.description,
        service.category,
        service.slug,
        ...service.features,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });

    if (!preferredServiceSlug) {
      return matchingServices;
    }

    return [...matchingServices].sort(
      (first, second) =>
        Number(second.slug === preferredServiceSlug) - Number(first.slug === preferredServiceSlug)
    );
  }, [activeCategory, preferredServiceSlug, recommendedServiceIds, searchQuery, services]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * SERVICES_PER_PAGE;
  const visibleServices = filteredServices.slice(pageStart, pageStart + SERVICES_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="mt-8 flex min-h-[360px] items-center justify-center rounded-[1.8rem] border border-primary/10 bg-white">
        <div className="px-6 text-center">
          <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-primary" />

          <h3 className="mt-5 font-heading text-2xl font-black text-navy">
            Preparing your cleaning plans
          </h3>

          <p className="mt-3 text-base font-medium text-slate-500">
            Loading available CleanNest services.
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
          Cleaning plans could not be loaded
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
          No cleaning plans are available
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-amber-700">
          An administrator must activate at least one cleaning service before customers can
          continue.
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
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-primary-light/40 px-5 py-4">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-cyan-300">
            <Home className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-bold text-primary">Personalized for your home</p>
            <h3 className="mt-1 font-heading text-lg font-black text-navy">
              {propertyTypeLabel(propertyType)} · {propertySize} m² · {bedrooms} bed · {bathrooms}{" "}
              bath
            </h3>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-500">Prices include your space size</p>
      </section>

      {/* Service catalogue */}
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              Cleaning catalogue
            </p>

            <h3 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-navy">
              Select your main cleaning plan
            </h3>
          </div>

          <p className="max-w-md text-sm font-semibold leading-6 text-slate-500 md:text-right">
            Start with our best matches, or compare the full catalogue.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-primary/10 bg-white shadow-[0_14px_40px_rgba(11,37,69,0.06)]">
          {bestMatchService && (
            <div className="grid gap-5 bg-[linear-gradient(120deg,#0b2545,#124f8e)] p-5 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-navy">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                    Best match for your {propertyType}
                  </p>
                  <h4 className="mt-2 font-heading text-2xl font-black">{bestMatchService.name}</h4>
                  <p className="mt-2 text-sm font-semibold text-blue-100/75">
                    {formatCurrency(bestMatchQuote?.baseAmount ?? bestMatchService.basePrice)} ·{" "}
                    {formatDuration(
                      bestMatchQuote?.estimatedDurationMinutes ??
                        bestMatchService.estimatedDurationMinutes
                    )}{" "}
                    · Personalized for your home
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelect({
                    ...bestMatchService,
                    basePrice: bestMatchQuote?.baseAmount ?? bestMatchService.basePrice,
                    estimatedDurationMinutes:
                      bestMatchQuote?.estimatedDurationMinutes ??
                      bestMatchService.estimatedDurationMinutes,
                  });
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-extrabold text-navy transition hover:bg-white"
              >
                {selectedServiceId === bestMatchService.id && <Check className="h-4 w-4" />}
                {selectedServiceId === bestMatchService.id ? "Selected" : "Choose best match"}
              </button>
            </div>
          )}

          <div className="p-4 md:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="booking-service-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search services"
                aria-label="Search cleaning plans"
                className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm font-semibold text-navy outline-none transition placeholder:text-slate-400 focus:border-primary/35 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div
              className="mt-4 flex gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Service categories"
            >
              {[
                {
                  value: "all",
                  label: "All",
                },
                {
                  value: "recommended",
                  label: "Best matches",
                },
                ...categories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ].map((category) => {
                const isActive = activeCategory === category.value;

                return (
                  <button
                    key={category.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveCategory(category.value);
                      setCurrentPage(1);
                    }}
                    className={`min-h-9 shrink-0 rounded-lg border px-3 text-xs font-bold transition ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500">
            {filteredServices.length === 0
              ? "No matching services"
              : `Showing ${pageStart + 1}–${Math.min(
                  pageStart + SERVICES_PER_PAGE,
                  filteredServices.length
                )} of ${filteredServices.length} services`}
          </p>

          {(searchQuery || activeCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                setCurrentPage(1);
              }}
              className="text-sm font-extrabold text-primary transition hover:text-primary-dark"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
          {visibleServices.map((service, index) => {
            const isSelected = service.id === selectedServiceId;

            const visual = getServiceVisual(service.name);

            const Icon = visual.icon;

            const features = service.features.length > 0 ? service.features : DEFAULT_FEATURES;

            const personalizedQuote = personalizedQuotes[service.id];

            const displayedPrice = personalizedQuote?.baseAmount ?? service.basePrice;

            const displayedDuration =
              personalizedQuote?.estimatedDurationMinutes ?? service.estimatedDurationMinutes;

            const selectService = () => {
              onSelect({
                ...service,
                basePrice: displayedPrice,
                estimatedDurationMinutes: displayedDuration,
              });
            };

            return (
              <motion.article
                key={service.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? "Selected" : "Choose"} ${service.name} cleaning service`}
                onClick={selectService}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectService();
                  }
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
                  delay: Math.min(index * 0.06, 0.3),
                }}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: -4,
                      }
                }
                className={`group relative cursor-pointer overflow-hidden rounded-[1.5rem] border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                  isSelected
                    ? "border-primary bg-primary-light/60 shadow-[0_18px_45px_rgba(30,111,217,0.14)]"
                    : "border-slate-200 bg-white shadow-[0_12px_35px_rgba(11,37,69,0.06)] hover:border-primary/35"
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`absolute -right-16 -top-16 h-48 w-48 rounded-full transition ${
                    isSelected ? "bg-primary/[0.12]" : "bg-slate-50"
                  }`}
                />

                <div className="relative flex h-full flex-col">
                  {service.imageUrl && (
                    <div className="relative -mx-5 -mt-5 mb-5 h-36 overflow-hidden border-b border-slate-100">
                      <ServiceCoverImage
                        src={service.imageUrl}
                        alt={`${service.name} service`}
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? "bg-primary text-white shadow-[0_12px_28px_rgba(30,111,217,0.28)]"
                          : "bg-primary-light text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
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

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-600">
                        {service.category}
                      </span>

                      {isSelected && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                          Selected
                        </span>
                      )}

                      {service.id === bestMatchId && (
                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-700">
                          Best match
                        </span>
                      )}
                    </div>

                    <h4 className="mt-4 font-heading text-xl font-black leading-tight tracking-[-0.03em] text-navy">
                      {service.name}
                    </h4>

                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-primary/10 pt-5">
                    <div className="rounded-xl bg-surface-soft p-3">
                      <div className="flex items-center gap-2">
                        <BadgeDollarSign className="h-4 w-4 shrink-0 text-primary" />

                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                          {personalizedQuote ? "Your price" : "Starting price"}
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-black text-navy">
                        {formatCurrency(displayedPrice)}
                      </p>

                      {personalizedQuote && personalizedQuote.propertyAdjustmentAmount > 0 && (
                        <p className="mt-1 text-[11px] font-semibold leading-4 text-primary">
                          {formatCurrency(personalizedQuote.serviceBaseAmount)} base +{" "}
                          {formatCurrency(personalizedQuote.propertyAdjustmentAmount)} space
                        </p>
                      )}

                      {quotesLoading && !personalizedQuote && (
                        <span className="mt-2 block h-2 w-20 animate-pulse rounded-full bg-primary/10" />
                      )}
                    </div>

                    <div className="rounded-xl bg-surface-soft p-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 shrink-0 text-primary" />

                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                          Base duration
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-extrabold leading-6 text-navy">
                        {formatDuration(displayedDuration)}
                      </p>
                    </div>
                  </div>

                  {expandedServiceId === service.id && (
                    <div className="mt-4 space-y-2 rounded-xl border border-primary/10 bg-white/80 p-4">
                      {features.slice(0, 3).map((feature, featureIndex) => (
                        <div
                          key={`${service.id}-${featureIndex}`}
                          className="flex items-start gap-2.5"
                        >
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <p className="text-xs font-semibold leading-5 text-slate-600">
                            {feature}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                    <button
                      type="button"
                      aria-expanded={expandedServiceId === service.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedServiceId((currentId) =>
                          currentId === service.id ? null : service.id
                        );
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary"
                    >
                      Details
                      <ChevronDown
                        className={`h-4 w-4 transition ${
                          expandedServiceId === service.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectService();
                      }}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-navy text-white hover:bg-primary"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                      {isSelected ? "Selected" : "Choose this service"}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {visibleServices.length === 0 && (
          <div className="mt-6 rounded-[1.7rem] border border-dashed border-primary/20 bg-white p-10 text-center">
            <Search className="mx-auto h-9 w-9 text-primary/50" />
            <h4 className="mt-4 font-heading text-2xl font-black text-navy">
              No cleaning plans found
            </h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try a different search or clear the category filter to see all available services.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Service catalogue pages"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="rounded-xl bg-primary-light px-4 py-3 text-sm font-extrabold text-primary">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
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
              <p className="text-lg font-extrabold text-emerald-900">Cleaning plan selected</p>

              <p className="mt-2 text-base font-semibold leading-7 text-emerald-700">
                {selectedService.name} ·{" "}
                {formatCurrency(selectedQuote?.baseAmount ?? selectedService.basePrice)}{" "}
                personalized price ·{" "}
                {formatDuration(
                  selectedQuote?.estimatedDurationMinutes ??
                    selectedService.estimatedDurationMinutes
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
