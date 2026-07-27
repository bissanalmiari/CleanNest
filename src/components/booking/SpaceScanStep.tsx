"use client";

import {
  Bath,
  BedDouble,
  Briefcase,
  Building2,
  Check,
  Home,
  Minus,
  Plus,
  Ruler,
  Shapes,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

export type SpaceScanPropertyType = "apartment" | "house" | "office" | "other";

export interface SpaceScanValue {
  propertyType: SpaceScanPropertyType;
  bedrooms: number;
  bathrooms: number;
  propertySize: number;
}

interface SpaceScanStepProps {
  value: SpaceScanValue;

  onChange: (update: Partial<SpaceScanValue>) => void;
}

interface PropertyOption {
  id: SpaceScanPropertyType;
  name: string;
  code: string;
  description: string;
  icon: LucideIcon;
}

interface SizePreset {
  label: string;
  value: number;
}

const PROPERTY_OPTIONS: PropertyOption[] = [
  {
    id: "apartment",
    name: "Apartment",
    code: "CN-APT",
    description: "Best for flats and compact residential spaces with connected rooms.",
    icon: Building2,
  },
  {
    id: "house",
    name: "House",
    code: "CN-HSE",
    description: "Designed for larger homes with multiple rooms and living areas.",
    icon: Home,
  },
  {
    id: "office",
    name: "Office",
    code: "CN-OFF",
    description: "Suitable for workplaces, shared areas, desks, and meeting rooms.",
    icon: Briefcase,
  },
  {
    id: "other",
    name: "Other",
    code: "CN-CUS",
    description: "Choose this for a custom property that does not fit another category.",
    icon: Shapes,
  },
];

const SIZE_PRESETS: SizePreset[] = [
  {
    label: "Compact",
    value: 60,
  },
  {
    label: "Standard",
    value: 100,
  },
  {
    label: "Spacious",
    value: 180,
  },
  {
    label: "Large",
    value: 300,
  },
];

const MIN_PROPERTY_SIZE = 20;
const MAX_PROPERTY_SIZE = 2000;

function clampNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, value));
}

function getSizeProfile(propertySize: number) {
  if (propertySize <= 70) {
    return {
      label: "Compact route",
      description: "A focused cleaning route for a smaller property.",
    };
  }

  if (propertySize <= 140) {
    return {
      label: "Standard route",
      description: "A balanced route for an average-sized property.",
    };
  }

  if (propertySize <= 250) {
    return {
      label: "Extended route",
      description: "A longer route covering more rooms and surfaces.",
    };
  }

  return {
    label: "Large-property route",
    description: "A detailed route designed for a large home or workplace.",
  };
}

function getRoomLabel(propertyType: SpaceScanPropertyType) {
  if (propertyType === "office") {
    return "Work areas";
  }

  if (propertyType === "other") {
    return "Main rooms";
  }

  return "Bedrooms";
}

function getPropertyLabel(propertyType: SpaceScanPropertyType) {
  return PROPERTY_OPTIONS.find((property) => property.id === propertyType)?.name ?? "Property";
}

