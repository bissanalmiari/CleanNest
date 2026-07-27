"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  CookingPot,
  LoaderCircle,
  Minus,
  Plus,
  Refrigerator,
  RefreshCw,
  ShieldCheck,
  Sofa,
  Sparkles,
  SprayCan,
  WashingMachine,
  X,
  type LucideIcon,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

export interface ExtraTouchSelection {
  addOnId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface ExtraTouchOption {
  id: string;
  name: string;
  description: string;

  unitPrice: number;
  durationMinutes: number;

  badge: string | null;
  maxQuantity: number;
}

interface ExtraTouchesStepProps {
  serviceId: string;
  serviceName: string;

  selectedAddOns: ExtraTouchSelection[];

  onChange: (addOns: ExtraTouchSelection[]) => void;
}

interface AddOnsApiResponse {
  success?: boolean;

  data?: {
    addOns?: unknown;
    total?: number;
  };

  addOns?: unknown;

  error?: string;
  message?: string;
}

interface ExtraTouchVisual {
  icon: LucideIcon;
  label: string;
}

type ExtraTouchCategory =
  "kitchen" | "bathroom" | "fabric" | "windows" | "laundry" | "outdoor" | "commercial" | "general";

interface ExtraTouchPackage {
  id: string;
  name: string;
  description: string;
  serviceKeywords: string[];
  addOnNames: string[];
}

const EXTRA_TOUCH_CATEGORIES: Array<{
  value: ExtraTouchCategory;
  label: string;
}> = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "fabric", label: "Fabric care" },
  { value: "windows", label: "Windows" },
  { value: "laundry", label: "Laundry" },
  { value: "outdoor", label: "Outdoor" },
  { value: "commercial", label: "Commercial" },
  { value: "general", label: "General care" },
];

const EXTRA_TOUCH_PACKAGES: ExtraTouchPackage[] = [
  {
    id: "kitchen-upgrade",
    name: "Kitchen Upgrade",
    description: "A focused appliance and cabinet reset for a more complete kitchen clean.",
    serviceKeywords: ["home", "deep", "move", "villa", "kitchen", "airbnb", "eco"],
    addOnNames: [
      "Inside Refrigerator",
      "Inside Oven",
      "Range Hood Degreasing",
      "Kitchen Cabinet Exteriors",
    ],
  },
  {
    id: "move-out-complete",
    name: "Move-Out Complete",
    description: "The high-detail finishing touches most useful before a property handover.",
    serviceKeywords: ["move", "deep", "post-construction"],
    addOnNames: [
      "Inside Kitchen Cabinets",
      "Inside Oven",
      "Interior Windows",
      "Window Track Detailing",
      "Baseboards and Trim",
      "Bathroom Grout Detailing",
    ],
  },
  {
    id: "guest-ready",
    name: "Guest-Ready Package",
    description: "Prepare beds, supplies, dishes, and presentation details for the next arrival.",
    serviceKeywords: ["airbnb", "villa", "regular"],
    addOnNames: [
      "Bed Linen Change",
      "Guest Supply Restocking",
      "Dishwashing",
      "Guest-Ready Styling",
    ],
  },
  {
    id: "fabric-refresh",
    name: "Fabric Refresh",
    description: "Coordinate furniture, rug, and fabric spot care in one convenient selection.",
    serviceKeywords: ["sofa", "carpet", "mattress", "deep", "villa", "home"],
    addOnNames: [
      "Sofa Cleaning",
      "Upholstered Chair Cleaning",
      "Area Rug Cleaning",
      "Fabric Spot Treatment",
      "Intensive Pet Hair Removal",
    ],
  },
  {
    id: "workplace-ready",
    name: "Workplace Ready",
    description: "Detail shared work areas, meeting spaces, and high-touch business surfaces.",
    serviceKeywords: ["office", "retail", "clinic", "school"],
    addOnNames: [
      "Workstation Disinfection",
      "Meeting Room Reset",
      "Office Break Room Detail",
      "Enhanced High-Touch Disinfection",
      "Display and Shelf Detailing",
    ],
  },
];

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeAddOn(value: unknown): ExtraTouchOption | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  const id = readString(record.id) || readString(record._id);

  if (!id) {
    return null;
  }

  const name = readString(record.name) || readString(record.title) || "Extra cleaning touch";

  const description =
    readString(record.description) ||
    readString(record.shortDescription) ||
    "Additional focused care for your cleaning route.";

  const unitPrice = Math.max(0, readNumber(record.unitPrice ?? record.price ?? record.basePrice));

  const durationMinutes = Math.max(
    0,
    Math.round(
      readNumber(
        record.durationMinutes ??
          record.additionalDurationMinutes ??
          record.estimatedDurationMinutes
      )
    )
  );

  const maxQuantity = Math.max(1, Math.min(20, Math.floor(readNumber(record.maxQuantity, 1))));

  const badge = readString(record.badge) || readString(record.category) || null;

  return {
    id,
    name,
    description,
    unitPrice,
    durationMinutes,
    badge,
    maxQuantity,
  };
}