export default function SpaceScanStep({ value, onChange }: SpaceScanStepProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizeProfile = getSizeProfile(value.propertySize);

  const roomLabel = getRoomLabel(value.propertyType);

  const propertyLabel = getPropertyLabel(value.propertyType);

  const sizePercentage =
    ((value.propertySize - MIN_PROPERTY_SIZE) / (MAX_PROPERTY_SIZE - MIN_PROPERTY_SIZE)) * 100;

  const safeMarkerPosition = Math.min(97, Math.max(3, sizePercentage));

  function updateBedrooms(nextValue: number) {
    onChange({
      bedrooms: clampNumber(nextValue, 0, 30),
    });
  }

  function updateBathrooms(nextValue: number) {
    onChange({
      bathrooms: clampNumber(nextValue, 0, 30),
    });
  }

  function updatePropertySize(nextValue: number) {
    onChange({
      propertySize: clampNumber(nextValue, MIN_PROPERTY_SIZE, MAX_PROPERTY_SIZE),
    });
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Property type */}
      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              Route template
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black tracking-[-0.025em] text-navy">
              Choose your property type
            </h3>
          </div>

          <p className="max-w-sm text-sm font-medium leading-6 text-slate-500 md:text-right">
            Select the property that most closely matches the space that needs cleaning.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-4">
          {PROPERTY_OPTIONS.map((property) => {
            const Icon = property.icon;

            const isSelected = value.propertyType === property.id;

            return (
              <motion.button
                key={property.id}
                type="button"
                onClick={() => {
                  onChange({
                    propertyType: property.id,
                  });
                }}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        y: -3,
                      }
                }
                whileTap={{
                  scale: 0.985,
                }}
                className={`relative min-h-[190px] overflow-hidden rounded-[1.5rem] border p-5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/80 shadow-[0_16px_40px_rgba(30,111,217,0.15)]"
                    : "border-slate-200 bg-white hover:border-primary/35 hover:shadow-[0_14px_35px_rgba(11,37,69,0.08)]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${
                    isSelected ? "bg-primary/10" : "bg-slate-50"
                  }`}
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`h-13 w-13 flex h-[52px] shrink-0 items-center justify-center rounded-2xl transition ${
                        isSelected
                          ? "bg-primary text-white shadow-[0_10px_25px_rgba(30,111,217,0.28)]"
                          : "bg-surface-soft text-slate-500"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>

                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="mt-5">
                    <h4 className="font-heading text-xl font-black text-navy">{property.name}</h4>

                    <p className="mt-1 font-mono text-[11px] font-extrabold tracking-[0.13em] text-primary/55">
                      {property.code}
                    </p>
                  </div>

                  <p className="mt-4 text-sm font-medium leading-6 text-slate-500">
                    {property.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Room counters */}
      <section>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
            Room count
          </p>

          <h3 className="mt-2 font-heading text-2xl font-black tracking-[-0.025em] text-navy">
            Describe the inside of your space
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            These numbers help CleanNest estimate the cleaning duration more accurately.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
          <RoomCounter
            icon={BedDouble}
            label={roomLabel}
            description={
              value.propertyType === "office"
                ? "Separate rooms or work zones that require cleaning."
                : "Sleeping or main rooms included in the cleaning route."
            }
            value={value.bedrooms}
            onDecrease={() => {
              updateBedrooms(value.bedrooms - 1);
            }}
            onIncrease={() => {
              updateBedrooms(value.bedrooms + 1);
            }}
          />

          <RoomCounter
            icon={Bath}
            label="Bathrooms"
            description="Bathrooms or washrooms included in the cleaning route."
            value={value.bathrooms}
            onDecrease={() => {
              updateBathrooms(value.bathrooms - 1);
            }}
            onIncrease={() => {
              updateBathrooms(value.bathrooms + 1);
            }}
          />
        </div>
      </section>

      {/* Property size */}
      <section className="overflow-hidden rounded-[1.7rem] border border-primary/10 bg-white shadow-[0_14px_40px_rgba(11,37,69,0.06)]">
        <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300">
                <Ruler className="h-5 w-5" />
              </span>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
                  Surface scanner
                </p>

                <h3 className="mt-2 font-heading text-2xl font-black tracking-[-0.025em] text-navy">
                  Approximate property size
                </h3>

                <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
                  Enter a close estimate in square metres. CleanNest uses this value when
                  calculating duration and price.
                </p>
              </div>
            </div>

            <div className="mt-7">
              <input
                type="range"
                min={MIN_PROPERTY_SIZE}
                max={MAX_PROPERTY_SIZE}
                step={10}
                value={value.propertySize}
                onChange={(event) => {
                  updatePropertySize(Number(event.target.value));
                }}
                className="h-3 w-full cursor-pointer appearance-none rounded-full bg-primary-light accent-primary"
                aria-label="Property size"
              />

              <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                <span>{MIN_PROPERTY_SIZE} m²</span>

                <span>{MAX_PROPERTY_SIZE} m²</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SIZE_PRESETS.map((preset) => {
                const isSelected = value.propertySize === preset.value;

                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      updatePropertySize(preset.value);
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary-light text-primary"
                        : "border-slate-200 bg-white text-slate-500 hover:border-primary/30"
                    }`}
                  >
                    <span className="block text-sm font-extrabold">{preset.label}</span>

                    <span className="mt-1 block text-xs font-semibold opacity-70">
                      {preset.value} m²
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-6 h-16 overflow-hidden rounded-2xl border border-primary/10 bg-surface-soft">
              <div className="absolute inset-x-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/10" />

              <motion.div
                className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-[0_8px_20px_rgba(30,111,217,0.3)]"
                animate={{
                  left: `${safeMarkerPosition}%`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 18,
                }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            </div>
          </div>

          <div className="flex min-h-[240px] flex-col justify-between rounded-[1.4rem] bg-navy p-5 text-white">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                Scanned area
              </p>

              <div className="mt-4 flex items-end gap-2">
                <input
                  type="number"
                  min={MIN_PROPERTY_SIZE}
                  max={MAX_PROPERTY_SIZE}
                  value={value.propertySize}
                  onChange={(event) => {
                    updatePropertySize(Number(event.target.value));
                  }}
                  className="w-full min-w-0 border-0 bg-transparent p-0 font-heading text-4xl font-black text-white outline-none"
                  aria-label="Property size in square metres"
                />

                <span className="pb-1 text-base font-bold text-blue-100/60">m²</span>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-base font-extrabold text-white">{sizeProfile.label}</p>

              <p className="mt-2 text-sm font-medium leading-6 text-blue-100/65">
                {sizeProfile.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Completed summary */}
      <section className="flex flex-col gap-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
            <Check className="h-5 w-5" />
          </span>

          <div>
            <p className="text-base font-extrabold text-emerald-900">Space route completed</p>

            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
              {propertyLabel} · {value.bedrooms} {roomLabel.toLowerCase()} · {value.bathrooms}{" "}
              bathrooms · {value.propertySize} m²
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
          Stage ready
        </span>
      </section>
    </div>
  );
}

interface RoomCounterProps {
  icon: LucideIcon;
  label: string;
  description: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

function RoomCounter({
  icon: Icon,
  label,
  description,
  value,
  onDecrease,
  onIncrease,
}: RoomCounterProps) {
  return (
    <div className="rounded-[1.5rem] border border-primary/10 bg-white p-5 shadow-[0_12px_35px_rgba(11,37,69,0.06)]">
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <h4 className="font-heading text-xl font-black text-navy">{label}</h4>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        <span className="shrink-0 font-heading text-4xl font-black text-navy">{value}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= 0}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/10 bg-surface-soft px-4 text-sm font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus className="h-4 w-4" />
          Remove
        </button>

        <button
          type="button"
          onClick={onIncrease}
          disabled={value >= 30}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-extrabold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  );
}