function normalizeAddOnArray(value: unknown): ExtraTouchOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeAddOn).filter((addOn): addOn is ExtraTouchOption => addOn !== null);
}

function extractAddOns(payload: AddOnsApiResponse): ExtraTouchOption[] {
  const nestedAddOns = normalizeAddOnArray(payload.data?.addOns);

  if (nestedAddOns.length > 0) {
    return nestedAddOns;
  }

  return normalizeAddOnArray(payload.addOns);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return "No added time";
  }

  if (minutes < 60) {
    return `+${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `+${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  return `+${hours} hr ${remainingMinutes} min`;
}

function getExtraTouchVisual(name: string): ExtraTouchVisual {
  const normalizedName = name.trim().toLowerCase();

  if (normalizedName.includes("fridge") || normalizedName.includes("refrigerator")) {
    return {
      icon: Refrigerator,
      label: "Kitchen detail",
    };
  }

  if (
    normalizedName.includes("oven") ||
    normalizedName.includes("stove") ||
    normalizedName.includes("cooker")
  ) {
    return {
      icon: CookingPot,
      label: "Appliance care",
    };
  }

  if (normalizedName.includes("laundry") || normalizedName.includes("washing")) {
    return {
      icon: WashingMachine,
      label: "Laundry care",
    };
  }

  if (
    normalizedName.includes("sofa") ||
    normalizedName.includes("couch") ||
    normalizedName.includes("upholstery")
  ) {
    return {
      icon: Sofa,
      label: "Fabric care",
    };
  }

  return {
    icon: Sparkles,
    label: "Focused care",
  };
}

function getExtraTouchCategory(name: string): ExtraTouchCategory {
  const normalizedName = name.trim().toLowerCase();

  if (
    [
      "workstation",
      "meeting room",
      "office break",
      "display and shelf",
      "high-touch",
      "classroom",
      "play area",
    ].some((keyword) => normalizedName.includes(keyword))
  ) {
    return "commercial";
  }

  if (
    [
      "refrigerator",
      "oven",
      "microwave",
      "dishwasher",
      "range hood",
      "kitchen",
      "pantry",
      "backsplash",
      "appliance",
      "dishwashing",
    ].some((keyword) => normalizedName.includes(keyword))
  ) {
    return "kitchen";
  }

  if (["bathroom", "shower", "grout"].some((keyword) => normalizedName.includes(keyword))) {
    return "bathroom";
  }

  if (
    [
      "sofa",
      "upholstered",
      "mattress",
      "headboard",
      "carpet",
      "rug",
      "pet hair",
      "fabric",
      "curtain",
    ].some((keyword) => normalizedName.includes(keyword))
  ) {
    return "fabric";
  }

  if (["window", "glass", "blind"].some((keyword) => normalizedName.includes(keyword))) {
    return "windows";
  }

  if (
    ["laundry", "ironing", "linen", "guest supply", "guest-ready"].some((keyword) =>
      normalizedName.includes(keyword)
    )
  ) {
    return "laundry";
  }

  if (
    ["balcony", "patio", "terrace", "garage", "staircase"].some((keyword) =>
      normalizedName.includes(keyword)
    )
  ) {
    return "outdoor";
  }

  return "general";
}

function getRecommendationScore(addOn: ExtraTouchOption, serviceName: string) {
  const normalizedService = serviceName.toLowerCase();
  const normalizedAddOn = addOn.name.toLowerCase();
  const category = getExtraTouchCategory(addOn.name);
  let score = 0;

  if (normalizedService.includes("kitchen")) {
    if (category === "kitchen") score += 100;
  } else if (normalizedService.includes("bathroom")) {
    if (category === "bathroom") score += 100;
  } else if (
    ["sofa", "carpet", "mattress"].some((keyword) => normalizedService.includes(keyword))
  ) {
    if (category === "fabric") score += 100;
  } else if (normalizedService.includes("window")) {
    if (category === "windows") score += 100;
  } else if (
    ["office", "retail", "clinic", "school"].some((keyword) => normalizedService.includes(keyword))
  ) {
    if (category === "commercial") score += 100;
    if (category === "windows") score += 35;
  } else if (normalizedService.includes("airbnb")) {
    if (category === "laundry") score += 90;
    if (category === "kitchen") score += 65;
  } else if (normalizedService.includes("move")) {
    if (category === "kitchen") score += 80;
    if (category === "windows") score += 75;
    if (category === "bathroom") score += 60;
  } else if (normalizedService.includes("post-construction")) {
    if (category === "windows") score += 80;
    if (category === "general") score += 60;
    if (category === "outdoor") score += 45;
  } else if (normalizedService.includes("deep")) {
    if (category === "kitchen") score += 75;
    if (category === "bathroom") score += 70;
    if (category === "windows") score += 55;
  } else {
    if (category === "kitchen") score += 55;
    if (category === "fabric") score += 45;
    if (category === "laundry") score += 35;
    if (category === "outdoor") score += 25;
  }

  if (
    [
      "inside oven",
      "inside refrigerator",
      "interior windows",
      "bed linen",
      "high-touch",
      "pet hair",
    ].some((keyword) => normalizedAddOn.includes(keyword))
  ) {
    score += 15;
  }

  return score;
}

export default function ExtraTouchesStep({
  serviceId,
  serviceName,
  selectedAddOns,
  onChange,
}: ExtraTouchesStepProps) {
  const prefersReducedMotion = useReducedMotion();

  const [addOns, setAddOns] = useState<ExtraTouchOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "recommended" | ExtraTouchCategory>(
    "recommended"
  );

  const loadAddOns = useCallback(async () => {
    if (!serviceId) {
      setAddOns([]);
      setIsLoading(false);

      setErrorMessage("Choose a cleaning plan before loading extra touches.");

      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/customer/services/${encodeURIComponent(serviceId)}/add-ons`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const responseText = await response.text();

      let payload: AddOnsApiResponse = {};

      if (responseText.trim()) {
        try {
          payload = JSON.parse(responseText) as AddOnsApiResponse;
        } catch {
          throw new Error(
            response.status === 404
              ? "The service add-ons API route was not found."
              : "The add-ons server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Unable to load extra touches.");
      }

      setAddOns(extractAddOns(payload));
    } catch (error) {
      setAddOns([]);

      setErrorMessage(error instanceof Error ? error.message : "Unable to load extra touches.");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void loadAddOns();
  }, [loadAddOns]);

  useEffect(() => {
    setActiveCategory("recommended");
  }, [serviceId]);

  const selectedQuantity = useMemo(() => {
    return selectedAddOns.reduce((total, addOn) => total + addOn.quantity, 0);
  }, [selectedAddOns]);

  const selectedTotal = useMemo(() => {
    return selectedAddOns.reduce((total, addOn) => total + addOn.quantity * addOn.unitPrice, 0);
  }, [selectedAddOns]);

  const selectedDuration = useMemo(() => {
    return selectedAddOns.reduce((total, selection) => {
      const matchingAddOn = addOns.find((addOn) => addOn.id === selection.addOnId);

      if (!matchingAddOn) {
        return total;
      }

      return total + matchingAddOn.durationMinutes * selection.quantity;
    }, 0);
  }, [addOns, selectedAddOns]);

  const recommendedAddOnIds = useMemo(() => {
    const scoredAddOns = addOns
      .map((addOn) => ({
        id: addOn.id,
        score: getRecommendationScore(addOn, serviceName),
      }))
      .filter(({ score }) => score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 6);

    const recommended =
      scoredAddOns.length > 0
        ? scoredAddOns
        : addOns.slice(0, 4).map((addOn) => ({
            id: addOn.id,
          }));

    return new Set(recommended.map(({ id }) => id));
  }, [addOns, serviceName]);

  const availableCategories = useMemo(() => {
    const categorySet = new Set(addOns.map((addOn) => getExtraTouchCategory(addOn.name)));

    return EXTRA_TOUCH_CATEGORIES.filter((category) => categorySet.has(category.value));
  }, [addOns]);

  const visibleAddOns = useMemo(() => {
    if (activeCategory === "all") {
      return addOns;
    }

    if (activeCategory === "recommended") {
      return addOns.filter((addOn) => recommendedAddOnIds.has(addOn.id));
    }

    return addOns.filter((addOn) => getExtraTouchCategory(addOn.name) === activeCategory);
  }, [activeCategory, addOns, recommendedAddOnIds]);

  const availablePackages = useMemo(() => {
    const normalizedService = serviceName.toLowerCase();
    const addOnsByName = new Map(addOns.map((addOn) => [addOn.name, addOn]));

    return EXTRA_TOUCH_PACKAGES.filter((extraPackage) =>
      extraPackage.serviceKeywords.some((keyword) => normalizedService.includes(keyword))
    )
      .map((extraPackage) => ({
        ...extraPackage,
        addOns: extraPackage.addOnNames
          .map((name) => addOnsByName.get(name))
          .filter((addOn): addOn is ExtraTouchOption => addOn !== undefined),
      }))
      .filter((extraPackage) => extraPackage.addOns.length >= 2);
  }, [addOns, serviceName]);

  function getSelection(addOnId: string) {
    return selectedAddOns.find((selection) => selection.addOnId === addOnId);
  }

  function toggleAddOn(addOn: ExtraTouchOption) {
    const existingSelection = getSelection(addOn.id);

    if (existingSelection) {
      onChange(selectedAddOns.filter((selection) => selection.addOnId !== addOn.id));

      return;
    }

    onChange([
      ...selectedAddOns,
      {
        addOnId: addOn.id,
        name: addOn.name,
        quantity: 1,
        unitPrice: addOn.unitPrice,
      },
    ]);
  }

  function changeQuantity(addOn: ExtraTouchOption, nextQuantity: number) {
    if (nextQuantity <= 0) {
      onChange(selectedAddOns.filter((selection) => selection.addOnId !== addOn.id));

      return;
    }

    const safeQuantity = Math.min(addOn.maxQuantity, Math.max(1, nextQuantity));

    const existingSelection = getSelection(addOn.id);

    if (!existingSelection) {
      onChange([
        ...selectedAddOns,
        {
          addOnId: addOn.id,
          name: addOn.name,
          quantity: safeQuantity,
          unitPrice: addOn.unitPrice,
        },
      ]);

      return;
    }

    onChange(
      selectedAddOns.map((selection) =>
        selection.addOnId === addOn.id
          ? {
              ...selection,
              name: addOn.name,
              quantity: safeQuantity,
              unitPrice: addOn.unitPrice,
            }
          : selection
      )
    );
  }

  function addPackage(packageAddOns: ExtraTouchOption[]) {
    const selectionsById = new Map(
      selectedAddOns.map((selection) => [selection.addOnId, selection])
    );

    for (const addOn of packageAddOns) {
      if (!selectionsById.has(addOn.id)) {
        selectionsById.set(addOn.id, {
          addOnId: addOn.id,
          name: addOn.name,
          quantity: 1,
          unitPrice: addOn.unitPrice,
        });
      }
    }

    onChange(Array.from(selectionsById.values()));
  }

  if (isLoading) {
    return (
      <div className="mt-8 flex min-h-[340px] items-center justify-center rounded-[1.8rem] border border-primary/10 bg-white">
        <div className="px-6 text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />

          <h3 className="mt-5 font-heading text-2xl font-black text-navy">
            Preparing extra touches
          </h3>

          <p className="mt-3 text-base font-medium text-slate-500">
            Loading options available for {serviceName}.
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
          Extra touches could not be loaded
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={() => {
            void loadAddOns();
          }}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-red-600 px-6 text-sm font-extrabold text-white transition hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Selected service */}
      <section className="grid gap-5 rounded-[1.6rem] border border-primary/10 bg-primary-light/35 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300">
            <SprayCan className="h-5 w-5" />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-primary">
              Selected cleaning plan
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black text-navy">{serviceName}</h3>

            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Add optional focused care, or continue without selecting any extra touches.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onChange([]);
          }}
          disabled={selectedAddOns.length === 0}
          className="inline-flex min-h-[46px] w-fit items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Clear extras
        </button>
      </section>

      {addOns.length === 0 ? (
        <section className="rounded-[1.7rem] border border-amber-200 bg-amber-50 p-7 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-amber-600" />

          <h3 className="mt-5 font-heading text-2xl font-black text-amber-900">
            No extra touches available
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-amber-700">
            This cleaning plan currently has no linked add-ons. You can continue directly to the
            address stage.
          </p>
        </section>
      ) : (
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                Optional care shelf
              </p>

              <h3 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-navy">
                Personalize your result
              </h3>
            </div>

            <p className="max-w-md text-base font-medium leading-7 text-slate-500 md:text-right">
              Select only the focused cleaning details your property needs.
            </p>
          </div>

          {availablePackages.length > 0 && (
            <div className="mt-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                    One-click packages
                  </p>
                  <h4 className="mt-2 font-heading text-2xl font-black text-navy">
                    Complete a focused upgrade
                  </h4>
                </div>
                <p className="max-w-md text-sm font-medium leading-6 text-slate-500 sm:text-right">
                  Packages select compatible extras at their normal individual prices.
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {availablePackages.map((extraPackage) => {
                  const packagePrice = extraPackage.addOns.reduce(
                    (total, addOn) => total + addOn.unitPrice,
                    0
                  );
                  const packageDuration = extraPackage.addOns.reduce(
                    (total, addOn) => total + addOn.durationMinutes,
                    0
                  );
                  const selectedPackageItems = extraPackage.addOns.filter((addOn) =>
                    selectedAddOns.some((selection) => selection.addOnId === addOn.id)
                  ).length;
                  const isPackageAdded = selectedPackageItems === extraPackage.addOns.length;

                  return (
                    <article
                      key={extraPackage.id}
                      className="overflow-hidden rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(135deg,#071d38,#0d4e87)] p-5 text-white shadow-[0_18px_45px_rgba(11,37,69,0.14)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-navy">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-200">
                          {extraPackage.addOns.length} touches
                        </span>
                      </div>

                      <h5 className="mt-5 font-heading text-xl font-black">{extraPackage.name}</h5>
                      <p className="mt-2 text-sm font-medium leading-6 text-blue-100/65">
                        {extraPackage.description}
                      </p>

                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {extraPackage.addOns.map((addOn) => (
                          <li
                            key={addOn.id}
                            className="flex items-start gap-2 text-xs font-semibold text-blue-50"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                            {addOn.name}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                        <div>
                          <p className="font-heading text-xl font-black">
                            {formatCurrency(packagePrice)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-blue-100/55">
                            {formatDuration(packageDuration)}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isPackageAdded}
                          onClick={() => addPackage(extraPackage.addOns)}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-primary transition hover:bg-cyan-50 disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-700"
                        >
                          {isPackageAdded ? (
                            <>
                              <Check className="h-4 w-4" />
                              Package added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add {extraPackage.addOns.length - selectedPackageItems} item
                              {extraPackage.addOns.length - selectedPackageItems === 1 ? "" : "s"}
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-[1.5rem] border border-primary/10 bg-white p-4 shadow-[0_12px_35px_rgba(11,37,69,0.06)]">
            <p className="px-1 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Browse extra touches
            </p>
            <div
              className="mt-3 flex gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Extra touch categories"
            >
              {[
                {
                  value: "recommended",
                  label: "Recommended",
                },
                {
                  value: "all",
                  label: "All extras",
                },
                ...availableCategories,
              ].map((category) => {
                const isActive = activeCategory === category.value;

                return (
                  <button
                    key={category.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() =>
                      setActiveCategory(
                        category.value as "all" | "recommended" | ExtraTouchCategory
                      )
                    }
                    className={`min-h-[42px] shrink-0 rounded-xl border px-4 text-xs font-extrabold transition ${
                      isActive
                        ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(30,111,217,0.2)]"
                        : "border-primary/10 bg-surface-soft text-slate-600 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
            {visibleAddOns.map((addOn, index) => {
              const selection = getSelection(addOn.id);

              const isSelected = Boolean(selection);
              const isRecommended = recommendedAddOnIds.has(addOn.id);
              const categoryLabel =
                EXTRA_TOUCH_CATEGORIES.find(
                  (category) => category.value === getExtraTouchCategory(addOn.name)
                )?.label ?? "General care";

              const visual = getExtraTouchVisual(addOn.name);

              const Icon = visual.icon;

              return (
                <motion.article
                  key={addOn.id}
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
                          y: -3,
                        }
                  }
                  className={`relative overflow-hidden rounded-[1.7rem] border p-6 transition-all ${
                    isSelected
                      ? "border-primary bg-primary-light/65 shadow-[0_22px_55px_rgba(30,111,217,0.15)]"
                      : "border-slate-200 bg-white shadow-[0_12px_35px_rgba(11,37,69,0.06)]"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className={`absolute -right-16 -top-16 h-48 w-48 rounded-full ${
                      isSelected ? "bg-primary/10" : "bg-slate-50"
                    }`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition ${
                          isSelected
                            ? "bg-primary text-white shadow-[0_12px_28px_rgba(30,111,217,0.25)]"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          toggleAddOn(addOn);
                        }}
                        aria-pressed={isSelected}
                        aria-label={isSelected ? `Remove ${addOn.name}` : `Add ${addOn.name}`}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-slate-200 bg-white text-slate-400 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {isSelected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="mt-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-navy px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-300">
                          {addOn.badge ?? categoryLabel ?? visual.label}
                        </span>
                        {isRecommended && (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                            Recommended
                          </span>
                        )}
                      </div>

                      <h4 className="mt-4 font-heading text-2xl font-black leading-tight text-navy">
                        {addOn.name}
                      </h4>

                      <p className="mt-3 text-base font-medium leading-7 text-slate-500">
                        {addOn.description}
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-surface-soft p-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                          Per item
                        </p>

                        <p className="mt-2 font-heading text-2xl font-black text-navy">
                          {formatCurrency(addOn.unitPrice)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-soft p-4">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 shrink-0 text-primary" />

                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                            Added time
                          </p>
                        </div>

                        <p className="mt-2 text-sm font-extrabold leading-6 text-navy">
                          {formatDuration(addOn.durationMinutes)}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="mt-5 flex flex-col gap-4 rounded-2xl border border-primary/15 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                            Quantity
                          </p>

                          <p className="mt-1 text-sm font-bold text-navy">
                            Maximum {addOn.maxQuantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              changeQuantity(addOn, (selection?.quantity ?? 1) - 1);
                            }}
                            aria-label={`Decrease ${addOn.name} quantity`}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-surface-soft text-slate-600 transition hover:border-primary/30 hover:text-primary"
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <span className="flex h-11 min-w-12 items-center justify-center rounded-xl bg-navy px-3 text-base font-black text-white">
                            {selection?.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={(selection?.quantity ?? 1) >= addOn.maxQuantity}
                            onClick={() => {
                              changeQuantity(addOn, (selection?.quantity ?? 1) + 1);
                            }}
                            aria-label={`Increase ${addOn.name} quantity`}
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

          {visibleAddOns.length === 0 && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-primary/20 bg-white p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary/50" />
              <h4 className="mt-4 font-heading text-xl font-black text-navy">
                No extras in this category
              </h4>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className="mt-4 text-sm font-extrabold text-primary"
              >
                View all extras
              </button>
            </div>
          )}
        </section>
      )}

      {/* Stage summary */}
      <section className="grid gap-5 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>

          <div>
            <p className="text-lg font-extrabold text-emerald-900">Extra touches ready</p>

            <p className="mt-2 text-base font-semibold leading-7 text-emerald-700">
              {selectedQuantity === 0
                ? "No extras selected. You can continue without them."
                : `${selectedQuantity} item${
                    selectedQuantity === 1 ? "" : "s"
                  } selected · ${formatCurrency(selectedTotal)} · ${formatDuration(
                    selectedDuration
                  )}`}
            </p>
          </div>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />

          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
            Optional stage
          </span>
        </div>
      </section>
    </div>
  );
}
